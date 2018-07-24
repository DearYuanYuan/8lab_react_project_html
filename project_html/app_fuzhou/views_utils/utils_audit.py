#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
本例用来为audit.py提供调用,功能从ElasticSearch中读取对应trustFile日志
Author 杨泽
Date 2017-6-6

依赖于logstash配置

  else if "trustLog" in [tags]{
    grok {
      match => {
        "message" => "^%{DATA:date} \[[INFO|DEBUG|WARNING|ERROR|CRITICAL]"
      }
    }
    date {
      match => ["date", "yyyy-MM-dd HH:mm:ss"]
    }
  }

时区!TIME_ZONE!
trustLog的日志时间为: 北京时间,转换为@timestamp时减了8h
统一从es中@timestamp取时间,且该时间为UTC
"""
import datetime
import time

from elasticsearch import Elasticsearch

from app_fuzhou.views_utils.localconfig import JsonConfiguration
from app_fuzhou.views_utils.logger import logger

LEVEL = ["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"]
LOG_PRE = "[八分量] (可信云服务日志) "
# INDEX = "trustlog192.168.1.239" 这个不能写死,这个写到share.json中配置了,要读配置文件
TIME_DELTA = datetime.timedelta(hours=8)


def get_audit_log_from_es(level, pagenum=1, pagesize=50, time_filter=None, sort="desc"):
    """
    从es中读取某一个级别的trustFile日志
    :param level: 日志级别LEVEL
    :param pagenum: 页码
    :param pagesize: 每页显示数据量
    :param time_filter: 时间过滤器
    :param sort: 排序
    :return: 日志列表result['hits']['hits'], 总条数result['hits']['total']
    """
    jc = JsonConfiguration()  # share.json
    es = Elasticsearch(jc.es_server_ip_port)  # 连接ES
    index_list = []
    body = {
        "query": {
            "bool": {
                "must": [
                    {"match_phrase": {"_type": "trustLog"}},  # 必须匹配规则
                ],
                # "filter": {"range": {"@timestamp": {"gte": "now-3d", "lte": "now"}}}  # 时间过滤器
            }
        },
        "from": (pagenum - 1) * pagesize,
        "size": pagesize,
    }
    if sort == "desc" or sort == "asc":
        body["sort"] = {"@timestamp": sort}
    if time_filter:
        body["query"]["bool"]['filter'] = time_filter  # 添加时间过滤
    if level:  # 如果传来级别
        body["query"]["bool"]['must'].append({"match_phrase": {"message": "["+level+"]"}})  # 必须匹配规则
    index_list.append(jc.trustlog_index)
    try:
        result = es.search(index=index_list, body=body, ignore_unavailable=True)  # 从es中读取
    except Exception as e:
        logger.error(e)
        return [], 0
    return result['hits']['hits'], result['hits']['total']


def get_audit_log_from_es_scroll(level="INFO", pagenum=1, pagesize=20, sort_order="desc"):
    """
        从es中读取某一个级别的trustFile日志(采用scroll方式，打破了10000条的限制)
        :param level: 日志级别LEVEL
        :param pagenum: 页码
        :param pagesize: 每页显示数据量
        :return: 日志列表result['hits']['hits'], 总条数result['hits']['total']
    """
    jc = JsonConfiguration()  # share.json
    es = Elasticsearch(jc.es_server_ip_port)  # 连接ES
    index_list = []
    body = {
        "query": {
            "bool": {
                "must": [
                    {"match_phrase": {"_type": "trustLog"}},  # 必须匹配规则
                    {"match_phrase": {"message": "[" + level.upper() + "]"}}
                ]
            }
        },
        "sort": {"@timestamp": {"order": sort_order}}
    }
    index_list.append(jc.trustlog_index)
    try:
        # scroll='1m',保持游标查询窗口一分钟; size=pagesize,指定１页的大小
        res = es.search(index=index_list, body=body, scroll='1m', size=pagesize, ignore_unavailable=True)
    except Exception as e:
        logger.error(e)
        return [], 0

    if pagenum == 1:  # res就是第１页的信息
        return res['hits']['hits'], res['hits']['total']

    try:
        sid = res["_scroll_id"]  # 若键_scroll_id不存在,则说明查询结果为空
    except KeyError as e:
        logger.error(e)
        return [], 0

    pages_count = page_calculate(res["hits"]["total"], pagesize)

    for i in range(1, pages_count):
        # 传入scroll_id; 并且再次设置游标查询 过期时间为一分钟;
        result = es.scroll(scroll_id=sid, scroll='1m')
        # scroll查询可能会改变scroll_id值，所以每次查询时需要使用最新的scroll_id
        sid = result["_scroll_id"]  # 取出最新的_scroll_id
        if i+1 == pagenum:
            return result['hits']['hits'], result['hits']['total']
    return [], 0


def get_audit_logs_count():
    """
    获取各个级别的trustFile日志数量统计
    :return: result_dict{"DEBUG":12,...}
    """
    result_dict = {}
    for _level in LEVEL:  # 分别处理每个日志级别
        result_list, total = get_audit_log_from_es(_level, 1, 0, sort="")  # size为零,es搜索更快,此处仅用total字段
        result_dict[_level] = total
    return result_dict


def get_audit_logs_week_history():
    """
    获取包括今天在内的7天里的每天的各个级别的日志的数量,5个级别*7天
    :return: {date:[],INFO:[],...}
    """
    days = []
    today = datetime.date.today()
    for _day in range(6, -1, -1):  # 日子排序为从远到近
        days.append((today - datetime.timedelta(days=_day)).strftime("%Y-%m-%d"))
    result_dict = {}
    jc = JsonConfiguration()  # share.json
    index_list = []
    es = Elasticsearch(jc.es_server_ip_port)
    index_list.append(jc.trustlog_index)
    try:
        for _level in LEVEL:
            body = {"query": {"bool": {"must": [{"match_phrase": {"_type": "trustLog"}},
                                                {"match_phrase": {"message": "["+_level+"]"}}]}},
                    "size": 0,
                    "aggs": {  # 聚合
                        "week_history": {
                            "date_histogram": {
                                "field": "@timestamp",  # 时间字段
                                "interval": "day",  # 按天统计
                                "format": "yyyy-MM-dd",
                                "min_doc_count": 0,
                                "time_zone": "+08:00",  # es默认时区是UTC,所以需要+8
                                "extended_bounds": {"min": days[0], "max": days[6]}  # 范围为近7天内,包括今天
                            }
                        }
                    }}
            results = es.search(index=index_list, body=body, ignore_unavailable=True)  # 访问一次ES
            result_dict[_level] = []
            for _result in results['aggregations']['week_history']['buckets']:  # ES返回的聚合数据list有序,顺序为从小到大
                result_dict[_level].append(_result['doc_count'])  # 存入顺序为从小到大
        result_dict['date'] = days
    except Exception as e:
        logger.error(e)
    finally:
        return result_dict


def get_audit_logs_latest_five():
    """
    获取最新5条trustFile日志
    :return: result_dict{"DEBUG":12,...}
    """
    result_dict = {}
    return_log_count = 5
    return_list = []
    try:
        result_list, total = get_audit_log_from_es(None, 1, 50)  # 先取50条
        for hit in result_list:
            _log = hit['_source']['message']
            """
                日志格式如下:
                2017-05-15 10:38:56 [INFO] [PorridgeMQ:Porridge_server_blackbox] [394]
                - Blackbox[INFO]:8lab trust system working...............................
                根据此格式解析日志
            """
            if len(_log) < 1:
                continue
            if len(return_list) >= return_log_count:  # 达到5条则退出
                break
            _split = _log.split(' - ')
            if len(_split) == 2:  # 筛选出日志中以 - 分割的行
                _con = _split[1]
                _time = _log[:19]
                try:  # 如果时间格式不匹配就放弃这条
                    datetime.datetime.strptime(_time, "%Y-%m-%d %H:%M:%S")
                except ValueError:
                    continue
                if str(_log).find("ERROR") != -1:
                    _level = "ERROR"
                    _con = "ERROR " + LOG_PRE + _con
                elif str(_log).find("WARNING") != -1 or str(_log).find("ignoring") != -1:
                    _level = "WARNING"
                    _con = "WARNING " + LOG_PRE + _con
                elif str(_log).find("CRITICAL") != -1:
                    _level = "CRITICAL"
                    _con = "CRITICAL " + LOG_PRE + _con
                elif str(_log).find("INFO") != -1:
                    _level = "INFO"
                    _con = "INFO " + LOG_PRE + _con
                else:
                    _level = "DEBUG"
                    _con = "DEBUG " + LOG_PRE + _con
                each_list = [_time, _level, _con]
                return_list.append(each_list)
        return_list.sort(key=lambda x: x[0], reverse=True)  # 之前已经经过反序,这一步仍检测一次是否有乱序
        result_dict["logs"] = return_list
    except Exception as e:
        logger.error(e)
    finally:
        return result_dict

# 原代码
# def get_audit_logs_timestamp_count(is_first=False, time_interval=10):
#     """
#     按秒数统计日志,即每秒出现多少条日志
#     :param is_first: 是否是第一次,如果是,则获取1天内(23h)统计数据,如果不是,则获取最近time_interval秒内的统计数据
#     :param time_interval: 时间过滤,最近time_interval秒内
#     :return:
#     """
#     result_dict = {"data": [], "time": []}
#     jc = JsonConfiguration()  # share.json
#     index_list = []
#     es = Elasticsearch(jc.es_server_ip_port)  # es实例
#     index_list.append(INDEX)
#     try:
#         body = {"query": {"bool": {"must": {"match_phrase": {"_type": "trustLog"}},
#                 "filter": {"range": {"@timestamp": {"gte": "now-%ss" % time_interval, "lte": "now"}}}  # 时间过滤器
#                 }},
#                 "size": 0,
#                 "aggs": {
#                     "time_count": {
#                         "date_histogram": {
#                             "field": "@timestamp",  # 时间字段
#                             "interval": "second",  # 按秒数统计
#                             "format": "yyyy-MM-dd HH:mm:ss",
#                             "time_zone": "+08:00",  # 时区
#                             "min_doc_count": 1 if is_first else 0,
#                         }
#                     }
#                 }}
#         if is_first:  # 如果是第一次访问,时间过滤为1天(23h)内,否则为10秒内
#             body["query"]["bool"]["filter"] = {"range": {"@timestamp": {"gte": "now-23h", "lte": "now"}}}
#         results = es.search(index=index_list, body=body, ignore_unavailable=True)  # 访问一次ES
#         for _result in results['aggregations']['time_count']['buckets']:  # ES返回的聚合数据list有序,按时间正排序
#             result_dict["data"].append(_result['doc_count'])
#             result_dict["time"].append(_result['key_as_string'][11:])
#     except Exception as e:
#         logger.error(e)
#     finally:
#         return result_dict


def get_audit_logs_timestamp_count(is_first=False, time_interval=10):
    """
    按秒数统计日志,即每秒出现多少条日志
    :param is_first: 是否是第一次,如果是,则获取1天内(23h)统计数据,如果不是,则获取最近time_interval秒内的统计数据
    :param time_interval: 时间过滤,最近time_interval秒内
    :return:
    """
    result_dict = {"data": [], "time": []}
    jc = JsonConfiguration()  # share.json
    index_list = []
    es = Elasticsearch(jc.es_server_ip_port)  # es实例
    index_list.append(jc.trustlog_index)
    now_interval, now = get_range_of_last_interval(time_interval)
    try:
        body = {"query": {"bool": {"must": {"match_phrase": {"_type": "trustLog"}},
                "filter": {"range": {"@timestamp":{
                                "gte": now_interval,
                                "lte": now,
                                "format": "yyyy-MM-dd HH:mm:ss"}}}  # 时间过滤器
                }},
                "size": 0,
                "aggs": {
                    "time_count": {
                        "date_histogram": {
                            "field": "@timestamp",  # 时间字段
                            "interval": "second",  # 按秒数统计
                            "format": "yyyy-MM-dd HH:mm:ss",
                            "min_doc_count": 1 if is_first else 0,
                        }
                    }
                }}
        if is_first:  # 如果是第一次访问,时间过滤为1天(23h)内,否则为10秒内
            body["query"]["bool"]["filter"] = {"range": {"@timestamp": {"gte": "now-23h", "lte": "now"}}}
        else:
            body["aggs"]["time_count"]["date_histogram"]["extended_bounds"] = {"min": now_interval, "max": now}
        results = es.search(index=index_list, body=body, ignore_unavailable=True)  # 访问一次ES
        if results['aggregations']['time_count']['buckets']:  # 若列表非空
            for _result in results['aggregations']['time_count']['buckets']:  # ES返回的聚合数据list有序,按时间正排序
                result_dict["data"].append(_result['doc_count'])
                result_dict["time"].append(_result['key_as_string'][11:])
        else:  # 若列表为空,表示最近time_interval秒内,没有数据;　设置如下的默认返回值
            seconds = get_seconds_of_interval(time_interval)
            result_dict['time'].extend(seconds)
            datas = get_datas_of_interval(time_interval)
            result_dict['data'].extend(datas)
    except Exception as e:
        logger.error(e)
        result_dict['error'] = str(e)
    finally:
        return result_dict


def get_seconds_of_interval(interval=10):
    seconds = []
    now = time.time()
    for i in range(interval):
        t = now - (9-i)  # timestamp加减单位以 秒 为单位
        seconds.append(time.ctime(t)[11:19])
    return seconds


def get_datas_of_interval(interval=10):
    datas = []
    for i in range(interval):
        datas.append(0)
    return datas


def get_range_of_last_interval(interval=10):
    now = datetime.datetime.now()
    now_interval = now - datetime.timedelta(seconds=interval-1)

    now = str(now)[:19]
    now_interval = str(now_interval)[:19]
    # now = now.strftime('yyyy-MM-dd hh:mm:ss')
    # now_interval = now_interval.strftime('yyyy-MM-dd hh:mm:ss')
    return now_interval, now


# def get_audit_logs_by_level(level, page, size):
#     """
#     按日志级别分页获取日志,最大条数1万条
#     :param level: 日志级别
#     :param page: 第几页
#     :param size: 每页多少条
#     :return:
#     """
#     level_dict = {'INFO': [], 'DEBUG': [], 'WARNING': [], 'ERROR': [], 'CRITICAL': []}
#     result_list, total = get_audit_log_from_es_scroll(level.upper(), int(page), int(size))  # 从es中取出日志
#     for hit in result_list:
#         _log = hit['_source']['message']
#         _split = _log.split(' - ')
#         if len(_split) == 2:  # 筛选出日志中以 - 分割的行
#             _con = _split[1]
#             _time = _log[:19]
#             _level = level.upper()
#             _con = _level + " " + LOG_PRE + _con
#             try:  # 如果时间格式不匹配就放弃这条(但这里暂时用timestamp替换)
#                 datetime.datetime.strptime(_time, "%Y-%m-%d %H:%M:%S")
#             except ValueError:
#                 # continue  # 以下为临时解决方案
#                 _time = datetime.datetime.strptime(hit['_source']['@timestamp'], "%Y-%m-%dT%H:%M:%S.%fZ")+TIME_DELTA
#                 _time = str(_time)[:19]
#                 _con = _level + " " + LOG_PRE + _log
#             level_dict[_level].append([_time, _level, _con])
#     # 算出目标level的日志能分成几页
#     level_dict[level.upper()].sort(key=lambda x: x[0], reverse=True)  # 之前已经经过反序,这一步仍检测一次是否有乱序
#     total = 10000 if total >= 10000 else total
#     pages = page_calculate(total, size)
#     return {"logs": level_dict[level.upper()], "pageCount": pages}


def get_audit_logs_by_level(level, page, size):
    """
    按日志级别分页获取日志,最大条数1万条
    :param level: 日志级别
    :param page: 第几页
    :param size: 每页多少条
    :return:
    """
    level_dict = {'INFO': [], 'DEBUG': [], 'WARNING': [], 'ERROR': [], 'CRITICAL': []}
    result_list, total = get_audit_log_from_es_scroll(level.upper(), int(page), int(size))  # 从es中取出日志
    for hit in result_list:
        _log = hit['_source']['message']
        _split = _log.split(' - ')
        if len(_split) == 2:  # 筛选出日志中以 - 分割的行
            _con = _split[1]
            _time = _log[:19]
            _level = level.upper()
            _con = _level + " " + LOG_PRE + _con
            try:  # 如果时间格式不匹配就放弃这条(但这里暂时用timestamp替换)
                datetime.datetime.strptime(_time, "%Y-%m-%d %H:%M:%S")
            except ValueError:
                # continue  # 以下为临时解决方案
                _time = datetime.datetime.strptime(hit['_source']['@timestamp'], "%Y-%m-%dT%H:%M:%S.%fZ")+TIME_DELTA
                _time = str(_time)[:19]
                _con = _level + " " + LOG_PRE + _log
            level_dict[_level].append([_time, _level, _con])
    # 算出目标level的日志能分成几页
    level_dict[level.upper()].sort(key=lambda x: x[0], reverse=True)  # 之前已经经过反序,这一步仍检测一次是否有乱序
    pages = page_calculate(total, size)
    return {"logs": level_dict[level.upper()], "pageCount": pages}


def page_calculate(count, size):
    """
    计算总页数
    :param count:
    :param size:
    :return page_sum:
    """
    pages = int(count) / int(size)
    page_sum = int(pages) + 1 if pages > int(pages) else int(pages)
    return page_sum

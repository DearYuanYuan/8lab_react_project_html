#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
本例用来为waf_view提供调用,功能从ElasticSearch中读取对应wafLog
Author 杨泽
Date 2017-4-26

依赖于logstash配置:
filter{
 else if "wafLog" in [tags] {
    grok {
      match => {
        "message" => "^X-Forwarded-For: %{DATA:XForwardedFor}$"
      }
    }
    grok {
      match => {
        "message" =>  "---[0-9a-zA-Z]{8}---A--\n\[%{DATA:date}]"
      }
    }
    grok {
      match => {
        "message" => "Referer: %{DATA:Referer}$"
      }
    }
    date {
      match => ["date", "dd/MMM/yyyy:HH:mm:ss Z"]
    }
    mutate {
        replace => {
            "model" => "defense"
        }
    }
  }
}
update: 2017-7-7 by YangZe

时区!TIME_ZONE!
wafLog的日志时间为: UTC时间,转换为@timestamp时,因为带有时区信息,因此时区没变
统一从es中@timestamp取时间,且该时间为UTC
"""
import re
import datetime
import time

from elasticsearch import Elasticsearch, TransportError

from app_fuzhou.views_utils.localconfig import JsonConfiguration
from app_fuzhou.views_utils.global_config import GlobalConf
from app_fuzhou.views_utils.logger import logger
from app_fuzhou.views_utils.service.queryip.GeoLite2_Instance import IpToCoordinate


LOCAL_CONFIG = JsonConfiguration()  # share.json

WAF_INDEX = LOCAL_CONFIG.waf_index


def get_waf_log(attack_type, page, pagesize):
    """
    从ES获取flag类型的wafLog日志,从中提取出攻击时间/源IP/目的IP/攻击工具以及攻击记录总数,并返回
    :param attack_type: 攻击类型
    :param page: 页数,>=1
    :param pagesize: 每页数据大小
    :return:
    """
    try:
        results, log_sum = get_waf_log_from_es(attack_type, page, pagesize)  # 从es中读取wafLog
        logs = handle_get_waf_log(results, attack_type)  # 处理wafLog,攻击信息
        return logs, log_sum
    except Exception as e:
        logger.error(e)
        return [], 0


def get_waf_log_from_es(attack_type, page=1, pagesize=50, time_filter=None, sort="desc"):
    """
    从ES获取WafLog
    :param attack_type: waf攻击类型
    :param page: 第几页
    :param pagesize: 每页多少条
    :param time_filter: 时间过滤器
    :param sort: 排序
    :return:
    """
    global_config = GlobalConf()
    es = Elasticsearch(LOCAL_CONFIG.es_server_ip_port)
    body = {
        "query": {
            "bool": {
                "must": [
                    {"match_phrase": {"_type": "wafLog"}},  # 必须匹配规则
                ],
                "should": [],
                "minimum_should_match": 1,  # 后面加的message匹配规需要至少匹配一个
                # "filter": {"range": {"@timestamp": {"gte": "now-3d", "lte": "now"}}}  # 时间过滤器
            }
        },
        "from": (page-1)*pagesize,
        "size": pagesize,
    }
    if sort == "desc" or sort == "asc":
        body["sort"] = {"@timestamp": sort}
    if time_filter:
        body["query"]["bool"]['filter'] = time_filter
    # 首先解析flag,从配置文件查找flag对应字段
    if attack_type == "web-attack":  # web-attack
        rules = global_config.RULES['EXPERIMENTAL_RULES']
    elif attack_type == "sensitive-data-tracking":  # sensitive-data-tracking
        rules = global_config.RULES['OPTIONAL_RULES']
    elif attack_type == "identification-error":  # identification-error
        rules = global_config.RULES['SLR_RULES']
    elif attack_type == "dos-attack":  # dos-attack
        rules = global_config.RULES['DOS_RULES']
    elif attack_type == "http-defense":  # http-defense
        rules = global_config.RULES['BASE_RULES']  # 包含http规则
        except_rules = []  # 或者不包含其他的
        except_rules += global_config.RULES['EXPERIMENTAL_RULES']
        except_rules += global_config.RULES['OPTIONAL_RULES']
        except_rules += global_config.RULES['SLR_RULES']
        except_rules += global_config.RULES['DOS_RULES']
        must_not_list = []
        for rule in except_rules:  # 把must_not匹配规则加入到body中
            must_not_list.append({"match_phrase": {"message": rule}})
        body["query"]["bool"]["should"].append({"bool": {"must_not": must_not_list}})
    else:
        return [], 0
    for rule in rules:  # 把message匹配规则加入到body中
        body["query"]["bool"]["should"].append({"match_phrase": {"message": rule}})
    """
    for host in hosts:  # 生成索引列表
        index_list.append(index+host['ip'])
    """
    try:
        result = es.search(index=WAF_INDEX, body=body, ignore_unavailable=True)  # 从es中读取
    except Exception as e:
        logger.error(e)
        return [], 0
    # 至此从es上获得了数据
    return result['hits']['hits'], result['hits']['total']


def get_waf_logs_timestamp_count(time_interval=10):
    """
    按秒数统计日志,即每秒出现多少条日志
    :param time_interval: 时间过滤,最近time_interval秒内
    :return:
    """
    result_dict = {"data": []}
    es = Elasticsearch(LOCAL_CONFIG.es_server_ip_port)  # es实例
    now_interval, now = get_range_of_last_interval(time_interval)
    try:

        body = {
            "query": {
                "range": {
                    "@timestamp": {
                        "gte": now_interval,
                        "lte": now
                    }
                },
            }
        }

        results = es.search(index=WAF_INDEX, doc_type="wafLog", body=body,
                            ignore_unavailable=True)  # 访问一次ES
        result_dict["data"] = results["hits"]["hits"]
    except Exception as e:
        logger.error(e)
    finally:
        return result_dict


def handle_get_waf_log(results, attack_type):
    """
    处理wafLog,记录waf攻击的攻击源,攻击目标,攻击时间,攻击工具,攻击类型信息
    :param results:
    :param attack_type: 攻击类型
    :return:
    """
    logs = []
    time_delta = datetime.timedelta(hours=8)
    for hit in results:
        try:
            log = {"inter_ip": hit['_source']['type'],  # 攻击目标ip
                   "inter_time": (datetime.datetime.strptime(
                       hit["_source"]["@timestamp"], "%Y-%m-%dT%H:%M:%S.%fZ")
                                  + time_delta).strftime('%Y-%m-%d %H:%M:%S'),
                   "inter_source": hit['_source'].get('XForwardedFor', ''),  # 攻击源ip
                   "inter_tool": hit['_source'].get('Referer', ''),  # 攻击来源
                   "defend_type": attack_type}  # 防御类型
            logs.append(log)
        except Exception as e:
            logger.error(str(e))
    logs.sort(key=lambda x: x["inter_time"], reverse=True)  # 之前已经经过反序,这一步仍检测一次是否有乱序
    return logs


def handle_get_waf_log_old(results, flag):  # 旧代码
    """
    处理wafLog,记录waf攻击的攻击源,攻击目标,攻击时间,攻击工具,攻击类型信息
    :param results:
    :param flag:
    :return:
    """
    head = re.compile(r"--.*-A--")
    logs = []
    time_delta = datetime.timedelta(hours=8)
    for hit in results:
        one_record = hit['_source']['message'].split('\n')
        i = 0
        # 进入每一条日志,重置log,并记录被攻击IP,该字段记录在es的type中
        log = {"inter_ip": hit['_source']['type'],  # 攻击目标ip
               "inter_time": "Unknown",  # 攻击时间
               "inter_source": hit['_source'].get('XForwardedFor', ''),  # 攻击源ip
               "inter_tool": "Unknown_Tool",  # 攻击工具
               "defend_type": flag}  # 防御类型
        one_interception = False
        while i < len(one_record):
            line = one_record[i]  # 每一行数据
            if (not one_interception) and head.findall(line):  # 正则表达式r"--.*-A--"
                temp = one_record[i + 1].split()
                _time = datetime.datetime.strptime(temp[0].strip("["),
                                                   '%d/%b/%Y:%H:%M:%S') + time_delta  # UTC+8小时
                log["inter_time"] = _time.strftime("%Y-%m-%d %X")
                one_interception = True  # 进入一条记录
                i += 1  # 下一行数据已记录
            elif line.find("Referer") != -1:  # 如果找到Referer
                log["inter_tool"] = line.split(":")[1]  # 记录攻击工具
            i += 1
        logs.append(log)
    logs.sort(key=lambda x: x["inter_time"], reverse=True)  # 之前已经经过反序,这一步仍检测一次是否有乱序
    return logs


def get_state_info_dict():
    """
    分别搜索es中的wafLog中的日志总数,和带有Referer字段的wafLog的日志总数(即识别数)
    :return: {识别数,未识别数}
    """
    try:
        hosts = LOCAL_CONFIG.client_audit_hosts
        es = Elasticsearch(LOCAL_CONFIG.es_server_ip_port)
        state_info_dict = {}
        index_list = []
        """
        for host in hosts:  # 生成索引列表
            index_list.append(index + host['ip'])
        """
        # 首先在es中搜索各索引全部的wafLog记录
        body = {"query": {"bool": {"must": [{"match_phrase": {"_type": "wafLog"}}]}}, "size": 0}
        result = es.search(index=WAF_INDEX, body=body, ignore_unavailable=True)  # 从es中读取
        total_results = result['hits']['total']
        # 首先在es中搜索各索引全部的wafLog记录中带有Referer字段的,update:带有model字段并值为defense的
        body = {"query": {"bool": {"must": [{"match_phrase": {"_type": "wafLog"}},
                                            {"match": {"model": "defense"}}]}}, "size": 0}
        result = es.search(index=WAF_INDEX, body=body, ignore_unavailable=True)  # 从es中读取
        total_intercepted_results = result['hits']['total']
        state_info_dict["intercepted"] = total_intercepted_results
        state_info_dict["unrecognized"] = total_results - total_intercepted_results
        return state_info_dict
    except Exception as e:
        logger.error(e)
        return {"intercepted": 0, "unrecognized": 0}


def get_waf_log_aggregations_week():
    """
    获取包括今天在内的7天里的每天的各个级别的日志的数量,5个级别*7天
    获取各个级别日志总数
    :return: week:{date:[],dos-attack:[],...},total: {dos-attack:0,....}
    """
    days = []
    today = datetime.date.today()
    for _day in range(6, -1, -1):  # 日子排序为从远到近
        days.append((today - datetime.timedelta(days=_day)).strftime("%Y-%m-%d"))  # 近7天
    global_config = GlobalConf()
    hosts = LOCAL_CONFIG.client_audit_hosts
    es = Elasticsearch(LOCAL_CONFIG.es_server_ip_port)
    index_list = []
    """
    for host in hosts:  # 生成索引列表
        index_list.append(index + host['ip'])
    """
    level_list = ["web-attack", "sensitive-data-tracking",
                  "identification-error", "dos-attack", "http-defense"]
    week_aggr_dict = {'date': days}
    total_count = {}
    # 首先解析flag,从配置文件查找flag对应字段
    for _level in level_list:
        body = {
            "query": {
                "bool": {
                    "must": [
                        {"match_phrase": {"_type": "wafLog"}},  # 必须匹配规则
                    ],
                    "should": [],
                    "minimum_should_match": 1,  # 后面加的message匹配规需要至少匹配一个
                }
            },
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
            }
        }
        week_aggr_dict[_level] = []
        if _level == "web-attack":  # web-attack
            rules = global_config.RULES['EXPERIMENTAL_RULES']
        elif _level == "sensitive-data-tracking":  # sensitive-data-tracking
            rules = global_config.RULES['OPTIONAL_RULES']
        elif _level == "identification-error":  # identification-error
            rules = global_config.RULES['SLR_RULES']
        elif _level == "dos-attack":  # dos-attack
            rules = global_config.RULES['DOS_RULES']
        else:  # http-defense
            rules = global_config.RULES['BASE_RULES']  # 匹配http规则
            except_rules = []  # 或者不匹配其他任何
            except_rules += global_config.RULES['EXPERIMENTAL_RULES']
            except_rules += global_config.RULES['OPTIONAL_RULES']
            except_rules += global_config.RULES['SLR_RULES']
            except_rules += global_config.RULES['DOS_RULES']
            must_not_list = []
            body["query"]["bool"]["should"].append({"bool": {"must_not": must_not_list}})
            for rule in except_rules:  # 把message匹配规则加入到body中
                must_not_list.append({"match_phrase": {"message": rule}})
        for rule in rules:  # 把message匹配规则加入到body中
            body["query"]["bool"]["should"].append({"match_phrase": {"message": rule}})
        try:
            results = es.search(index=WAF_INDEX, body=body,
                                ignore_unavailable=True)  # 从es中读取
            total_count[_level] = results['hits']['total']  # 记录每种类型的总数
            # 虽然,上面的聚合操作指定了只取最近７天,但其只能进行扩展,不能进行压缩,因此,下面的切片操作[-7:]是必须的!!
            for _result in results['aggregations']['week_history']['buckets'][-7:]:  # ES返回的聚合数据list有序,顺序为从小到大
                week_aggr_dict[_level].append(_result['doc_count'])  # 存入顺序为 按照日期　从小到大
            # total_count[_level] = results['hits']['total']  # 记录每种类型的总数
        except Exception as e:
            logger.error(e)
        if not week_aggr_dict[_level]:  # 当索引不存在时,week_aggr_dict[_level]就是一个空列表,此时进行如下赋值
            week_aggr_dict[_level] = [0, 0, 0, 0, 0, 0, 0]
    return week_aggr_dict, total_count


def get_waf_log_aggregations_days():
    """
    获取wafLog按天统计的日志数量
    :return: {"date": [], "limit": 100, "count": []}
    """
    days = []  # 近10天日期
    count = []  # 近10天,每天的攻击总数
    today = datetime.date.today()
    early_day = today-datetime.timedelta(days=9)
    for _day in range(9, -1, -1):  # 日子排序为从远到近
        days.append((today - datetime.timedelta(days=_day)).strftime("%m-%d"))  # 近10天
    hosts = LOCAL_CONFIG.client_audit_hosts
    es = Elasticsearch(LOCAL_CONFIG.es_server_ip_port)
    index_list = []
    """
    for host in hosts:  # 生成索引列表
        index_list.append(index + host['ip'])
    """
    body = {
        "query": {
            "bool": {
                "must": [
                    {"match_phrase": {"_type": "wafLog"}},  # 必须匹配规则
                ],
            }
        },
        "size": 0,
        "aggs": {  # 聚合
            "week_history": {
                "date_histogram": {
                    "field": "@timestamp",  # 时间字段
                    "interval": "day",  # 按天统计
                    "format": "yyyy-MM-dd",
                    "min_doc_count": 0,
                    "time_zone": "+08:00",  # es默认时区是UTC,所以需要+8
                    "extended_bounds": {"min": str(early_day), "max": str(today)}  # 范围为近10天内,包括今天
                }
            }
        }
    }
    try:
        results = es.search(index=WAF_INDEX, body=body, ignore_unavailable=True)  # 从es中读取
        # 虽然,上面的聚合操作指定了只取最近10天,但其只能进行扩展,不能进行压缩,因此,下面的切片操作[-10:]是必须的!!
        for _result in results['aggregations']['week_history']['buckets'][-10:]:  # ES返回的聚合数据list有序,顺序为按照日期从小到大
            count.append(_result['doc_count'])
    except Exception as e:
        logger.error(e)
    if not count:  # 当索引不存在时,count就是一个空列表,此时进行如下赋值
        count = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    return {"date": days, "limit": 100, "count": count}


def get_waf_log_aggregations_city():
    """
    获取攻击源城市的统计
    根据waf的XFF字段记录的ip做统计,然后把ip转换为城市名
    :return: {"name": city_list, "count": attack_count}
    """
    es = Elasticsearch(LOCAL_CONFIG.es_server_ip_port)
    body = {
        "query": {
            "bool": {
                "must": [
                    {"match_phrase": {"_type": "wafLog"}},  # 必须匹配规则
                ],
            }
        },
        "size": 0,
        "aggs": {  # 聚合
            "source_ip": {  # 按照XForwardedFor字段统计ip
                "terms": {
                    "field": "XForwardedFor"  # 结果默认count从大到小排序
                }
            }
        }
    }
    ip_list = []
    ip_count_list = []
    try:
        # 从es中读取
        results = es.search(index=WAF_INDEX, body=body, ignore_unavailable=True)
        # 按照每个桶内的文档数 降序排序,包含文档数最多的桶 排在最前面
        for _result in results['aggregations']['source_ip']['buckets']:
            ip_list.append(_result['key'].strip())
            ip_count_list.append(int(_result['doc_count']))
    except TransportError as e:  # 在初始默认情况下,自定义的字段XForwardedFor,es默认不可搜索,需要开启
        logger.error(e)
        post_data = {"properties": {"XForwardedFor": {"type": "text", "fielddata": "true"}}}  # 开启XForwardedFor搜索
        es.indices.put_mapping(index=WAF_INDEX, doc_type="wafLog", body=post_data, ignore_unavailable=True)
        results = es.search(index=WAF_INDEX, body=body, ignore_unavailable=True)  # 再次从es中读取
        for _result in results['aggregations']['source_ip']['buckets']:  # 按照每个桶内的文档数 降序排序,包含文档数最多的桶 排在最前面
            ip_list.append(_result['key'].strip())
            ip_count_list.append(int(_result['doc_count']))
        logger.info("The error above has been fixed")
    except Exception as e:
        logger.error(e)
    ip_geo_resolver = IpToCoordinate()  # 由IP解析地理坐标的工具类
    i = 0
    city_list = []
    attack_count = []
    for _ip in ip_list:
        if len(city_list) >= 9:
            break
        try:  # 如果ip格式错误或者没有找到结果,则不记录
            ip_information = ip_geo_resolver.get_information_by_ip(_ip)  # 获取攻击源IP的信息
            print('\n\nip_information=', ip_information)
            city_name = ip_information["city"]["names"]["zh-CN"]  # 记录城市中文名
            if ip_information["country"]["names"]["en"] != "China":  # 如果为外国城市,再加上英文名
                city_name += " " + ip_information["city"]["names"]["en"]
            city_list.append(city_name)
            attack_count.append(ip_count_list[i])
        except ValueError as e:  # 若ip不存在(错误),将抛出ValueError异常
            logger.error("wrong ip:" + str(e))
        except KeyError as e:  # 若字典中的某个键不存在,将抛出KeyError异常
            logger.error(str(e))
        i += 1
    diff = sum(ip_count_list) - sum(attack_count)  # 如果已记录的攻击数和总数不一样
    if diff != 0:
        city_list.append("其他")  # 则添加一个"其他",把差额付给他
        attack_count.append(diff)
    if len(city_list) == 0:  # 如果没数据,前端会不显示图形,因此添加一个"无"
        city_list.append("无")  # 则添加一个"无"
        attack_count.append(1)  # 值为1
    return {"name": city_list, "count": attack_count}


def get_range_of_last_interval(interval=10):
    """
    获取当前时间往前推 interval 时间间隔的时间
    :param interval:
    :return:
    """
    now = datetime.datetime.now() - datetime.timedelta(hours=8)  # utc时间 小时需要减8
    now_interval = now - datetime.timedelta(seconds=interval - 1)

    now = now.strftime('%Y-%m-%d') + "T" + now.strftime('%H:%M:%S') + ".000Z"
    now_interval = now_interval.strftime('%Y-%m-%d') + "T" + now_interval.strftime('%H:%M:%S') + ".000Z"
    return now_interval, now


def get_seconds_of_interval(interval=10):
    """
    获取当前时间往前推 interval 时间间隔的时间,单位为秒
    :param interval:
    :return:
    """
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

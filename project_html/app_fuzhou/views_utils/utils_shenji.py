#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
本例用来为shenji_view提供调用,功能从ElasticSearch中读取对应mysqlAudit日志或pgAudit日志
Author 杨泽
Date 2017-4-26

依赖于logstash的配置:


if "mysqlAudit" in [tags] {
    grok {
      match => {
        "message" => '"objects":\[\{"db":"%{DATA:db}","name":"%{DATA:name}",'
      }
    }
    json {
      source => "message"
      remove_field => ["message"]
    }
    date {
      match => ["date", "UNIX_MS" ]
    }
  }
  else if "pgAudit" in [tags] {
    grok {
      match => {
        "message" => "^8LAB: %{DATA:8lab}; USER: %{DATA:user}; DBNAME: %{DATA:db};
        HOST: %{DATA:ip}; TIME: %{DATA:date} CST;%{DATA:query}$"
      }
    }
    date {
      match => ["date", "yyyy-MM-dd HH:mm:ss" ]
    }
  }
update: 2017-7-5


时区!TIME_ZONE!
mysqlAudit的日志时间为: UNIX_MS,UTC时间,转换为@timestamp时时区没变
pgAudit的日志时间为: 北京时间2017-07-07 16:51:28,转换为@timestamp时减了8h
统一从es中@timestamp取时间,且该时间为UTC
"""
import datetime
import time
from elasticsearch import Elasticsearch

from app_fuzhou.views_utils.localconfig import JsonConfiguration
from app_fuzhou.views_utils.global_config import GlobalConf
from app_fuzhou.views_utils.logger import logger
from app_fuzhou.util import mysql_base_api

GLOBAL_CONFIG = GlobalConf()
LOCAL_CONFIG = JsonConfiguration()  # share.json

index = "filebeat"

KEY_SINGLE = ["date", "user", "ip", "query"]
KEY_OBJECTS = "objects"
KEY_NEST = ["db", "name"]

time_delta = datetime.timedelta(hours=8)


def audit_log(ip, db_type, keyword=None, page=1, size=0, date_time=None):
    """
    访问es,获取对应mysqlAudit日志或pgAudit日志,处理后返回
    :param ip:
    :param db_type:　根据db_type,获取mysqlAudit日志或pgAudit日志
    :param keyword:　搜索关键字
    :param page:　　页码
    :param size:　　页大小
    :return:
    by xing ming
    """
    if date_time:  # date_time = "2017-07-26"
        if db_type == "mysql":  # 如果是mysql日志,需要将搜索时间转换成linux时间戳（以毫秒为单位）
            start_time = date_time + " 00:00:00"  # 搜索时间的起点
            end_time = date_time + " 23:59:59"  # 搜索时间的终点
            start_time = str(int(time.mktime(time.strptime(start_time, '%Y-%m-%d %X'))*1000))
            end_time = str(int(time.mktime(time.strptime(end_time, '%Y-%m-%d %X'))*1000))
            # mysqlAudit日志　按照date字段过滤
            time_filter = {
                "range": {
                    "date": {"gte": start_time, "lte": end_time}
                }
            }
        else:  # postgresql日志需要转换成 时间戳
            start_time = date_time + "T00:00:00.000Z"  # 搜索时间的起点
            end_time = date_time + "T23:59:59.999Z"  # 搜索时间的终点
            # pgAudit日志　按照时间戳过滤
            time_filter = {
                "range": {
                    "@timestamp": {"gte": start_time, "lte": end_time}
                }
            }
    else:  # 如果用户没有输入日期,则表明不需要进行时间搜索
        time_filter = None
    # 由于使用了mysqlAudit插件,白名单用户和白名单行为　相应的操作日记都不记录!
    # 因此,ES中没有　白名单用户和白名单行为　对应的日志信息
    if db_type == "mysql":
        result, total = get_mysql_audit_from_es(ip, keyword, page, size, time_filter)
        total = 7000 if total > 7000 else total
        return handle_mysql_audit(result), total
    else:  # postgresql
        # postgresql数据库没有使用安全插件,记录了所有的日志信息;
        # 因此,从ES中去取日志的时候,要将　白名单用户和白名单行为　产生的日志　过滤掉！
        # 获取 用户白名单 和 行为白名单
        conn, cursor = mysql_base_api.sql_init(LOCAL_CONFIG.mysql_host,
                                               LOCAL_CONFIG.mysql_user,
                                               LOCAL_CONFIG.mysql_pass,
                                               LOCAL_CONFIG.mysql_database,
                                               LOCAL_CONFIG.mysql_port)  # 初始化数据库
        # 从数据库中查询,db_type = 'postgresql', ip为指定ip的记录
        sql = "select * from white_user_action WHERE ip = '%s' and db_type = 'postgresql'" % (ip, )
        result_list = mysql_base_api.sql_execute(conn, cursor, sql, "")
        # 关闭数据库
        mysql_base_api.sql_close(conn, cursor)

        white_user = []  # 白名单用户
        white_action = []  # 白名单行为
        for item in result_list:
            if item['type'] == '1':  # '1'表示白名单用户
                match_rule = {"match_phrase_prefix": {"user": item['value']}}
                white_user.append(match_rule)
            elif item['type'] == '2':  # '2'表示白名单行为
                match_rule = {"match_phrase_prefix": {"query": item['value']}}
                white_action.append(match_rule)

        user_action_filter = white_user + white_action
        result, total = get_postgresql_audit_from_es(ip, keyword, page, size, time_filter, user_action_filter)
        total = 7000 if total > 7000 else total
        return handle_postgresql_audit(result), total


def handle_postgresql_audit(_result):
    """
    处理pgAudit日志
    :param _result:
    :return:
    """
    audit_logs = []
    for hit in _result:
        if hit["_source"].get("ip", "") == "":  # 如果ip为空,则设置ip为'localhost'
            ip = 'localhost'
        else:
            ip = hit["_source"].get("ip")
        log_parser = {
            "user": hit["_source"].get("user", ""),
            "host": ip,
            "query": hit["_source"].get("query", ""),
            "db": hit["_source"].get("db", ""),
            "name": hit["_source"].get("name", ""),
            "date": hit["_source"]["date"],
        }
        audit_logs.append(log_parser)
    if len(audit_logs) != 0:
        audit_logs.sort(key=lambda x: x["date"], reverse=True)  # 按日志里的"date"排序
    return audit_logs


def get_postgresql_audit_from_es(ip, keyword=None, page=1, size=0, time_filter=None, user_action_filter=[]):
    """
    接受ip地址,合成为es的index,在该index中搜索postgresql日志,分页
    :param ip:
    :param keyword:
    :param page:
    :param size:
    :param time_filter:
    :return: []
    by xing ming
    """
    hosts = LOCAL_CONFIG.db_ip_list
    ip_list = []
    for host in hosts:
        ip_list.append(host['ip'])
    if ip not in ip_list:  # 检测ip是否合法
        return [], 0
    body = {
        "query": {
            "bool": {
                "must": [
                    {"match": {"_type": "pgAudit"}},  # 审计Postgresql
                    ],
                "should": [
                    {"exists": {"field": "user"}},  # 必须含有如下key之一
                    {"exists": {"field": "ip"}},
                    {"exists": {"field": "query"}},
                    {"exists": {"field": "db"}},
                    {"exists": {"field": "name"}},
                ],
                "minimum_should_match": 1,
            }
        },
        "from": (page - 1) * size if page > 1 else 0,
        "size": size,
        "sort": {"@timestamp": "desc"}
    }

    if keyword:
        body["query"]["bool"]["should"] = [
            {"match_phrase_prefix": {"db": keyword}},
            {"match_phrase_prefix": {"name": keyword}},
            {"match_phrase_prefix": {"user": keyword}},
            {"match_phrase_prefix": {"ip": keyword}},
            {"match_phrase_prefix": {"query": keyword}},
        ]

    if time_filter:
        body["query"]["bool"]['filter'] = time_filter  # 添加时间过滤
    if user_action_filter:  # 过滤白名单用户和白名单行为　产生的日志
        body["query"]["bool"]["must_not"] = user_action_filter
    es = Elasticsearch(LOCAL_CONFIG.es_server_ip_port)
    try:
        _result = es.search(index=index + ip + '*', body=body, ignore_unavailable=True)  # 从es中读取
    except Exception as e:
        logger.error(e)
        return [], 0
    return _result['hits']['hits'], _result['hits']['total']


def get_mysql_audit_from_es(ip, keyword=None, page=1, size=0, time_filter=None):
    """
    接受ip地址,合成为es的index,在该index中搜索mysqlAudit日志,分页
    :param ip:
    :param db_type:
    :param keyword:
    :param page:
    :param size:
    :param time_filter:
    :return: []
    """
    hosts = LOCAL_CONFIG.db_ip_list
    ip_list = []
    for host in hosts:
        ip_list.append(host['ip'])
    if ip not in ip_list:  # 检测ip是否合法
        return [], 0
    body = {
        "query": {
            "bool": {
                "must": {
                    "bool": {
                        "should": [
                            {"exists": {"field": "user"}},  # 必须含有如下key之一
                            {"exists": {"field": "ip"}},
                            {"exists": {"field": "query"}},
                            {"exists": {"field": "db"}},
                            {"exists": {"field": "name"}},
                        ],
                        "minimum_should_match": 1,
                    }
                },
                "should": [
                    {"match": {"_type": "mysqlAudit"}},  # 审计mysql
                    # {"match": {"_type": "pgAudit"}},  # 审计PostgresQL
                ],
                "minimum_should_match": 1,  # 或
            }
        },
        "from": (page - 1) * size if page > 1 else 0,
        "size": size,
        "sort": {"@timestamp": "desc"}
    }

    if keyword:
        body["query"]["bool"]["must"]["bool"]["should"] = [
            {"match_phrase_prefix": {"db": keyword}},
            {"match_phrase_prefix": {"name": keyword}},
            {"match_phrase_prefix": {"user": keyword}},
            {"match_phrase_prefix": {"ip": keyword}},
            {"match_phrase_prefix": {"query": keyword}},
        ]

    if time_filter:
        body["query"]["bool"]['filter'] = time_filter  # 添加时间过滤
    es = Elasticsearch(LOCAL_CONFIG.es_server_ip_port)
    try:
        _result = es.search(index=index + ip + '*', body=body,
                            ignore_unavailable=True)  # 从es中读取
    except Exception as e:
        logger.error(e)
        return [], 0
    return _result['hits']['hits'], _result['hits']['total']


def handle_mysql_audit(_result):
    """
    处理mysqlAudit日志
    :param _result:
    :return:
    """
    audit_logs = []
    for hit in _result:
        if hit["_source"].get("ip", "") == "":  # 如果ip为空,则设置ip为'localhost'
            ip = 'localhost'
        else:
            ip = hit["_source"].get("ip")
        log_parser = {
            "user": hit["_source"].get("user", ""),
            "host": ip,
            "query": hit["_source"].get("query", ""),
            "db": hit["_source"].get("db", ""),
            "name": hit["_source"].get("name", ""),
            "date": (datetime.datetime.strptime(
                hit["_source"]["@timestamp"], "%Y-%m-%dT%H:%M:%S.%fZ")+time_delta).strftime('%Y-%m-%d %H:%M:%S'),
        }
        audit_logs.append(log_parser)
    if len(audit_logs) != 0:
        audit_logs.sort(key=lambda x: x["date"], reverse=True)  # 按日志里的"date"排序
    return audit_logs


def get_latest_audit_log(ip):
    hosts = LOCAL_CONFIG.db_ip_list
    ip_list = []
    for host in hosts:
        ip_list.append(host['ip'])
    if ip not in ip_list:  # 检测ip是否合法
        return []
    body = {
        "query": {
            "bool": {
                "should": [
                    {"match": {"_type": "mysqlAudit"}},  # 审计mysql
                    {"match": {"_type": "pgAudit"}},  # 审计PostgresQL
                ],
                "minimum_should_match": 1,  # 或
            }
        },
        "size": 1,  # 1条
        "sort": {"@timestamp": "desc"}  # 最新
    }
    es = Elasticsearch(LOCAL_CONFIG.es_server_ip_port)
    try:
        _result = es.search(index=index + ip + '*', body=body, ignore_unavailable=True)  # 从es中读取
        if len(_result['hits']['hits']) == 0:
            raise Exception("MysqAudit Log is Empty")
    except Exception as e:
        logger.error(e)
        return {}
    return _result['hits']['hits'][0]


# def get_mysql_audit_from_es_old(ip, keyword=None, page=1, size=0, time_filter=None):  # 旧代码,不再调用
#     """
#     接受ip地址,合成为es的index,在该index中搜索mysqlAudit日志,分页
#     :param ip:
#     :param keyword:
#     :param page:
#     :param size:
#     :param time_filter:
#     :return: []
#     """
#     hosts = LOCAL_CONFIG.db_ip_list
#     ip_list = []
#     for host in hosts:
#         ip_list.append(host['ip'])
#     if ip not in ip_list:  # 检测ip是否合法
#         return []
#     body = {
#         "query": {
#             "bool": {
#                 "must": [
#                     {"match": {"_type": "mysqlAudit"}},  # 搜索mysqlAudit
#                 ],
#                 "should": [
#                     {"match": {"message": "user"}},  # 必须含有如下key之一
#                     {"match": {"message": "ip"}},
#                     {"match": {"message": "query"}},
#                     {"match": {"message": "db"}},
#                     {"match": {"message": "name"}},
#                 ],
#                 "minimum_should_match": 1,
#             }
#         },
#         "from": (page - 1) * size if page > 1 else 0,
#         "size": size,
#         "sort": {"@timestamp": "desc"}
#     }
#     if keyword:
#         body["query"]["bool"]["must"].append({"match_phrase_prefix": {"message": keyword}})
#     if time_filter:
#         body["query"]["bool"]['filter'] = time_filter  # 添加时间过滤
#     es = Elasticsearch(LOCAL_CONFIG.es_server_ip_port)
#     try:
#         _result = es.search(index=index + ip, body=body, ignore_unavailable=True)  # 从es中读取
#     except Exception as e:
#         logger.error(e)
#         return [], 0
#     return _result['hits']['hits'], _result['hits']['total']
#
#
# def handle_mysql_audit_old(_result):  # 旧代码,不再调用
#     """
#     处理mysqlAudit日志
#     :param _result:
#     :return:
#     """
#     audit_logs = []
#     for hit in _result:
#         # 对每一条日志进行关键词匹配,并返回全部字典
#         log_dict = json.loads(hit['_source']['message'])  # 日志为json格式,反序列化
#         log_parser = {}
#         if len(log_dict) == 0:
#             continue
#         for key in KEY_SINGLE + KEY_NEST:  # 分别提取["date", "user", "ip", "query"] + 初始化["db", "name]
#             if key in log_dict:  # 如果在当前这条日志有关键字,则提取其内容
#                 if key == "date":
#                     log_dict[key] = int(log_dict[key])
#                     log_parser[key] = datetime.datetime.\
#                         fromtimestamp(log_dict[key]/1000.0).strftime('%Y-%m-%d %H:%M:%S')
#                 elif key == 'ip':
#                     log_parser['host'] = log_dict['ip']
#                 else:
#                     log_parser[key] = log_dict[key]
#             else:  # 如果在当前这条日志没有这个关键字,则设其默认值
#                 log_parser[key] = ""
#         if KEY_OBJECTS in log_dict:  # KEY_OBJECTS = "objects"
#             one_obj = log_dict[KEY_OBJECTS][0]  # log_dict[KEY_OBJECTS]是一个列表,取第一个元素,是一个字典
#             for key in KEY_NEST:  # KEY_NEST = ["db", "name"]
#                 if key in one_obj:
#                     log_parser[key] = one_obj[key]  # 提取字段
#         audit_logs.append(log_parser)
#     if len(audit_logs) != 0:
#         audit_logs.sort(key=lambda x: x["date"], reverse=True)  # 按日志里的"date"排序
#     return audit_logs


# def audit_export():
#     """
#     将mysqlAudit导出到excel
#     :return:
#     """
#     import xlwt
#     fields = ['user', 'name', 'query', 'host', 'db', 'date', ]
#     wb = xlwt.Workbook(encoding='utf-8')
#     ws = wb.add_sheet("mysqlAudit")
#     mysql_audit_logs = audit_log("192.168.1.16")
#     for k in range(len(fields)):
#         ws.write(0, k, fields[k])
#     for y in range(len(mysql_audit_logs)):
#         temp_dict = mysql_audit_logs[y]
#         for x in range(len(fields)):
#             ws.write(y+1, x, temp_dict[fields[x]])
#     wb.save("x.xls")


# def xls_to_response(xls, filename):
#     response = StreamingHttpResponse()
#     response['Content-Disposition'] = 'attachment; filename=%s' % filename
#     xls.save(response)
#     return response

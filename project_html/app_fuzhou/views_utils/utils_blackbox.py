# -*- coding: utf-8 -*-

"""
分析统计blackbox日志
"""
from elasticsearch import Elasticsearch
from app_fuzhou.views_utils.localconfig import JsonConfiguration
from app_fuzhou.views_utils.logger import logger

jc = JsonConfiguration()

LEVEL = ["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"]


def get_blackbox_logs_count_from_es(level, time_filter):
    """
    从es中读取某一个级别的trustFile日志数量
    :param level: 日志级别
    :return: 该级别的日志总条数result['hits']['total']
    """
    jc = JsonConfiguration()  # share.json
    es = Elasticsearch(jc.es_server_ip_port)  # 连接ES
    index_list = []
    body = {
        "query": {
            "bool": {
                "must": [
                    {"match_phrase": {"_type": "trustLog"}},  # 必须匹配规则
                    {"match_phrase": {"message": "[" + level + "]"}}  # 必须匹配规则
                ],
                "filter": {"range": {"@timestamp": {"gte": "now-%ds" % time_filter, "lte": "now"}}}  # 时间过滤器
            }
        },
        "size": 1,
    }


    index_list.append(jc.trustlog_index)
    try:
        result = es.search(index=index_list, body=body, ignore_unavailable=True)  # 从es中读取
    except Exception as e:
        logger.error(e)
        return 0
    return result['hits']['total']


def get_blackbox_logs_count(time_filter):
    """
    获取各个级别的trustFile日志数量统计
    :param time_filter 时间过滤
    :return: result_dict{"DEBUG":12,...}
    """
    result_dict = {}
    for level in LEVEL:  # 分别处理每个日志级别,获得其数量
        total = get_blackbox_logs_count_from_es(level, time_filter)
        result_dict[level] = total
    return result_dict

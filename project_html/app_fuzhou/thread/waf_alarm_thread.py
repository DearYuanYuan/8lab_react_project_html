#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
本例用来从ElasticSearch中每15秒读取一次waf,将新的攻击数目记录到mysql,线程运行
Author YangZe
Date 2017-5-18
"""
import time
import datetime
import threading

from elasticsearch import Elasticsearch

from app_fuzhou.views_utils.localconfig import JsonConfiguration
from app_fuzhou.views_utils.logger import logger
from app_fuzhou.util import mysql_base_api

LOCAL_CONFIG = JsonConfiguration()  # share.json

# Lock = threading.Lock()
INDEX = 'filebeat'
TIME_INTERVAL = 15


def read_waf_from_es():
    """
    从es中读取wafLog记录,存到mysql中
    :return:
    """
    hosts = LOCAL_CONFIG.client_audit_hosts  # 从share.json中读取client的ip
    index_list = []
    body = {"query": {"bool": {  # 查询最近time_interval秒内的wafLog日志
                "must": {"match_phrase": {"_type": "wafLog"}},  # 必须匹配规则wafLog
                "filter": {"range": {"@timestamp": {"gte": "now-%ss" % TIME_INTERVAL, "lt": "now"}}}  # 时间过滤器
            }}, "size": 0}
    for host in hosts:  # 生成索引列表
        index_list.append(INDEX + host['ip'])
    try:
        es = Elasticsearch(LOCAL_CONFIG.es_server_ip_port)  # 创建es实例
        result = es.search(index=index_list, body=body, ignore_unavailable=True)  # 从es中读取
        # 至此从es上获得了数据
        if result['hits']['total'] != 0:  # 如果数量不等于0,则记录到数据库
            mysql_insert_alarm(count=result['hits']['total'], error_type=1)
        """
        # from app_fuzhou.models import Alarm
        # Alarm.objects.create(alarm_type=1,
        #                      create_time=datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
        #                      count=result['hits']['total'])
        """
    except Exception as e:
        logger.error(e)


def mysql_insert_alarm(count, error_type):
    """
    将错误信息保存到数据库 前端定时查询数据库
    :param count:
    :param error_type:
    :return:
    """
    try:
        datetime_now = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        conn, cursor = mysql_base_api.sql_init(
            db_host=LOCAL_CONFIG.mysql_host,
            db_port=LOCAL_CONFIG.mysql_port,
            db_user=LOCAL_CONFIG.mysql_user,
            db_passwd=LOCAL_CONFIG.mysql_pass,
            db_name=LOCAL_CONFIG.mysql_database)
        sql = "INSERT INTO app_fuzhou_alarm (create_time, alarm_type, count) VALUES (%s, %s, %s)"
        mysql_base_api.sql_execute(conn, cursor, sql, (datetime_now, error_type, count))
        mysql_base_api.sql_close(conn, cursor)
    except Exception as e:
        logger.error(e)

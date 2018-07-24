# -*- coding: utf-8 -*-

""" 统计eagle日志
从大数据分析平台获取eagle报警日志,完整的请求格式如下:
http://192.168.1.182:9099/eagle-service/rest/entities?query=AlertService[@site=%22sandbox%22%20AND%20@application=%22hdfsAuditLog%22]{*}&pageSize=10&startTime=2017-07-17%2003:09:06&endTime=2017-08-17%2003:09:07
"""

import http.cookiejar
import datetime
import base64
import json
from urllib import request
from app_fuzhou.views_utils.logger import logger
from app_fuzhou.views_utils.localconfig import JsonConfiguration
from elasticsearch import Elasticsearch

jc = JsonConfiguration()

INDEX = "nisalog"


# 获取eagle报警日志的数量
def get_alert_count_from_eagle(filter_seconds):
    """
    从eagle获取警告信息
    :param filter_seconds: 取最近filter_seconds妙的报警日志
    :return:  返回 最近filter_seconds妙 报警日志的数量
    """
    objs = []
    try:
        # 创建全局cookie
        cookie = http.cookiejar.CookieJar()
        cookie_proc = request.HTTPCookieProcessor(cookie)
        opener = request.build_opener(cookie_proc)

        # 登录操作 保存cookie
        # user_password = "admin:secret"
        bytes_string = "admin:secret".encode(encoding="utf-8")
        _hash = base64.b64encode(bytes_string)
        headers = {"Authorization": "Basic " + _hash.decode()}

        base_url = "http://" + jc.eagle_host + ":" + str(jc.eagle_port)
        login_url = base_url + "/eagle-service/rest/authentication"
        req = request.Request(url=login_url, headers=headers)
        result = opener.open(req, timeout=10).read().decode("utf-8")
        # logger.info(result)

        req_url = base_url + "/eagle-service/rest/entities?query=AlertService[@site=%22sandbox%22%20AND%20@application=%22hdfsAuditLog%22]{*}"
        # 计算查询时间 生成最新的url
        local_current_time = datetime.datetime.now()  # 本地当前时间
        utc_end_time = local_current_time - datetime.timedelta(hours=8)  # 解决时区问题 UTC和本地时区差8小时
        utc_start_time = utc_end_time - datetime.timedelta(seconds=filter_seconds)  # 取最近filter_seconds妙内的报警日志(默认取最近15天)
        start_time = utc_start_time.strftime('%Y-%m-%d %H:%M:%S').replace(' ','%20')
        end_time = utc_end_time.strftime('%Y-%m-%d %H:%M:%S').replace(' ', '%20')
        req_url = req_url + "&pageSize=10000" + "&startTime=" + start_time + "&endTime=" + end_time

        req = request.Request(url=req_url)
        result = opener.open(req, timeout=5).read().decode("utf-8")
        # logger.info(result)

        re_json = json.loads(result)
        # print(re_json)
        objs = re_json['obj']
    except Exception as e:
        logger.error(e)

    return len(objs)


# 获取eagle所有日志
def get_eagle_log_total_from_es(filter_time):
    index_list = []
    es = Elasticsearch(jc.es_server_ip_port)  # es实例
    index_list.append(INDEX)
    body = {
        "query": {
            "bool": {
                "must": [
                    {"match": {"_type": "eagle"}},
                ],
                "filter": {  # 时间过滤器
                    "range": {"@timestamp": {"gte": "now-%ds" % filter_time, "lte": "now"}}
                }
            }
        },
        "sort": {"@timestamp": "asc"},
        "size": 1,
    }
    try:
        res = es.search(index=index_list, body=body, ignore_unavailable=True)
    except Exception as e:
        logger.error(e)
        return 0
    return res["hits"]["total"]


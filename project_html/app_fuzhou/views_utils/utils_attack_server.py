#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
本例用来为attack_server.py提供调用,功能从ElasticSearch中读取对应wafLog,解析攻击类型,ip对应的经纬度
Author Yang Ze   Jing Qingyun
Date 2017-4-26
"""
import re
import json
import datetime
import random
import traceback
import math
import time
import redis
from collections import OrderedDict

from elasticsearch import Elasticsearch

from app_fuzhou.views_utils.localconfig import JsonConfiguration
from app_fuzhou.views_utils.global_config import GlobalConf
from app_fuzhou.views_utils.utils_waf import (
    get_waf_log_from_es,
    WAF_INDEX
)
from app_fuzhou.models import TrustLog

from app_fuzhou.views_utils.logger import logger
from app_fuzhou.views_utils.service.queryip.GeoLite2_Instance import IpToCoordinate

GLOBAL_CONFIG = GlobalConf()
LOCAL_CONFIG = JsonConfiguration()  # share.json
server_ip = LOCAL_CONFIG.server_ip

FUZHOU_DES_IP = LOCAL_CONFIG.des_ip_addr

es_server_ip_port = LOCAL_CONFIG.es_server_ip_port
es = Elasticsearch(es_server_ip_port)

# 不同攻击类型对应的攻击个数
attack_types = {
    "http-defense": 0,
    "dos-attack": 0,
    "web-attack": 0,
    "sensitive-data-tracking": 0,
    "identification-error": 0,
}

SERVER_ADDRESS = 'tcp://*:%s' % LOCAL_CONFIG.used_ports['attack_ip']
RECV_TIMEWAIT = 0.1

# 不同类型的攻击对应的线条的颜色
TYPE_COLORS = {
    "http-defense": [228, 78, 143],
    "dos-attack": [159, 60, 222],
    "web-attack": [52, 182, 225],
    "sensitive-data-tracking": [67, 197, 142],
    "identification-error": [222, 213, 60]
}
# CZML文件的头部参数
# HEAD = {
#     "id": "document",
#     "name": "CZML Geometries: test node data",
#     "version": "1.0"
# }

# 时间格式
ATTACK_TIME_FORMAT = "[%d/%b/%Y:%X%z]"
EPOCH_TIME_FORMAT = "%Y-%m-%dT%H:%M:%SZ"
STD_TIME_FORMAT = "%Y-%m-%d %X"

intranet_ip = re.compile(
        r"^((192\.168|172\.([1][6-9]|[2]\d|3[01]))(\.([2][0-4]\d|[2][5][0-5]|[01]?\d?\d)){2}"
        r"|10(\.([2][0-4]\d|[2][5][0-5]|[01]?\d?\d)){3})|127.0.0.1$")
ip_geo_resolver = IpToCoordinate()  # 由IP解析地理坐标的工具类


class LocalDateTimeJSONEncoder(json.JSONEncoder):
    """
    自定义的datetime类型的JSON转换其
    """
    def default(self, o):
        if isinstance(o, datetime.datetime):
            return o.strftime(STD_TIME_FORMAT)
        else:
            return super(LocalDateTimeJSONEncoder, self).default(o)


class Node(object):
    """
    定义地图上的点
    """
    def __init__(self, main_id, x, y, source_ip, des_ip, attack_type, occur_time):
        self.id = main_id
        self.name = 'node-%s' % main_id
        self.position = Position(x, y).__dict__
        self.billboard = BillBoard().__dict__
        self.source_ip = source_ip
        self.des_ip = des_ip
        self.attack_type = attack_type
        self.occur_time = occur_time


class Head(object):
    """
    CZML文件中数据包的头部
    """
    def __init__(self, start, end):
        """
        构造方法
        :param start: datetime,开始时间
        :param end: datetime,结束时间
        """
        self.id = "document"
        self.name = "CZML Geometries: test node data"
        self.version = "1.0"

        start_time = start.strftime(EPOCH_TIME_FORMAT)
        end_time = end + datetime.timedelta(minutes=7)  # 增加持续时间
        end_time = end_time.strftime(EPOCH_TIME_FORMAT)
        self.clock = {"interval": "%s/%s" % (start_time, end_time),
                      "currentTime": start_time, "mutilplier": 360}  # 设置时钟
        self.availability = "%s/%s" % (start_time, end_time)


class BillBoard(object):
    """
    生成地图的附加数据
    """
    def __init__(self):
        self.eyeOffset = {'cartesian': [0, 0, 0]}
        self.image = 'static/img/mapImg/source.png'  # 设置地图上点的图标
        self.horizontalOrigin = "CENTER"
        self.verticalOrigin = "CENTER"
        self.pixelOffset = {'cartesian2': [0, 0]}
        self.scale = 1.5  # 设置图标的图片缩放的比例
        self.show = True


class Position(object):
    """
    经纬度坐标
    """
    def __init__(self, x, y):
        self.cartographicDegrees = [x, y, 0]


class Point(object):
    """
    源地址到目的地址连线上的点
    """
    def __init__(self, main_id, x1, y1, x2, y2, color, epoch, delta, offset):
        """
        构造方法
        :param main_id: ID
        :param x1: 源地址经度
        :param y1: 源地址纬度
        :param x2: 目的地址经度
        :param y2: 目的地址纬度
        :param color: 颜色
        :param epoch: 前段显示出现时间
        :param delta: 相对出现时间的增量
        :param offset: 随机值,在显示上加以区分
        """
        self.id = 'point-%s' % main_id

        end = epoch + datetime.timedelta(seconds=delta)

        start_time = epoch.strftime(EPOCH_TIME_FORMAT)
        end_time = epoch + datetime.timedelta(minutes=7)
        end_time = end_time.strftime(EPOCH_TIME_FORMAT)
        self.availability = "%s/%s" % (start_time, end_time)
        self.point = {
            "outlineWidth": 1,  # 点的轮廓的宽度
            "pixelSize": 5,  # 点的大小
            "color": {"rgba": color},  # 点的颜色
            "outlineColor": {"rgba": [255, 255, 255, 0]}  # 点的轮廓颜色，最后一个值为透明度，[1,255]
        }
        self.position = {
            "epoch": end.strftime(EPOCH_TIME_FORMAT),
            "interpolationDegree": 12,  # 插值多项式的次数
            "interpolationAlgorithm": "HERMITE",  # 插值算法
            "cartographicDegrees": set_cart(x1, y1, x2, y2, offset)
        }


class Line(object):
    """
    源地址到目的地址连线
    """
    def __init__(self, main_id, x1, y1, x2, y2, width, color, epoch, offset):
        """
        Line类构造方法
        :param main_id: ID
        :param x1: 源地址经度
        :param y1: 源地址纬度
        :param x2: 目的地址经度
        :param y2: 目的地址纬度
        :param width: 宽度,合并相同对象时增加
        :param color: 颜色
        :param epoch: 出现时间
        :param offset: 随机值,在显示上加以区分
        """
        self.id = 'line-%d' % main_id
        end = epoch + datetime.timedelta(minutes=7)

        start_time = epoch.strftime(EPOCH_TIME_FORMAT)
        end_time = end.strftime(EPOCH_TIME_FORMAT)
        self.availability = "%s/%s" % (start_time, end_time)  # 对象的数据可用时间段
        self.path = {
            "leadTime": 10,  # 要显示的未来数据的描述
            "width": width,  # 路径的宽度
            "resolution": 1,
            "trialTime": 1000,  # 要显示的历史数据的秒数
            "material": {
                "solidColor": {"color": {"rgba": color}}
            }
        }
        self.position = {
            "epoch": epoch.strftime(EPOCH_TIME_FORMAT),
            "interpolationDegree": 12,
            "interpolationAlgorithm": "HERMITE",
            "cartographicDegrees": set_cart(x1, y1, x2, y2, offset)
        }


def set_cart(x1, y1, x2, y2, offset):
    """
    通过提供的源地址、目的地址生成坐标数据
    :param x1: 源地址经度
    :param y1: 原地是维度
    :param x2: 目的地址经度
    :param y2: 目的地址纬度
    :param offset:
    :return: 坐标数据
    """
    x1 = float(x1)
    y1 = float(y1)
    x2 = float(x2)
    y2 = float(y2)
    cart = [0, x1, y1, 0, 180, (x1 + x2) / 2 + offset, (y1 + y2) / 2 + offset, 2000000, 360, x2, y2, 0]
    return cart


def _get_nodes(query_result):
    """
    通过查询结果将数据封装成Node类信息
    :param query_result: tuple,数据库查询结果
    :return: list,Node类信息
    """
    s_node = "s_"
    d_node = "d_"
    node_list = []
    for item in query_result:
        # 构造攻击者的Node对象
        node_list.append(
            Node(
                s_node + str(item['id']),
                item['source_lng'],
                item['source_lat'],
                source_ip=item['source_ip'],
                des_ip=item['des_ip'],
                attack_type=item['attack_type'],
                occur_time=item['occur_time']
            ).__dict__
        )
        # 构造被攻击者的Node对象
        node_list.append(
            Node(
                d_node + str(item['id']),
                item['des_lng'],
                item['des_lat'],
                source_ip=item['source_ip'],
                des_ip=item['des_ip'],
                attack_type=item['attack_type'],
                occur_time=item['occur_time']
            ).__dict__
        )
    return node_list


def _get_points(query_result, offset):
    """
    通过查询结果将数据封装成Point类信息
    :param query_result: tuple,数据库查询结果
    :return: list,Point类信息
    """
    point_list = []
    # 写死第一个点出现的时间
    t = datetime.datetime.strptime("2012-08-04T16:00:00Z", EPOCH_TIME_FORMAT)
    pos = 0
    for item in query_result:
        # 根据顺序偏移时间
        pos += 1
        # 生成一定数量的Point用于连续地显示
        num_points = 20  # 每条查询结果对应的points数量
        for cur in range(num_points):
            color = []
            color += TYPE_COLORS[item["attack_type"]]
            color.append(255 - cur * math.floor(255/num_points))  # 设置不同的透明度，使这些派生的点形成渐变的效果

            point_list.append(
                Point(
                    str(item['id']) + "-" + str(cur),
                    item['source_lng'],
                    item['source_lat'],
                    item['des_lng'],
                    item['des_lat'],
                    color,
                    t + datetime.timedelta(minutes=pos),  # 前段显示出现时间，每两个原始点出现的间隔时间
                    cur * 3.5,  # 相对出现时间的增量，单位为秒，即每两个派生点之间的间隔时间
                    offset
                ).__dict__
            )
    return point_list


def _get_lines(query_result, offset):
    """
    通过查询结果将数据封装成Line类信息
    :param query_result: tuple,数据库查询结果
    :return: list,Line类信息
    """
    line_list = []
    # 写死第一个点出现的时间
    t = datetime.datetime.strptime("2012-08-04T16:00:00Z", EPOCH_TIME_FORMAT)
    pos = 0
    for item in query_result:
        color = []
        # 设置起始点和目标点之间的连线颜色
        color += TYPE_COLORS[item["attack_type"]]
        color.append(255)
        # 根据顺序偏移时间
        pos += 1
        line = Line(
            0, item['source_lng'],
            item['source_lat'],
            item['des_lng'],
            item['des_lat'],
            1, color,
            t + datetime.timedelta(minutes=pos),
            offset
        ).__dict__
        # 判断是否已经存在相同属性的Line对象
        if line not in line_list:
            line_list.append(line)
        else:
            # 如果已经存在相同属性的Line,则将已存在的width加1
            target = line_list.index(line)
            line_list[target]['path']['width'] += 1
    i = 0
    # 生成ID
    for item in line_list:
        item['id'] = "line-%d" % i
        i += 1
    return line_list


def get_attack_info_count():
    """
    调用了utils_waf.py的函数,分别查找每种攻击类型的总数
    :return:
    """
    try:
        for attack_type in attack_types:  # 调用utils_waf的函数,5种类型分别从es中读取数据(不足:需要搜索5次)
            attack_types[attack_type] = get_waf_log_from_es(attack_type, 0, 0, sort="")[1]  # [1]为total,只取total所以size置0,可以快一些
        """
            把trustlog/watcherlab(态势感知数据)算到http里
        """
        wt_re = _get_watcherlab_statics()
        tr_re = _get_trust_log()
        attack_types['http-defense'] = attack_types['http-defense'] + len(
            tr_re) + wt_re['intercepted']
    except Exception as e:
        logger.error(e)
        logger.error(traceback.format_exc())
    finally:
        return attack_types


def get_all_type_attack_info(flag, size):
    """
    从ES中把每种类型的wafLog取出来(调用了utils_waf.py的函数),
    找出每条日志的攻击IP等信息,再把IP转换为地理坐标,形成一条新的记录,存到list中,
    每一种攻击类型分为一个list,它们再组成一个dict
    :param flag: 标志位
    :param size: 获取数据的多少
    :return: {type:[]}
    """
    head = re.compile(r"--.*-A--")

    total = 0
    attack_records = {}
    for attack_type in attack_types:  # 遍历各种攻击类型
        if flag == "1":
            result, total = get_waf_log_from_es(attack_type, 1, size)  # 如果是第一次访问,则无时间过滤
        else:
            time_filter = {"range": {"@timestamp": {"gte": "now-5m", "lte": "now"}}}  # 时间过滤器
            result, total = get_waf_log_from_es(attack_type, 1, size, time_filter)
        # 搜索出的结果,就是某一种防御类型的日志
        attack_records[attack_type] = []
        for hit in result:
            one_record = hit['_source']['message'].split('\n')  # 每条message由多行wafLog日志组成,这里先把它按回车分开
            len_one_record = len(one_record)
            i = 0
            record = {"des_ip": hit['_source']['type']}  # 进入每一条日志,重置log,并记录被攻击IP,该字段记录在es的type中
            while i < len_one_record:
                line = one_record[i]  # 每一行数据
                if head.findall(line) and i + 1 < len_one_record:  # 正则表达式r"--.*-A--"
                    temp = one_record[i + 1].split()
                    record['attack_time'] = str(temp[0] + temp[1])[1:-1]
                    break
            if len(hit['_source'].get('XForwardedFor', '').strip()) != 0:  # 如果XFF字段的值存在,则攻击源找到
                record['source_ip'] = hit['_source'].get('XForwardedFor', '').strip()
            else:  # 如果找不到,设定地址为指定地址
                record['source_ip'] = FUZHOU_DES_IP
                # logger.debug(flag)

            # 如果是内网地址,则把地址改为指定地址
            if intranet_ip.findall(record['source_ip']) and flag == '2':
                record['source_ip'] = FUZHOU_DES_IP
            if intranet_ip.findall(record['des_ip']) and flag == '2':
                record['des_ip'] = FUZHOU_DES_IP

            try:  # 如果ip格式错误或者没有找到结果,则不记录
                record['source_lng'], record['source_lat'] = \
                    ip_geo_resolver.get_coordinate_by_ip(record['source_ip'])  # 获取攻击源IP的GPS
                record['des_lng'], record['des_lat'] = \
                    ip_geo_resolver.get_coordinate_by_ip(record['des_ip'])  # 获取攻击目标IP的GPS
                record['attack_type'] = attack_type  # 攻击类型
                record['id'] = hit['_source']['offset']  # id
                attack_records[attack_type].append(record)  # 记录
            except ValueError as e:
                logger.debug("wrong ip:" + str(e))
            i += 1
    http = "http-defense"
    _size = random.randint(10, 20)
    wt_records = get_watcherlab_info_limit(_size, sort_random=True)
    trust_records = _get_trust_log()
    logger.debug('watcherlab records %d , trust records %d', len(wt_records), len(trust_records))
    attack_records[http] = attack_records[http] + wt_records + trust_records

    return attack_records, total


def get_attack_info(flag, size):
    """
    调用get_all_type_attack_info,得到攻击IP的地理坐标后,进行数据的封装
    :param flag: 标志位
    :param size: 获取数据的多少
    :return: {'node': node_list, 'point_line': point_line_list}
    """
    all_info = {}
    try:
        records, total = get_all_type_attack_info(flag, size)
        # # 对records进行去重
        # res_list = []
        # new_list = []
        # data_list = records["http-defense"]
        # # 去重
        # for data in data_list:
        #     if (data["des_ip"], data["source_ip"], data["occur_time"]) in res_list:
        #         pass
        #     else:
        #         res_list.append((data["des_ip"], data["source_ip"], data["occur_time"]))
        #         new_list.append(data)
        #
        # records["http-defense"] = new_list
        # with open('aaaa.txt', 'w') as f:
        #     f.write(str(records["http-defense"]))

        # {'http-defense': [{'source_lat': '39.9289', 'attack_time': '27/May/2017:02:25:33+0000',
        # 'des_ip': '183.250.187.100', 'source_lng': '116.3883', 'attack_type': 'http-defense',
        # 'des_lat': '24.4798', 'source_ip': '223.72.72.12', 'id': 479027, 'des_lng': '118.0819'}]}
        # 获取查询结果中记录最多的攻击类型的记录条数
        max_records_length = 0
        for key_type in records:
            attack_record = records[key_type]
            if len(attack_record) > max_records_length:
                max_records_length = len(attack_record)
        for key in records:
            record = records[key]
            # 当多条线的起始点和目的点相同时，设置一个偏移量
            offset = (random.random() + 1) * 3  # 3到6之间的随机数
            # 数据的有效时间的开始时间和结束时间
            start = datetime.datetime.strptime("2012-08-04T16:00:00Z", EPOCH_TIME_FORMAT)
            # 使用最多的记录条数设置结束时间，使所有类型对应的动态攻击线条都能在一个周期内完整显示
            end = start + max_records_length * datetime.timedelta(minutes=1)
            # 根据查询结果封装Node
            node_list = []
            nodes = _get_nodes(record)  # 通过查询结果将数据封装成Node类信息
            if len(nodes) > 0:
                node_list.append(Head(start, end).__dict__)
                node_list = node_list + nodes
            # 根据查询结果封装Point
            point_line_list = []
            points = _get_points(record, offset)
            if len(points) > 0:
                point_line_list.append(Head(start, end).__dict__)
                point_line_list = point_line_list + points
            # 根据查询结果封装Line
            lines = _get_lines(record, offset)
            if len(lines) > 0:
                point_line_list = point_line_list + lines
            all_info[key] = {'node': node_list, 'point_line': point_line_list}
    except Exception as e:
        logger.error(e)
        logger.error(traceback.format_exc())
    finally:
        return all_info


def get_attack_info_by_time(time, limit):
    """
    获取一定时间内的攻击信息
    :param time: 分钟数, 时间长度
    :param limit: 分页大小
    :return: 该时间段内的攻击信息
    """
    attack_records = []
    try:
        es = Elasticsearch(LOCAL_CONFIG.es_server_ip_port)
        head = re.compile(r"--.*-A--")
        xff = "X-Forwarded-For"
        # mid_B = re.compile(r"--.*-B--")
        mid_h = re.compile(r"--.*-H--")
        # end = re.compile(r"--.*-Z--")
        # 首先在es中搜索各索引全部的wafLog记录
        body = {"query": {"bool": {"must": [{"match_phrase": {"_type": "wafLog"}}]}},
                "size": limit, "sort": {"@timestamp": "desc"}}
        if time != 0:
            body["query"]["bool"]['filter'] = {"range": {"@timestamp": {"gte": "now-%sm" % time, "lte": "now"}}}
        result = es.search(index=WAF_INDEX, body=body, ignore_unavailable=True)  # 从es中读取
        _results = result['hits']['hits']
        time_delta = datetime.timedelta(hours=8)
        # 搜索出的结果,就是某一种防御类型的日志
        if result['hits']['total']:
            for hit in _results:
                one_record = hit['_source']['message'].split('\n')
                len_one_record = len(one_record)
                i = 0
                found = 0
                record = {"des_ip": hit['_source']['type']}  # 进入每一条日志,重置log,并记录被攻击IP,该字段记录在es的type中
                while i < len_one_record:
                    line = one_record[i]  # 每一行数据
                    if head.findall(line) and i + 1 < len_one_record:  # 正则表达式r"--.*-A--"
                        _time = datetime.datetime.strptime(
                            one_record[i + 1].split()[0].strip("["), '%d/%b/%Y:%H:%M:%S') + time_delta   # +8h
                        record['occur_time'] = _time.strftime("%Y-%m-%d %X")
                        i += 1
                        found += 1
                    elif line.find(xff) != -1:  # 正则表达式r"X-Forwarded-For"
                        record['source_ip'] = line.split()[1]
                        found += 1
                    elif mid_h.findall(line) and i + 1 < len_one_record:  # 正确表达式r"--.*-H--"
                        record['attack_type'] = _handle_type(one_record[i + 1])  # 处理下1行
                        i += 1
                        found += 1
                    if found == 3:
                        break
                    i += 1
                # if 'source_ip' in record:  # 如果有攻击源IP才记录
                #     attack_records.append(record)
                if 'source_ip' not in record:  # 如果有攻击源IP才记录
                    record['source_ip'] = FUZHOU_DES_IP
                    attack_records.append(record)
    except Exception as e:
        logger.error(e)
        logger.error(traceback.format_exc())
    finally:
        return attack_records


def get_watcherlab_info_limit(limit, sort_random=False):
    """
    获取一定时间内的态势感知数据
    :param sort_random: 是否随机排序
    :param limit: 分页大小
    :return: 该时间段内的攻击信息
    """
    attack_records = []
    try:
        es = Elasticsearch(LOCAL_CONFIG.es_server_ip_port)
        # 首先在es中搜索各索引全部的wafLog记录
        body = {
            "query": {},
            "size": limit,
        }
        if sort_random:
            body['sort'] = {
                "_script": {
                    "script": "Math.random()",
                    "type": "number",
                    "order": "asc"
                }
            }

        result = es.search(index='watcherlab*', body=body, ignore_unavailable=True)  # 从es中读取
        _results = result['hits']['hits']

        if result['hits']['total']:
            for hit in _results:
                try:
                    one_record = hit['_source']['data'].split(',')
                    record = {}
                    record['occur_time'] = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                    record['source_ip'] = one_record[1]
                    record['des_ip'] = FUZHOU_DES_IP
                    record['id'] = hit['_id']  # id
                    record['location'] = hit['_source']['location'].split('-')[1]
                    # if intranet_ip.findall(record['source_ip']) or intranet_ip.findall(record['des_ip']):
                    #     logger.info(record['source_ip'] + " " + record['des_ip'] + " can not do!")
                    # else:  # 不是内网地址,则记录
                    record['source_lng'], record['source_lat'] = \
                        ip_geo_resolver.get_coordinate_by_ip(record['source_ip'])  # 获取攻击源IP的GPS
                    record['des_lng'], record['des_lat'] = \
                        ip_geo_resolver.get_coordinate_by_ip(record['des_ip'])  # 获取攻击目标IP的GPS
                    record['attack_type'] = 'http-defense'  # 攻击类型
                    attack_records.append(record)
                except ValueError as e1:
                    continue
    except Exception as e:
        logger.error(e)
        logger.error(traceback.format_exc())
    finally:
        return attack_records


def _get_watcherlab_count_info():
    """
    获取态势感知数据统计信息
    :return:
    """
    top = 5000
    _result = []
    try:
        es = Elasticsearch(LOCAL_CONFIG.es_server_ip_port)
        body = {
            "query": {},
            "size": top,
            "sort": {
                "_script": {
                    "script": "Math.random()",
                    "type": "number",
                    "order": "asc"
                }
            }
        }
        result = es.search(index='watcherlab*', body=body,
                           ignore_unavailable=True)  # 从es中读取
        _results = result['hits']['hits']
        locations = set()
        if result['hits']['total']:
            for hit in _results:
                location = hit['_source']['location'].split('-')[0]
                locations.add(location)

        for locate in locations:
            body = {
                "query": {
                    "bool": {
                        "must": {
                            "match_phrase":{
                                "location": "[" + locate + "]"
                            }
                        }
                    }
                }
            }
            result = es.search(index='watcherlab*', body=body,
                               ignore_unavailable=True)
            _count = result['hits']['total']
            _r = {}
            _r['name'] = locate
            _r['value'] = str(_count)
            _result.append(_r)
    except Exception as e:
        logger.error(e)
        logger.error(traceback.format_exc())
    finally:
        logger.debug(_result)
        return _result


def get_watcherlab_top_percent():
    """
    获取态势感知数据排名前5的百分比
    :return:
    """
    _statcis_result = _get_watcherlab_count_info()
    count = int(_get_watcherlab_statics()['intercepted'])
    results = []
    for r in _statcis_result:
        r['percent'] = round(int(r['value']) / count * 100, 2)
        results.append(r)
    return sorted(results, key=lambda d: d['percent'], reverse=True)[0:5]


def _get_watcherlab_statics():
    """
    获取一定时间内的态势感知数据
    :param time: 分钟数, 时间长度
    :param limit: 分页大小
    :return: 该时间段内的攻击信息
    """
    result = {}
    try:
        es = Elasticsearch(LOCAL_CONFIG.es_server_ip_port)
        # 首先在es中搜索各索引全部的wafLog记录
        body = {
            "query": {},
        }
        _result = es.search(index='watcherlab*', body=body, ignore_unavailable=True)  # 从es中读取

        total = _result['hits']['total']
        result['intercepted'] = total
    except Exception as e:
        result['intercepted'] = 1
        logger.error(e)
        logger.error(traceback.format_exc())
    finally:
        return result


def _get_trust_log():
    _resultes = list(TrustLog.objects.filter(state=0).values())

    _records = []
    res_list = []
    new_list = []
    data_list = _resultes
    # 去重
    for data in data_list:
        if (data["ip"], data["time"]) in res_list:
            pass
        else:
            res_list.append((data["ip"], data["time"]))
            new_list.append(data)

    _resultes = new_list

    try:
        for re in _resultes:
            record = {}
            record['occur_time'] = re['time']
            record['source_ip'] = re['ip']
            record['des_ip'] = FUZHOU_DES_IP
            record['id'] = re['id']  # id
            record['attack_type'] = 'http-defense'  # 攻击类型

            if intranet_ip.findall(re['ip']) :
                record['source_ip'] = FUZHOU_DES_IP
            else:
                record['source_ip'] = re['ip']

            record['source_lng'], record['source_lat'] = \
                ip_geo_resolver.get_coordinate_by_ip(
                    record['source_ip'])  # 获取攻击源IP的GPS
            record['des_lng'], record['des_lat'] = \
                ip_geo_resolver.get_coordinate_by_ip(
                    record['des_ip'])  # 获取攻击目标IP的GPS

            _records.append(record)
    except Exception as e:
        logger.error(e)
    finally:
        return _records


def _handle_type(line):
    defend_type = "http-defense"
    if line.find("[file \"/") != -1:  # 找[file字段
        cont = line.split()  # 按空格split
        for w in range(len(cont)):
            if cont[w].find("[file") != -1:
                rule = cont[w+1].split("/")[-1].strip("]").strip("\"")
                if rule in GLOBAL_CONFIG.RULES['EXPERIMENTAL_RULES']:
                    defend_type = "web-attack"
                elif rule in GLOBAL_CONFIG.RULES['OPTIONAL_RULES']:
                    defend_type = "sensitive-data-tracking"
                elif rule in GLOBAL_CONFIG.RULES['SLR_RULES']:
                    defend_type = "identification-error"
                elif rule in GLOBAL_CONFIG.RULES['DOS_RULES']:
                    defend_type = "dos-attack"
                else:
                    defend_type = "http-defense"
    return defend_type


def get_watcherlab_daily(n):
    """
    获取每天总的威胁情报数量
    :return: 返回近n天攻击信息
    """
    result = OrderedDict()
    try:
        es = Elasticsearch(LOCAL_CONFIG.es_server_ip_port)
        # 对每天情报数量进行聚合
        body = {"size": 0, "aggs": {"date": {
                    "date_histogram": {"field": "@timestamp", "interval": "day", "format": "yyyy-MM-dd"}}}}
        _result = es.search(index='watcherlab-*', body=body, ignore_unavailable=True)  # 从es中读取
        _result = _result['aggregations']['date']["buckets"]
        items = _result[-n:] if len(_result) > n else _result
        for item in items:
            result[item["key_as_string"]] = item["doc_count"]

    except Exception as e:
        logger.error(e)
        logger.error(traceback.format_exc())
    finally:
        return result


def get_watcherlab_last_month():
    """
    获取每月总的威胁情报数量
    :return: 返回上个月攻击信息
    """
    result = OrderedDict()
    res = {}
    try:
        es = Elasticsearch(LOCAL_CONFIG.es_server_ip_port)
        # 对每天情报数量进行聚合
        body = {"size": 0, "aggs": {"date": {
                    "date_histogram": {"field": "@timestamp", "interval": "month", "format": "yyyy-MM-dd"}}}}
        _result = es.search(index='watcherlab-*', body=body, ignore_unavailable=True)  # 从es中读取
        _result = _result['aggregations']['date']["buckets"]
        items = _result[-2:] if len(_result) > 2 else _result
        for item in items:
            result[item["key_as_string"]] = item["doc_count"]
        today = datetime.datetime.today()
        first_day = datetime.date(today.year, today.month, 1)
        pre_month = first_day - datetime.timedelta(days=1)
        first_day_of_pre_month = datetime.date(pre_month.year, pre_month.month, 1)
        res["last_month"] = result[str(first_day_of_pre_month)]
    except Exception as e:
        logger.error(e)
        logger.error(traceback.format_exc())
    finally:
        return res


def get_watcherlab_month():
    """
    获取本月总的威胁情报数量
    :return: 返回本月攻击信息数量
    """
    result = OrderedDict()
    res = {}
    try:
        es = Elasticsearch(LOCAL_CONFIG.es_server_ip_port)
        # 对每天情报数量进行聚合
        body = {"size": 0, "aggs": {"date": {
                    "date_histogram": {"field": "@timestamp", "interval": "month", "format": "yyyy-MM-dd"}}}}
        _result = es.search(index='watcherlab-*', body=body, ignore_unavailable=True)  # 从es中读取
        _result = _result['aggregations']['date']["buckets"]
        items = _result[-2:] if len(_result) > 2 else _result
        for item in items:
            result[item["key_as_string"]] = item["doc_count"]
        today = datetime.datetime.today()
        first_day_of_month = datetime.date(today.year, today.month, 1)
        res["month"] = result[str(first_day_of_month)]
    except Exception as e:
        logger.error(e)
        logger.error(traceback.format_exc())
    finally:
        return res


def get_server_status():
    """
    获取流量实时统计, 磁盘写入, 磁盘读取, ipv4流入, ipv4流出,
    cpu, memory, swap, 进程总数, 磁盘利用率, vda 的数据
    :return:
    """
    result = {}
    cpu_index = "metriccpumetricsets" + "-" + datetime.datetime.now().strftime('%Y%m%d')
    memory_index = "metricmemorymetricsets" + "-" + datetime.datetime.now().strftime('%Y%m%d')
    process_index = "metricprocessmetricsets" + "-" + datetime.datetime.now().strftime('%Y%m%d')
    diskio_index = "metricdiskiometricsets" + "-" + datetime.datetime.now().strftime('%Y%m%d')
    network_index = "metricnetworkmetricsets" + "-" + datetime.datetime.now().strftime('%Y%m%d')


    result['used_cpu_pct'] = get_cpu_pct(cpu_index)  # cpu 利用率
    result['used_mem_pct'] = get_memory_pct(memory_index)  # 内存利用率
    result['used_swap_pct'] = get_swap_pct(memory_index)  # swap 利用率
    result['process_nums'] = get_process_num(process_index)  # 进程数量

    res = get_diskio(diskio_index)
    result['disk_write'] = res["disk_write"]  # 磁盘写入速度
    result['disk_read'] = res["disk_read"]  # 磁盘读取速度
    result['read_write_count'] = res['read_write_count']  # 读写数量
    result['vda'] = res["disk_write"]  # vda 目前定义为磁盘写入速度

    res = get_network(network_index)
    result['network_in'] = '%.2f' % res['network_in']  # 网络流入
    result['network_out'] = '%.2f' % res['network_out']  # 网络流出
    result['data_second'] = '%.2f' % (res['network_in'] + res['network_out'])  # 流量实时统计定义为网络流入和流出速度和
    return result


def get_cpu_pct(index):
    """
    获取cpu 使用率
    :param index:
    :return:
    """
    # cpu_body = {"query": {"match": {'metricset.name': 'cpu'}},
    #             'sort': {'@timestamp': {'order': 'desc'}},
    #             'size': 1}
    cpu_body = {"query": {"bool": {"must": [{"match": {"metricset.name": "cpu"}},
                                            {"match": {"fields.ip": server_ip}}]}},
                'sort': {'@timestamp': {'order': 'desc'}},
                'size': 1}
    used_swap_pct = 0
    try:
        # 获取cpu使用率
        res = es.search(index=index, body=cpu_body)
        cpu_info = res['hits']['hits']
        if len(cpu_info) > 0:
            latest_cpu_info = cpu_info[0]
            idle_pct = latest_cpu_info['_source']['system']['cpu']['idle']['pct']
            # 保留4位小数
            used_swap_pct = '%.4f' % (1 - idle_pct)
    except Exception as e:
        logger.error(e)
    return used_swap_pct


def get_memory_pct(index):
    """
    获取内存使用率
    :param index:
    :return:
    """
    # mem_body = {"query": {"match": {'metricset.name': 'memory'}},
    #             'sort': {'@timestamp': {'order': 'desc'}},
    #             'size': 1}
    mem_body = {"query": {"bool": {"must": [{"match": {"metricset.name": "memory"}},
                                            {"match": {"fields.ip": server_ip}}]}},
                'sort': {'@timestamp': {'order': 'desc'}},
                'size': 1}
    used_mem_pct = 0
    try:
        # 获取内存, swap使用率
        res = es.search(index=index, body=mem_body)
        mem_info = res['hits']['hits']
        if len(mem_info) > 0:
            latest_mem_info = mem_info[0]
            sys_mem = latest_mem_info['_source']['system']['memory']
            used_mem_pct = '%.4f' % sys_mem['used']['pct']
    except Exception as e:
        logger.error(e)
    return used_mem_pct


def get_swap_pct(index):
    """
    获取交换swap 使用率
    :param index:
    :return:
    """
    mem_body = {"query": {"bool": {"must": [{"match": {"metricset.name": "memory"}},
                                            {"match": {"fields.ip": server_ip}}]}},
                'sort': {'@timestamp': {'order': 'desc'}},
                'size': 1}
    used_swap_pct = 0
    try:
        # 获取内存, swap使用率
        res = es.search(index=index, body=mem_body)
        mem_info = res['hits']['hits']
        if len(mem_info) > 0:
            latest_mem_info = mem_info[0]
            sys_mem = latest_mem_info['_source']['system']['memory']
            used_swap_pct = '%.4f' % sys_mem['swap']['used']['pct']
    except Exception as e:
        logger.error(e)
    return used_swap_pct


def get_process_num(index):
    """
    获取进程数量
    :param index:
    :return:
    """
    # process_body = {"query": {"match": {'metricset.name': 'process'}},
    #                 'sort': {'@timestamp': {'order': 'desc'}},
    #                 'size': 1}
    process_body = {"query": {"bool": {"must": [{"match": {"metricset.name": "process"}},
                                                {"match": {"fields.ip": server_ip}}]}},
                    'sort': {'@timestamp': {'order': 'desc'}},
                    'size': 1}
    process_nums = 0
    try:
        # 获取进程数量
        res = es.search(index=index, body=process_body)
        process_info = res['hits']['hits']
        if len(process_info) > 0:
            latest_process_time = process_info[0]['_source']['@timestamp']
            query = {"query": {"bool": {"must": [{"match": {"metricset.name": "process"}},
                                                 {"match": {"fields.ip": server_ip}},
                                                 {"match": {"@timestamp": latest_process_time}}]}}}
            res = es.search(index=index, body=query)
            process_nums = res['hits']['total']
    except Exception as e:
        logger.error(e)
    return process_nums


def get_diskio(index):
    """
    获取磁盘读写速度
    :param index:
    :return:
    """
    diskio_body = {"query": {"bool": {"must": [{"match": {"metricset.name": "diskio"}},
                                               {"match": {"fields.ip": server_ip}}]}},
                   'sort': {'@timestamp': {'order': 'desc'}},
                   'size': 1}
    disk_write = 0.0
    disk_read = 0.0
    read_write_count = 0

    result = {}
    try:
        # 获取磁盘读写速度
        res = es.search(index=index, body=diskio_body)
        disk_info = res['hits']['hits']
        disk_name = disk_info[0]['_source']['system']['diskio']['name']
        query = {"query": {"bool": {"must": [{"match": {"metricset.name": "diskio"}},
                                             {"match": {"system.diskio.name": disk_name}},
                                             {"match": {"fields.ip": server_ip}}]}},
                 "sort": [{"@timestamp": {"order": "desc"}}],
                 "size": 2}

        res = es.search(index=index, body=query)
        disk_timestamp0 = res['hits']['hits'][0]['_source']['@timestamp']
        disk_timeatamp1 = res['hits']['hits'][1]['_source']['@timestamp']
        disk_status0 = diskio_status(index, disk_timestamp0)
        disk_status1 = diskio_status(index, disk_timeatamp1)
        # 取es的时间戳间隔时间，而不是实际的写入时间
        interval_time = string2time(disk_timestamp0) - string2time(disk_timeatamp1)

        for vda in disk_status0:

            # read_time = (disk_status0[vda]["read_time"] - disk_status1[vda]["read_time"])
            # read_time = 1 if read_time is 0 else read_time
            #
            # write_time = (disk_status0[vda]["write_time"] - disk_status1[vda]["write_time"])
            # write_time = 1 if write_time is 0 else write_time
            # 以KB为单位，保留2位小数
            disk_write += (disk_status0[vda]["write"] - disk_status1[vda]["write"]) / 1024 / interval_time
            disk_read += (disk_status0[vda]["read"] - disk_status1[vda]["read"]) / 1024 / interval_time
            read_count = (disk_status0[vda]["read_count"] - disk_status1[vda]["read_count"]) / interval_time
            write_count = (disk_status0[vda]["write_count"] - disk_status1[vda]["write_count"]) / interval_time
            read_write_count += (read_count + write_count)

    except Exception as e:
        logger.error(e)
    result["disk_write"] = '%.2f' % disk_write
    result["disk_read"] = '%.2f' % disk_read
    result['read_write_count'] = int(read_write_count)
    return result


def get_network(index):
    """
    获取网络速度
    :param index:
    :return:
    """
    network_body = {"query": {'bool': {"must": [{'match': {'metricset.name': 'network'}},
                                                {"match": {"fields.ip": server_ip}}],
                                       'must_not': {'match': {'system.network.name': 'lo'}}}},
                    'sort': {'@timestamp': {'order': 'desc'}},
                    'size': 1}
    network_out = 0
    network_in = 0
    result = {}
    try:
        # 获取网络上传和下载速度
        # res = es.search(index=index, body=network_body, size=1)
        # network_name = res['hits']['hits'][0]['_source']['system']['network']['name']

        body = {"query": {
                    "bool": {
                         "must": [
                             {"match": {"system.network.name": "eth0"}},
                             {"match": {"fields.ip": server_ip}}]
                            }
                        },
                    "sort": {"@timestamp": {"order": "desc"}},
                'size': 2}
        res = es.search(index=index, body=body)
        network_info = res['hits']['hits']
        # 取第一次
        network_out0 = network_info[0]['_source']['system']['network']['out']['bytes']
        network_in0 = network_info[0]['_source']['system']['network']['in']['bytes']
        network_time0 = string2time(network_info[0]['_source']['@timestamp'])
        # 取第二次
        network_out1 = network_info[1]['_source']['system']['network']['out']['bytes']
        network_in1 = network_info[1]['_source']['system']['network']['in']['bytes']
        network_time1 = string2time(network_info[1]['_source']['@timestamp'])

        time_span = int(network_time0 - network_time1)

        time_span = 1 if time_span is 0 else time_span
        # 做差，以KB为单位，保留2位小数
        network_out = (network_out0 - network_out1) / 1024 / time_span
        network_in = (network_in0 - network_in1) / 1024 / time_span
    except Exception as e:
        logger.error(e)
    result["network_out"] = network_out
    result["network_in"] = network_in
    return result


def string2time(s):
    t = datetime.datetime.strptime(s.split(".")[0].replace("T", " "), "%Y-%m-%d %H:%M:%S")
    return time.mktime(t.timetuple())


def diskio_status(index, disk_timestamp):
    result = dict()
    query = {"query": {"bool": {"must": [{"match": {"metricset.name": "diskio"}},
                                         {"match": {"@timestamp": disk_timestamp}},
                                         {"match": {"fields.ip": server_ip}},
                                         {"match_phrase_prefix": {"system.diskio.name": "vda"}}]}},
             "sort": [{"@timestamp": {"order": "desc"}}]}
    res = es.search(index=index, body=query)
    disk_info = res['hits']['hits']

    for vda in disk_info:
        item = dict()
        vda_name = vda['_source']['system']["diskio"]["name"]
        item["write"] = vda['_source']['system']['diskio']['write']['bytes']
        item["read"] = vda['_source']['system']['diskio']['read']['bytes']
        # item["write_time"] = vda['_source']['system']['diskio']['write']['time']
        # item["read_time"] = vda['_source']['system']['diskio']['read']['time']
        item['read_count'] = vda['_source']['system']['diskio']['read']['count']
        item['write_count'] = vda['_source']['system']['diskio']['write']['count']
        result[vda_name] = item
    return result

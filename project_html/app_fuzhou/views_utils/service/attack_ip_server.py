#!/usr/bin/env python3
# encoding: utf-8
"""
此模块提供接收防火墙的攻击IP信息、查询攻击IP地址查询的功能
Author: Jing Qingyun
"""

import time
import zmq
import MySQLdb
import json
import datetime
import random

from app_fuzhou.views_utils.logger import logger
from app_fuzhou.views_utils.localconfig import JsonConfiguration
from app_fuzhou.views_utils.security import RSACrypto

GLOBAL_CONFIG = JsonConfiguration()

SERVER_ADDRESS = 'tcp://*:%s' % GLOBAL_CONFIG.used_ports['attack_ip']
RECV_TIMEWAIT = 0.1

TYPE_COLORS = {
    "http-defense": [228, 78, 143],
    "dos-attack": [159, 60, 222],
    "web-attack": [52, 182, 225],
    "sensitive-data-tracking": [67, 197, 142],
    "identification-error": [222, 213, 60]
}

HEAD = {
    "id": "document",
    "name": "CZML Geometries: test node data",
    "version": "1.0"
}

ATTACK_TIME_FORMAT = "[%d/%b/%Y:%X%z]"
EPOCH_TIME_FORMAT = "%Y-%m-%dT%H:%M:%SZ"
STD_TIME_FORMAT = "%Y-%m-%d %X"


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

    def __init__(self, id, x, y):
        self.id = id
        self.name = 'node-%s' % id
        self.position = Position(x, y).__dict__
        self.billboard = BillBoard().__dict__


class Head(object):
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
        # 增加持续时间
        end_time = end + datetime.timedelta(minutes=7)
        end_time = end_time.strftime(EPOCH_TIME_FORMAT)
        self.clock = {"interval": "%s/%s" % (start_time, end_time),
                      "currentTime": start_time, "mutilplier": 360}
        self.availability = "%s/%s" % (start_time, end_time)


class BillBoard(object):
    """
    生成地图的附加数据
    """

    def __init__(self):
        self.eyeOffset = {'cartesian': [0, 0, 0]}
        self.image = 'static/img/mapImg/source.png'
        self.horizontalOrigin = "CENTER"
        self.verticalOrigin = "CENTER"
        self.pixelOffset = {'cartesian2': [0, 0]}
        self.scale = 1.5
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

    def __init__(self, id, x1, y1, x2, y2, color, epoch, delta, offset):
        """
        构造方法
        :param id: ID
        :param x1: 源地址经度
        :param y1: 源地址纬度
        :param x2: 目的地址经度
        :param y2: 目的地址纬度
        :param color: 颜色
        :param epoch: 前段显示出现时间
        :param delta: 相对出现时间的增量
        :param offset: 随机值,在显示上加以区分
        """
        self.id = 'point-%s' % id

        end = epoch + datetime.timedelta(seconds=delta)

        start_time = epoch.strftime(EPOCH_TIME_FORMAT)
        end_time = epoch + datetime.timedelta(minutes=7)
        end_time = end_time.strftime(EPOCH_TIME_FORMAT)
        self.availability = "%s/%s" % (start_time, end_time)
        self.point = {
            "outlineWidth": 1,
            "pixelSize": 5,
            "color": {"rgba": color},
            "outlineColor": {"rgba": [255, 255, 255, 0]}
        }
        self.position = {
            "epoch": end.strftime(EPOCH_TIME_FORMAT),
            "interpolationDegree": 12,
            "interpolationAlgorithm": "HERMITE",
            "cartographicDegrees": set_cart(x1, y1, x2, y2, offset)
        }


class Line(object):
    """
    源地址到目的地址连线
    """

    def __init__(self, id, x1, y1, x2, y2, width, color, epoch, offset):
        """
        Line类构造方法
        :param id: ID
        :param x1: 源地址经度
        :param y1: 源地址纬度
        :param x2: 目的地址经度
        :param y2: 目的地址纬度
        :param width: 宽度,合并相同对象时增加
        :param color: 颜色
        :param epoch: 出现时间
        :param offset: 随机值,在显示上加以区分
        """
        self.id = 'line-%d' % id
        end = epoch + datetime.timedelta(minutes=7)

        start_time = epoch.strftime(EPOCH_TIME_FORMAT)
        end_time = end.strftime(EPOCH_TIME_FORMAT)
        self.availability = "%s/%s" % (start_time, end_time)
        self.path = {
            "leadTime": 10,
            "width": width,
            "resolution": 1,
            "trialTime": 1000,
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
    :return: 坐标数据
    """

    x1 = float(x1)
    y1 = float(y1)
    x2 = float(x2)
    y2 = float(y2)

    cart = [0, x1, y1, 0]
    cart.append(180)
    cart.append((x1 + x2) / 2 + offset)
    cart.append((y1 + y2) / 2 + offset)
    cart.append(2000000)
    cart.append(360)
    cart.append(x2)
    cart.append(y2)
    cart.append(0)
    return cart


def recv_attack_ip():
    """
    ZeroMQ的服务端，负责接收防火墙发送的攻击IP信息
    :return: None
    """

    logger.info('Attacking IP receiver(%s) is running...', SERVER_ADDRESS)
    context = zmq.Context()
    server = context.socket(zmq.REP)
    server.bind(SERVER_ADDRESS)

    while True:
        msg = json.loads(RSACrypto.decrypt(server.recv()))
        server.send(b'Server received.')
        if msg['header']['type'] != 8:
            save_attack_ip(msg['pack_dic']['content'])
        time.sleep(RECV_TIMEWAIT)


def save_attack_ip(value_array):
    """
    将攻击IP信息保存到数据库
    :param value_array: 攻击IP数组
    :return: None
    """

    conn = None
    cursor = None

    insert_sql = "INSERT INTO attack_ip(" \
                 "source_dim_x, source_dim_y, des_dim_x, des_dim_y, " \
                 "source_ip, des_ip, attack_type, occur_time, unique_tag) " \
                 "VALUES(%s, %s, %s, %s, %s, %s, %s, %s, %s)"
    logger.info(insert_sql)
    insert_values = set()  # 声明set集合用于去重
    # 添加批量插入的values
    for item in value_array:
        source_x = "%.4f" % float(item['source_dimension']['x'])
        source_y = "%.4f" % float(item['source_dimension']['y'])
        des_x = "%.4f" % float(item['des_dimension']['x'])
        des_y = "%.4f" % float(item['des_dimension']['y'])
        source = item['source']
        des = item['des']
        attack_type = item['attack_type']
        occur_time = datetime.datetime.strptime(
            item['attack_time'], ATTACK_TIME_FORMAT
        ).strftime(STD_TIME_FORMAT)

        # 将所有字段拼接生成hash值
        unique_tag = hash(source_x + source_y + des_x + des_y + source
                          + des + attack_type + occur_time)

        # set集合不能添加可变元素, 所以不能添加list对象
        insert_values.add(
            (source_x, source_y, des_x, des_y, source, des, attack_type,
             occur_time, unique_tag)
        )

    try:
        conn = get_connection()
        cursor = conn.cursor()
        logger.info("Attempting to insert %d records.", len(insert_values))
        cursor.executemany(insert_sql, insert_values)
        conn.commit()
        logger.info("All records saved.")
    except Exception as e:
        logger.error(e)
        conn.rollback()
    finally:
        cursor.close()
        conn.close()


def get_details(limit=100):
    """
    获取攻击信息
    :param limit: 分页的大小
    :return: 攻击信息
    """
    conn = None
    cursor = None

    try:
        conn = get_connection()
        cursor = conn.cursor(MySQLdb.cursors.DictCursor)
        sql = "SELECT source_ip, des_ip, attack_type, occur_time " \
              "FROM attack_ip ORDER BY occur_time DESC LIMIT %d" % limit
        # logger.info(sql)
        cursor.execute(sql)
        query_result = list(cursor.fetchall())
        query_result.reverse()
        return query_result
    except Exception as e:
        logger.error(e)
    finally:
        cursor.close()
        conn.close()


def get_details_time(time=5, limit=100):
    """
    获取一定时间内的攻击信息
    :param time: 秒, 时间长度
    :param limit: 分页大小
    :return: 该时间段内的攻击信息
    """
    conn = None
    cursor = None
    try:
        conn = get_connection()
        cursor = conn.cursor(MySQLdb.cursors.DictCursor)
        sql = "SELECT source_ip, des_ip, attack_type, occur_time " \
              "FROM attack_ip WHERE occur_time " \
              "BETWEEN date_sub(now(), INTERVAL %d MINUTE) AND now() LIMIT %d" \
              % (time, limit)
        # logger.info(sql)
        cursor.execute(sql)
        query_result = cursor.fetchall()
        return query_result
    except Exception as e:
        logger.error(e)
    finally:
        cursor.close()
        conn.close()


def get_type_count():
    """
    获得每种攻击类型的发生次数
    :return: dict，每种攻击类型的发生次数
    """

    conn = None
    cursor = None
    default = {
        "http-defense": 0,
        "dos-attack": 0,
        "web-attack": 0,
        "sensitive-data-tracking": 0,
        "identification-error": 0,
    }

    try:
        conn = get_connection()
        cursor = conn.cursor()
        sql = "SELECT attack_type, count(*) count FROM attack_ip " \
              "GROUP BY attack_type"
        # logger.info(sql)
        cursor.execute(sql)
        all = cursor.fetchall()
        # 通过更新的方式,保证类型计数 >= 0
        for item in all:
            default[item[0]] = item[1]
        return default
    except Exception as e:
        logger.info(e)
    finally:
        cursor.close()
        conn.close()


def get_ip_by_dim(dim_x, dim_y):
    """
    通过经纬度查询对应的IP地址
    :param dim_x: 经度
    :param dim_y: 纬度
    :return: dict,IP信息
    """

    conn = None
    cursor = None
    try:
        conn = get_connection()
        cursor = conn.cursor(MySQLdb.cursors.DictCursor)

        sql = "SELECT source_ip, des_ip, attack_type, occur_time " \
              "FROM attack_ip WHERE  des_dim_x=%s AND des_dim_y=%s " \
              "ORDER BY occur_time DESC "
        # logger.info(sql)
        cursor.execute(sql, (dim_x, dim_y))
        all1 = cursor.fetchall()
        # 更改为target,受攻击者
        for item in all1:
            item['occur_time'] = item['occur_time'].strftime(STD_TIME_FORMAT)
            item['type'] = 'target'

        sql = "SELECT source_ip, des_ip, attack_type, occur_time " \
              "FROM attack_ip WHERE (source_dim_x=%s AND source_dim_y=%s) " \
              "ORDER BY occur_time DESC "
        # logger.info(sql)
        cursor.execute(sql, (dim_x, dim_y))
        all2 = cursor.fetchall()
        # 更改为source,攻击者
        for item in all2:
            item['occur_time'] = item['occur_time'].strftime(STD_TIME_FORMAT)
            item['type'] = 'source'
        all = all1 + all2
        return all
    except Exception as e:
        logger.error(e)
    finally:
        cursor.close()
        conn.close()


def get_info_time(count, limit):
    """
    获得一定时间内发生的攻击IP信息,分别封装成Point,Node和Line
    :return: dict，攻击IP信息
    """

    conn = None
    cursor = None

    try:
        types = get_all_attack_types()
        conn = get_connection()
        cursor = conn.cursor(MySQLdb.cursors.DictCursor)
        all_info = {}

        for type in types:
            if count == "1":
                sql = "SELECT id, source_dim_x, source_dim_y, des_dim_x, " \
                      "des_dim_y, attack_type " \
                      "FROM attack_ip " \
                      "WHERE attack_type=%s ORDER BY occur_time DESC limit " + str(limit)
            else:
                sql = "SELECT id, source_dim_x, source_dim_y, des_dim_x, " \
                      "des_dim_y, attack_type " \
                      "FROM attack_ip " \
                      "WHERE attack_type=%s AND occur_time " \
                      "BETWEEN DATE_SUB(NOW(), INTERVAL 5 MINUTE) AND NOW() " \
                      "ORDER BY occur_time DESC limit " + str(limit)

            # logger.info(sql)
            cursor.execute(sql, (type,))
            query_result = list(cursor.fetchall())
            # 查询结果是按时间逆序取最新的值,这里将其还原为正序
            query_result.reverse()
            num_of_row = cursor.rowcount
            # 重叠的偏移
            offset = random.random() * 5

            # 有效时间的开始时间和结束时间
            start = datetime.datetime.strptime("2012-08-04T16:00:00Z",
                                               EPOCH_TIME_FORMAT)
            end = start + num_of_row * datetime.timedelta(minutes=1)

            # 根据查询结果封装Node
            node_list = []
            nodes = __get_nodes(query_result)
            if len(nodes) > 0:
                node_list.append(Head(start, end).__dict__)
                node_list = node_list + nodes

            # 根据查询结果封装Point
            point_line_list = []
            points = __get_points(query_result, offset)
            if len(points) > 0:
                point_line_list.append(Head(start, end).__dict__)
                point_line_list = point_line_list + points

            # 根据查询结果封装Line
            lines = __get_lines(query_result, offset)
            if len(lines) > 0:
                point_line_list = point_line_list + lines

            all_info[type] = {'node': node_list, 'point_line': point_line_list}

        return all_info
    except Exception as e:
        logger.error(e)
    finally:
        cursor.close()
        conn.close()


def get_all_attack_types():
    """
    获取所有攻击类型
    :return: list, 所有攻击类型
    """

    conn = None
    cursor = None
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT DISTINCT attack_type FROM attack_ip')
        types = []
        # ((x,), (y,))转换成[x, y]
        for e in cursor.fetchall():
            types.append(e[0])
        return types
    except Exception as e:
        logger.error(e)
    finally:
        conn.close()
        cursor.close()


def __get_nodes(query_result):
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
                item['source_dim_x'],
                item['source_dim_y']
            ).__dict__
        )
        # 构造被攻击者的Node对象
        node_list.append(
            Node(
                d_node + str(item['id']), item['des_dim_x'], item['des_dim_y']
            ).__dict__
        )

    return node_list


def __get_points(query_result, offset):
    """
    通过查询结果将数据封装成Point类信息
    :param query_result: tuple,数据库查询结果
    :return: list,Point类信息
    """

    point_list = []
    # 写死第一个点出现的时间
    t = datetime.datetime.strptime("2012-08-04T16:00:00Z", EPOCH_TIME_FORMAT)
    index = 0
    for item in query_result:
        # 根据顺序偏移时间
        index += 1
        # 生成一定数量的Point用于连续地显示
        for i in range(20):
            color = []
            color += TYPE_COLORS[item["attack_type"]]
            color.append(255 - i * 12)

            point_list.append(
                Point(
                    str(item['id']) + "-" + str(i),
                    item['source_dim_x'],
                    item['source_dim_y'],
                    item['des_dim_x'],
                    item['des_dim_y'],
                    color,
                    t + datetime.timedelta(minutes=index),
                    i * 3.5,
                    offset
                ).__dict__
            )
    return point_list


def __get_lines(query_result, offset):
    """
    通过查询结果将数据封装成Line类信息
    :param query_result: tuple,数据库查询结果
    :return: list,Line类信息
    """

    line_list = []

    # 写死第一个点出现的时间
    t = datetime.datetime.strptime("2012-08-04T16:00:00Z", EPOCH_TIME_FORMAT)
    index = 0

    for item in query_result:
        color = []
        color += TYPE_COLORS[item["attack_type"]]
        color.append(255)

        # 根据顺序偏移时间
        index += 1
        line = Line(
            0, item['source_dim_x'],
            item['source_dim_y'],
            item['des_dim_x'],
            item['des_dim_y'],
            1, color,
            t + datetime.timedelta(minutes=index),
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


def get_connection():
    """
    获得数据库连接
    :return: Connection
    """

    user = GLOBAL_CONFIG.mysql_user
    password = GLOBAL_CONFIG.mysql_pass
    port = GLOBAL_CONFIG.mysql_port
    host = GLOBAL_CONFIG.mysql_host
    database = GLOBAL_CONFIG.mysql_database

    try:
        return MySQLdb.connect(
            host=host, port=port, user=user, passwd=password, db=database
        )
    except Exception as e:
        logger.error(e)

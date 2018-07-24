#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
本例用来为地球服务的后端接口
Author 杨泽
Date 2017-5-27
"""
import json
import time
import random
import datetime
from collections import OrderedDict

from dateutil.relativedelta import relativedelta
from dateutil.rrule import *

import redis
from django.http import HttpResponse, JsonResponse

from app_fuzhou.views_utils.utils_attack_server import (
    get_attack_info,
    get_attack_info_by_time,
    get_all_type_attack_info,
    get_attack_info_count,
    get_watcherlab_info_limit,
    _get_trust_log,
    _get_watcherlab_statics,
    _get_watcherlab_count_info
)
from app_fuzhou.views_utils import utils_attack_server, utils_waf
from app_fuzhou.views_utils.global_config import JsonConfiguration
from app_fuzhou.views_utils.logger import logger

CONF = JsonConfiguration()


# 获取所有类型的攻击IP信息
def get_all_info(request):
    """
    获取在地球上绘制攻击的点和线信息
    :param request:
        参数:flag,标志位,第几次请求,1为第一次(无时间过滤),2为其余(5分钟内的数据)
        参数:limit,获取的攻击记录最大条数
    :return: {'node': node_list, 'point_line': point_line_list}
    """
    flag = request.POST.get('count', '1')
    limit = int(request.POST.get('limit', 100))
    result = get_attack_info(flag, limit)
    return HttpResponse(json.dumps(result))


def get_details(request):
    """
    获取所有攻击IP信息
    :param request:
        参数:limit,获取的攻击记录最大条数
        参数:time,时间过滤,单位分钟,0即不进行时间过滤
    :return: [{}]
    """
    limit = int(request.POST.get('limit', 100))
    time = int(request.POST.get('time', 0))
    info_time = get_attack_info_by_time(time, limit)
    info_limit = get_watcherlab_info_limit(random.randint(5, 20)) # 取随机数展示
    trust_log_count = _get_trust_log()
    return HttpResponse(json.dumps(info_time + info_limit + trust_log_count))


def get_type_count(request):
    """
    获得所有攻击类型发生次数
    :param request:
    :return:
    """
    return HttpResponse(json.dumps(get_attack_info_count()))


def get_watcherlab_info(request):
    """
    获取所有攻击IP信息,包括攻击地点的IP等信息
    :param request:
    :return: [{}]
    """
    det = get_watcherlab_info_limit(random.randint(5, 50), True)
    return HttpResponse(json.dumps(det))


def get_watcherlab_count(request):
    """
    查询态势感知数据总条数
    :param request:
    :return: [{}]
    """
    det = get_watcherlab_info_limit(random.randint(5, 50), True)
    return HttpResponse(json.dumps(det))


def get_watcherlab_statics(request):
    """
    查询拦截威胁数量等统计信息
    :param request:
    :return:
    """
    return HttpResponse(json.dumps(_get_watcherlab_statics()))


def get_watcherlab_top_percent(request):
    """
    获取前5的百分比信息
    :param request:
    :return:
    """
    return HttpResponse(
        json.dumps(utils_attack_server.get_watcherlab_top_percent()))


def get_watcherlab_count_info(request):
    """
    首页2D地球,攻击地点前10的攻击信息
    :param request:
    :return: [{}]
    例如:
        [{'name': '美国', "value": "189"},
        {'name': '英国', "value": '12'}]
    """
    try:
        redis_client = redis.Redis(CONF.redis4bigchanidb_host, CONF.redis4bigchanidb_port)
        key = 'watcherlab_' + datetime.datetime.now().strftime('%Y-%m-%d')
        info = redis_client.get(key)
        if info is None:  # 如果redis中没有缓存,从ES查询计算
            info = json.dumps(_get_watcherlab_count_info())  # 直接把json数据存入redis
            redis_client.setex(key, info, 60 * 60 * 24)
    except Exception as e:
        logger.error(e)
        info = json.dumps(_get_watcherlab_count_info())
    return HttpResponse(info)


def get_watcherlab_daily(request):
    """
    获取按天统计每天总的威胁情报数量
    :param request:
    :return:
    """
    result = OrderedDict()
    today = datetime.datetime.today()
    res = utils_attack_server.get_watcherlab_daily(10)
    for i in range(9, -1, -1):
        day_s = (today - datetime.timedelta(days=i)).strftime("%Y-%m-%d")
        result[day_s] = res.get(day_s, 0)
    return HttpResponse(json.dumps(result))


def get_server_status(request):
    """
    获取服务器状态数据
    :param request:
    :return:
    """
    return HttpResponse(json.dumps(utils_attack_server.get_server_status()))


def get_watcherlab_last_two_days(request):
    """
    获取最近两天的威胁情报数量
    :param request:
    :return:
    """
    res = {}
    today = datetime.datetime.today()
    watcherlab_daily = utils_attack_server.get_watcherlab_daily(2)
    res["today"] = watcherlab_daily.get(today.strftime("%Y-%m-%d"), 0)  # 今天总数
    res["yesterday"] = watcherlab_daily.get((today - datetime.timedelta(days=1)).strftime("%Y-%m-%d"), 0)  # 昨日总数
    return HttpResponse(json.dumps(res))


def get_watcherlab_statistic(request):
    """
    按不同时间维度获取威胁情报统计数据
    :param request:
    :return:
    """
    res = {}
    week_nums = 0
    month_nums = 0
    today = datetime.datetime.today()

    watcherlab_daily = utils_attack_server.get_watcherlab_daily(30)

    res["today"] = watcherlab_daily.get(today.strftime("%Y-%m-%d"), 0)  # 今天总数
    res["yesterday"] = watcherlab_daily.get((today - datetime.timedelta(days=1)).strftime("%Y-%m-%d"), 0)  # 昨日总数

    # 上周总数
    last_monday = today + relativedelta(weekday=MO(-2))
    for i in range(0, 7):
        week_nums += watcherlab_daily.get((last_monday + datetime.timedelta(days=i)).strftime("%Y-%m-%d"), 0)
    res["last_week"] = week_nums

    # 最近一周总数
    week_nums = 0
    for i in range(0, 7):
        week_nums += watcherlab_daily.get((today - datetime.timedelta(days=i)).strftime("%Y-%m-%d"), 0)
    res["present_week"] = week_nums

    # 上月总数和最近一个月总数
    for i in range(0, 30):
        month_nums += watcherlab_daily.get((today - datetime.timedelta(days=i)).strftime("%Y-%m-%d"), 0)
    res["present_month"] = month_nums  # 最近一月总数
    res.update(utils_attack_server.get_watcherlab_last_month())
    return HttpResponse(json.dumps(res))


def get_attack_pct(request):
    """
    获取五种攻击百分比
    :param request:
    :return:
    """
    return_dict = {}
    nums = 0
    try:

        # 返回近7天每天的每种攻击类型的统计,和每种类型的总数统计
        week, total = utils_waf.get_waf_log_aggregations_week()
        for item in total.keys():
            nums += total[item]
        nums = nums if nums else 1
        return_dict['web-attack'] = round(total['web-attack'] / nums, 4)
        return_dict['sensitive-data-tracking'] = round(total['sensitive-data-tracking'] / nums, 4)
        return_dict['identification-error'] = round(total['identification-error'] / nums, 4)
        return_dict['dos-attack'] = round(total['dos-attack'] / nums, 4)
        return_dict['http-defense'] = round(total['http-defense'] / nums, 4)

    except Exception as e:
        logger.error(e)
    return HttpResponse(json.dumps(return_dict))


def get_watherlab_average(request):
    """
    今日拦截数平均每分钟, 本月每日平均数量, 本月平均每分钟数量
    :param request:
    :return:
    """
    result = {}
    t = int(time.time())
    today = datetime.datetime.today()
    first_day_of_month = str(datetime.date(today.year, today.month, 1)) + " 00:00:00"

    minutes_of_month = (t - int(ISOString2Time(first_day_of_month))) / 60
    minutes_of_month = minutes_of_month if minutes_of_month else 1

    minutes_of_day = (t - int(ISOString2Time(today.strftime("%Y-%m-%d") + " 00:00:00"))) / 60
    minutes_of_day = minutes_of_day if minutes_of_day else 1

    watcherlab_daily = utils_attack_server.get_watcherlab_daily(1)
    today_nums = watcherlab_daily.get(today.strftime("%Y-%m-%d"), 0)
    watcherlab_month = utils_attack_server.get_watcherlab_month()
    month_nums = watcherlab_month["month"]

    result["pre_day"] = round(month_nums / int(datetime.datetime.now().day), 2)
    result["pre_minute_of_today"] = round(today_nums / minutes_of_day, 2)
    result["pre_minute_of_month"] = round(month_nums / minutes_of_month, 2)

    return HttpResponse(json.dumps(result))


def attack_week_detail(request):
    """
    获取http 和dos 攻击一周数量
    :param request:
    :return:
    """
    time = []
    http_count = []
    dos_count = []

    week, total = utils_waf.get_waf_log_aggregations_week()
    for (i1, i2) in zip(week["date"], week["http-defense"]):
        time.append((datetime.datetime.strptime(i1,'%Y-%m-%d')).strftime('%m.%d'))
        http_count.append(i2)

    for (i1, i2) in zip(week["date"], week["dos-attack"]):
        dos_count.append(i2)

    return JsonResponse({'time': time, 'http_count': http_count, 'dos_count': dos_count})


def ISOString2Time(s):
    """
    把一个时间转化为秒
    :param s:
    :return:
    """
    d = datetime.datetime.strptime(s, "%Y-%m-%d %H:%M:%S")
    return time.mktime(d.timetuple())


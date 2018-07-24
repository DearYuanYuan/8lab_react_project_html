#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
本例为logInfo接口,提供trustFile的各种数据
Author 杨泽
Date 2017-6-6
"""
import json
import traceback

from django.http import HttpResponse
from django.utils.datastructures import MultiValueDictKeyError

from app_fuzhou.views_utils.logger import logger
from app_fuzhou.views_utils.utils_audit import get_audit_logs_count, get_audit_logs_week_history, \
    get_audit_logs_by_level, get_audit_logs_latest_five, get_audit_logs_timestamp_count


def get_audit_log_by_flag(request):
    """
    接收前端请求
    :param request:
        flag == 0: 返回第一个饼图数据,数据为trustFile的五种日志级别的数量统计
        flag == 1: 返回第二个折线图数据,数据为trustFile的近7天的每天的五种日志级别的数量统计
        flag == 2: 返回最新5条trustFile数据
        flag == 3:
            is_first == True: 返回所有trustFile日志的时间
            else:             返回近30秒内的所有trustFile日志时间
        flag == 4: 返回trustFile日志列表,并按照日志级别筛选
    :return:
    """
    return_dic = {}  # 要返回的json
    try:
        # 获取前端传过来的参数
        flag = request.POST["flag"]
        node_type = request.POST["type"]
        source = request.POST["source"]
        if node_type == "local":  # local对应master节点
            if source == "assassin":  # assassin对应skynet,即samba服务日志信息
                # 根据flag返回相应数据给前端
                if flag == "0":
                    return_dic = get_audit_logs_count()    # 返回第一个饼图数据,即全部trustLog的各个级别统计
                elif flag == "1":
                    return_dic = get_audit_logs_week_history()  # 返回第二个折线图数据,7天内每天的各个级别的二维统计
                elif flag == "2":
                    return_dic = get_audit_logs_latest_five()  # 最新5条trustLog
                elif flag == "3":  # 今日变化曲线图
                    is_first = request.POST.get("isFirst", "")
                    if is_first == "true":
                        return_dic = get_audit_logs_timestamp_count(True)  # 最近一天内的trustLog的按秒数的统计,一维数据
                    else:
                        time_interval = request.POST.get("time_interval", 30)  # 默认过滤时间间隔30秒(即取最近30秒生成的日志)
                        # 最近30秒内的trustLog的按秒数的统计,一维数据
                        return_dic = get_audit_logs_timestamp_count(time_interval=time_interval)
                elif flag == "4":
                    return_dic = get_audit_logs_by_level(  # 按日志级别获取日志内容,分页
                        request.POST["level"], request.POST["page"], request.POST["size"])
            elif source == "ostute":
                logger.debug("ostute checked")
            elif source == "received":
                logger.debug("received checked")
            else:
                logger.debug("no source checked")
        elif node_type == "node1":
            logger.debug("node1 checked")
        elif node_type == "node2":
            logger.debug("node2 checked")
        else:
            logger.debug("no node_type checked")
    except MultiValueDictKeyError as e:  # post中参数为空
        return_dic['message'] = 'Missing Key: ' + str(e).split('"')[1]
        logger.error(e)
    except Exception as e:
        return_dic['message'] = str(e)
        logger.error(e)
        logger.error(traceback.format_exc())
    finally:
        return HttpResponse(json.dumps(return_dic))

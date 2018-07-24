#!/usr/bin/env python
# encoding: utf-8
"""
报警系统的前端接口
author:YangZe
"""
import json
import redis
from django.http.response import HttpResponse

from app_fuzhou.views_utils.localconfig import JsonConfiguration
from app_fuzhou.views_utils.logger import logger
from app_fuzhou.models import WarningList

from app_fuzhou.views_utils.service.warningservice.send_mail import \
    clear_mail_to_list_cache

jc = JsonConfiguration()
SESSION_TIMEOUT_REDIS_KEY = 'octa_web_session_timeout'


def add_warninglist(request):
    """
    添加警报名单
    :param request: 
    :return: 
    """
    try:
        phone = request.POST.get("phone")
        email = request.POST.get("email")

        WarningList.objects.create(phone=phone, email=email, enabled=1)
        clear_mail_to_list_cache()  # 清除redis缓存
        response_result = {'status': '1'}
    except Exception as e:
        response_result = {'status': '0'}
        logger.error(e)
    finally:
        return HttpResponse(json.dumps(response_result))


def update_warninglist(request):
    """
    更新 警报名单  包括删除 启用 停用
    :param request: 
    :return: 
    """
    response_result = {}
    try:
        ids = request.POST.get("data")
        action_type = request.POST.get("type")

        _ids = ids[:-1].split('#')
        logger.debug(_ids)

        if action_type == "0":  # 删除
            WarningList.objects.filter(id__in=_ids).delete()
        elif action_type == "1":  # 停用
            WarningList.objects.filter(id__in=_ids).update(enabled=0)
        elif action_type == "2":  # 启用
            WarningList.objects.filter(id__in=_ids).update(enabled=1)
        clear_mail_to_list_cache()  # 清除redis缓存
        response_result = {'code': '1'}
    except Exception as e:
        response_result = {'code': '0'}
        logger.error(e)
    finally:
        return HttpResponse(json.dumps(response_result))


def get_warninglist(request):
    """
    获取所有警报名单
    :param request: 
    :return: 
    """
    wariniglist = []
    try:
        wariniglist = list(WarningList.objects.values())
    except Exception as e:
        logger.error(e)
    finally:
        return HttpResponse(json.dumps(wariniglist))


def set_session_timeout(request):
    """
    设置会话超时时间
    :param request:
    :return:
    """
    timeout = request.POST.get('timeout', 60)  # 单位,分钟
    try:
        re = redis.Redis(jc.redis4bigchanidb_host,
                         jc.redis4bigchanidb_port)
        set_result = re.setex(SESSION_TIMEOUT_REDIS_KEY, int(timeout) * 60,
                              60 * 60)
        return HttpResponse(json.dumps({'code': '200'}))
    except Exception as e:
        logger.error(e)
        return HttpResponse(json.dumps({'code': '201', 'message': '操作失败'}))


def get_session_timeout(request):
    """
    设置会话超时时间
    :param request:
    :return:
    """
    return HttpResponse(
        json.dumps(
            {'code': '200', 'timeout': get_session_timeout_value() / 60}))


def get_session_timeout_value():
    """
    获取会话超时时间
    :return:
    """
    try:
        re = redis.Redis(jc.redis4bigchanidb_host,
                         jc.redis4bigchanidb_port)
        timeout = re.get(SESSION_TIMEOUT_REDIS_KEY)
        if timeout is None:  # 如果redis中没有缓存
            return 60 * 60
        else:
            return int(timeout)
    except Exception as e:
        logger.error(e)
        return 60 * 60

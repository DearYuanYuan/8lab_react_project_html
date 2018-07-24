#!/usr/bin/env python
# encoding: utf-8

"""
区块链相关接口
author:Wangjiashuai
"""
import json
import os

from datetime import datetime
from django.http import HttpResponse
from django.core.paginator import Paginator
from django.db.models import Q

from bigchaindb_driver.crypto import generate_keypair

from app_fuzhou.views_utils.logger import logger
from app_fuzhou.views_utils.localconfig import JsonConfiguration
from app_fuzhou.models import (
    ChainUser,
    ChainUserTran
)
from  octastack_fuzhou_web.settings import MEDIA_URL

CONFIG = JsonConfiguration()

CHAIN_USER_PHOTO_DIR = "chain_user_photo"
MAX_PHOTO_SIZE = 1 << 18  # 256k
LEGAL_PHOTO_TYPE = ["png", "jpg"]


def query_list(request):
    """
    获取区块链用户列表
    :return:
    """
    page = request.POST.get('page', 1)
    page_size = request.POST.get('pageSize', 10)
    search = request.POST.get('search', '')
    if search != '':
        qe = ChainUser.objects.filter(
            Q(username__icontains=search) | Q(phone__icontains=search) | Q(
                department__icontains=search) | Q(job__icontains=search) | Q(
                email__icontains=search))
        count = qe.count()
        _list = qe.order_by('-create_time')
    else:
        count = ChainUser.objects.count()
        _list = ChainUser.objects.order_by('-create_time')

    paginator = Paginator(_list, page_size)

    chain_user_list = paginator.page(page)
    _l = chain_user_list.object_list

    _ll = []
    for i in _l:
        _user = {}
        _user['username'] = i.username
        _user['email'] = i.email
        _user['id'] = i.id
        _user['private_key'] = i.private_key
        _user['public_key'] = i.public_key
        _user['job'] = i.job
        _user['department'] = i.department
        _user['is_active'] = i.is_active
        _user['tran_count'] = ChainUserTran.objects.filter(
            chain_user_id=i.id).count()
        _user['photo'] = i.photo
        _ll.append(_user)

    return HttpResponse(json.dumps({'code': '200', 'list': _ll, 'count': count}))


def query_all(request):
    """
    获取区块链用户列表
    :return:
    """
    _list = ChainUser.objects.all().order_by('-is_active')
    _ll = []
    for i in _list:
        _user = {}
        _user['username'] = i.username
        _user['email'] = i.email
        _user['id'] = i.id
        _user['private_key'] = i.private_key
        _user['public_key'] = i.public_key
        _user['job'] = i.job
        _user['department'] = i.department
        _user['photo'] = i.photo
        _user['is_active'] = i.is_active
        _ll.append(_user)

    return HttpResponse(json.dumps({'code': '200', 'list': _ll}))


def modify(request):
    """
    修改区块链用户
    :return:
    """
    user_id = request.POST.get('user_id')
    user_obj = ChainUser.objects.filter(id=user_id)

    email = request.POST.get('email', '')
    phone = request.POST.get('phone', '')
    job = request.POST.get('job', '')
    user = request.POST.get('user', '')
    department = request.POST.get('department', '')

    photo_uri = _upload_photo(request)
    if photo_uri:  # 如果有头像,则更新头像
        user_obj.update(photo=photo_uri)

    user_obj.update(job=job, department=department, phone=phone, email=email,
                    username=user)
    return HttpResponse(json.dumps({'code': 200, 'results': 'success'}))


def switch(request):
    """
    停用或者启用用户,1表示启用
    :return:
    """
    user_id = request.POST.get('user_id')
    is_active = request.POST.get('is_active')  # 1表示要启用,0表示要停用
    logger.debug(is_active)
    try:
        user_obj = ChainUser.objects.filter(id=user_id)
        user_obj.update(is_active=is_active)
        return HttpResponse(json.dumps({'code': 200, 'results': 'success'}))
    except Exception as e:
        logger.error(e)
        return HttpResponse(json.dumps({'code': 201, 'results': '操作失败'}))


def _upload_photo(request):
    """
    上传头像
    :param request:
    :return:
    """
    from app_fuzhou.api.handlers.fileupload import handle_upload

    photo_file = request.FILES.get("file")
    if not photo_file:
        return

    file_type = photo_file.name.split(".")[-1]
    if file_type in LEGAL_PHOTO_TYPE and photo_file.size < MAX_PHOTO_SIZE:  #
        #  判断上传大小限制及文件类型
        filename = handle_upload(photo_file, CHAIN_USER_PHOTO_DIR)
        if filename:
            logger.debug(filename)
            return os.path.join(MEDIA_URL, CHAIN_USER_PHOTO_DIR, filename)


def delete(request):
    """
    删除区块链用户,如果用户存在交易记录,则不允许删除
    :return:
    """
    user_id = request.POST.get('user_id')
    _count = ChainUserTran.objects.filter(chain_user_id=user_id).count()
    if _count > 0:
        return HttpResponse(json.dumps({'code': 201, 'results': '该用户有交易信息,不能删除'}))
    else:
        ChainUser.objects.filter(id=user_id).delete()
    return HttpResponse(json.dumps({'code': 200, 'results': 'success'}))


def query_detail(request):
    """
    获取区块链用户详细信息
    :return:
    """
    user_id = request.POST.get('user_id')
    i = ChainUser.objects.get(id=user_id)
    result = {}
    _user = {}
    _user['username'] = i.username
    _user['email'] = i.email
    _user['id'] = i.id
    _user['private_key'] = i.private_key
    _user['public_key'] = i.public_key
    _user['job'] = i.job
    _user['phone'] = i.phone
    _user['photo'] = i.photo
    _user['department'] = i.department
    result['code'] = 200
    result['user_detail'] = _user

    return HttpResponse(json.dumps(result))

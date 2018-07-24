#!/usr/bin/env python3
# encoding: utf-8

import json

import datetime
import traceback

import requests
from django.db import transaction

from django.http.response import HttpResponse
from redis import StrictRedis

from app_fuzhou.models import SVNUserHostPath, SVNVersionHistory, WebVersionHistory, WebUserHostPath, SVNTamperUser, \
    WebTamperUser, SVNHostInfo, WebHostInfo, SVNHostPath, WebHostPath
from app_fuzhou.views_utils.AES_cipher import AESCipher
from app_fuzhou.views_utils.logger import logger
from elasticsearch import Elasticsearch
from app_fuzhou.views_utils.localconfig import JsonConfiguration
from app_fuzhou.views_utils.task_publisher import TaskPublisher
from app_fuzhou.views_utils.util_RSA_signer import RSASigner
from app_fuzhou.views_utils.utils_tamper_proof import check_user_valid, get_user_host_path, check_path_format, \
    check_host_name_valid, check_host_path_valid, get_key_pairs, receive_control_message, query_version_history, \
    query_user_host_detail, query_user_root_path, query_current_version_tree, check_version_valid, check_operate_struct, \
    check_user_host_path, query_current_version_obj, generate_folder_tree
from app_fuzhou.views_utils.task_info import Task

jc = JsonConfiguration()
TOKEN_TYPE = "Bearer "  # toke类型   类型后面有一个空格 不能省略``

CONTROL_SEND_CHANNEL = "control_send"
CONTROL_RETURN_CHANNEL = "control_return"


# def get_hosts_and_rootpaths(request):
#     """
#     获取用户主机以及根目录
#     :param request:
#     :return:
#     """
#     results = []
#     try:
#         # 首先查询当前用户的主机列表
#         # username = request.POST.get('username')
#         username = "admin"
#         is_super = request.POST.get('is_super', 0)
#         # token = request.POST.get('token')
#         token = ""
#         service_type = request.POST.get('service_type', 'web')
#
#         request_params = {
#             'username': username,
#             'is_super': is_super,
#             'service_type': service_type
#         }
#
#         headers = {
#             "Authorization": TOKEN_TYPE + token
#         }
#
#         url = jc.tamper_proof_url + "/api/v1.0/tamper_proof_restful/query_user_host_list/"
#         response = requests.get(url, params=request_params, headers=headers)
#         user_list = json.loads(response.text)
#
#         if user_list['result'] == '401' and user_list['status'] == 'FAILURE':
#             user_list['msg'] = "登录超时，请重新登录。"
#             results.append(user_list)
#             raise Exception('token verify failure')
#
#         for host_name in user_list['result']:
#             temp_param = {
#                 'username': username,
#                 'host_name': host_name,
#                 'service_type': service_type
#             }
#             temp_url = jc.tamper_proof_url + "/api/v1.0/tamper_proof_restful/query_user_root_path/"
#             tmp_response = requests.get(temp_url, params=temp_param, headers=headers)
#             temp_dict = json.loads(tmp_response.text)
#
#             if temp_dict['result'] == '401' and temp_dict['status'] == 'FAILURE':
#                 temp_dict['msg'] = "登录超时，请重新登录。"
#                 results.append(temp_dict)
#                 raise Exception('token verify failure')
#
#             root_path = {
#                 "host": host_name,
#                 "root_paths": temp_dict['result']
#             }
#             results.append(root_path)
#     except Exception as e:
#         logger.error(e)
#     finally:
#         return HttpResponse(json.dumps(results))


def get_hosts_and_rootpaths(request):
    """
    @api {post} api/tamper_proof/get_hosts_and_rootpaths/  ★获取用户主机以及根目录
    @apiDescription 获取用户主机以及根目录
    @apiGroup tamper_proof
    @apiParam {string} username    用户名称
    @apiParam {string} is_super 0普通，1超管。如果是超管, 则查询所有主机列表
    @apiParam {string} service_type 服务名称：web、svn
    @apiSuccessExample Success-Response:
        [
            {
                "host": "192.168.1.179",
                "root_paths": [{
                    "id": 3,
                    "protect_host_name": "192.168.1.179",
                    "protect_host_addr": "192.168.1.179",
                    "protect_root_path": "/home/svn/project",
                    "protect_path_mark": "svn",
                    "status": "protected",
                    "timestamp": "2018-06-29 10:26:50",
                    "remark": null
                }]
            },
            {
                "host": "192.168.1.212",
                "root_paths": []
            }
        ]
    @apiErrorExample Error-Response:
        [{
            "status": FAILURE,
            "msg": "Error message"
        }]
    """
    results = []
    res = {}
    try:
        # 首先查询当前用户的主机列表
        username = request.POST.get('username')
        is_super = request.POST.get('is_super', 0)
        service_type = request.POST.get('service_type', 'web')

        # 查询用户是否存在
        user_flag, user_obj = check_user_valid(service_type, username)

        if not user_flag:
            error_message = 'The user: %s does not exist.' % username
            logger.error(error_message)
            res["msg"] = error_message
            res["status"] = "FAILURE"
            results.append(res)
            return HttpResponse(json.dumps(results))

        # 获取用户主机详情
        ret = get_user_host_path(service_type, is_super, user_obj)

        for host in ret:
            for host_name in host.keys():
                root_path = {
                    "host": host_name,
                    "root_paths": host.get(host_name, [])
                }
                results.append(root_path)
    except Exception as e:
        logger.error(e)
    finally:
        return HttpResponse(json.dumps(results))


# def get_user_detail(request):
#     """
#     获取用户详情，包括 用户主机以及根目录 （暂时不包括该用户详细信息）
#     :param request:
#     :return:
#     """
#     results = []
#     try:
#         # 首先查询当前用户的主机列表
#         # username = request.POST.get('username')
#         username = "admin"
#         is_super = request.POST.get('is_super', 0)
#         # token = request.POST.get('token')
#         token = ""
#         service_type = request.POST.get('service_type', 'web')
#
#         request_params = {
#             'username': username,
#             'is_super': is_super,
#             'service_type': service_type
#         }
#
#         headers = {
#             "Authorization": TOKEN_TYPE + token
#         }
#
#         url = jc.tamper_proof_url + "/api/v1.0/tamper_proof_restful/query_user_host_list/"
#         response = requests.get(url, params=request_params, headers=headers)
#         user_list = json.loads(response.text)
#
#         if user_list['result'] == '401' and user_list['status'] == 'FAILURE':
#             user_list['msg'] = "登录超时，请重新登录。"
#             results.append(user_list)
#             raise Exception('token verify failure')
#
#         for host_name in user_list['result']:
#             host_detail = {}
#
#             temp_param = {
#                 'username': username,
#                 'host_name': host_name,
#                 'service_type': service_type
#             }
#             temp_url = jc.tamper_proof_url + "/api/v1.0/tamper_proof_restful/query_user_root_path/"
#             temp_res = requests.get(temp_url, params=temp_param, headers=headers)
#             temp_dict = json.loads(temp_res.text)
#
#             if temp_dict['result'] == '401' and temp_dict['status'] == 'FAILURE':
#                 temp_dict['msg'] = "登录超时，请重新登录。"
#                 results.append(temp_dict)
#                 raise Exception('token verify failure')
#
#             host_detail[host_name] = temp_dict['result']
#
#             results.append(host_detail)
#     except Exception as e:
#         logger.error(e)
#     finally:
#         return HttpResponse(json.dumps(results))


def get_user_detail(request):
    """
    @api {post} api/tamper_proof/get_user_detail/  ★获取用户详情
    @apiDescription 获取用户主机详情，包括 用户主机以及根目录 （暂时不包括该用户详细信息）
    @apiGroup tamper_proof
    @apiParam {string} username    用户名
    @apiParam {string} is_super    是否是管理员
    @apiParam {string} service_type 服务名称：web、svn
    @apiSuccessExample Success-Response:
        [
            {
                "192.168.1.177":[
                    {
                        "protect_host_name":"192.168.1.177",
                        "status":"protected",
                        "protect_host_addr":"192.168.1.177",
                        "protect_path_mark":"/home/test28",
                        "id":13,
                        "protect_root_path":"/home/test28",
                        "remark":null,
                        "timestamp":"2018-06-28 19:35:05"
                    },
                    {
                        "protect_host_name":"192.168.1.177",
                        "status":"protected",
                        "protect_host_addr":"192.168.1.177",
                        "protect_path_mark":"uuu",
                        "id":15,
                        "protect_root_path":"/home/uuu",
                        "remark":null,
                        "timestamp":"2018-06-29 16:33:23"
                    }
                ]
            }
        ]
    @apiErrorExample Error-Response:
        [{
            "status": "FAILURE",
            "msg": "Error message"
        }]
    """
    results = []
    res = {}
    try:
        # 首先查询当前用户的主机列表
        username = request.POST.get('username')
        is_super = request.POST.get('is_super', 0)
        service_type = request.POST.get('service_type', 'web')

        # 查询用户是否存在
        user_flag, user_obj = check_user_valid(service_type, username)

        if not user_flag:
            error_message = 'The user: %s does not exist.' % username
            logger.error(error_message)
            res["msg"] = error_message
            res["status"] = "FAILURE"
            results.append(res)
            return HttpResponse(json.dumps(results))

        # 获取用户主机详情
        results = get_user_host_path(service_type, is_super, user_obj)

    except Exception as e:
        logger.error(e)
    finally:
        return HttpResponse(json.dumps(results))


# def get_version_info(request):
#     """
#     获取版本信息
#     :param request:
#     :return:
#     """
#
#     results = []
#     try:
#         host_name = request.POST.get('host_name')
#         root_path = request.POST.get('root_path')
#         # token = request.POST.get('token')
#         token = ""
#         service_type = request.POST.get('service_type', 'web')
#
#         request_params = {
#             'host_name': host_name,
#             'root_path': root_path,
#             'service_type': service_type
#         }
#
#         headers = {
#             "Authorization": TOKEN_TYPE + token
#         }
#
#         url = jc.tamper_proof_url + "/api/v1.0/tamper_proof_restful/query_version_history/"
#         response = requests.get(url, params=request_params, headers=headers)
#         response_info = json.loads(response.text)
#
#         if response_info['result'] == '401' and response_info['status'] == 'FAILURE':
#             response_info['msg'] = "登录超时，请重新登录。"
#             results.append(response_info)
#             raise Exception('token verify failure')
#
#         results.append(response_info)
#     except Exception as e:
#         logger.error(e)
#     finally:
#         if len(results) == 0:
#             results.append({"status": "FAILURE"})
#         return HttpResponse(json.dumps(results))


def get_version_info(request):
    """
    @api {post} api/tamper_proof/get_version_info/  ★获取版本信息
    @apiDescription 获取版本信息
    @apiGroup tamper_proof
    @apiParam {string} host_name    主机名
    @apiParam {string} root_path 根目录路径
    @apiParam {string} service_type 服务名称：web、svn
    @apiSuccessExample Success-Response:
        [{
            "status": "SUCCESS",
            "result": [{
                "protect_host_name": "192.168.1.177",
                "operate_username": "admin",
                "protect_host_addr": "192.168.1.177",
                "changed_objects": ["/home/test28/export.json"],
                "timestamp": "2018-06-29 11:40:13",
                "protect_root_path": "/home/test28",
                "remark": "",
                "version_tree": "{\"/home/test28\": {\"path\": \"/home/test28\", \"time\": \"2018-06-28 19:35:06\", \"type\": \"root\", \"nodes\": {\"export.json\": {\"path\": \"/home/test28/export.json\", \"time\": \"2018-06-29 11:40:13\", \"type\": \"blob\", \"size\": \"1.1 KB\"}}}}",
                "id": 159,
                "version_txid": "c26c67d76ec7f2951f43acf09926f6c4c6f396b55a4db3c38b5688f5622032eb",
                "operate_type": "new",
                "commits_info": []
            }, {
                "protect_host_name": "192.168.1.177",
                "operate_username": "admin",
                "protect_host_addr": "192.168.1.177",
                "changed_objects": ["/home/test28"],
                "timestamp": "2018-06-28 19:35:05",
                "protect_root_path": "/home/test28",
                "remark": "add root path",
                "version_tree": "{\"/home/test28\": {\"type\": \"root\", \"nodes\": {}, \"path\": \"/home/test28\", \"time\": \"2018-06-28 19:35:06\"}}",
                "id": 157,
                "version_txid": "d17726f5803a9ff90dd1a05d36f79aff4b56ba26d195ca0934b4c289a248b6e1",
                "operate_type": "start",
                "commits_info": []
            }],
            "msg": "Success. Finish fetching version histories of hostname: 192.168.1.177, root path: /home/test28"
        }]
    @apiErrorExample Error-Response:
        [{
            "status": "FAILURE",
            "result": [{......}],
            "msg": "Error message"
        }]
    """
    results = []
    res = {}
    host_name = request.POST.get("host_name")
    root_path = request.POST.get("root_path")
    service_type = request.POST.get("service_type", "web")

    is_success, version_history_list, msg = query_version_history(service_type, host_name, root_path)

    if is_success:
        res["status"] = "SUCCESS"
    else:
        res["status"] = "FAILURE"
    res["msg"] = msg
    res["result"] = version_history_list
    results.append(res)
    return HttpResponse(json.dumps(results))


# def rollback_version(request):
#     """
#     回滚版本
#     :param request:
#     :return:
#     """
#     results = []
#     try:
#         # username = request.POST.get('username')
#         username = "admin"
#         host_name = request.POST.get('host_name')
#         root_path = request.POST.get('root_path')
#         org_version_tx_id = request.POST.get('org_version_tx_id')
#         # token = request.POST.get('token')
#         token = ""
#         service_type = request.POST.get('service_type', 'web')
#
#         request_params = {
#             "token": "trust2",
#             "username": username,
#             "host_name": host_name,
#             "root_path": root_path,
#             "org_version_tx_id": org_version_tx_id,
#             'service_type': service_type
#         }
#
#         url = jc.tamper_proof_url + "/api/v1.0/tamper_proof_restful/rollback_version/"
#
#         headers = {
#             "Content-type": "application/json",
#             "Authorization": TOKEN_TYPE + token
#         }
#
#         response = requests.post(url=url, headers=headers, json=request_params)
#         response_info = json.loads(response.text)
#
#         if response_info['result'] == '401' and response_info['status'] == 'FAILURE':
#             response_info['msg'] = "登录超时，请重新登录。"
#             results.append(response_info)
#             raise Exception('token verify failure')
#
#         results.append(response_info)
#     except Exception as e:
#         logger.error(e)
#     finally:
#         if len(results) == 0:
#             results.append({"status": "FAILURE"})
#         return HttpResponse(json.dumps(results))


def rollback_version(request):
    """
    @api {post} api/tamper_proof/rollback_version/  ★回滚版本
    @apiDescription 回滚版本
    @apiGroup tamper_proof
    @apiParam {string} username    用户名称
    @apiParam {string} host_name 主机名称
    @apiParam {string} root_path 根目录路径
    @apiParam {string} org_version_tx_id 返回id
    @apiParam {string} service_type 服务名称：web、svn
    @apiSuccessExample Success-Response:
        [
            {
                "status":"SUCCESS",
                "result":{
                    "status":"starting",
                    "object_count":0,
                    "object_handled":0,
                    "task_id":313
                },
                "msg":"Success starting rollback task. Host: 192.168.1.177, root_path: /home/uuu, verison: 9889c3517467fca2d60838a7922298f9cb5682d7c669e0dfcd0eaf40f4f52a6a. Task_ID: 313"
            }
        ]
    @apiErrorExample Error-Response:
        [
            {
                "status":"FAILURE",
                "msg":"Error message"
            }
        ]
    """
    results = []
    arguments = {}
    res = {}
    username = request.POST.get('username')
    host_name = request.POST.get('host_name')

    root_path = request.POST.get('root_path')
    root_path = root_path.replace("\\", "/")
    org_version_tx_id = request.POST.get('org_version_tx_id')

    service_type = request.POST.get('service_type', 'web')

    operate_type = "rollback"
    try:
        # 检查路径是否合法
        path_flag = check_path_format(root_path)

        if not path_flag:
            msg = 'Illegal path: %s.' % root_path
            logger.error(msg)
            res["msg"] = msg
            res["status"] = "FAILURE"
            results.append(res)
            return HttpResponse(json.dumps(results))

        # 查询用户是否存在
        user_flag, user_obj = check_user_valid(service_type, username)

        if not user_flag:
            error_message = 'The user: %s does not exist.' % username
            logger.error(error_message)
            res["msg"] = error_message
            res["status"] = "FAILURE"
            results.append(res)
            return HttpResponse(json.dumps(results))

        # 检查主机是否合法
        host_flag, host_obj = check_host_name_valid(service_type, host_name)

        if not host_flag:
            error_message = 'The host: %s does not exist.' % host_name
            logger.error(error_message)
            res["msg"] = error_message
            res["status"] = "FAILURE"
            results.append(res)
            return HttpResponse(json.dumps(results))

        host_addr = host_obj.protect_host_addr

        # 校验根目录
        host_path_flag, host_path_obj = check_host_path_valid(service_type, host_name, host_addr, root_path)
        if not host_path_flag:
            error_message = 'The host: %s, root path: %s does not exist.' % (host_name, root_path)
            logger.error(error_message)
            res["msg"] = error_message
            res["status"] = "FAILURE"
            results.append(res)
            return HttpResponse(json.dumps(results))

        # 检查版本历史信息
        version_flag, version_history_obj = check_version_valid(service_type, host_name, root_path, org_version_tx_id)
        if not version_flag:
            error_message = 'The version: %s of host: %s, root path: %s does not exist.' % (org_version_tx_id, host_name, root_path)
            logger.error(error_message)
            res["msg"] = error_message
            res["status"] = "FAILURE"
            results.append(res)
            return HttpResponse(json.dumps(results))

        arguments['host_addr'] = str(host_addr)
        arguments['operate_type'] = operate_type
        arguments['username'] = username
        arguments['host_name'] = host_name
        arguments['root_path'] = root_path
        arguments['service_type'] = service_type
        arguments['token'] = "trust2"
        arguments['org_version_tx_id'] = org_version_tx_id

        # 添加任务
        task_id, ret = Task.add_task(arguments)
        arguments['task_id'] = task_id
        res["result"] = ret

        # 发布任务
        message = json.dumps(arguments)
        task_pubblisher = TaskPublisher()
        is_success, msg = task_pubblisher.async_publish(message, task_id)

        # 发布任务失败, 则删除任务并返回
        if not is_success:
            Task.delete_task(service_type, ret['task_id'])
            msg = 'Fail to update root path %s of host %s. Task unconfirmed.' % (host_name, root_path)
        else:
            msg = "Success starting rollback task. Host: %s, root_path: %s, verison: %s. Task_ID: %s" % \
                  (host_name, root_path, org_version_tx_id, str(task_id))

    except Exception as error:
        is_success = False
        logger.error(error)
        msg = "Fail to start rollback task. Host: %s, root_path: %s, verison: %s." % \
              (host_name, root_path, org_version_tx_id)

    if not is_success:
        logger.error(msg)
        res['msg'] = msg
        res["status"] = "FAILURE"
    else:
        logger.info(msg)
        res['msg'] = msg
        res["status"] = "SUCCESS"
    results.append(res)
    return HttpResponse(json.dumps(results))


# def get_user_host_detail(request):
#     """
#     获取'文件管理'中 当前用户可访问的主机信息
#     :param request:
#     :return:
#     """
#
#     results = []
#     try:
#         # username = request.POST.get('username', "trust")
#         username = "admin"
#         is_super = request.POST.get('is_super', 0)
#         # token = request.POST.get('token')
#         token = ""
#         service_type = request.POST.get('service_type', 'web')
#
#         request_params = {
#             'username': username,
#             'is_super': is_super,
#             'service_type': service_type
#         }
#
#         headers = {
#             "Authorization": TOKEN_TYPE + token
#         }
#
#         url = jc.tamper_proof_url + "/api/v1.0/tamper_proof_restful/query_user_host_detail/"
#         response = requests.get(url, params=request_params, headers=headers)
#         response_info = json.loads(response.text)
#
#         if response_info['result'] == '401' and response_info['status'] == 'FAILURE':
#             response_info['msg'] = "登录超时，请重新登录。"
#             results.append(response_info)
#             raise Exception('token verify failure')
#
#         results.append(response_info)
#     except Exception as e:
#         logger.error(e)
#     finally:
#         if len(results) == 0:
#             results.append({"status": "FAILURE"})
#         return HttpResponse(json.dumps(results))


def get_user_host_detail(request):
    """
    @api {post} api/tamper_proof/get_user_host_detail/  ★获取用户主机列表
    @apiDescription 获取'文件管理'中 当前用户可访问的主机信息
    @apiGroup tamper_proof
    @apiParam {string} username    用户名
    @apiParam {string} is_super 是否是管理员
    @apiParam {string} service_type 服务名称：web、svn
    @apiSuccessExample Success-Response:
        [{
            "status": "SUCCESS",
            "result": [{
                "protect_host_name": "192.168.1.177",
                "status": "protected",
                "protect_host_addr": "192.168.1.177",
                "os_name": "Linux",
                "id": 1,
                "remark": ""
            }],
            "msg": "Success. Finish fetching all host detail of user: admin"
        }]
    @apiErrorExample Error-Response:
        [
            {
                "status":"FAILURE",
                "msg":"Error message"
            }
        ]
    """
    results = []
    res = {}
    username = request.POST.get('username', "trust")
    is_super = request.POST.get('is_super', 0)
    service_type = request.POST.get('service_type', 'web')
    is_success, host_info_list, msg = query_user_host_detail(service_type, username, is_super)
    if is_success:
        res["status"] = "SUCCESS"
    else:
        res["status"] = "FAILURE"
    res["msg"] = msg
    res["result"] = host_info_list
    results.append(res)
    return HttpResponse(json.dumps(results))


# def get_user_rootpath_list(request):
#     """
#     获取某用户所有主机中指定主机的根目录列表
#     :param request:
#     :return:
#     """
#
#     results = []
#     try:
#         # username = request.POST.get('username')
#         username = "admin"
#         host_name = request.POST.get('host_name')
#         # token = request.POST.get('token')
#         token = ""
#         service_type = request.POST.get('service_type', 'web')
#
#         request_params = {
#             'username': username,
#             'host_name': host_name,
#             'service_type': service_type
#         }
#
#         headers = {
#             "Authorization": TOKEN_TYPE + token
#         }
#
#         url = jc.tamper_proof_url + "/api/v1.0/tamper_proof_restful/query_user_root_path/"
#         response = requests.get(url, params=request_params, headers=headers)
#         response_info = json.loads(response.text)
#
#         if response_info['result'] == '401' and response_info['status'] == 'FAILURE':
#             response_info['msg'] = "登录超时，请重新登录。"
#             results.append(response_info)
#             raise Exception('token verify failure')
#
#         results.append(response_info)
#     except Exception as e:
#         logger.error(e)
#     finally:
#         if len(results) == 0:
#             results.append({"status": "FAILURE"})
#         return HttpResponse(json.dumps(results))


def get_user_rootpath_list(request):
    """
    @api {post} api/tamper_proof/get_user_rootpath_list/  ★获取根目录列表
    @apiDescription 获取根目录列表
    @apiGroup tamper_proof
    @apiParam {string} username    用户名
    @apiParam {string} host_name 主机名
    @apiParam {string} service_type 服务名称：web、svn
    @apiSuccessExample Success-Response:
        [
            {
                "status":"SUCCESS",
                "result":[
                    {
                        "protect_host_name":"192.168.1.177",
                        "status":"protected",
                        "protect_host_addr":"192.168.1.177",
                        "protect_path_mark":"/home/test28",
                        "id":13,
                        "protect_root_path":"/home/test28",
                        "remark":null,
                        "timestamp":"2018-06-28 19:35:05"
                    },
                    {
                        "protect_host_name":"192.168.1.177",
                        "status":"protected",
                        "protect_host_addr":"192.168.1.177",
                        "protect_path_mark":"uuu",
                        "id":15,
                        "protect_root_path":"/home/uuu",
                        "remark":null,
                        "timestamp":"2018-06-29 16:33:23"
                    }
                ],
                "msg":"Success. Finish fetching all root paths of user: admin"
            }
        ]
    @apiErrorExample Error-Response:
        [
            {
                "status":"FAILURE",
                "msg":"Error message"
            }
        ]
    """

    results = []
    res = {}
    username = request.POST.get('username')
    host_name = request.POST.get('host_name')
    service_type = request.POST.get('service_type', 'web')

    # 查询用户是否存在
    user_flag, user_obj = check_user_valid(service_type, username)

    if not user_flag:
        error_message = 'The user: %s does not exist.' % username
        logger.error(error_message)
        res["msg"] = error_message
        res["status"] = "FAILURE"
        results.append(res)
        return HttpResponse(json.dumps(results))

    # 获取用户主机详情
    is_success, host_path_list, msg = query_user_root_path(service_type, username, host_name)

    if is_success:
        res["status"] = "SUCCESS"
    else:
        res["status"] = "FAILURE"
    res["msg"] = msg
    res["result"] = host_path_list
    results.append(res)
    return HttpResponse(json.dumps(results))


# def get_root_path_tree(request):
#     """
#     获取指定根目录的树形结构
#     :param request:
#     :return:
#     """
#
#     results = []
#     try:
#         host_name = request.POST.get('host_name')
#         root_path = request.POST.get('root_path')
#         # token = request.POST.get('token')
#         token = ""
#         service_type = request.POST.get('service_type', 'web')
#
#         request_params = {
#             'host_name': host_name,
#             'root_path': root_path,
#             'service_type': service_type
#         }
#
#         headers = {
#             "Authorization": TOKEN_TYPE + token
#         }
#
#         url = jc.tamper_proof_url + "/api/v1.0/tamper_proof_restful/query_current_version_tree/"
#         response = requests.get(url, params=request_params, headers=headers)
#         response_info = json.loads(response.text)
#
#         if response_info['result'] == '401' and response_info['status'] == 'FAILURE':
#             response_info['msg'] = "登录超时，请重新登录。"
#             results.append(response_info)
#             raise Exception('token verify failure')
#
#         results.append(response_info)
#     except Exception as e:
#         logger.error(e)
#     finally:
#         if len(results) == 0:
#             results.append({"status": "FAILURE"})
#         return HttpResponse(json.dumps(results))


def get_root_path_tree(request):
    """
    @api {post} api/tamper_proof/get_root_path_tree/  ★获取根目录的树形结构
    @apiDescription 获取根目录的树形结构
    @apiGroup tamper_proof
    @apiParam {string} root_path 根目录路径
    @apiParam {string} host_name 主机名
    @apiParam {string} service_type 服务名称：web、svn
    @apiSuccessExample Success-Response:
        [
            {
                "status":"SUCCESS",
                "result":{
                    "/home/test28":{
                        "nodes":{
                            "export.json":{
                                "size":"1.1 KB",
                                "path":"/home/test28/export.json",
                                "time":"2018-06-29 11:40:13",
                                "type":"blob"
                            }
                        },
                        "path":"/home/test28",
                        "time":"2018-06-28 19:35:06",
                        "type":"root"
                    }
                },
                "msg":"Success. Finish fetching Current version tree of host name 192.168.1.177, root_path /home/test28: "
            }
        ]
    @apiErrorExample Error-Response:
        [
            {
                "status":"FAILURE",
                "msg":"Error message"
            }
        ]
    """

    results = []
    res = {}
    host_name = request.POST.get('host_name')
    root_path = request.POST.get('root_path')
    service_type = request.POST.get('service_type', 'web')

    # 获取用户主机详情
    is_success, current_version_dict, msg = query_current_version_tree(service_type, host_name, root_path)

    if is_success:
        res["status"] = "SUCCESS"
    else:
        res["status"] = "FAILURE"
    res["msg"] = msg
    res["result"] = current_version_dict
    results.append(res)
    return HttpResponse(json.dumps(results))


# def get_current_version_folder_tree(request):
#     """
#     获取当前版本id的文件夹树形结构
#     :param request:
#     :return:
#     """
#     results = []
#     try:
#         host_name = request.POST.get('host_name')
#         root_path = request.POST.get('root_path')
#         # token = request.POST.get('token')
#         token = ""
#         service_type = request.POST.get('service_type', 'web')
#
#         request_params = {
#             'host_name': host_name,
#             'root_path': root_path,
#             'service_type': service_type
#         }
#
#         headers = {
#             "Authorization": TOKEN_TYPE + token
#         }
#
#         url = jc.tamper_proof_url + "/api/v1.0/tamper_proof_restful/query_current_version_folder_tree/"
#         response = requests.get(url, params=request_params, headers=headers)
#         response_info = json.loads(response.text)
#
#         if response_info['result'] == '401' and response_info['status'] == 'FAILURE':
#             response_info['msg'] = "登录超时，请重新登录。"
#             results.append(response_info)
#             raise Exception('token verify failure')
#
#         results.append(response_info)
#     except Exception as e:
#         logger.error(e)
#     finally:
#         if len(results) == 0:
#             results.append({"status": "FAILURE"})
#         return HttpResponse(json.dumps(results))


def get_current_version_folder_tree(request):
    """
    @api {post} api/tamper_proof/get_current_version_folder_tree/  ★根目录下的移动文件或文件夹，获取根目录下的文件夹树形结构
    @apiDescription 根目录下的移动文件或文件夹，获取根目录下的文件夹树形结构
    @apiGroup tamper_proof
    @apiParam {string} host_name    主机名
    @apiParam {string} root_path 根目录路径
    @apiParam {string} service_type 服务名称：web、svn
    @apiSuccessExample Success-Response:
        [
            {
                "id":1,
                "path":"/home/finger/8lab.test",
                "pId":0,
                "name":"/home/finger/8lab.test"
            },
            {
                "id":11,
                "path":"/home/finger/8lab.test/octa_cipher",
                "pId":1,
                "name":"octa_cipher"
            },
            {
                "id":12,
                "path":"/home/finger/8lab.test/octa_bdb_api",
                "pId":1,
                "name":"octa_bdb_api"
            }
        ]
    @apiErrorExample Error-Response:
        [
            {
                "status":"FAILURE",
                "msg":"Error message"
            }
        ]
    """
    results = []
    res = {}
    host_name = request.POST.get('host_name')
    root_path = request.POST.get('root_path')
    service_type = request.POST.get('service_type', 'web')
    node_list = []
    try:
        _, current_version_obj, _ = query_current_version_obj(service_type, host_name, root_path)
        current_version_json = current_version_obj.version_tree
        current_version_dict = json.loads(current_version_json)
        nodes = current_version_dict[root_path]['nodes']

        root_node = {
            'id': 1,
            'pId': 0,
            'name': root_path,
            'path': root_path
        }

        node_list = [root_node]
        node_list += generate_folder_tree(nodes, 1)
        msg = 'Success. Finish fetching Current version all folders tree of host name %s, root_path %s: ' % (
            host_name, root_path)
        res["status"] = "SUCCESS"

    except Exception as e:
        logger.error(e)
        msg = traceback.format_exc()
        res["status"] = "FAILURE"

    logger.info(msg)
    res["msg"] = msg
    res["result"] = node_list
    results.append(res)
    return HttpResponse(json.dumps(results))


# def new_user_root_path(request):
#     """
#     新增根目录
#     :param request:
#     :return:
#     """
#     results = []
#     try:
#         # token = request.POST.get('token')
#         token = ""
#         # username = request.POST.get('username')
#         username = "admin"
#         host_name = request.POST.get('host_name')
#
#         root_path = request.POST.get('root_path')
#         root_path = root_path.replace("\\", "/")
#
#         root_mark = request.POST.get('root_mark')
#         remark = request.POST.get('remark', 'add root path')
#
#         service_type = request.POST.get('service_type', 'web')
#
#         request_params = {
#             "token": "token",
#             "username": username,
#             "host_name": host_name,
#             "root_path": root_path,
#             "root_mark": root_mark,
#             "remark": remark,
#             'service_type': service_type
#         }
#
#         url = jc.tamper_proof_url + "/api/v1.0/tamper_proof_restful/start_root_path_protect/"
#
#         headers = {
#             "Content-type": "application/json",
#             "Authorization": TOKEN_TYPE + token
#         }
#
#         response = requests.post(url=url, headers=headers, json=request_params)
#         response_info = json.loads(response.text)
#
#         if response_info['result'] == '401' and response_info['status'] == 'FAILURE':
#             response_info['msg'] = "登录超时，请重新登录。"
#             results.append(response_info)
#             raise Exception('token verify failure')
#
#         results.append(response_info)
#     except Exception as e:
#         logger.error(e)
#     finally:
#         if len(results) == 0:
#             results.append({"status": "FAILURE"})
#         return HttpResponse(json.dumps(results))


def new_user_root_path(request):
    """
    @api {post} api/tamper_proof/new_user_root_path/  ★新增/启动根目录
    @apiDescription 新增/启动根目录
    @apiGroup tamper_proof
    @apiParam {string} username    用户名
    @apiParam {string} host_name    主机名
    @apiParam {string} root_path 根目录路径
    @apiParam {string} root_mark 目录说明
    @apiParam {string} service_type 服务名称：web、svn
    @apiSuccessExample Success-Response:
        [
            {
                "status":"SUCCESS",
                "msg":"Success starting protect task. Host: 192.168.1.177, root_path: /home/test28. Task_ID: 277"
            }
        ]
    @apiErrorExample Error-Response:
        [
            {
                "status":"FAILURE",
                "msg":"Error message"
            }
        ]
    """
    results = []
    arguments = {}
    res = {}
    username = request.POST.get('username')
    host_name = request.POST.get('host_name')

    root_path = request.POST.get('root_path')
    root_path = root_path.replace("\\", "/")

    root_mark = request.POST.get('root_mark')
    remark = request.POST.get('remark', 'add root path')

    service_type = request.POST.get('service_type', 'web')

    operate_type = "protect"
    try:
        # 检查路径是否合法
        path_flag = check_path_format(root_path)

        if not path_flag:
            msg = 'Illegal path: %s.' % root_path
            logger.error(msg)
            res["msg"] = msg
            res["status"] = "FAILURE"
            results.append(res)
            return HttpResponse(json.dumps(results))

        # 查询用户是否存在
        user_flag, user_obj = check_user_valid(service_type, username)

        if not user_flag:
            error_message = 'The user: %s does not exist.' % username
            logger.error(error_message)
            res["msg"] = error_message
            res["status"] = "FAILURE"
            results.append(res)
            return HttpResponse(json.dumps(results))

        # 检查主机是否合法
        host_flag, host_obj = check_host_name_valid(service_type, host_name)

        if not host_flag:
            error_message = 'The host: %s does not exist.' % host_name
            logger.error(error_message)
            res["msg"] = error_message
            res["status"] = "FAILURE"
            results.append(res)
            return HttpResponse(json.dumps(results))

        arguments['host_addr'] = str(host_obj.protect_host_addr)
        arguments['operate_type'] = operate_type
        arguments['username'] = username
        arguments['host_name'] = host_name
        arguments['root_path'] = root_path
        arguments['service_type'] = service_type
        arguments['token'] = "token"
        arguments['root_mark'] = root_mark
        arguments['remark'] = remark

        # 添加任务
        task_id, ret = Task.add_task(arguments)
        arguments['task_id'] = task_id

        # 发布任务
        message = json.dumps(arguments)
        task_pubblisher = TaskPublisher()
        is_success, msg = task_pubblisher.async_publish(message, task_id)

        # 发布任务失败, 则删除任务并返回
        if not is_success:
            Task.delete_task(service_type, ret['task_id'])
            msg = 'Fail to start protect task. Host: %s, root_path: %s. Task unconfirmed.' % (host_name, root_path)
        else:
            msg = 'Success starting protect task. Host: %s, root_path: %s. Task_ID: %s' % \
                  (host_name, root_path, str(task_id))

    except Exception as error:
        is_success = False
        logger.error(error)
        msg = 'Fail to start protect task. Host: %s, root_path: %s.' % (host_name, root_path)

    if not is_success:
        logger.error(msg)
        res['msg'] = msg
        res["status"] = "FAILURE"
    else:
        logger.info(msg)
        res['msg'] = msg
        res["status"] = "SUCCESS"
    results.append(res)
    return HttpResponse(json.dumps(results))


# def cancel_root_path(request):
#     """
#     取消根目录
#     :param request:
#     :return:
#     """
#     results = []
#     try:
#         # token = request.POST.get('token')
#         token = ""
#         host_name = request.POST.get('host_name')
#         # username = request.POST.get('username')
#         username = "admin"
#         root_path = request.POST.get('root_path')
#         root_path = eval(root_path)
#
#         service_type = request.POST.get('service_type', 'web')
#
#         request_params = {
#             "token": "token",
#             "username": username,
#             "host_name": host_name,
#             "root_path": root_path[0],
#             'service_type': service_type
#         }
#
#         url = jc.tamper_proof_url + "/api/v1.0/tamper_proof_restful/cancel_root_path/"
#
#         headers = {
#             "Content-type": "application/json",
#             "Authorization": TOKEN_TYPE + token
#         }
#
#         response = requests.post(url=url, headers=headers, json=request_params)
#         response_info = json.loads(response.text)
#
#         if response_info['result'] == '401' and response_info['status'] == 'FAILURE':
#             response_info['msg'] = "登录超时，请重新登录。"
#             results.append(response_info)
#             raise Exception('token verify failure')
#
#         results.append(response_info)
#     except Exception as e:
#         logger.error(e)
#     finally:
#         if len(results) == 0:
#             results.append({"status": "FAILURE"})
#         return HttpResponse(json.dumps(results))


# @transaction.atomic()
def cancel_root_path(request):
    """
    @api {post} api/tamper_proof/cancel_root_path/  ★取消根目录
    @apiDescription 取消根目录
    @apiGroup tamper_proof
    @apiParam {string} username    用户名
    @apiParam {string} host_name    主机名
    @apiParam {string} root_path 根目录路径
    @apiParam {string} service_type 服务名称：web、svn
    @apiSuccessExample Success-Response:
        [
            {
                "status":"SUCCESS",
                "msg":"Success starting cancel task. Host: 192.168.1.177, root_path: /home/uuu/vvv. Task_ID: 315"
            }
        ]
    @apiErrorExample Error-Response:
        [
            {
                "status":"FAILURE",
                "msg":"error_message"
            }
        ]
    """
    results = []
    res = {}
    arguments = {}

    # host_path_obj = None
    # user_host_path_objs = None
    # version_history_objs = None
    # sp1 = None
    # db_flag = "dtamper_web_mysql"

    token = "token"
    host_name = request.POST.get('host_name')
    username = request.POST.get('username')
    root_path = request.POST.get('root_path')
    root_path = eval(root_path)
    operate_type = "cancel"
    service_type = request.POST.get('service_type', 'web')
    try:
        # if service_type == "svn":
        #     db_flag = "dtamper_svn_mysql"
        # elif service_type == "web":
        #     db_flag = "dtamper_web_mysql"

        # 查询用户是否存在
        user_flag, user_obj = check_user_valid(service_type, username)

        if not user_flag:
            error_message = 'The user: %s does not exist.' % username
            logger.error(error_message)
            res["msg"] = error_message
            res["status"] = "FAILURE"
            results.append(res)
            return HttpResponse(json.dumps(results))

        # 检查主机是否合法
        host_flag, host_obj = check_host_name_valid(service_type, host_name)

        if not host_flag:
            error_message = 'The host: %s does not exist.' % host_name
            logger.error(error_message)
            res["msg"] = error_message
            res["status"] = "FAILURE"
            results.append(res)
            return HttpResponse(json.dumps(results))

        host_addr = host_obj.protect_host_addr

        # sp1 = transaction.savepoint(using=db_flag)
        # 检查路径是否合法
        for path in root_path:
            # 检查路径是否合法
            path_flag = check_path_format(path)

            if not path_flag:
                msg = 'Illegal path: %s.' % path
                logger.error(msg)
                res["msg"] = msg
                res["status"] = "FAILURE"
                results.append(res)
                return HttpResponse(json.dumps(results))

            # 检查路径是否存在
            host_path_flag, host_path_obj = check_host_path_valid(service_type, host_name, host_addr, path)

            if not host_path_flag:
                error_message = 'The host: %s, root path: %s does not exist.' % (host_name, path)
                logger.error(error_message)
                res["msg"] = error_message
                res["status"] = "FAILURE"
                results.append(res)
                return HttpResponse(json.dumps(results))

        arguments['host_addr'] = str(host_obj.protect_host_addr)
        arguments['operate_type'] = operate_type
        arguments['username'] = username
        arguments['host_name'] = host_name
        arguments['root_path'] = root_path[0]
        arguments['service_type'] = service_type
        arguments['token'] = "token"

        # 添加任务
        task_id, ret = Task.add_task(arguments)
        arguments['task_id'] = task_id

        # 发布任务
        message = json.dumps(arguments)
        task_pubblisher = TaskPublisher()
        is_success, msg = task_pubblisher.async_publish(message, task_id)

        # 发布任务失败, 则删除任务并返回
        if not is_success:
            Task.delete_task(service_type, ret['task_id'])
            msg = 'Fail to cancel root path %s of host %s. Task unconfirmed.' % (host_name, root_path[0])
        else:
            msg = 'Success starting cancel task. Host: %s, root_path: %s. Task_ID: %s' % \
                  (host_name, root_path[0], str(task_id))
    except Exception as error:
        is_success = False
        logger.error(error)
        msg = 'Fail to cancel root path %s of host %s.' % (root_path[0], host_name)

    if not is_success:
        logger.error(msg)
        res['msg'] = msg
        res["status"] = "FAILURE"
    else:
        logger.info(msg)
        res['msg'] = msg
        res["status"] = "SUCCESS"
    results.append(res)
    return HttpResponse(json.dumps(results))

    #         # 取消根目录:从数据库中删除指定根目录的信息, client端停止保护, 并从client的根目录列表中删除
    #         host_path_obj.delete()  # 如果指定主机上的根目录存在, 那么从HostPath表中删除根目录
    #
    #         # 从UserHostPath表中删除根目录
    #         if service_type == "svn":
    #             user_host_path_objs = SVNUserHostPath.objects.using("dtamper_svn_mysql")\
    #                 .filter(protect_host_name=host_name, protect_root_path=path).all()
    #         elif service_type == "web":
    #             user_host_path_objs = SVNUserHostPath.objects.using("dtamper_web_mysql") \
    #                 .filter(protect_host_name=host_name, protect_root_path=path).all()
    #
    #         for obj in user_host_path_objs:
    #             obj.delete()
    #
    #         # 从VersionHistory表中删除根目录
    #         if service_type == "svn":
    #             version_history_objs = SVNVersionHistory.objects.using("dtamper_svn_mysql")\
    #                 .filter(protect_host_name=host_name, protect_root_path=path).all()
    #         elif service_type == "web":
    #             version_history_objs = WebVersionHistory.objects.using("dtamper_web_mysql") \
    #                 .filter(protect_host_name=host_name, protect_root_path=path).all()
    #
    #         for obj in version_history_objs:
    #             obj.delete()
    #
    #     # 控制client端取消根目录, 停止对根目录保护, 并从根目录列表中移除, 不再对其进行维护
    #     pub_key, pri_key = get_key_pairs()
    #     # 构造发给client 端的消息
    #     rsa_signer = RSASigner(pri_key=pri_key, pub_key=pub_key)
    #     send_message = {}  # 生成发送给client 端的控制消息
    #     send_message['token'] = token
    #     send_message['root_path'] = root_path[0]
    #     send_message['operate_type'] = operate_type
    #     sort_message = json.dumps(send_message, sort_keys=True)
    #     send_message['signature'] = rsa_signer.sign_data(sort_message)
    #     # 加密
    #     aes_cipher = AESCipher(key=jc.aes_key, iv=jc.aes_iv)
    #     cipher_message = aes_cipher.encrypt(json.dumps(send_message))
    #
    #     # 发送控制消息到client端
    #     # redis实例
    #     rdb = StrictRedis(jc.dtamper_redis_host, jc.dtamper_redis_port, socket_timeout=0.5, decode_responses=True,
    #                       socket_keepalive=True, retry_on_timeout=True)
    #
    #     control_send_channel = host_addr + '_' + service_type + '_' + CONTROL_SEND_CHANNEL
    #     rdb.publish(control_send_channel, cipher_message)
    #     logger.info("Server send control command: %s to client, with root_path: %s" % (operate_type, root_path))
    #
    #     # 订阅redis消息队列, 监听client端的执行结果
    #     pubsub = rdb.pubsub(ignore_subscribe_messages=True)
    #     control_return_channel = host_addr + '_' + service_type + '_' + CONTROL_RETURN_CHANNEL
    #     pubsub.subscribe(control_return_channel)
    #     logger.info("Server subscribe redis message queue and begin to listen.................. ")
    #     is_success, msg = receive_control_message(pubsub, rsa_signer, aes_cipher)
    #
    #     # 如果Client端执行错误, 则回滚之前的删除操作
    #     if not is_success:
    #         transaction.savepoint_rollback(sp1, using=db_flag)
    #         results.append({"status": "FAILURE"})
    #         return HttpResponse(json.dumps(results))
    #     else:
    #         transaction.savepoint_commit(sp1, using=db_flag)
    #         results.append({"status": "SUCCESS"})
    #         return HttpResponse(json.dumps(results))
    # except Exception as e:
    #     logger.error(e)
    #     transaction.savepoint_rollback(sp1, using=db_flag)
    #     results.append({"status": "FAILURE"})
    #     return HttpResponse(json.dumps(results))


# def stop_user_root_path(request):
#     """
#     停用根目录
#     :param request:
#     :return:
#     """
#     results = []
#     try:
#         # token = request.POST.get('token')
#         token = ""
#         # username = request.POST.get('username')
#         username = "admin"
#         host_name = request.POST.get('host_name')
#         root_path = request.POST.get('root_path')
#         service_type = request.POST.get('service_type', 'web')
#
#         request_params = {
#             "token": "token",
#             "username": username,
#             "host_name": host_name,
#             "root_path": root_path,
#             'service_type': service_type
#         }
#
#         url = jc.tamper_proof_url + "/api/v1.0/tamper_proof_restful/stop_root_path_protect/"
#
#         headers = {
#             "Content-type": "application/json",
#             "Authorization": TOKEN_TYPE + token
#         }
#
#         response = requests.post(url=url, headers=headers, json=request_params)
#         response_info = json.loads(response.text)
#
#         if response_info['result'] == '401' and response_info['status'] == 'FAILURE':
#             response_info['msg'] = "登录超时，请重新登录。"
#             results.append(response_info)
#             raise Exception('token verify failure')
#
#         results.append(response_info)
#     except Exception as e:
#         logger.error(e)
#     finally:
#         if len(results) == 0:
#             results.append({"status": "FAILURE"})
#         return HttpResponse(json.dumps(results))


def stop_user_root_path(request):
    """
    @api {post} api/tamper_proof/stop_user_root_path/  ★停用根目录
    @apiDescription 停用根目录
    @apiGroup tamper_proof
    @apiParam {string} username    用户名
    @apiParam {string} host_name    主机名
    @apiParam {string} root_path 根目录路径
    @apiParam {string} service_type 服务名称：web、svn
    @apiSuccessExample Success-Response:
        [
            {
                "status":"SUCCESS",
                "msg":"Success starting stop task. Host: 192.168.1.177, root_path: /home/test28. Task_ID: 279"
            }
        ]
    @apiErrorExample Error-Response:
        [
            {
                "status":"FAILURE",
                "msg":"Error message"
            }
        ]
    """
    results = []
    arguments = {}
    res = {}
    username = request.POST.get('username')
    host_name = request.POST.get('host_name')

    root_path = request.POST.get('root_path')
    root_path = root_path.replace("\\", "/")

    service_type = request.POST.get('service_type', 'web')

    operate_type = "stop"
    try:
        # 检查路径是否合法
        path_flag = check_path_format(root_path)

        if not path_flag:
            msg = 'Illegal path: %s.' % root_path
            logger.error(msg)
            res["msg"] = msg
            res["status"] = "FAILURE"
            results.append(res)
            return HttpResponse(json.dumps(results))

        # 查询用户是否存在
        user_flag, user_obj = check_user_valid(service_type, username)

        if not user_flag:
            error_message = 'The user: %s does not exist.' % username
            logger.error(error_message)
            res["msg"] = error_message
            res["status"] = "FAILURE"
            results.append(res)
            return HttpResponse(json.dumps(results))

        # 检查主机是否合法
        host_flag, host_obj = check_host_name_valid(service_type, host_name)

        if not host_flag:
            error_message = 'The host: %s does not exist.' % host_name
            logger.error(error_message)
            res["msg"] = error_message
            res["status"] = "FAILURE"
            results.append(res)
            return HttpResponse(json.dumps(results))

        host_addr = host_obj.protect_host_addr

        # 校验根目录
        host_path_flag, host_path_obj = check_host_path_valid(service_type, host_name, host_addr, root_path)
        if not host_path_flag:
            error_message = 'The host: %s, root path: %s does not exist.' % (host_name, root_path)
            logger.error(error_message)
            res["msg"] = error_message
            res["status"] = "FAILURE"
            results.append(res)
            return HttpResponse(json.dumps(results))

        arguments['host_addr'] = str(host_addr)
        arguments['operate_type'] = operate_type
        arguments['username'] = username
        arguments['host_name'] = host_name
        arguments['root_path'] = root_path
        arguments['service_type'] = service_type
        arguments['token'] = "token"

        # 添加任务
        task_id, ret = Task.add_task(arguments)
        arguments['task_id'] = task_id

        # 发布任务
        message = json.dumps(arguments)
        task_pubblisher = TaskPublisher()
        is_success, msg = task_pubblisher.async_publish(message, task_id)

        # 发布任务失败, 则删除任务并返回
        if not is_success:
            Task.delete_task(service_type, ret['task_id'])
            msg = 'Fail to stop root path %s of host %s. Task unconfirmed.' % (host_name, root_path)
        else:
            msg = 'Success starting stop task. Host: %s, root_path: %s. Task_ID: %s' % \
                  (host_name, root_path, str(task_id))

    except Exception as error:
        is_success = False
        logger.error(error)
        msg = 'Fail to stop root path %s of host %s.' % (root_path, host_name)

    if not is_success:
        logger.error(msg)
        res['msg'] = msg
        res["status"] = "FAILURE"
    else:
        logger.info(msg)
        res['msg'] = msg
        res["status"] = "SUCCESS"
    results.append(res)
    return HttpResponse(json.dumps(results))


# def assign_user_root_path(request):
#     """
#     为用户分配一个已存在的目录作为根目录
#     :param request:
#     :return:
#     """
#     results = []
#     try:
#         # token = request.POST.get('token')
#         token = ""
#         # username = request.POST.get('userName')
#         username = "admin"
#         assign_list = request.POST.get('assignRootPath')
#         assign_list = eval(assign_list)
#         remark = request.POST.get('root_mark', 'assign root path')
#         service_type = request.POST.get('service_type', 'web')
#
#         if len(assign_list) > 0:
#             request_params = {
#                 "username": username,
#                 "assign_list": assign_list,
#                 "remark": remark,
#                 'service_type': service_type
#             }
#
#             url = jc.tamper_proof_url + "/api/v1.0/tamper_proof_restful/assign_user_root_path/"
#
#             headers = {
#                 "Content-type": "application/json",
#                 "Authorization": TOKEN_TYPE + token
#             }
#
#             response = requests.post(url=url, headers=headers, json=request_params)
#             response_info = json.loads(response.text)
#
#             if response_info['result'] == '401' and response_info['status'] == 'FAILURE':
#                 response_info['msg'] = "登录超时，请重新登录。"
#                 results.append(response_info)
#                 raise Exception('token verify failure')
#
#             results.append(response_info)
#     except Exception as e:
#         logger.error(e)
#     finally:
#         if len(results) == 0:
#             results.append({"status": "FAILURE"})
#         return HttpResponse(json.dumps(results))


@transaction.atomic()
def assign_user_root_path(request):
    """
    @api {post} api/tamper_proof/assign_user_root_path/  ★为用户分配一个已存在的目录作为根目录
    @apiDescription 获取版本信息
    @apiGroup tamper_proof
    @apiParam {string} userName    用户名称
    @apiParam {string} assignRootPath 分配路径
    @apiParam {string} root_mark 路径说明
    @apiParam {string} service_type 服务名称：web、svn
    @apiSuccessExample Success-Response:
        [
            {
                "status":"SUCCESS",
                "msg":"Success. Finish assigning root paths [{"host": "192.168.1.177", "path": "/home/uuu"}] in to user trust."
            }
        ]
    @apiErrorExample Error-Response:
        [
            {
                "status":"FAILURE",
                "msg":"Error message"
            }
        ]
    """
    results = []
    res = {}
    user_host_path_obj = None
    sp1 = None
    db_flag = "dtamper_web_mysql"
    try:
        username = request.POST.get('userName')
        assign_list = request.POST.get('assignRootPath')
        assign_list = eval(assign_list)
        remark = request.POST.get('root_mark', 'assign root path')
        service_type = request.POST.get('service_type', 'web')
        timestamp = datetime.datetime.now()
        if service_type == "svn":
            db_flag = "dtamper_svn_mysql"
        elif service_type == "web":
            db_flag = "dtamper_web_mysql"

        if len(assign_list) > 0:
            sp1 = transaction.savepoint(using=db_flag)
            for host_path_dict in assign_list:
                # 检查数据结构是否合法, 即是否包含"host"和"path"两个key
                if not all(k in host_path_dict.keys() for k in ("host", "path")):
                    error_message = '''KeyError: No "host" or "path"'''
                    logger.error(error_message)
                    results.append({"msg": error_message})
                    return HttpResponse(json.dumps(results))

                # 获取主机名称和根目录
                host_name = host_path_dict['host']
                root_path = host_path_dict['path']

                # 检查主机是否合法
                host_flag, host_obj = check_host_name_valid(service_type, host_name)

                if not host_flag:
                    error_message = 'The host: %s does not exist.' % host_name
                    logger.error(error_message)
                    res["msg"] = error_message
                    res["status"] = "FAILURE"
                    results.append(res)
                    return HttpResponse(json.dumps(results))

                # 获取主机地址
                host_addr = host_obj.protect_host_addr

                # 检查路径是否存在
                host_path_flag, host_path_obj = check_host_path_valid(service_type, host_name, host_addr, root_path)

                if not host_path_flag:
                    error_message = 'The host: %s, root path: %s does not exist.' % (host_name, root_path)
                    logger.error(error_message)
                    res["msg"] = error_message
                    res["status"] = "FAILURE"
                    results.append(res)
                    return HttpResponse(json.dumps(results))

                # 判断用户下面的根目录是否已存在, 若不存在则插入UserHostPath表中
                if service_type == "svn":
                    user_host_path_obj = SVNUserHostPath.objects.using("dtamper_svn_mysql")\
                        .filter(username=username, protect_host_name=host_name, protect_root_path=root_path).all()
                elif service_type == "web":
                    user_host_path_obj = WebUserHostPath.objects.using("dtamper_svn_mysql") \
                        .filter(username=username, protect_host_name=host_name, protect_root_path=root_path).all()

                if not user_host_path_obj:
                    user_host_path = SVNUserHostPath() if service_type == "svn" else WebUserHostPath()
                    user_host_path.username = username
                    user_host_path.protect_host_name = host_name
                    user_host_path.protect_host_addr = host_addr
                    user_host_path.protect_root_path = root_path
                    user_host_path.protect_path_mark = host_path_obj.protect_path_mark
                    user_host_path.status = host_path_obj.status
                    user_host_path.timestamp = timestamp
                    user_host_path.remark = remark
                    user_host_path.save()

            transaction.savepoint_commit(sp1, using=db_flag)
            success_message = 'Success. Finish assigning root paths %s in to user %s.' % (json.dumps(assign_list), username)
            logger.info(success_message)
            res["status"] = "SUCCESS"
            res["msg"] = success_message
            results.append(res)
    except Exception as e:
        logger.error(e)
        transaction.savepoint_rollback(sp1, using=db_flag)
    finally:
        if len(results) == 0:
            results.append({"status": "FAILURE"})
        return HttpResponse(json.dumps(results))


def del_root_path(request):
    """
    @api {post} api/tamper_proof/del_root_path/  ★删除根目录
    @apiDescription 删除根目录
    @apiGroup tamper_proof
    @apiParam {string} host_name    主机名
    @apiParam {string} root_path 根目录路径
    @apiParam {string} service_type 服务名称：web、svn
    @apiSuccessExample Success-Response:
        {

        }
    @apiErrorExample Error-Response:
        [
            {
                "status":"FAILURE"
            }
        ]
    """
    results = []
    try:
        # token = request.POST.get('token')
        token = ""
        host_name = request.POST.get('host_name')
        root_path = request.POST.get('root_path')
        service_type = request.POST.get('service_type', 'web')

        request_params = {
            "token": "token",
            "host_name": host_name,
            "root_path": root_path,
            'service_type': service_type
        }

        url = jc.tamper_proof_url + "/api/v1.0/tamper_proof_restful/del_root_path/"

        headers = {
            "Content-type": "application/json",
            "Authorization": TOKEN_TYPE + token
        }

        response = requests.post(url=url, headers=headers, json=request_params)
        response_info = json.loads(response.text)

        if response_info['result'] == '401' and response_info['status'] == 'FAILURE':
            response_info['msg'] = "登录超时，请重新登录。"
            results.append(response_info)
            raise Exception('token verify failure')

        results.append(response_info)
    except Exception as e:
        logger.error(e)
    finally:
        if len(results) == 0:
            results.append({"status": "FAILURE"})
        return HttpResponse(json.dumps(results))


# def revoke_user_root_path(request):
#     """
#     撤销用户根目录权限
#     :param request:
#     :return:
#     """
#     results = []
#     try:
#         # token = request.POST.get('token')
#         token = ""
#         # username = request.POST.get('username')
#         username = "admin"
#         host_name = request.POST.get('host_name')
#         root_path = request.POST.get('root_path')
#         root_path_list = eval(root_path)
#         service_type = request.POST.get('service_type', 'web')
#
#         request_params = {
#             "username": username,
#             "host_name": host_name,
#             "root_path_list": root_path_list,
#             'service_type': service_type
#         }
#
#         url = jc.tamper_proof_url + "/api/v1.0/tamper_proof_restful/revoke_user_root_path/"
#
#         headers = {
#             "Content-type": "application/json",
#             "Authorization": TOKEN_TYPE + token
#         }
#
#         response = requests.post(url=url, headers=headers, json=request_params)
#         response_info = json.loads(response.text)
#
#         if response_info['result'] == '401' and response_info['status'] == 'FAILURE':
#             response_info['msg'] = "登录超时，请重新登录。"
#             results.append(response_info)
#             raise Exception('token verify failure')
#
#         results.append(response_info)
#     except Exception as e:
#         logger.error(e)
#     finally:
#         if len(results) == 0:
#             results.append({"status": "FAILURE"})
#         return HttpResponse(json.dumps(results))


@transaction.atomic()
def revoke_user_root_path(request):
    """
    @api {post} api/tamper_proof/revoke_user_root_path/  ★撤销用户根目录权限
    @apiDescription 撤销用户根目录权限
    @apiGroup tamper_proof
    @apiParam {string} username    用户名
    @apiParam {string} host_name    主机名
    @apiParam {string} root_path 根目录路径
    @apiParam {string} service_type 服务名称：web、svn
    @apiSuccessExample Success-Response:
        [
            {
                "status":"SUCCESS",
                "msg":"Success msg"
            }
        ]
    @apiErrorExample Error-Response:
        [
            {
                "status":"FAILURE",
                "msg":"Failure. The root path: /home/eee in host: 192.168.1.177 of user trust doesn't exist. "
            }
        ]
    """
    results = []
    res = {}
    user_host_path_objs = None
    sp1 = None
    db_flag = "dtamper_web_mysql"
    try:
        username = request.POST.get('username')
        host_name = request.POST.get('host_name')
        root_path = request.POST.get('root_path')
        root_path_list = eval(root_path)
        service_type = request.POST.get('service_type', 'web')
        if service_type == "svn":
            db_flag = "dtamper_web_mysql"
        elif service_type == "web":
            db_flag = "dtamper_web_mysql"

        # 查询用户是否存在
        user_flag, user_obj = check_user_valid(service_type, username)

        if not user_flag:
            error_message = 'The user: %s does not exist.' % username
            logger.error(error_message)
            res["msg"] = error_message
            res["status"] = "FAILURE"
            results.append(res)
            return HttpResponse(json.dumps(results))

        # 如果用户为管理员权限, 则直接返回
        if user_obj.is_super == 1:
            msg = 'Revoke. The user: %s has administrator authority and the revoke operation is cancelled.' % username
            logger.info(msg)
            res["msg"] = msg
            res["status"] = "SUCCESS"
            results.append(res)
            return HttpResponse(json.dumps(results))

        # 遍历根目录列表, 依次取消授权
        sp1 = transaction.savepoint(using=db_flag)
        for root_path in root_path_list:

            if service_type == "svn":
                user_host_path_objs = SVNUserHostPath.objects.using("dtamper_svn_mysql")\
                    .filter(username=username, protect_host_name=host_name, protect_root_path=root_path).all()
            elif service_type == "web":
                user_host_path_objs = SVNUserHostPath.objects.using("dtamper_svn_mysql") \
                    .filter(username=username, protect_host_name=host_name, protect_root_path=root_path).all()

            if not user_host_path_objs:
                error_message = "Failure. The root path: %s in host: %s of user %s doesn't exist. " % \
                                (root_path, host_name, username)
                logger.error(error_message)
                transaction.savepoint_rollback(sp1, using=db_flag)
                res["msg"] = error_message
                res["status"] = "FAILURE"
                results.append(res)
                return HttpResponse(json.dumps(results))

            for obj in user_host_path_objs:
                obj.delete()

        transaction.savepoint_commit(sp1, using=db_flag)
        success_message = 'Success. Finish revoking root path %s in host %s from user %s.' % (
            json.dumps(root_path_list), host_name, username)
        logger.info(success_message)
        res["msg"] = success_message
        res["status"] = "SUCCESS"
        results.append(res)
        return HttpResponse(json.dumps(results))
    except Exception as e:
        logger.error(e)
        transaction.savepoint_rollback(sp1, using=db_flag)
        results.append({"status": "FAILURE"})
        return HttpResponse(json.dumps(results))


# def get_user_list(request):
#     """
#     获取用户列表
#     :param request:
#     :return:
#     """
#     results = []
#     try:
#         # token = request.POST.get('token')
#         token = ""
#         service_type = request.POST.get('service_type', 'web')
#
#         request_params = {
#             'service_type': service_type
#         }
#
#         headers = {
#             "Authorization": TOKEN_TYPE + token
#         }
#
#         url = jc.tamper_proof_url + "/api/v1.0/tamper_proof_restful/query_user_list/"
#         response = requests.get(url, headers=headers, json=request_params)
#         response_info = json.loads(response.text)
#
#         if response_info['result'] == '401' and response_info['status'] == 'FAILURE':
#             response_info['msg'] = "登录超时，请重新登录。"
#             results.append(response_info)
#             raise Exception('token verify failure')
#
#         results.append(response_info)
#     except Exception as e:
#         logger.error(e)
#     finally:
#         if len(results) == 0:
#             results.append({"status": "FAILURE"})
#         return HttpResponse(json.dumps(results))


def get_user_list(request):
    """
    @api {post} api/tamper_proof/get_user_list/  ★获取用户列表
    @apiDescription 获取用户列表
    @apiGroup tamper_proof
    @apiParam {string} service_type 服务名称：web、svn
    @apiSuccessExample Success-Response:
        [{
            "status": "SUCCESS",
            "result": [{
                "department": "",
                "remark": "管理员",
                "is_super": 1,
                "phone": "",
                "status": "authorized",
                "id": 1,
                "username": "admin",
                "email": "",
                "user_alias": null,
                "position": "高工"
            }, {
                "department": "",
                "remark": "用户",
                "is_super": 0,
                "phone": "",
                "status": "authorized",
                "id": 3,
                "username": "trust",
                "email": "",
                "user_alias": null,
                "position": "高工"
            }],
            "msg": "Success. Finish fetching all user information."
        }]
    @apiErrorExample Error-Response:
        {
            "status": "FAILURE"
        }
    """
    user_objs = []
    user_list = []
    results = []
    res = {}
    try:
        service_type = request.POST.get('service_type', 'web')
        if service_type == "svn":
            user_objs = SVNTamperUser.objects.using("dtamper_svn_mysql").all()
        elif service_type == "web":
            user_objs = WebTamperUser.objects.using("dtamper_web_mysql").all()
        for user in user_objs:
            user_dict = user.toDict()
            if 'password' in user_dict:
                del user_dict['password']
            if 'token' in user_dict:
                del user_dict['token']
            user_list.append(user_dict)
    except Exception as e:
        logger.error(e)
    finally:
        if len(user_list) == 0:
            res["status"] = "FAILURE"
        else:
            res["msg"] = 'Success. Finish fetching all user information.'
            res["status"] = "SUCCESS"
            res["result"] = user_list
        results.append(res)
        return HttpResponse(json.dumps(results))


# def get_all_host_path(request):
#     """
#     获取所有根目录的树形结构
#     :param request:
#     :return:
#     """
#     results = []
#     try:
#         # token = request.POST.get('token')
#         token = ""
#         service_type = request.POST.get('service_type', 'web')
#
#         request_params = {
#             'service_type': service_type
#         }
#
#         headers = {
#             "Authorization": TOKEN_TYPE + token
#         }
#
#         url = jc.tamper_proof_url + "/api/v1.0/tamper_proof_restful/query_all_host_path/"
#         response = requests.get(url, headers=headers, json=request_params)
#         response_info = json.loads(response.text)
#
#         if response_info['result'] == '401' and response_info['status'] == 'FAILURE':
#             response_info['msg'] = "登录超时，请重新登录。"
#             results.append(response_info)
#             raise Exception('token verify failure')
#
#         results.append(response_info)
#     except Exception as e:
#         logger.error(e)
#     finally:
#         if len(results) == 0:
#             results.append({"status": "FAILURE"})
#         return HttpResponse(json.dumps(results))


def get_all_host_path(request):
    """
    @api {post} api/tamper_proof/get_all_host_path/  ★获取所有根目录的树形结构
    @apiDescription 获取所有根目录的树形结构
    @apiGroup tamper_proof
    @apiParam {string} service_type 服务名称：web、svn
    @apiSuccessExample Success-Response:
        {

        }
    @apiErrorExample Error-Response:
        {

        }
    """
    results = []
    host_objs = None
    host_path_objs = None
    host_path_dict = {}
    res = {}
    try:
        service_type = request.POST.get('service_type', 'web')

        # 从数据库中获取主机对象列表
        if service_type == "svn":
            host_objs = SVNHostInfo.objects.using("dtamper_svn_mysql").all()
        elif service_type == "web":
            host_objs = WebHostInfo.objects.using("dtamper_web_mysql").all()

        for host_obj in host_objs:
            root_path_list = []
            # 获取主机名称
            host_name = host_obj.protect_host_name
            # 从数据库中获取该主机下的所有被保护目录
            if service_type == "svn":
                host_path_objs = SVNHostPath.objects.using("dtamper_svn_mysql").filter(protect_host_name=host_name).all()
            elif service_type == "web":
                host_path_objs = WebHostPath.objects.using("dtamper_web_mysql").filter(protect_host_name=host_name).all()

            for host_path_obj in host_path_objs:
                path_dict = host_path_obj.toDict()

                path_dict['protect_host_addr'] = str(host_path_obj.protect_host_addr)
                path_dict['timestamp'] = host_path_obj.timestamp.strftime("%Y-%m-%d %H:%M:%S")

                root_path_list.append(path_dict)

            # 构建根目录的树行结构
            host_path_dict[str(host_obj.protect_host_addr)] = root_path_list
        success_message = 'Success. Finish fetching all root paths.'
        logger.info(success_message)
        logger.info(host_path_dict)
        res["msg"] = success_message
        res["result"] = host_path_dict
        res["status"] = "SUCCESS"
        results.append(res)
        return HttpResponse(json.dumps(results))
    except Exception as e:
        logger.error(e)
        results.append({"status": "FAILURE"})
        return HttpResponse(json.dumps(results))


# def operations(request):
#     """
#     新建 上传 删除 移动操作
#     :param request:
#     :return:
#     """
#     results = []
#     try:
#         # token = request.POST.get('token')
#         token = ""
#         service_type = request.POST.get('service_type', 'web')
#         is_upload = request.POST.get('isUpload', False)
#
#         if is_upload:
#             # username = request.POST.get('username')
#             username = "admin"
#             host_name = request.POST.get('host_name')
#             root_path = request.POST.get('root_path')
#             remark = request.POST.get('remark', '')
#             operation = request.POST.get('operation')
#             path = request.POST.get('path')
#             type = request.POST.get('type')
#             req_file = request.FILES['content']
#             content = req_file.read().decode("iso-8859-1")
#
#             request_params = {
#                 "token": "trust2",
#                 "username": username,
#                 "host_name": host_name,
#                 "root_path": root_path,
#                 "remark": remark,
#                 'service_type': service_type,
#                 "operations": {
#                     "operation": operation,
#                     "object_list": [
#                         {
#                             "path": path,
#                             "type": type,
#                             "content": content
#                         }
#                     ]
#                 },
#             }
#         else:
#             data = request.POST.get('data')
#             request_params = json.loads(data)
#             request_params["token"] = token
#             request_params["service_type"] = service_type
#
#         url = jc.tamper_proof_url + "/api/v1.0/tamper_proof_restful/update_version/"
#
#         headers = {
#             "Content-type": "application/json",
#             "Authorization": TOKEN_TYPE + token
#         }
#
#         response = requests.post(url=url, headers=headers, json=request_params)
#         response_info = json.loads(response.text)
#
#         if response_info['result'] == '401' and response_info['status'] == 'FAILURE':
#             response_info['msg'] = "登录超时，请重新登录。"
#             results.append(response_info)
#             raise Exception('token verify failure')
#
#         results.append(response_info)
#     except Exception as e:
#         logger.error(e)
#     finally:
#         if len(results) == 0:
#             results.append({"status": "FAILURE"})
#         return HttpResponse(json.dumps(results))


def operations(request):
    """
    @api {post} api/tamper_proof/operations/  ★新建/上传/删除/移动操作
    @apiDescription 新建/上传/删除/移动操作
    @apiGroup tamper_proof
    @apiParam {string} isUpload    是否上传
    @apiParam {string} service_type 服务名称：web、svn
    @apiSuccessExample Success-Response:
        {

        }
    @apiErrorExample Error-Response:
        [
            {
                "status":"FAILURE",
                "msg":"Error message"
            }
        ]
    """
    results = []
    arguments = {}
    res = {}
    token = "trust2"
    operation_type = "update"
    service_type = request.POST.get('service_type', 'web')
    is_upload = request.POST.get('isUpload', False)

    if is_upload:
        username = request.POST.get('username')
        host_name = request.POST.get('host_name')
        root_path = request.POST.get('root_path')
        operation = request.POST.get('operation')
        path = request.POST.get('path')
        type = request.POST.get('type')
        req_file = request.FILES['content']
        content = req_file.read().decode("iso-8859-1")
        operations = {
            "operation": operation,
            "object_list": [{
                "path": path,
                "type": type,
                "content": content
                }
            ]
        }
    else:
        data = request.POST.get('data')
        ret = json.loads(data)
        username = ret["username"]
        host_name = ret["host_name"]
        root_path = ret["root_path"]
        operations = ret["operations"]
    try:
        # 检查路径是否合法
        path_flag = check_path_format(root_path)

        if not path_flag:
            msg = 'Illegal path: %s.' % root_path
            logger.error(msg)
            res["msg"] = msg
            res["status"] = "FAILURE"
            results.append(res)
            return HttpResponse(json.dumps(results))

        # 检查版本变更数据结构是否合法
        is_success, new_root_path, msg = check_operate_struct(root_path, operations)
        if not is_success:
            logger.error(msg)
            res["msg"] = msg
            res["status"] = "FAILURE"
            results.append(res)
            return HttpResponse(json.dumps(results))

        # 检查主机是否合法
        host_flag, host_obj = check_host_name_valid(service_type, host_name)

        if not host_flag:
            error_message = 'The host: %s does not exist.' % host_name
            logger.error(error_message)
            res["msg"] = error_message
            res["status"] = "FAILURE"
            results.append(res)
            return HttpResponse(json.dumps(results))
        host_addr = host_obj.protect_host_addr

        # 校验根目录
        host_path_flag, host_path_obj = check_host_path_valid(service_type, host_name, host_addr, root_path)
        if not host_path_flag:
            error_message = 'The host: %s, root path: %s does not exist.' % (host_name, root_path)
            logger.error(error_message)
            res["msg"] = error_message
            res["status"] = "FAILURE"
            results.append(res)
            return HttpResponse(json.dumps(results))

        # 查询用户是否存在
        user_flag, user_obj = check_user_valid(service_type, username)

        if not user_flag:
            error_message = 'The user: %s does not exist.' % username
            logger.error(error_message)
            res["msg"] = error_message
            res["status"] = "FAILURE"
            results.append(res)
            return HttpResponse(json.dumps(results))

        # 判断用户下面的根目录是否已存在
        if user_obj.is_super != 1:
            is_success = check_user_host_path(service_type, username, host_name, root_path)
            if is_success:
                error_message = 'The host: %s, root path: %s of user: %s does not exist.' % \
                                (host_name, root_path, username)
                logger.error(error_message)
                res["msg"] = error_message
                res["status"] = "FAILURE"
                results.append(res)
                return HttpResponse(json.dumps(results))

        arguments['host_addr'] = str(host_addr)
        arguments['operate_type'] = operation_type
        arguments['username'] = username
        arguments['host_name'] = host_name
        arguments['root_path'] = root_path
        arguments['service_type'] = service_type
        arguments['token'] = token
        arguments['operations'] = operations

        # 添加任务
        task_id, ret = Task.add_task(arguments)
        arguments['task_id'] = task_id
        res["result"] = ret

        # 发布任务
        message = json.dumps(arguments)
        task_pubblisher = TaskPublisher()
        is_success, msg = task_pubblisher.async_publish(message, task_id)

        # 发布任务失败, 则删除任务并返回
        if not is_success:
            Task.delete_task(service_type, ret['task_id'])
            msg = 'Fail to update root path %s of host %s. Task unconfirmed.' % (host_name, root_path)
        else:
            msg = 'Success starting update version task. Host: %s, root_path: %s. Task_ID: %s' % \
                  (host_name, root_path, str(task_id))

    except Exception as error:
        is_success = False
        logger.error(error)
        msg = 'Fail to start update version task. Host: %s, root_path: %s.' % (host_name, root_path)

    if not is_success:
        logger.error(msg)
        res['msg'] = msg
        res["status"] = "FAILURE"
    else:
        logger.info(msg)
        res['msg'] = msg
        res["status"] = "SUCCESS"
    results.append(res)
    return HttpResponse(json.dumps(results))


# def get_host_list(request):
#     """
#     查询所有主机列表
#     :param request:
#     :return:
#     """
#     results = []
#     try:
#         # token = request.POST.get('token')
#         token = ""
#         service_type = request.POST.get('service_type', 'web')
#
#         request_params = {
#             'service_type': service_type
#         }
#
#         headers = {
#             "Authorization": TOKEN_TYPE + token
#         }
#
#         url = jc.tamper_proof_url + "/api/v1.0/tamper_proof_restful/query_host_list/"
#         response = requests.get(url, headers=headers, json=request_params)
#         response_info = json.loads(response.text)
#
#         if response_info['result'] == '401' and response_info['status'] == 'FAILURE':
#             response_info['msg'] = "登录超时，请重新登录。"
#             results.append(response_info)
#             raise Exception('token verify failure')
#
#         results.append(response_info)
#     except Exception as e:
#         logger.error(e)
#     finally:
#         if len(results) == 0:
#             results.append({"status": "FAILURE"})
#         return HttpResponse(json.dumps(results))


def get_host_list(request):
    """
    @api {post} api/tamper_proof/get_host_list/  ★查询所有主机列表
    @apiDescription 查询所有主机列表
    @apiGroup tamper_proof
    @apiParam {string} service_type 服务名称：web、svn
    @apiSuccessExample Success-Response:
        {

        }
    @apiErrorExample Error-Response:
        {

        }
    """
    results = []
    host_list = []
    host_objs = []
    res = {}
    try:
        service_type = request.POST.get('service_type', 'web')
        if service_type == "svn":
            host_objs = SVNHostInfo.objects.using("dtamper_svn_mysql").all()
        elif service_type == "web":
            host_objs = WebHostInfo.objects.using("dtamper_web_mysql").all()

        for host_obj in host_objs:
            temp_obj = {
                'host_name': host_obj.protect_host_name,
                'os_name': host_obj.os_name
            }

            host_list.append(temp_obj)
            res["result"] = host_list

    except Exception as e:
        logger.error(e)
    finally:
        if len(host_list) == 0:
            res["status"] = "FAILURE"
        else:
            res["status"] = "SUCCESS"
        results.append(res)
        return HttpResponse(json.dumps(results))


def log_in(request):
    """
    @api {post} api/tamper_proof/log_in/  ★防篡改登录
    @apiDescription 防篡改登录
    @apiGroup tamper_proof
    @apiParam {string} username    用户名
    @apiParam {string} password    密码
    @apiParam {string} service_type 服务名称：web、svn
    @apiSuccessExample Success-Response:
        {
            "code": "success,
            "token": dasdaskldasld
            "is_super": 1
        }
    @apiErrorExample Error-Response:
        {

        }
    """
    results = []

    try:
        username = request.POST.get('username')
        password = request.POST.get('password')
        service_type = request.POST.get('service_type', 'web')

        request_params = {
            "username": username,
            "password": password,
            'service_type': service_type
        }

        url = jc.tamper_proof_url + "/api/v1.0/tamper_proof_restful/admin_login/"
        response = requests.post(url=url, json=request_params)
        results.append(json.loads(response.text))
    except Exception as e:
        logger.error(e)
    finally:
        return HttpResponse(json.dumps(results))


def log_out(request):
    """
    @api {post} api/tamper_proof/log_out/  ★防篡改注销
    @apiDescription 防篡改注销
    @apiGroup tamper_proof
    @apiParam {string} username    用户名
    @apiParam {string} password    密码
    @apiParam {string} service_type 服务名称：web、svn
    @apiSuccessExample Success-Response:
        {
            'status': 'SUCCESS',
            'msg': success,
            'result': {}
        }
    @apiErrorExample Error-Response:
        {
            'status': 'FAILURE',
            'msg': failure,
            'result': {}
        }
    """
    results = []
    try:
        username = request.POST.get('username')
        password = request.POST.get('password', '000000')
        service_type = request.POST.get('service_type', 'web')

        request_params = {
            "username": username,
            "password": password,
            'service_type': service_type
        }

        url = jc.tamper_proof_url + "/api/v1.0/tamper_proof_restful/logout/"
        response = requests.post(url=url, json=request_params)
        results.append(json.loads(response.text))
    except Exception as e:
        logger.error(e)
    finally:
        return HttpResponse(json.dumps(results))


def register(request):
    """
    @api {post} api/tamper_proof/register/  ★防篡改注册
    @apiDescription 防篡改注册
    @apiGroup tamper_proof
    @apiParam {string} username    用户名
    @apiParam {string} password    密码
    @apiParam {string} position    企业
    @apiParam {string} department    部门
    @apiParam {string} email    邮箱
    @apiParam {string} phone    手机号
    @apiParam {string} service_type 服务名称：web、svn
    @apiSuccessExample Success-Response:
        {
            ret:{
                "token": dsadsadasdasdasd
            }
            "mes": "Registration successful."
        }
    @apiErrorExample Error-Response:
        {

        }
    """
    results = []
    try:
        username = request.POST.get('username')
        password = request.POST.get('password')
        position = request.POST.get('position')
        department = request.POST.get('department')
        email = request.POST.get('email')
        phone = request.POST.get('phone')
        service_type = request.POST.get('service_type', 'web')

        request_params = {
            "username": username,
            "password": password,
            "position": position,
            "department": department,
            "email": email,
            "phone": phone,
            "status": "authorized",
            "is_super": 1,
            'service_type': service_type
        }

        url = jc.tamper_proof_url + "/api/v1.0/tamper_proof_restful/register/"
        response = requests.post(url=url, json=request_params)
        results.append(json.loads(response.text))
    except Exception as e:
        logger.error(e)
    finally:
        return HttpResponse(json.dumps(results))


# def switch_user_status(request):
#     """
#     切换用户状态  授权和未授权
#     :param request:
#     :return:
#     """
#     results = []
#     try:
#         # token = request.POST.get('token')
#         token = ""
#         ids = request.POST.get('ids')
#         authorized = request.POST.get('authorized')
#         service_type = request.POST.get('service_type', 'web')
#
#         id_list = ids.split("#")
#         #id_list = [int(id) for id in id_list]
#
#         if len(id_list) > 0:
#             request_params = {
#                 "ids": id_list,
#                 "status": authorized,
#                 'service_type': service_type
#             }
#
#             headers = {
#                 "Content-type": "application/json",
#                 "Authorization": TOKEN_TYPE + token
#             }
#
#             url = jc.tamper_proof_url + "/api/v1.0/tamper_proof_restful/switch_user_status/"
#
#             response_info = requests.post(url=url, headers=headers, json=request_params)
#             results.append(json.loads(response_info.text))
#     except Exception as e:
#         logger.error(e)
#     finally:
#         return HttpResponse(json.dumps(results))


def switch_user_status(request):
    """
    @api {post} api/tamper_proof/switch_user_status/  ★切换用户状态
    @apiDescription 切换用户状态  授权和未授权
    @apiGroup tamper_proof
    @apiParam {string} ids    一组id
    @apiParam {string} authorized    登陆信息
    @apiParam {string} service_type 服务名称：web、svn
    @apiSuccessExample Success-Response:
        [{
            "status": "SUCCESS",
            "msg": "Switch status success."
        }]
    @apiErrorExample Error-Response:
        [
            {
                "status":"FAILURE",
                "msg":"Error message"
            }
        ]
    """
    results = []
    res = {}
    try:
        ids = request.POST.get('ids')
        authorized = request.POST.get('authorized')
        service_type = request.POST.get('service_type', 'web')

        id_list = ids.split("#")

        if len(id_list) > 0:
            if service_type == "svn":
                for user_id in ids:
                    user_obj = SVNTamperUser.objects.using("dtamper_svn_mysql").filter(id=user_id).first()
                    if not user_obj:
                        message = 'The user does not exist.'
                        logger.error(message)
                        res["msg"] = message
                        res["status"] = "FAILURE"
                        results.append(res)
                        return HttpResponse(json.dumps(results))

                    if user_obj.is_super == 1:
                        message = 'Status of administrator can not be changed.'
                        res["msg"] = message
                        res["status"] = "FAILURE"
                        results.append(res)
                        return HttpResponse(json.dumps(results))
                    user_obj.status = authorized
                    user_obj.token = 'logout'
                    user_obj.save()
                    logger.info("Switch %s status to %s.", user_obj.username, authorized)
                    res["msg"] = "Switch status success."
                    res["status"] = "SUCCESS"
                    results.append(res)
                    return HttpResponse(json.dumps(results))
            elif service_type == "web":
                for user_id in ids:
                    user_obj = SVNTamperUser.objects.using("dtamper_web_mysql").filter(id=user_id).first()
                    if not user_obj:
                        message = 'The user does not exist.'
                        res["msg"] = message
                        res["status"] = "FAILURE"
                        results.append(res)
                        return HttpResponse(json.dumps(results))

                    if user_obj.is_super == 1:
                        message = 'Status of administrator can not be changed.'
                        res["msg"] = message
                        res["status"] = "FAILURE"
                        results.append(res)
                        return HttpResponse(json.dumps(results))

                    user_obj.status = authorized
                    user_obj.token = 'logout'
                    user_obj.save()
                    logger.info("Switch %s status to %s.", user_obj.username, authorized)
                    res["msg"] = "Switch status success."
                    res["status"] = "SUCCESS"
                    results.append(res)
                    return HttpResponse(json.dumps(results))

    except Exception as e:
        logger.error(e)
        res["msg"] = "Switch status failure."
        res["status"] = "FAILURE"
        results.append(res)
        return HttpResponse(json.dumps(results))


def get_user_operation_log(request):
    """
    @api {post} api/tamper_proof/get_user_operation_log/  ★获取用户操作日志
    @apiDescription 获取用户操作日志
    @apiGroup tamper_proof
    @apiParam {string} pagenum 页码
    @apiParam {string} pagesize 每页数量
    @apiSuccessExample Success-Response:
        {
            "content": [{
                "_index": "dtamperserverlog192.168.1.222-20180629",
                "_type": "dtamperServerLog",
                "_source": {
                    "message": "{\"service_type\": \"web\", \"is_success\": \"SUCCESS\", \"protect_host_name\": \"192.168.1.177\", \"protect_root_path\": \"/home/test28\", \"username\": \"admin\", \"changed_objects\": [\"/home/test28\"], \"version_txid\": \"\", \"operate_type\": \"stop\", \"timestamp\": \"2018-06-29 16:12:19\"}",
                    "type": "192.168.1.222",
                    "source": "/var/log/8lab/8lab_tamper_proof_server.log",
                    "@timestamp": "2018-06-29T08:12:26.385Z",
                    "host": "dtamper01",
                    "beat": {
                        "name": "dtamper01",
                        "version": "5.4.3",
                        "hostname": "dtamper01"
                    },
                    "tags": ["dtamperServerLog", "beats_input_codec_plain_applied"],
                    "@version": "1",
                    "input_type": "log",
                    "kafka": {
                        "topic": "dtamperServerLog",
                        "consumer_group": "dtamperServerLog",
                        "key": null,
                        "partition": 2,
                        "offset": 5
                    },
                    "offset": 2390
                },
                "_score": null,
                "_id": "AWRKmcUDvk0jEuzRFu7O",
                "sort": [1530259946385]
            }, {
                "_index": "dtamperserverlog192.168.1.222-20180628",
                "_type": "dtamperServerLog",
                "_source": {
                    "message": "{\"service_type\": \"web\", \"is_success\": \"SUCCESS\", \"protect_host_name\": \"192.168.1.177\", \"protect_root_path\": \"/home/test28\", \"username\": \"admin\", \"changed_objects\": [\"/home/test28/test12.txt\"], \"version_txid\": \"679ffd20b4c75e4be1eba289d6378c3181e0e28a36b0ca23bdd68a8820bd1e27\", \"operate_type\": \"new\", \"timestamp\": \"2018-06-28 19:17:13\"}",
                    "type": "192.168.1.222",
                    "source": "/var/log/8lab/8lab_tamper_proof_server.log",
                    "@timestamp": "2018-06-28T11:17:37.137Z",
                    "host": "dtamper01",
                    "beat": {
                        "name": "dtamper01",
                        "version": "5.4.3",
                        "hostname": "dtamper01"
                    },
                    "tags": ["dtamperServerLog", "beats_input_codec_plain_applied"],
                    "@version": "1",
                    "input_type": "log",
                    "kafka": {
                        "topic": "dtamperServerLog",
                        "consumer_group": "dtamperServerLog",
                        "key": null,
                        "partition": 1,
                        "offset": 0
                    },
                    "offset": 663
                },
                "_score": null,
                "_id": "AWRGHP2Lvk0jEuzRQWHL",
                "sort": [1530184657137]
            }],
            "total": 16
        }
    @apiErrorExample Error-Response:
        {

        }
    """
    results = {}
    try:
        # token = request.POST.get('token')
        token = ""
        pagenum = request.POST.get('pagenum', 1)
        pagesize = request.POST.get('pagesize', 10)
        pagenum = int(pagenum)
        pagesize = int(pagesize)

        es = Elasticsearch(jc.es_server_ip_port)  # 连接ES
        index_list = []
        body = {
            "query": {
                "bool": {
                    "must": [
                        {"match_phrase": {"_type": "dtamperServerLog"}},  # 必须匹配规则
                    ],
                }
            },
            "from": (pagenum - 1) * pagesize,
            "size": pagesize,
            "sort": {"@timestamp": {"order": 'desc'}}
        }

        tamper_index = "dtamperserverlog*"
        index_list.append(tamper_index)
        result = es.search(index=index_list, body=body, ignore_unavailable=True)  # 从es中读取
        results['total'] = result['hits']['total']
        results['content'] = result['hits']['hits']
    except Exception as e:
        logger.error(e)
        results['total'] = 0
        results['content'] = []
    finally:
        return HttpResponse(json.dumps(results))


def get_client_log(request):
    """
    @api {post} api/tamper_proof/get_client_log/  ★获取客户端防篡改日志
    @apiDescription 获取客户端防篡改日志
    @apiGroup tamper_proof
    @apiParam {string} pagenum    页码
    @apiParam {string} pagesize    每页数量
    @apiSuccessExample Success-Response:
        {
            "content": [{
                "_index": "dtamperclientlog192.168.1.177-20180629",
                "_type": "dtamperClientLog",
                "_source": {
                    "message": "{\"client_address\": \"192.168.1.177\", \"service_type\": \"web\", \"spath\": \"/home/test28/export.json\", \"tamper_type\": \"del\", \"root_path\": \"/home/test28\", \"version_txid\": \"c26c67d76ec7f2951f43acf09926f6c4c6f396b55a4db3c38b5688f5622032eb\", \"dpath\": \"\", \"timestamp\": \"2018-06-29 11:41:04\"}",
                    "type": "192.168.1.177",
                    "source": "/var/log/8lab/8lab_tamper_proof_client.log",
                    "@timestamp": "2018-06-29T03:41:07.421Z",
                    "host": "dtamper03",
                    "beat": {
                        "name": "dtamper03",
                        "version": "5.1.2",
                        "hostname": "dtamper03"
                    },
                    "tags": ["dtamperClientLog", "beats_input_codec_plain_applied"],
                    "@version": "1",
                    "input_type": "log",
                    "kafka": {
                        "topic": "dtamperClientLog",
                        "consumer_group": "dtamperClientLog",
                        "key": null,
                        "partition": 2,
                        "offset": 1
                    },
                    "offset": 280
                },
                "_score": null,
                "_id": "AWRJoVotvk0jEuzRqq9Q",
                "sort": [1530243667421]
            }],
            "total": 4
        }
    @apiErrorExample Error-Response:
        {

        }
    """
    results = {}
    try:
        pagenum = request.POST.get('pagenum', 1)
        pagesize = request.POST.get('pagesize', 10)

        pagenum = int(pagenum)
        pagesize = int(pagesize)

        es = Elasticsearch(jc.es_server_ip_port)  # 连接ES
        index_list = []
        body = {
            "query": {
                "bool": {
                    "must": [
                        {"match_phrase": {"_type": "dtamperClientLog"}},  # 必须匹配规则
                    ],
                }
            },
            "from": (pagenum - 1) * pagesize,
            "size": pagesize,
            "sort": {"@timestamp": {"order": 'desc'}}
        }

        tamper_index = "dtamperclientlog*"
        index_list.append(tamper_index)
        result = es.search(index=index_list, body=body, ignore_unavailable=True)  # 从es中读取
        results['total'] = result['hits']['total']
        results['content'] = result['hits']['hits']
    except Exception as e:
        logger.error(e)
        results['total'] = 0
        results['content'] = []
    finally:
        return HttpResponse(json.dumps(results))


# def query_task_progress(request):
#     """
#     查询任务进度
#     :param request:
#     :return:
#     """
#     result = {}
#     try:
#         service_type = request.POST.get('service_type', 'web')
#         task_id = request.POST.get('task_id')
#         task_id = int(task_id)
#
#         task_id_list = []
#         task_id_list.append(task_id)
#         if task_id_list:
#             token = ""
#             request_params = {
#                 'service_type': service_type,
#                 'task_id_list': task_id_list
#             }
#
#             headers = {
#                 "Authorization": TOKEN_TYPE + token
#             }
#
#             url = jc.tamper_proof_url + "/api/v1.0/tamper_proof_restful/query_task_progress/"
#             response = requests.post(url=url, headers=headers, json=request_params)
#             response_info = json.loads(response.text)
#             result['msg'] = response_info['msg']
#             result['status'] = response_info['status']
#
#             if result['status'].lower() == 'starting':
#                 result['percentage'] = 0
#             elif result['status'].lower() == 'running':
#                 object_count = response_info['result'][0]['object_count']
#                 object_handled = response_info['result'][0]['object_handled']
#                 result['percentage'] = int(object_handled / object_count * 100)
#             elif result['status'].lower() == 'success':
#                 result['percentage'] = 100
#     except Exception as e:
#         result['msg'] = str(e)
#         result['status'] = 'FAILURE'
#         result['percentage'] = 0
#     finally:
#         return HttpResponse(json.dumps(result))


def query_task_progress(request):
    """
    @api {post} api/tamper_proof/log_in/  ★查询任务进度
    @apiDescription 查询任务进度
    @apiGroup tamper_proof
    @apiParam {string} username    用户名
    @apiParam {string} password    密码
    @apiParam {string} service_type 服务名称：web、svn
    @apiSuccessExample Success-Response:
        {

        }
    @apiErrorExample Error-Response:
        {

        }
    """
    result = {}
    try:
        service_type = request.POST.get('service_type', 'web')
        task_id = request.POST.get('task_id')
        task_id = int(task_id)

        task_id_list = []
        task_id_list.append(task_id)
        if task_id_list:
            is_success, ret, msg = Task.query_task_progress(service_type, task_id_list)
            result['msg'] = msg

            if is_success:
                result['status'] = "SUCCESS"
            else:
                result['status'] = "FAILURE"

            if result['status'].lower() == 'starting':
                result['percentage'] = 0
            elif result['status'].lower() == 'running':
                object_count = ret[0]['object_count']
                object_handled = ret[0]['object_handled']
                result['percentage'] = int(object_handled / object_count * 100)
            elif result['status'].lower() == 'success':
                result['percentage'] = 100
    except Exception as e:
        result['msg'] = str(e)
        result['status'] = 'FAILURE'
        result['percentage'] = 0
    finally:
        return HttpResponse(json.dumps(result))


if __name__ == '__main__':
    """
        获取用户操作日志
        :param request: 
        :return: 
        """
    results = {}
    pagenum = 1
    pagesize = 10

    es = Elasticsearch(jc.es_server_ip_port)  # 连接ES
    index_list = []
    body = {
        "query": {
            "bool": {
                "must": [
                        {"match_phrase": {"_type": "dtamperServerLog"}},  # 必须匹配规则
                ],
            }
        },
        "from": (pagenum - 1) * pagesize,
        "size": pagesize,
        "sort": {"@timestamp": {"order": 'desc'}}
    }

    tamper_index = "dtamperserverlog*"
    index_list.append(tamper_index)
    result = es.search(index=index_list, body=body, ignore_unavailable=True)  
    results['total'] = result['hits']['total']
    results['content'] = result['hits']['hits']

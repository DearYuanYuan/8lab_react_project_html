import json
import re
import traceback
import uuid
import time

import datetime

import os
import redis

from django.utils.crypto import salted_hmac
from redis import StrictRedis

from app_fuzhou.models import User, SVNTaskInfo, WebTaskInfo, SVNTamperUser, WebTamperUser, SVNHostInfo, \
    SVNUserHostPath, SVNHostPath, WebHostInfo, WebUserHostPath, WebHostPath, SVNVersionHistory, WebVersionHistory
from app_fuzhou.views_utils.logger import logger
from app_fuzhou.views_utils.localconfig import JsonConfiguration

jc = JsonConfiguration()
COOKIE_NAME = "tamper_proof_cookie"
red = redis.Redis(jc.redis4bigchanidb_host, jc.redis4bigchanidb_port, db=1)


def check_login(cookie):
    """
    判断用户是否登录
    :param cookie:
    :return:
    """
    _coo_split = cookie.split('|')
    if len(_coo_split) <= 2:  # 检查cookie以"|"分隔的长度是不是符合
        return False
    hash = _coo_split[2]
    user, user_id = get_user_info("tamper_proof_session:" + cookie)
    if user and hash == get_session_auth_hash(user.username, user.password):
        return True
    else:
        logger.error(
            'user hash valid failed, the user id is %s, the hash is %s' % (user_id, hash))
        return False


def add_login_session(user):
    """
    将指定用户信息存储redis中
    :param user:
    :return:
    """
    password = user.password
    session_auth_hash = get_session_auth_hash(user.username, password)

    cookie = "tamper_proof|" + str(uuid.uuid4()) + "|" + session_auth_hash
    value = json.dumps({"user_id": user.id})
    red.set("tamper_proof_session:" + cookie, value)
    red.expire("tamper_proof_session:" + cookie, 3600)
    return cookie


def get_user_info(session_key):
    """
    通过session中的用户id获得用户信息
    :param session_key:
    :return:
    """
    user_id = -1
    info = red.get(session_key)
    if info:
        res = json.loads(red.get(session_key).decode())
        user_id = res.get("user_id", "")
        user = User.objects.get(id=user_id)
        return user, user_id
    else:
        return None, user_id


def delete_login_session(request):
    """
    删除登录用户session
    :param request:
    :return:
    """
    if COOKIE_NAME not in request.COOKIES:  # 检查是不是有cookie
        return ''

    key = request.COOKIES.get(COOKIE_NAME)
    try:
        red.delete("tamper_proof_session:" + key)
        logger.debug('remove key %s successfully' % key)
    except Exception as e:
        logger.error(e)


def get_session_auth_hash(username, password):
    """
    计算session的hash值
    :return:
    """
    return salted_hmac(username, password).hexdigest()


# def add_async_task(arguments):
#     """
#     添加异步任务到TaskInfo表
#
#     :param session: 数据库session
#     :param arguments: 参数
#     :return: 任务ID
#     """
#
#     service_type = arguments["service_type"]
#     task_info_obj = SVNTaskInfo() if service_type == "svn" else WebTaskInfo()
#
#     task_info_obj.timestamp = datetime.datetime.now()
#     task_info_obj.operate_username = arguments['username']
#     task_info_obj.protect_host_name = arguments['host_name']
#     task_info_obj.protect_host_addr = arguments['host_addr']
#     task_info_obj.protect_root_path = arguments['root_path']
#     task_info_obj.operate_type = arguments['operate_type']
#
#     task_info_obj.save()
#
#     if service_type == "svn":
#         task_info_obj = SVNTaskInfo.objects.using("dtamper_svn_mysql")\
#             .filter(timestamp=task_info_obj.timestamp).first()
#     elif service_type == "web":
#         task_info_obj = SVNTaskInfo.objects.using("dtamper_web_mysql")\
#             .filter(timestamp=task_info_obj.timestamp).first()
#
#     return task_info_obj.id


# class TaskPublisher(object):
#     """
#     负责异步任务的发布
#     """
#     def __init__(self):
#         pass
#
#     @staticmethod
#     def publish(arguments):
#         """从数据库中解析参数"""
#         redis = ServerRedis()
#         dispather_channel = 'TASK_DISPATCHER_CHANNEL'
#
#         # 发布任务
#         redis.rdb.publish(dispather_channel, json.dumps(arguments))


# class ServerRedis(object):
#     def __init__(self):
#         self.rdb = None
#         self.redis_instance()
#
#     def redis_instance(self):
#         # redis实例
#         # 这里需要在定义connectionpool时候指定decode_reponse=True, 否则解析到的所有消息均会为bytes类型
#         pool = redis.ConnectionPool(host=jc.dtamper_redis_host, port=jc.dtamper_redis_port, decode_responses=True)
#         self.rdb = StrictRedis(connection_pool=pool, socket_timeout=0.5,
#                                decode_responses=True, socket_keepalive=True, retry_on_timeout=True)


def verify_control_signature(rsa_signer, version_dict):
    """
    验证从client端收到的消息的签名

    :param version_dict: 解密后的返回消息
    :return: True, 验证成功
              False, 验证失败
    """

    status = version_dict['status']
    root_path = version_dict['root_path']
    version_tx_id = version_dict['version']
    message = version_dict['message']
    signature = version_dict['signature']
    # 验证失败
    if not rsa_signer.verify_sign(signature, status + root_path + version_tx_id + message):
        logger.error('Fail to verify CLIENT control return message signature')
        return False
    else:
        logger.info('Succeed verifying CLIENT control return signature')
        return True


def receive_control_message(pubsub, rsa_signer, aes_cipher):
    start_time = time.time()
    # 接收client端的执行结果
    while True:
        receive_message = pubsub.get_message()
        if receive_message:
            result_data = aes_cipher.decrypt(receive_message['data'])

            # 如果是bytes类型, 变更为str
            if type(result_data) == bytes:
                result_data = result_data.decode()
            result_dict = json.loads(result_data)

            # 验证签名
            if not verify_control_signature(rsa_signer, result_dict):
                return False, 'Fail to verify CLIENT signature'

            # 版本变更成功
            if result_dict['status'] == 'success':
                version_tx_id = result_dict['version']
                logger.info("Server receive success, with version_tx_id: " + version_tx_id)
                return True, 'success'
            else:
                logger.info("Server receive failure, with error message: " + result_dict['message'])
                return False, result_dict['message']

        now_time = time.time()

        # 如果超时, 则退出
        if now_time - start_time > 3600:
            error_msg = "Failure. The server has not received message from client for 3600 seconds."
            logger.error(error_msg)
            return False, error_msg

        time.sleep(0.001)


def get_key_pairs():
    pub_key_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'key_pairs/server_pub')
    pri_key_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'key_pairs/server_pri')

    with open(pub_key_path, 'r') as pub_reader:
        pub_key = pub_reader.read()
    with open(pri_key_path, 'r') as pri_reader:
        pri_key = pri_reader.read()
    return pub_key, pri_key


def check_user_valid(service_type, username):
    """
    查询用户是否存在
    :param service_type:
    :param username:
    :return:
    """
    user_obj = None
    if service_type == "svn":
        user_obj = SVNTamperUser.objects.using("dtamper_svn_mysql").filter(username=username).first()
    elif service_type == "web":
        user_obj = WebTamperUser.objects.using("dtamper_web_mysql").filter(username=username).first()

    if not user_obj:
        return False, user_obj
    else:
        return True, user_obj


def get_user_host_path(service_type, is_super, user_obj):
    """
    获取用户主机详情
    :param service_type:
    :param is_super:
    :param user_obj:
    :return:
    """
    results = []
    if service_type == "svn":
        # 如果是超管, 则查询所有主机列表
        if is_super == 1 or user_obj.is_super == 1:
            user_host_list = SVNHostInfo.objects.using("dtamper_svn_mysql") \
                .values("protect_host_name").distinct().all()
        else:
            user_host_list = SVNUserHostPath.objects.using("dtamper_svn_mysql") \
                .values("protect_host_name").filter(username=user_obj.username).distinct().all()

        for host in user_host_list:
            host_detail = {}
            if user_obj.is_super == 1:
                host_path_objs = SVNHostPath.objects.using("dtamper_svn_mysql") \
                    .filter(protect_host_name=host["protect_host_name"]).all()
            else:
                host_path_objs = SVNUserHostPath.objects.using("dtamper_svn_mysql") \
                    .filter(username=user_obj.username, protect_host_name=host["protect_host_name"]).all()

            host_path_list = []
            for obj in host_path_objs:
                obj_dict = obj.toDict()
                obj_dict["protect_host_addr"] = str(obj.protect_host_addr)
                obj_dict["timestamp"] = obj.timestamp.strftime("%Y-%m-%d %H:%M:%S")

                host_path_list.append(obj_dict)

            host_detail[host["protect_host_name"]] = host_path_list
            results.append(host_detail)
    else:
        # 如果是超管, 则查询所有主机列表
        if is_super == 1 or user_obj.is_super == 1:
            user_host_list = WebHostInfo.objects.using("dtamper_web_mysql") \
                .values("protect_host_name").distinct().all()
        else:
            user_host_list = WebUserHostPath.objects.using("dtamper_web_mysql") \
                .values("protect_host_name").filter(username=user_obj.username).distinct().all()

        for host in user_host_list:
            host_detail = {}
            if user_obj.is_super == 1:
                host_path_objs = WebHostPath.objects.using("dtamper_web_mysql") \
                    .filter(protect_host_name=host["protect_host_name"]).all()
            else:
                host_path_objs = WebUserHostPath.objects.using("dtamper_web_mysql") \
                    .filter(username=user_obj.username, protect_host_name=host["protect_host_name"]).all()

            host_path_list = []
            for obj in host_path_objs:
                obj_dict = obj.toDict()
                obj_dict["protect_host_addr"] = str(obj.protect_host_addr)
                obj_dict["timestamp"] = obj.timestamp.strftime("%Y-%m-%d %H:%M:%S")

                host_path_list.append(obj_dict)

            host_detail[host["protect_host_name"]] = host_path_list
            results.append(host_detail)
    return results


def check_path_format(path):
    """
    检查路径是否合法
    :param path:
    :return:
    """
    path_reg = re.compile(r'^([a-zA-Z]:)?(/)([^/\0]+(/)?)*[^/\0\s]+$')
    if path_reg.match(path):
        return True
    else:
        return False


def check_host_name_valid(service_type, host_name):
    """
    查询主机是否存在
    :param service_type:
    :param host_name:
    :return:
    """
    host_obj = None
    if service_type == "svn":
        host_obj = SVNHostInfo.objects.using("dtamper_svn_mysql").filter(protect_host_name=host_name).first()
    elif service_type == "web":
        host_obj = WebHostInfo.objects.using("dtamper_web_mysql").filter(protect_host_name=host_name).first()

    if not host_obj:
        return False, host_obj
    else:
        return True, host_obj


def check_host_path_valid(service_type, host_name, host_addr, path):
    """
    检查路径是否存在
    :param service_type:
    :param host_name:
    :param host_addr:
    :param path:
    :return:
    """
    host_path_obj = None
    if service_type == "svn":
        host_path_obj = SVNHostPath.objects.using("dtamper_svn_mysql") \
            .filter(protect_host_name=host_name, protect_host_addr=host_addr, protect_root_path=path).first()
    elif service_type == "web":
        host_path_obj = WebHostPath.objects.using("dtamper_web_mysql") \
            .filter(protect_host_name=host_name, protect_host_addr=host_addr, protect_root_path=path).first()

    if not host_path_obj:
        return False, host_path_obj
    else:
        return True, host_path_obj


def query_version_history(service_type, host_name, root_path):
    """
    获取指定主机上的根目录的历史版本信息
    :param host_name: 主机名
    :param root_path: 根目录
    :return:
    """
    version_history_list = []
    version_history_objs = None
    try:
        if service_type == "svn":
            version_history_objs = SVNVersionHistory.objects.using("dtamper_svn_mysql") \
                .filter(protect_host_name=host_name, protect_root_path=root_path).order_by("-timestamp").all()
        elif service_type == "web":
            version_history_objs = WebVersionHistory.objects.using("dtamper_web_mysql") \
                .filter(protect_host_name=host_name, protect_root_path=root_path).order_by("-timestamp").all()

        # 遍历并生成所有版本历史信息
        for obj in version_history_objs:
            obj_dict = obj.toDict()

            # 删除根目录结构字段
            if 'version_tree' in version_history_objs:
                del obj_dict['version_tree']

            obj_dict['protect_host_addr'] = str(obj.protect_host_addr)
            obj_dict['timestamp'] = obj.timestamp.strftime("%Y-%m-%d %H:%M:%S")
            obj_dict['changed_objects'] = obj.changed_objects.split(",")

            # 仅用于svn业务
            # 将svn的提交信息转换为list
            if 'commits_info' in obj_dict and obj.commits_info:
                try:
                    obj_dict['commits_info'] = json.loads(obj.commits_info)
                except Exception as error:
                    obj_dict['commits_info'] = []
                    logger.error(error)
            else:
                obj_dict['commits_info'] = []

            version_history_list.append(obj_dict)
    except Exception as error:
        error_message = traceback.format_exc()
        logger.error(error_message)
        return False, [], str(error)

    success_message = 'Success. Finish fetching version histories of hostname: %s, root path: %s' % (
        host_name, root_path)
    logger.info(success_message)
    return True, version_history_list, success_message


def query_user_host_detail(service_type, username, is_super):
    """
    获取指定用户的所有机器信息
    :param username: 用户名
    :param is_super: 是否超管
    :return:
    """
    host_info_list = []
    is_success, host_list, msg = query_user_host_list(service_type, username, is_super)
    if not is_success:
        return False, [], msg

    for host_name in host_list:
        is_success, host_info, msg = query_host_detail(service_type, host_name)
        if is_success:
            host_info_list.append(host_info)
        else:
            return False, [], msg
    success_message = 'Success. Finish fetching all host detail of user: %s' % username
    return True, host_info_list, success_message


def query_user_host_list(service_type, username, is_super):
    """
    查询指定用户名下的所有主机
    :param username: 用户名
    :param is_super: 是否为超级管理员
    :return:
    """
    host_list = []
    user_host_list = None
    try:
        is_success, user_obj = check_user_valid(service_type, username)

        # 如果是超管, 则返回所有主机列表
        if is_super == 1 or user_obj.is_super == 1:
            if service_type == "svn":
                user_host_list = SVNHostInfo.objects.using("dtamper_svn_mysql").values("protect_host_name").distinct().all()
            elif service_type == "web":
                user_host_list = WebHostInfo.objects.using("dtamper_web_mysql").values("protect_host_name").distinct().all()
        else:
            if service_type == "svn":
                user_host_list = SVNUserHostPath.objects.using("dtamper_svn_mysql").values("protect_host_name")\
                    .filter(username=username).distinct().all()
            elif service_type == "web":
                user_host_list = WebUserHostPath.objects.using("dtamper_web_mysql").values("protect_host_name")\
                    .filter(username=username).distinct().all()

        for host in user_host_list:
            host_list.append(host["protect_host_name"])
    except Exception as error:
        error_message = traceback.format_exc()
        logger.error(error_message)
        return False, [], str(error)

    success_message = 'Success. Finish fetching all hosts of user: %s.' % username
    logger.info(success_message)
    return True, host_list, success_message


def query_host_detail(service_type, host_name):
    """
    获取指定主机的详细信息
    :param host_name: 主机名称
    :return:
    """
    try:
        is_success, host_obj = check_host_name_valid(service_type, host_name)

        if is_success:
            host_info_dict = host_obj.toDict()
            host_info_dict['protect_host_addr'] = str(host_obj.protect_host_addr)
        else:
            failure_message = 'failure. host does not exist'
            return False, {}, failure_message

    except Exception as error:
        error_message = traceback.format_exc()
        logger.error(error_message)
        return False, {}, str(error)

    success_message = 'Success. Finish fetching detail of host: %s' % host_name
    return True, host_info_dict, success_message


def query_user_root_path(service_type, username, host_name):
    """
    查询指定用户和机器下面的根目录列表
    :param username: 用户名
    :param host_name: 主机名
    """
    host_path_list = []
    host_path_objs = None
    try:
        is_success, user_obj = check_user_valid(service_type, username)
        if is_success:
            # 超级管理员, 获取指定主机上的所有根目录
            if user_obj.is_super == 1:
                if service_type == "svn":
                    host_path_objs = SVNHostPath.objects.using("dtamper_svn_mysql")\
                        .filter(protect_host_name=host_name).all()
                elif service_type == "web":
                    host_path_objs = WebHostPath.objects.using("dtamper_web_mysql")\
                        .filter(protect_host_name=host_name).all()
            # 普通用户, 获取该指定用户在指定主机上的所有根目录
            else:
                if service_type == "svn":
                    host_path_objs = SVNUserHostPath.objects.using("dtamper_svn_mysql")\
                        .filter(username=username, protect_host_name=host_name).all()
                elif service_type == "web":
                    host_path_objs = WebUserHostPath.objects.using("dtamper_web_mysql")\
                        .filter(username=username, protect_host_name=host_name).all()

        # 遍历根目录, 生成各根目录的信息
        for obj in host_path_objs:
            obj_dict = obj.toDict()

            obj_dict['protect_host_addr'] = str(obj.protect_host_addr)
            obj_dict['timestamp'] = obj.timestamp.strftime("%Y-%m-%d %H:%M:%S")

            host_path_list.append(obj_dict)

    except Exception as error:
        error_message = traceback.format_exc()
        logger.error(error_message)
        return False, [], str(error)

    success_message = 'Success. Finish fetching all root paths of user: %s' % username
    logger.info(success_message)
    return True, host_path_list, success_message


def query_current_version_tree(service_type, host_name, root_path):
    """
    获取当前版本信息中的目录树形结构

    :param host_name: 主机名
    :param root_path: 根目录
    :return:
    """
    current_version_dict = None
    try:
        is_success, current_version_obj, msg = query_current_version_obj(service_type, host_name, root_path)
        if is_success:
            current_version_json = current_version_obj.version_tree
            current_version_dict = json.loads(current_version_json)
        else:
            False, {}, str(msg)
    # json转换dict错误
    except ValueError as json_error:
        error_message = traceback.format_exc()
        logger.error(error_message)
        return False, {}, str(json_error)
    except Exception as error:
        error_message = traceback.format_exc()
        logger.error(error_message)
        return False, {}, str(error)

    success_message = 'Success. Finish fetching Current version tree of host name %s, root_path %s: ' % (
        host_name, root_path)
    logger.info(success_message)
    return True, current_version_dict, success_message


def query_current_version_obj(service_type, host_name, root_path):
    """
    获取当前版本信息
    :param service_type:
    :param host_name: 主机名
    :param root_path: 根目录
    :return:
    """
    current_version_obj = None
    if service_type == "svn":
        current_version_obj = SVNVersionHistory.objects.using("dtamper_svn_mysql") \
            .filter(protect_host_name=host_name, protect_root_path=root_path).order_by("-timestamp").first()
    elif service_type == "web":
        current_version_obj = WebVersionHistory.objects.using("dtamper_web_mysql") \
            .filter(protect_host_name=host_name, protect_root_path=root_path).order_by("-timestamp").first()
    if current_version_obj:
        return True, current_version_obj, "Success. Finish fetching current version tree of host."
    else:
        error_msg = 'The root_path: %s of host_name: %s does not exist.' % (root_path, host_name)
        logger.error(error_msg)
        return False, current_version_obj, error_msg


def check_version_valid(service_type, host_name, root_path, org_version_tx_id):
    """
    检查指定版本信息是否存在
    :param host_name: 主机名称
    :param root_path: 根目录路径
    :param org_version_tx_id: 历史版本号
    :return:
    """
    version_history_obj = None
    if service_type == "svn":
        version_history_obj = SVNVersionHistory.objects.using("dtamper_svn_mysql") \
            .filter(version_txid=org_version_tx_id, protect_host_name=host_name, protect_root_path=root_path).first()
    elif service_type == "web":
        version_history_obj = WebVersionHistory.objects.using("dtamper_web_mysql") \
            .filter(version_txid=org_version_tx_id, protect_host_name=host_name, protect_root_path=root_path).first()

    # 如果历史版本信息不存在, 则直接返回错误信息
    if not version_history_obj:
        error_message = 'The version: %s of host: %s, root path: %s does not exist.' % (org_version_tx_id, host_name, root_path)
        logger.error(error_message)
        return False, version_history_obj
    else:
        return True, version_history_obj


def check_operate_struct(root_path, operations):
    """
    检查版本变更数据结构是否合法

    :param root_path: 根目录
    :param operations: 版本变更数据结构
    :return: 合法: True, 'success'
              不合法: False, 错误信息
    """
    if 'operation' not in operations:
        error_message = '''KeyError: No "operation"'''
        return False, None, error_message
    if 'object_list' not in operations:
        error_message = '''KeyError: No "object_list"'''
        return False, None, error_message

    operation_type = operations['operation']
    object_list = operations['object_list']

    if operation_type == 'new':
        return check_new_struct(root_path, object_list)
    elif operation_type == 'del':
        return check_del_struct(root_path, object_list)
    elif operation_type == 'mov':
        return check_mov_struct(root_path, object_list)
    else:
        error_message = 'Invalid Operation type: %s.' % operation_type
        return False, None, error_message


def check_new_struct(root_path, new_objects):
    """
    检验新增对象操作(上传文件和新增目录)的数据结构的合法性

    :param root_path: 根目录
    :param new_objects: 新的文件和目录信息
    :return:  成功, True, 新的根目录, 'success'
              失败, False, None, error_message
    """
    path_list = []  # 文件路径列表

    for obj in new_objects:
        # 校验key是否合法
        if not all(k in obj.keys() for k in ("path", "type")):
            error_message = '''KeyError: No "path" or "type"'''
            return False, None, error_message

        # 校验对象类型是否合法
        is_valid, msg = check_obj_type(obj)
        if not is_valid:
            return False, None, msg

        # 如果是文件对象, 判断是否包含content的key
        if obj['type'] == 'blob' and 'content' not in obj:
            error_message = '''KeyError: No "content"'''
            return False, None, error_message

        # 新的根目录
        if obj['type'] == 'root':
            root_path = obj['path']

        path_list.append(obj['path'])

    # 检验路径的格式是否合法
    is_valid, msg = check_obj_path_format(root_path, path_list)
    if not is_valid:
        return False, None, msg

    return True, root_path, 'success'


def check_del_struct(root_path, del_objects):
    """
    检查删除操作的数据结构的合法性

    :param root_path: 根目录
    :param del_objects: 删除的文件和目录列表
    :return: 成功, True, 'success'
              失败, False, error_message
    """
    path_list = []  # 路径列表

    for obj in del_objects:
        # 校验key是否合法
        if not all(k in obj.keys() for k in ("path", "type")):
            error_message = '''KeyError: No "path" or "type"'''
            return False, None, error_message

        # 校验对象类型是否合法
        is_valid, msg = check_obj_type(obj)
        if not is_valid:
            return False, None, msg

        path_list.append(obj['path'])

    # 检验路径的格式是否合法
    is_valid, msg = check_obj_path_format(root_path, path_list)
    if not is_valid:
        return False, None, msg

    return True, root_path, 'success'


def check_mov_struct(root_path, mov_objects):
    """
    检查移动对象操作的数据结构的合法性

    :param root_path: 根目录
    :param mov_objects: 移动的文件和目录列表
    :return:  成功, True, 新的根目录, 'success'
              失败, False, None, error_message
    """
    spath_list = []         # 源路径列表
    dpath_list = []         # 目的路径列表
    # 新的根目录
    new_root_path = None
    path_reg = path_format_regex()

    root_path = root_path.replace("\\", "/")  # 统一将路径分隔符换成 /

    for obj in mov_objects:
        # 校验key是否合法
        if not all(k in obj.keys() for k in ("spath", "dpath", "type")):
            error_message = '''KeyError: No "spath" or "dpath" or "type"'''
            return False, None, error_message

        # 校验对象类型是否合法
        is_valid, msg = check_obj_type(obj)
        if not is_valid:
            return False, None, msg

        spath = obj['spath'].replace("\\", "/")
        dpath = obj['dpath'].replace("\\", "/")

        # 判断目的路径是否在源路径内, 如果在则认为非法
        first, second, third = dpath.partition(spath)
        if first == '' and second == spath and path_reg.match(third):
            error_message = 'Illegal. The dest path: %s is in source path: %s.' % (dpath, spath)
            return False, None, error_message

        # 新的根目录
        if obj['type'] == 'root':
            new_root_path = dpath

        spath_list.append(spath)
        dpath_list.append(dpath)

    if not new_root_path:
        new_root_path = root_path

    # 检验源路径的格式是否合法
    is_valid, msg = check_obj_path_format(root_path, spath_list)
    if not is_valid:
        return False, None, msg

    # 检验目的路径的格式是否合法
    is_valid, msg = check_obj_path_format(new_root_path, dpath_list)
    if not is_valid:
        return False, None, msg

    return True, new_root_path, 'success'


def check_obj_type(obj):
    """
    判断对象类型是否合法

    :param obj:
    :return:
    """
    if obj['type'] not in ("blob", "tree", "root"):
        error_message = 'TypeError: Illegal object type: ' + obj['type'] + ' with path: ' + obj['path']
        return False, error_message
    else:
        return True, 'Legal.'


def check_obj_path_format(root_path, path_list):
    """
    检验路径的格式是否合法

    首先, 检验路径是否为空;
    然后, 检验路径前缀是否为根目录;
    最后, 检验路径格式.

    :param root_path: 根目录
    :param path_list: 路径列表
    :return: 合法:   True, 'Legal.'
              不合法: False, error_message
    """

    path_reg = path_format_regex()
    # root_path = path_format(root_path)

    # 判断根目录格式是否合法
    if not path_reg.match(root_path):
        error_message = 'Illegal root path: %s' % root_path
        return False, error_message

    for obj_path in path_list:
        # 如果路径为空, 直接返回
        if not obj_path:
            error_message = 'Illegal object path: %s' % obj_path
            return False, error_message

        # obj_path = path_format(obj_path)

        if obj_path == root_path:
            continue

        # 判断对象路径是否以根目录作为前缀, 并判断其相对路径格式是否合法
        first, second, third = obj_path.partition(root_path)
        if first != '' or second != root_path or not path_reg.match(third):
            error_message = 'Illegal object path: %s' % obj_path
            return False, error_message

    return True, 'Legal.'


def path_format_regex():
    """
    生成正则表达式

    1. 以 / 起始
    2. 中间不能出现连续多个 /
    3. 结尾不以 / 结束
    4. 结尾不包含空格
    """
    return re.compile(r'^([a-zA-Z]:)?(/)([^/\0]+(/)?)*[^/\0\s]+$')


def check_user_host_path(service_type, username, host_name, root_path):
    """
    检查指定用户在指定主机上是否有某个根目录

    :param service_type:
    :param username: 用户名
    :param host_name: 主机名称
    :param root_path: 根目录名称
    :return:
    """
    user_host_path_obj = None
    if service_type == "svn":
        user_host_path_obj = SVNUserHostPath.objects.using("dtamper_svn_mysql") \
            .filter(username=username, protect_host_name=host_name, protect_root_path=root_path).first()
    elif service_type == "web":
        user_host_path_obj = WebUserHostPath.objects.using("dtamper_web_mysql") \
            .filter(username=username, protect_host_name=host_name, protect_root_path=root_path).first()

    if not user_host_path_obj:
        return False
    else:
        return True


def generate_folder_tree(nodes, pId):
    """
    递归生成子文件夹结构

    :param nodes: 子节点列表
    :param pId: 父节点ID
    :return:
    """

    i = 1
    node_list = []

    for key, val in nodes.items():
        obj_type = val['type']
        if obj_type == 'blob':
            continue

        obj_name = key
        obj_path = val['path']
        sub_nodes = val['nodes']
        current_id = pId * 10 + i

        current_obj_dict = {
            'id': current_id,
            'pId': pId,
            'name': obj_name,
            'path': obj_path
        }

        node_list.append(current_obj_dict)
        node_list += generate_folder_tree(sub_nodes, current_id)

        i += 1

    return node_list

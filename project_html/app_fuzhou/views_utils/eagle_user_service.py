"""
Eagle模块用户管理
"""
import os
import json
import datetime

from app_fuzhou.views_utils.localconfig import JsonConfiguration
from app_fuzhou.views_utils.logger import logger
from app_fuzhou.models import UserInfo
from app_fuzhou.views_utils.rpc.user_portrait.nisa_rpc_client import NisaRpcClient
from app_fuzhou.util import fileupload

from django.db import connection, transaction
from django.db.models import Q
from elasticsearch import Elasticsearch, TransportError
from django.http import HttpResponse

_CONFIG = JsonConfiguration()
_HOST = _CONFIG.redis4bigchanidb_host
_PORT = _CONFIG.redis4bigchanidb_port
_REDIS_KEY_NAME = "octastack_fuzhou:users"
_KEY = None
_MAX_FILE_SIZE = 256 * 1024
_USER_PHOTO_DIR = "chain_user_photo"
_LEGAL_PHOTO_TYPE = ["png", "jpg"]
NISALOG_INDEX = 'nisalog*'


class User(object):
    def __init__(self, user_id, username, feature, department, position, email, phone, photo, status, id=""):
        self.id = id
        self.user_id = user_id
        self.username = username
        self.feature = feature
        self.department = department
        self.position = position
        self.email = email
        self.phone = phone
        self.photo = photo
        self.status = status

    @staticmethod
    def po2vo(user):
        """
        将ORM层的PO转换成VO
        :param user: PO User
        :return: VO User
        """
        id = user.id
        user_id = user.user_id
        username = user.username
        feature = user.feature
        department = user.department
        position = user.position
        email = user.email
        phone = user.phone
        photo = user.photo
        status = user.status
        return User(user_id, username, feature, department, position, email, phone, photo, status, id)

    def writable_fields(self):
        fields = vars(self)
        writable = ["username", "department", "position", "email", "phone"]
        return {e: fields[e] for i, e in enumerate(writable) if e in writable}


class Status(object):
    def __init__(self, status, message=''):
        self.status = status
        self.message = message

    def merge(self, status):
        if isinstance(status, Status):
            self.status = self.status and status.status
            self.message = self.message + status.message
        return self


def query_user_by_user_id(user_id):
    result = UserInfo.objects.get(user_id=user_id)
    return User.po2vo(result)


def query_user_section(start, end, field, condition):
    """
    按区间进行用户查询
    :param start: 起始位置
    :param end: 结束位置
    :param field: {column}-0/1 排序字段和方式
    :param condition: 查询条件
    :return: 记录总数和分段结果
    """

    logger.info("start: %s, end: %s" % (start, end))

    _update_user_list()  # 更新数据库中的用户列表
    if not 0 <= start < end:
        return

    try:
        result = UserInfo.objects.all()
        count = len(result)

        # 有查询条件，进行模糊查询
        if condition:
            result = result.filter(
                # 按用户名、部门、特征进行模糊查询
                Q(username__contains=condition) | Q(department__contains=condition) | Q(feature__contains=condition)
            )
            count = len(result)

        # 有排序条件，按字段和排序方式进行排序
        if field:
            args = field.split("-")
            column = args[0]  # 排序的列
            sort = int(args[1])  # 排序方式，0表示升序，1表示降序

            if not sort:
                result = result.order_by(column)
            else:
                result = result.order_by('-' + column)
        _data = []
        for i, e in enumerate(list(result[start:end])):
            _ii = vars(User.po2vo(e))
            _ii['max_feature'] = _calc_feature(_ii['user_id'])
            _data.append(_ii)
        # 将PO转换成VO再返回
        return {"total": count, "data": _data}
    except Exception as e:
        logger.error(e)
    return list()


def _calc_feature(user_id):
    m = json.loads(get_model(user_id))
    if m['data'] is None:
        return 'unknown'
    utype = m['data']['data']['utype']
    if utype is None or len(utype) == 0:
        return 'unknown'
    _u2 = sorted(utype.items(), key=lambda d: d[1], reverse=True)
    return _u2[0]


def query_user_partition(start, length, field, condition):
    """
    按分段进行查询
    :param start: 起始位置
    :param length: 长度
    :param field: 排序字段
    :param condition: 查询条件
    :return: 结果
    """

    return query_user_section(start, start + length, field, condition)


def query_user_page(page_num, page_length, field, condition):
    """
    按分页进行查询
    :param page_num: 页码，从1开始
    :param page_length: 页大小
    :param field: 排序字段
    :param condition: 查询条件
    :return: 结果
    """

    return query_user_partition((page_num - 1) * page_length, page_length, field, condition)


@transaction.atomic
def update_user(user):
    logger.debug(vars(user))
    if isinstance(user, User) and user.id:
        try:
            UserInfo.objects.filter(id=user.id).update(**user.writable_fields())
            return Status(True)
        except Exception as e:
            logger.error(e)
    return Status(False)


@transaction.atomic
def add_user(user):
    if isinstance(user, User):
        try:
            UserInfo(vars(user)).save()
            logger.debug(connection.queries)
            return Status(True)
        except Exception as e:
            logger.error(e)
    return Status(False)


@transaction.atomic
def delete_user(id):
    try:
        if id:
            UserInfo.objects.filter(id=id).delete()
            logger.debug(connection.queries)
            return Status(True)
    except Exception as e:
        logger.error(e)
    return Status(False)


def get_user_list():
    """
    获取用户列表
    :return: 用户列表
    """
    try:
        with NisaRpcClient() as rpc_client:
            result = rpc_client.getuserlist()
            return result
    except Exception as e:
        logger.error(e)
    return dict()


def manual_train(arg, ttype="normal"):
    """
    手动训练
    :param arg: 训练数据
    :param ttype: normal表示普通训练，later表示者增量训练,status,表示查询当前任务状态
    :return: 调用结果
    """
    try:
        logger.debug(arg)
        with NisaRpcClient() as rpc_client:
            result = rpc_client.train(arg, ttype)
            return result
    except Exception as e:
        logger.error(e)
    return dict()


def upload_photo(files, user_id):
    """
    上传用户头像
    :param files: Form表单提交的文件
    :param user_id: 用户ID
    :return: 保存后的文件名
    """
    photo_file = files.get("photo")
    if not photo_file:
        return Status(True, "No file to save.")

    # 限制文件类型
    file_type = photo_file.name.split(".")[-1]
    if file_type not in _LEGAL_PHOTO_TYPE:
        return Status(False, "Unsupported file type.")

    # 限制文件大小
    if photo_file.size > _MAX_FILE_SIZE:
        return Status(False, "Too large file size.")

    filename = fileupload.handle_upload(photo_file, _USER_PHOTO_DIR)
    if not filename:
        return Status(False, '文件保存失败')
    photo_path = os.path.join(_USER_PHOTO_DIR, filename)
    _update_user_photo(photo_path, user_id)

    return Status(True, filename)


@transaction.atomic
def _update_user_photo(file_path, user_id):
    """
    更新用户头像字段到数据库中
    :param file_path: 头像文件路径
    :param user_id: 用户ID
    :return:
    """
    try:
        user = UserInfo.objects.get(user_id=user_id)
        user.photo = file_path
        user.save()
    except Exception as e:
        logger.error(e)


def get_model(user_id):
    """
    获取用户画像的模型
    :param user_id:　用户ID
    :return: 模型
    """
    try:
        if user_id:
            with NisaRpcClient() as rpc_client:
                result = rpc_client.getmodel(user_id)
                logger.debug(result)
                return result
    except Exception as e:
        logger.error(e)
    return dict()


def get_nisalog_from_es(flag, page, size):
    """
    从ES中读取nisalog日志
    :param flag:
    :param page:
    :param size:
    :return:
    """
    try:
        return_list, sum_count = get_nisa_log(flag, page, size)  # 获取waf日志
        sum_count = 10000 if sum_count >= 10000 else sum_count  # 条数最大10000条
        total_page = int(sum_count / size) \
            if (int(sum_count / size) == sum_count / size) \
            else int(sum_count / size) + 1  # 总页数
        return_list.append({'totalpages': total_page})
        return HttpResponse(json.dumps(return_list))
    except Exception as e:
        logger.error(e)
    return dict()


def get_nisa_log(username, page, pagesize):
    """
    从ES获取flag类型的wafLog日志,从中提取出攻击时间/源IP/目的IP/攻击工具以及攻击记录总数,并返回
    :param username: 用户标示
    :param page: 页数,>=1
    :param pagesize: 每页数据大小
    :return:
    """
    try:
        results, log_sum = get_nisa_log_from_es(username, page, pagesize)  # 从es中读取wafLog
        logs = handle_get_nisa_log(results, username)  # 处理wafLog,攻击信息
        return logs, log_sum
    except Exception as e:
        logger.error(e)
        return [], 0


def get_nisa_log_from_es(username, page=1, pagesize=50, time_filter=None, sort="desc"):
    """
    从ES获取WafLog
    :param username:
    :param page: 第几页
    :param pagesize: 每页多少条
    :param time_filter: 时间过滤器
    :param sort: 排序
    :return:
    """
    es = Elasticsearch(_CONFIG.es_server_ip_port)
    body = {
        "query": {
            "bool": {
                "must": [
                    {"match_phrase": {"_type": "eagle"}},  # 必须匹配规则
                ],
                "should": [],
                "minimum_should_match": 1,  # 后面加的message匹配规需要至少匹配一个
                # "filter": {"range": {"@timestamp": {"gte": "now-3d", "lte": "now"}}}  # 时间过滤器
            }
        },
        "from": (page-1)*pagesize,
        "size": pagesize,
    }
    if sort == "desc" or sort == "asc":
        body["sort"] = {"@timestamp": sort}
    if time_filter:
        body["query"]["bool"]['filter'] = time_filter
    body["query"]["bool"]["should"].append({"match_phrase": {"user": username}})
    """
    for host in hosts:  # 生成索引列表
        index_list.append(index+host['ip'])
    """
    try:
        result = es.search(index=NISALOG_INDEX, body=body, ignore_unavailable=True)  # 从es中读取
    except Exception as e:
        logger.error(e)
        return [], 0
    # 至此从es上获得了数据
    return result['hits']['hits'], result['hits']['total']


def handle_get_nisa_log(results, flag):
    """
    处理wafLog,记录waf攻击的攻击源,攻击目标,攻击时间,攻击工具,攻击类型信息
    :param results:
    :param flag:
    :return:
    """
    logs = []
    time_delta = datetime.timedelta(hours=8)
    for hit in results:
        try:
            log = {"safe_factor": '安全',  # 攻击目标ip
                   "opt_time": (datetime.datetime.strptime(
                       hit["_source"]["@timestamp"], "%Y-%m-%dT%H:%M:%S.%fZ")+time_delta).strftime('%Y-%m-%d %H:%M:%S'),
                   "opt_cmd": hit['_source'].get('cmd', ''),
                   "opt_ip": hit['_source'].get('ip', '')}
            logs.append(log)
        except Exception as e:
            logger.error(str(e))
    logs.sort(key=lambda x: x["opt_time"], reverse=True)  # 之前已经经过反序,这一步仍检测一次是否有乱序
    return logs


def control_centre(args):
    try:
        if args:
            with NisaRpcClient() as client:
                return client.controlCentre(args)
    except Exception as e:
        logger.error(e)


def put_knowledge(knowledge):
    """
    用户知识标记
    :param knowledge: 需要标记的知识
    :return:
    """
    try:
        if knowledge:
            with NisaRpcClient() as client:
                return client.putknowledge(knowledge)
    except Exception as e:
        logger.error(e)


@transaction.atomic
def _update_user_list():
    """
    讲用户列表的用户ID保存到数据库中
    """

    import json
    import random

    user_list = json.loads(get_user_list()).get("data")
    if not user_list:
        return

    insert_list = list()
    for e in user_list:
        if not UserInfo.objects.filter(user_id=e).exists():
            insert_list.append(UserInfo(user_id=e, username="8lab_user_%d" % random.randint(1000, 10000)))
    try:
        UserInfo.objects.bulk_create(insert_list)   # 批量插入
    except Exception as e:
        logger.error(e)

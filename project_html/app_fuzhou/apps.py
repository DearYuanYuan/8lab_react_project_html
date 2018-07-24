"""
APP的常量配置,目前主要时配置了接口返回的状态码以及状态码对应的中文含义,
但是目前一般的是:
前段操作类的接口请求,返回{'code': '200', 'message': '操作成功'},或者
{'code': '201', 'message': '错误原因'}
"""
from __future__ import unicode_literals
from django.apps import AppConfig


class AppConfig(AppConfig):
    """ App Name """
    name = 'app_fuzhou'


BIZ_CODE = {
    'SUCCESS': {'code': '200', 'message': '操作成功'},
    'ERROR': {'code': '201', 'message': '操作失败'},


    'UN_LOGIN': {'code': '101', 'message': '未登录'},
    'PARAM_INVALID': {'code': '102', 'message': '参数错误'},
    'OPERATE_DATABASE_ERROR': {'code': '103', 'message': '操作数据库失败'},
    'IMG_UPLOAD_ERROR': {'code': '104', 'message': '图片上传失败'},
    'OPERATING_FAILED': {'code': '105', 'message': '操作失败'},
    'WRONG_CONNECT': {'code': '106', 'message': '访问方式出错'},

    'USER_LOGIN_FAIL': {'code': '201', 'message': '用户名或密码错误'},
    'USER_REMAIN': {'code': '202', 'message': '用户已存在'},
    'USER_LOGON': {'code': '203', 'message': '用户已登录'},
    'USER_INACTIVE': {'code': '204', 'message': '用户已被本系统禁用'},
    'WRONG_PASS': {'code': '205', 'message': '当前旧密码错误'},
    'USER_NOT_EXIST': {'code': '206', 'message': '不能修改其他用户密码'},
    'USER_NOT_LOGIN': {'code': '207', 'message': '用户未登录'},
    'LOGIN_CLOSED': {'code': '208', 'message': '注册通道已关闭,请联系管理员'},

    'NOT_SUPPORT_DABABASE_TYPE': {'code': '301', 'message': '远程数据库不存在或不支持该数据库'},
    'WRONG_CONNECTION': {'code': '302', 'message': '连接错误,请检查用户名等信息是否输错'},
    'DATABASE_EXIST': {'code': '303', 'message': '数据库已存在'},
    'NET_UNREACHABLE': {'code': '304', 'message': '远程数据库无法访问'},
    'HOST_BINDED': {'code': '305', 'message': '本地主机被远程数据库禁止访问，请检查远程数据库服务器设置'},
    'TRANSFER_DB_FAILED': {'code': '306', 'message': '数据库迁移失败'},

    'OPTION_ALREADY_HANDLED': {'code': '202', 'message': '已经操作成功'},

    'UNSUPPORTABLE_FILE_TYPE': {'code':  '311', 'message': "不支持的文件格式"},
    'TOO_BIG_SIZE': {'code': '312', 'message': '文件过大'}
}


# global return code
class Response:
    """
    @:param
        code for response status
        message for response message
        result for handling result from views/v1/[function].py
    """
    code = ''
    message = ''
    result = {}

    def __init__(self):
        self.code = BIZ_CODE['SUCCESS']['code']
        self.message = BIZ_CODE['SUCCESS']['message']
        self.result = {}

    def setcode(self, state):
        """
        :param state:
        :return:
        """
        self.code = BIZ_CODE[state]['code']
        self.message = BIZ_CODE[state]['message']

    def adddata(self, key, value):
        """
        :param key:
        :param value:
        :return:
        """
        self.result[key] = value

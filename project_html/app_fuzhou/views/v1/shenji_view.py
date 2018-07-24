#!/usr/bin/env python
# coding: utf-8
"""
此模块的功能--可信审计-DB审计
使用 pylint 进行代码检查及优化 jiaxuechuan 2018-02-23
"""

import datetime
import json
import os
import time
import traceback

from django.http import HttpResponse

from octastack_fuzhou_web.settings import django_setup_time
from app_fuzhou.models import WhiteUserAction
from app_fuzhou.util import mysql_base_api
from app_fuzhou.views_utils.localconfig import JsonConfiguration
from app_fuzhou.views_utils.logger import logger
from app_fuzhou.views_utils import utils_shenji
from app_fuzhou.views_utils.utils_audit import page_calculate
from app_fuzhou.views_utils.rpc.audit.audit_rpc_client import AuditRpcClient
from app_fuzhou.views_utils.rpc.snort.snort_rpc_client import SnortRpcClient

jc = JsonConfiguration()

AUDIT_RPC_PORT = 18889
# action_list 表示允许的用户行为操作序列
ACTION_LIST = ["create", "insert", "show", "select", "update", "flush",
               "use", "drop", "describe",
               "delete", "alter", "revoke", "grant", "mysqldump", "mysql",
               "mysqladmin"]


def audit_iplist(request):
    """
    获取multi-ips地址
    :param request:
    :return:
    """
    return_dict = {}
    # 获取muti-ips地址
    hosts = jc.db_ip_list
    ips = []
    for host in hosts:
        ips.append(host['ip'])
        return_dict['ip'] = ips
    return HttpResponse(json.dumps(return_dict))


def audit_status(request):
    """
    数据库审计数据接口
    :param request:
        参数1: shenji_ip　获取ip地址
        参数2: db_type 获取数据库（mysql or postgresql）
        参数3: keyword　获取搜索关键字
        参数4: page　　获取页码
        参数5: logsDate 获取搜索时间
        update by xing ming
    :return:
    """
    return_dict = {}
    hosts = jc.db_ip_list
    ips = []
    for host in hosts:  # 获取所有ip
        ips.append(host['ip'])
    return_dict['ip'] = ips
    page_size = 7  # 每页显示数量  utils_shenji.py 设置最大总条数7000,即1000页
    try:
        # 接收参数
        audit_ip = request.POST.get("shenji_ip", "#")
        db_type = request.POST.get("db_type", "mysql").lower()
        keyword = request.POST.get("keyword", "")
        page = int(request.POST.get("page", 1))
        date_time = request.POST.get("logsDate", "")

        return_dict['db_types'] = get_db_types(audit_ip)
        audit_ip = ips[0] if audit_ip == "#" else audit_ip  # 如果为#,则设为list里第一个ip

        # 在es中搜索关键字, 如果关键字为空
        if keyword == "":
            audit_logs, total = utils_shenji.audit_log(audit_ip, db_type,
                                                       None, page, page_size, date_time)
        else:
            audit_logs, total = utils_shenji.audit_log(audit_ip, db_type, keyword,
                                                       page, page_size, date_time)
        return_dict['content'] = audit_logs  # 得到数据
        return_dict['page'] = page_calculate(total, page_size)  # 计算页数
        time_now = datetime.datetime.now()  # 当前时间
        time_setup = django_setup_time  # 系统启动时间
        latest_audit_log = utils_shenji.get_latest_audit_log(audit_ip)
        latest_timestamp = latest_audit_log.get("_source", {}).get("@timestamp", 0)
        return_dict['time'] = "未扫描" if latest_timestamp == 0 else \
            (datetime.datetime.strptime(latest_timestamp, "%Y-%m-%dT%H:%M:%S.%fZ")
             + utils_shenji.time_delta).strftime('%Y-%m-%d %H:%M:%S')
        time_diff = time_now - time_setup
        time_status = {'days': time_diff.days, 'hours': time_diff.seconds//3600,
                       'minutes': time_diff.seconds % 3600 // 60}  # 系统启动时间与当前时间之差
        return_dict['time_status'] = time_status
    except Exception as e:
        logger.error(str(e))
        logger.error(traceback.format_exc())
    return HttpResponse(json.dumps(return_dict))


def white_list_status(request):
    """
    返回白名单状态
    :param request: shenji_ip
    :return:
    """
    return_dict = {}  # 返回的字典
    hosts = jc.db_ip_list
    ips = []
    for host in hosts:
        ips.append(host['ip'])
    audit_ip = request.POST.get("shenji_ip", "#")  # 获取ip
    # db_type = request.POST.get("db_type").lower()  # 获取数据库类型
    audit_ip = ips[0] if audit_ip == "#" else audit_ip

    # 获取数据库的添加的用户白名单 和 数据库行为白名单
    user_action_query = WhiteUserAction.objects.filter(ip=audit_ip).order_by('-id')
    # 从white user表中查询所有的user_name，从white action表中查询所有的 action_name
    # 把用户白名单放入到white_user中，把用户行为白名单放入到white_action中
    # 当type=1时 返回数据 ['value1', 'value2', 'value3']
    # 当type=2时 返回数据 [{'sid': sid1, 'value': value1}, {'sid': sid2, 'value': value2}]
    try:
        # flat 为True，它表示返回的结果为单个值而不是元组 ['value1', 'value2', 'value3']
        return_dict['user'] = list(user_action_query.objects.filter(
            type=1).values_list('value', flat=True))

        return_dict['action'] = list(user_action_query.objects.filter(
            type=2).values('sid', 'value'))
    except Exception as e:
        logger.error(e)
    return HttpResponse(json.dumps(return_dict))


def get_db_types(ip):
    """
    获取对应ip已安装的数据库类型
    :param ip:
    :return:
    """
    hosts = jc.db_ip_list
    db_types = []  # 保存host下已安装的数据库类型
    for item in hosts:
        if item['ip'] == ip and 'db_types' in item.keys():
            host_dbs = item['db_types']
            db_types = host_dbs.split(";")
            break
    return db_types


def audit_delete_old(request):
    """
    用户白名单，行为的添加和删除，清空操作
    :param request:
        参数1: values　要删除的数组
        参数2: type　1: 删除用户  2：删除行为
        参数3: ip　审计IP
        参数4: db_type 数据库类型
    :return:
    """
    # 接收参数
    values = request.POST.get("values", "")[:-1]  # 前台数据 ,由于最后多了一个"井号",所以需要删除
    _type = request.POST.get("type")
    ip = request.POST["ip"]
    db_type = request.POST.get("db_type").lower()

    return_dict = {}
    _values = values.split('#')
    logger.debug(_values)
    # 删除之前先判断好
    # 获取数据库中的数据，用户白名单 和用户行为值
    try:
        audit_rpc = AuditRpcClient(ip, AUDIT_RPC_PORT)
        result = audit_rpc.delete_part(_values, _type)
    except Exception as e:
        logger.error(e)
        result = -1

    # 删除单个用户行为
    if result == 0:
        WhiteUserAction.objects.filter(value__in=_values, ip=ip,
                                       type=_type, db_type=db_type).delete()
        return_dict['code'] = "200"
    else:
        return_dict['code'] = "201"
    return HttpResponse(json.dumps(return_dict))


def audit_add_old(request):
    """
    添加数据库审计用户或者行为  该方案暂用，见新 audit_add 方法
    :param request:req
    :return:json
    """
    # return_dict = {}
    return_dict = {"code": "201"}  # 设置默认值为"201",表示本次操作失败
    _type = request.POST.get("type")
    ip = request.POST.get("ip")
    value = request.POST.get("value")
    db_type = request.POST.get("db_type").lower()  # 目前,前端传过来的是　空字符串
    if db_type == "":  # 设置,mysql为默认数据库类型
        db_type = "mysql"

    if _type == "2" and value not in ACTION_LIST:  # 如果不合法,直接返回
        return HttpResponse(json.dumps({'code': '202'}))

    conn, cursor = mysql_base_api.sql_init(jc.mysql_host, jc.mysql_user, jc.mysql_pass,
                                           jc.mysql_database, jc.mysql_port)
    sql = "select count(id) as count from white_user_action WHERE type ='" \
          + _type + "' and ip = '" + ip + "' and value = '" + value + "' and db_type = '" + db_type + "'"
    # 当添加的已经存在，返回给前端300值
    # 查询之指定的白名单用户或行为,是否已经添加
    result = mysql_base_api.select_onesql(cursor, sql)  # result= ({'count': 1},)

    if result[0]['count'] > 0:  # 如果>0,则表明相应的白名单用户或行为已经添加
        # mysql_base_api.sql_close(conn, cursor)
        return_dict['code'] = "300"      # 已经存在，用户白名单添加重复
        return HttpResponse(json.dumps(return_dict))
    try:
        if db_type == 0:    # 0 mysql
            audit_rpc = AuditRpcClient(ip, AUDIT_RPC_PORT)
            rpc_result = audit_rpc.add(value, _type)
            logger.debug(rpc_result)

            if rpc_result == 0:
                return_dict['code'] = "200"

                # insert_action_name = {'white_user_action': [
                #     {"value": value, "ip": ip, 'type': _type, 'db_type': db_type}]}
                # mysql_base_api.insert_row(conn, cursor, insert_action_name)
                # mysql_base_api.sql_close(conn, cursor)

            else:
                return_dict['code'] = "201"
        elif db_type == 1:  # 1 postgresql
            insert_action_name = {'white_user_action': [
                {"value": value, "ip": ip, 'type': _type, 'db_type': db_type}]}
            mysql_base_api.insert_row(conn, cursor, insert_action_name)
            mysql_base_api.sql_close(conn, cursor)
            return_dict['code'] = "200"
    except Exception as e:
        logger.error(e)
        return_dict['code'] = "201"
        mysql_base_api.sql_close(conn, cursor)
        return HttpResponse(json.dumps(return_dict))

    return HttpResponse(json.dumps(return_dict))


def audit_add(request):
    """
    添加白名单行为
    :param request:
        参数1: type　1.白名单用户  2.白名单行为  3.黑名单行为
        参数2: ip　IP
        参数3: value
    :return:
    """
    return_dict = {"code": "201"}  # 设置默认值为"201",表示本次操作失败

    # 接收参数
    _type = request.POST.get("type", "2")
    ip = request.POST.get("ip")
    value = request.POST.get("value")

    # 查询之指定的白名单用户或行为,是否已经添加。当添加的已经存在，返回给前端300值
    try:
        count = WhiteUserAction.objects.filter(type=_type, ip=ip, value=value).count()
    except Exception as e:
        logger.error(e)
        return HttpResponse(json.dumps(return_dict))

    # 如果>0,则表明相应的白名单用户或行为已经添加
    if count > 0:
        return_dict['code'] = "300"  # 已经存在，用户白名单添加重复
        return HttpResponse(json.dumps(return_dict))

    # 否则根据前端传来的参数创建数据
    try:
        snort_rpc = SnortRpcClient(ip, jc.snort_rpc_port)
        c_time = str(int(time.time()))
        rpc_result = snort_rpc.add_rule("pass", "tcp", "any any", "any any", value, c_time)
        if rpc_result:
            WhiteUserAction.objects.create(ip=ip, value=value, type=_type, sid=c_time)
            return_dict['code'] = "200"
    except Exception as e:
        logger.error(e)
        return_dict['code'] = "201"
        return HttpResponse(json.dumps(return_dict))

    return HttpResponse(json.dumps(return_dict))


# SQL--->ORM 这个函数先不改。。。。没有在mysql中找到对应的表  88888
def while_result(request):
    """
    前台不断想后台轮训访问的api，用于判断用户白名单，行为添加删除和清空操作后台是否已经完成
    如，当前台添加用户白名单后，前台每隔1s会询问后台while_result，
    while_result返回给前台250说明成功，否则失败
    """
    user_type = request.POST["type"]
    deal_uer_content = request.POST["whiteNameIP"]
    shenji_ip = request.POST["shenji_ip"]
    if user_type == "1":
        # user_type值为1，表示用户白名单的结果轮训
        deal_uer_content = eval(deal_uer_content)
        my_content = deal_uer_content['IPcontent']
    elif user_type == "3":
        # 当user_type为3，表示用户行为的结果轮训
        deal_uer_content = eval(deal_uer_content)
        my_content = deal_uer_content['actionContent']
    else:
        my_content = deal_uer_content
    # 后端处理结果查询
    deal_result = 0
    _dict = {}
    if deal_result == 0:
        # 获取数据库操作信息，
        conn, cursor = mysql_base_api.sql_init(jc.mysql_host, jc.mysql_user, jc.mysql_pass,
                                               jc.mysql_database, jc.mysql_port)
        if user_type == "1":
            # 删除数据库中的用户白名单，删除的是单条白名单
            del_sql = ["delete from whiteuser where user_name='" + my_content + "' and user_ip = '" + shenji_ip + "'"]
            mysql_base_api.update_row(conn, cursor, del_sql)
        elif user_type == "2":
            # 清空特定ip服务器下的，用户白名单
            del_sql = ["delete from whiteuser where user_ip='" + shenji_ip + "'"]
            mysql_base_api.update_row(conn, cursor, del_sql)
        elif user_type == "3":
            # 删除数据库中的用户行为白名单，删除的是单条行为
            del_sql = ["delete from whiteaction where action_name='"
                       + my_content + "' and action_ip = '" + shenji_ip + "'"]
            mysql_base_api.update_row(conn, cursor, del_sql)
        elif user_type == "4":
            # 清空特定ip服务器下的用户白名单行为
            del_sql = ["delete from whiteaction where action_ip='" + shenji_ip + "'"]
            mysql_base_api.update_row(conn, cursor, del_sql)
        elif user_type == "5":
            # 后台添加用户白名单成功，现在把这个用户白名单添加到数据库中
            insert_user_name = {'whiteuser': [{"user_name": my_content, "user_ip": shenji_ip}]}
            mysql_base_api.insert_row(conn, cursor, insert_user_name)
        elif user_type == "6":
            # 后台添加用户行为成功，现在把这个行为添加到数据库中
            insert_action_name = {'whiteaction': [{"action_name": my_content, "action_ip": shenji_ip}]}
            mysql_base_api.insert_row(conn, cursor, insert_action_name)
        _dict['code'] = "250"
        # 关闭数据库
        mysql_base_api.sql_close(conn, cursor)
    else:
        _dict['code'] = "251"
    return HttpResponse(json.dumps(_dict))


def audit_backups(request):
    """
    审计日志－导出日志 添加备份和导出操作
    :param request:
        参数1: type
        参数2: ip 审计页面－当前ip
    :return:
    """
    # 接收参数
    _type = request.POST["type"]
    ip = request.POST['ip']

    if _type == "1" or _type == "2":
        # 当type为1，执行备份升级日志操作
        backups_logs = {'content': utils_shenji.audit_log(ip, None, 1, 10000)}
        # 获得要备份的全部审计日志数据
        audit_json = json.dumps(backups_logs)
        # 在当前文件下创建audit_backups审计日志备份文件夹
        parent_path = os.path.abspath(os.path.dirname(__file__))
        backups_path = parent_path + "/audit_backups"
        # 判断当前文件夹是否存在
        path_exists = os.path.exists(backups_path)
        if not path_exists:
            os.mkdir(backups_path)
        # 获取当前的时间，按照年_月_日_时_分的形式进行json文件命名
        now_time = time.strftime('%Y_%m_%d_%H_%M', time.localtime(time.time()))
        json_name = backups_path + "/" + now_time + ".json"
        # 把审计日志写入到json文件
        with open(json_name, 'w') as f:
            f.write(audit_json)
        # 要返回给前段的字典
        res_dict = {'path': json_name}
        # 返回给前段的path路径
        return HttpResponse(json.dumps(res_dict))

    return HttpResponse(json.dumps({}))


def blacklist_add(request):
    """
    添加黑名单行为
    :param request:
        参数1: type 黑名单行为  type为3
        参数2: ip 审计页面－当前ip
        参数3: value
    :return:
    """
    response_result = {'code': '201'}

    # 接收参数
    _type = request.POST.get("type")
    ip = request.POST.get("ip")
    value = request.POST.get("value")

    # 查询之指定黑名单行为,是否已添加。当添加的已经存在，返回给前端300值
    try:
        count = WhiteUserAction.objects.filter(type=_type, ip=ip, value=value).count()
    except Exception as e:
        logger.error(e)
        return HttpResponse(json.dumps(response_result))

    if count > 0:
        response_result['code'] = "300"  # 已存在，添加重复
        return HttpResponse(json.dumps(response_result))

    # 不存在则创建数据
    try:
        snort_rpc = SnortRpcClient(ip, jc.snort_rpc_port)
        c_time = str(int(time.time()))
        rpc_result = snort_rpc.add_rule("drop", "tcp", "any any", "any any", value, c_time)
        if rpc_result:
            WhiteUserAction.objects.create(ip=ip, value=value, type=_type, sid=c_time)
            response_result = {'code': '200'}
    except Exception as e:
        logger.error(e)
        response_result = {'code': '201'}
        return HttpResponse(json.dumps(response_result))

    return HttpResponse(json.dumps(response_result))


def delete_rules(request):
    """
    黑名单行为删除（恶意行为）
    :param request:
        参数1: values
        参数2: ip 审计页面－当前ip
    :return:
    """
    response_result = {'code': '201'}

    # 接收参数
    values = request.POST.get("values", "")[:-1]  # 前台数据 ,由于最后多了一个"#号",所以需要删除
    ip = request.POST["ip"]
    sids = values.split("#")

    # 数据库删除黑名单行为
    try:
        snort_rpc = SnortRpcClient(ip, 30303)
        rpc_result = snort_rpc.del_rules(sids)
        if rpc_result:
            WhiteUserAction.objects.filter(sid__in=sids, ip=ip).delete()
            response_result = {'code': '200'}
    except Exception as e:
        response_result = {'code': '201'}
        logger.error(e)
        return HttpResponse(json.dumps(response_result))

    return HttpResponse(json.dumps(response_result))


def black_list_status(request):
    """
    返回黑名单（恶意行为）
    :param request:
        参数1: shenji_ip
        参数2: type 3为黑名单行为
    :return:
    """
    # 接收参数
    audit_ip = request.POST.get("shenji_ip", "#")
    _type = request.POST.get("type")

    return_dict = {}  # 返回的字典
    hosts = jc.db_ip_list
    ips = []
    for host in hosts:
        ips.append(host['ip'])
    # audit_ip 获取不到就用 ips 里的第一个ip
    audit_ip = ips[0] if audit_ip == "#" else audit_ip

    try:
        # 把黑名单行为（恶意行为）放入到 black_action中
        black_action = list(WhiteUserAction.objects.filter(
            ip=audit_ip, type=_type).order_by('-id').values('sid', 'value'))
        # id降序查询　结果 [{'sid': sid1, 'value': value1}, {'sid': sid2, 'value': value2}]
        return_dict['action'] = black_action
    except Exception as e:
        logger.error(e)

    return HttpResponse(json.dumps(return_dict))

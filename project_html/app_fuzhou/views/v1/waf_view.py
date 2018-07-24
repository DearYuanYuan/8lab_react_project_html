#!/usr/bin/env python
# encoding: utf-8
"""
此模块的功能--可信审计-WAF防火墙
author:jiashua.wang
"""
import json

from django.http import HttpResponse, JsonResponse

from app_fuzhou.models import OctaGlobalSetting, OctaWafHostStatus
from app_fuzhou.apps import BIZ_CODE
from app_fuzhou.views_utils.localconfig import JsonConfiguration
from app_fuzhou.views_utils.logger import logger
from app_fuzhou.views_utils.rpc.waf.waf_rpc_client import WafRpcClient
from app_fuzhou.views_utils.security import RSACrypto
from app_fuzhou.views_utils import utils_waf
from app_fuzhou.util.RequestSimulator import RequestSimulator

CONFIG = JsonConfiguration()


def waf_rule_status(request):
    """
    获取整个防火墙的开关状态
    :return:列表
    """
    conn_list = OctaGlobalSetting.objects.all()
    rule_status = {}
    for item in conn_list:
        rule_status[item.param] = item.value
    return HttpResponse(json.dumps(rule_status))


def client_list(request):
    """
    获取部署代理的客户端列表,这个列表是share.json中的配置,同步到数据库的
    :return:列表
    """
    keyword = request.POST['keyword']
    # size = request.POST.get('size', 10)
    # page = request.POST.get('page', 1)

    try:
        conn_list = OctaWafHostStatus.objects.all().values()
    except Exception as e:
        logger.error(e)
        return JsonResponse({})

    list_result = {}
    waf_hosts = []
    waf_keyword_hosts = []
    # 将数据库中的每一条信息都保存到变量waf_hosts中
    for item in conn_list:
        waf_hosts.append(item)
    # 当用户搜索的client关键字不是空
    if keyword != "":
        for item in waf_hosts:
            # 查询waf_hosts中的name和ip字段是否有满足的条目，如果满足保存到waf_keyword_hosts列表当中
            if item["name"].find(keyword) != -1 or item["ip"].find(keyword) != -1:
                waf_keyword_hosts.append(item)
        list_result['content'] = waf_keyword_hosts
    else:
        # 如果用户搜索的关键字为空，直接将waf_hosts作为list_result的content值
        list_result['content'] = waf_hosts

    list_result['currentPage'] = 1  # TODO 取正常页数
    list_result['allPage'] = 1  # TODO
    # logger.debug(list_result)
    return HttpResponse(json.dumps(list_result))


def waf_log(request):
    """
    获取waf日志
    :param request
    :return:json格式日志
    """
    flag = request.POST.get('flag', '')  # waf类型
    page = int(request.POST.get('pagenum', 1))  # 第几页,默认第一页
    size = int(request.POST.get('size', 50))  # 每页多少条,默认50条
    return_list, sum_count = utils_waf.get_waf_log(flag, page, size)  # 获取waf日志
    sum_count = 10000 if sum_count >= 10000 else sum_count  # 条数最大10000条
    total_page = int(sum_count / size) \
        if (int(sum_count / size) == sum_count / size) else int(sum_count / size) + 1  # 总页数
    return_list.append({'totalpages': total_page})
    return HttpResponse(json.dumps(return_list))


def waf_home(request):
    """
    返回waf首页所需的4种数据
    :param request:
    :return:
    """
    return_dict = {}
    try:

        # 返回近7天每天的每种攻击类型的统计,和每种类型的总数统计
        week, total = utils_waf.get_waf_log_aggregations_week()
        return_dict["week"] = week
        return_dict["total"] = total
        # return_dict["total"] = {"web-attack": 10, "sensitive-data-tracking": 0,
        #                         "identification-error": 50, "dos-attack": 15,
        #                         "http-defense": 30}

        # 返回近10天每天的日志总条数统计
        return_dict["days"] = utils_waf.get_waf_log_aggregations_days()

        # 返回攻击源城市统计
        return_dict["city"] = utils_waf.get_waf_log_aggregations_city()
    except Exception as e:
        logger.error(str(e))
    return HttpResponse(json.dumps(return_dict))


def switch_waf_status(request):
    """
    切换对应主机的Waf规则状态,打开或者关闭
    :param request:
    :return:json结果
    """
    switch = request.POST["switch"]
    switch_checks = ['alarm', 'defense']
    logger.debug(switch)
    if switch not in switch_checks:  # 支持的操作只有'on','off'
        logger.error("%s not supported", switch)
        ret = BIZ_CODE['ERROR']
        return HttpResponse(json.dumps(ret))

    options = ['http', 'web', 'dataTrack', 'errorCheck', 'dos', 'whole']
    option = request.POST["option"]

    if option not in options:
        logger.error("%s not supported", option)
        ret = BIZ_CODE['ERROR']
        return HttpResponse(json.dumps(ret))
    ip = request.POST["ip"]
    result = 0
    option = 'whole'  # TODO 目前暂时只能关闭所有的，所以传什么，都改为关所有
    if option == 'whole':  # 如果传'whole',表示分别关闭(或者打开)所有的5个开关项
        # for i in range(5):
        #     _option = options[i]
        message_dict = {'option': option, 'switch': switch}
        # _single_result = switch_waf(message_dict, ip)
        _single_result = switch_alerm_or_defense(switch, ip)
        if _single_result == 0:
            # update 的 datchall() 返回空元组() 所以_res=()
            # _res = mysql_base_api.sql_execute(  # 88888
            #     conn, cursor, "update octa_waf_host_status set "
            # + option + " = %s where ip = %s", [switch, ip])  # 88888
            try:
                OctaWafHostStatus.objects.filter(ip=ip).update(whole=switch)
            except Exception as e:
                logger.error(e)
                return JsonResponse({})
            # logger.debug(_res)
        result += _single_result

    else:
        # message_dict = {'option': option, 'switch': switch}
        # result = switch_waf(message_dict, ip)
        # logger.debug(result)
        result = 0

    if result == 0:
        try:
            OctaWafHostStatus.objects.filter(ip=ip).update(whole=switch)
        except Exception as e:
            logger.error(e)
            return JsonResponse({})
        ret = BIZ_CODE['SUCCESS']
    else:
        ret = BIZ_CODE['ERROR']
    logger.info(ret)
    return HttpResponse(json.dumps(ret))


def switch_whole_waf_status(request):
    """
    切换整体Waf规则状态,打开或者关闭
    :param request:
    :return:json结果
    """
    # 规则 (http | web  | dataTrack | errorCheck | dos)
    # option = request.POST["option"]
    option = 'whole'
    switch = request.POST["switch"]  # on 或者 off
    diction = {}
    ok_ips = []  # 操作成功的主机
    message_dict = {'option': option, 'switch': switch}

    try:
        _count = OctaGlobalSetting.objects.filter(param=option, value=switch).count()
    except Exception as e:
        logger.error(e)
        return JsonResponse({})

    #  说明已经打开或者关闭了
    if _count > 0:
        ret = BIZ_CODE['OPTION_ALREADY_HANDLED']
        return HttpResponse(json.dumps(ret))

    try:
        OctaGlobalSetting.objects.filter(param=option).update(value=switch)
        ip_list = list(OctaWafHostStatus.objects.filter(whole=switch).values('ip'))
    except Exception as e:
        logger.error(e)
        return JsonResponse({})

    logger.debug(len(ip_list))
    _error_count = 0  # 关闭出错的数量
    _sucess_count = 0
    for ip_dic in ip_list:
        try:
            logger.debug("send ip : %s", ip_dic['ip'])
            result = switch_waf(message_dict, ip_dic['ip'])
            logger.debug(result)
            if result == 0:
                ok_ips.append(ip_dic['ip'])
                _sucess_count += 1
        except Exception as e:
            logger.error(e)
            _error_count += 1
    if _error_count == len(ip_list):
        return HttpResponse(json.dumps(BIZ_CODE['ERROR']))

    diction['code'] = 200
    diction['okIps'] = ok_ips
    diction['okCount'] = _sucess_count

    return HttpResponse(json.dumps(diction))


def waf_state(request):
    """
    # waf防火墙状态:是否是运行中,共拦截攻击次数,无法识别文件个数
    :return:json
    """
    state = utils_waf.get_state_info_dict()
    return HttpResponse(json.dumps(state))


def switch_waf(message, client_ip):
    """
    # 改变waf防火墙中开关的状态
    # 通过发送给客户端部署的代理程序来控制客户端的Mysql-Audit日志插件行为,
        或者是Apache的ModSecurity插件行为
    :param message: 内容信息:opt_type=1时表示审计白名单用户或者行为;
                            opt_type =2时,表示waf5种类型
    :param client_ip: 客户端IP
    :return:成功返回0,失败返回1
    """
    logger.debug("starting switch waf...")

    try:
        rpc_client = WafRpcClient(client_ip, 18888)
        _re = rpc_client.switch_waf(
            str(RSACrypto.encrypt(json.dumps(message)), 'utf-8'))
        logger.debug("send operation successful...")
        return _re
    except Exception as e:
        logger.error("send operation function fail")
        logger.error(e)
        return -1


def switch_alerm_or_defense(switch, client_ip):
    """
    # 改变waf防火墙中开关的状态
    # 通过发送给客户端部署的代理程序来控制客户端的Mysql-Audit日志插件行为,
        或者是Apache的ModSecurity插件行为
    :param switch: 开|关
    :param client_ip: 客户端IP
    :return:成功返回0,失败返回1
    """
    logger.debug("starting switch waf...")
    try:
        url = "http://" + client_ip + ":" + str(CONFIG.switch_waf_port)
        rs = RequestSimulator(url)
        resp = rs.post(url='/setwafstatus', data={'model': switch},
                       ignore_http_error=True)
        _re = resp.read().decode('utf-8')
        _re_json = json.loads(_re)
        logger.debug("%s operation successful...", switch)
        return _re_json['errno']
    except Exception as e:
        logger.error("ERROR:send operation function fail... %s", str(e))
        return -1

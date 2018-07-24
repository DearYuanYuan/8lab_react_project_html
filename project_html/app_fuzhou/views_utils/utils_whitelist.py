import os
import json
import datetime
import subprocess

from app_fuzhou.models import TrustLog, BlackboxHost, Virusbook, WhiteList, OperationHost
from app_fuzhou.views_utils.logger import logger
from app_fuzhou.views_utils.localconfig import JsonConfiguration
from app_fuzhou.views_utils.clamav.clamd_scan import ClamdScanner
from app_fuzhou.views_utils.rpc.blackbox.black_box_client import BlackBoxRPCClient
from app_fuzhou.views_utils.global_config import GlobalConf

from django.db import transaction
from django.db.models import Q
from django.forms.models import model_to_dict

GLOBAL_CONFIG = GlobalConf()
LOCAL_CONFIG = JsonConfiguration()
BLACKBOX_RPC_IP = LOCAL_CONFIG.blackbox_ip
BLACKB0X_RPC_PORT = LOCAL_CONFIG.used_ports['blackbox_rpc']


class BaseMessage(object):
    def __init__(self):
        self.Head = "8LABjs0nHe@dBegin"
        self.Action = ""
        self.Ip = ""
        self.Host = ""
        self.Content = ""
        self.Date = datetime.datetime.now().strftime("%Y-%m-%d %X")
        self.End = "8LABjs0nHe@dEnd"


class RepairMessage(BaseMessage):
    repair_action_code = "25"

    def __init__(self, content, host, ip):
        super().__init__()
        self.Action = self.repair_action_code
        self.Content = content
        self.Host = host
        self.Ip = ip


class ResetMessage(BaseMessage):
    reset_action_code = "24"

    def __init__(self, host, ip):
        super().__init__()
        self.Action = self.reset_action_code
        self.Host = host
        self.Ip = ip


class StartProtectionMessage(BaseMessage):
    action_code = "26"

    def __init__(self, host, ip):
        super().__init__()
        self.Action = self.action_code
        self.Host = host
        self.Ip = ip


class StopProtectionMessage(BaseMessage):
    action_code = '27'

    def __init__(self, host, ip):
        super().__init__()
        self.Action = self.action_code
        self.Host = host
        self.Ip = ip


class StartMediumBlock(BaseMessage):
    """
    开启中级阻断
    """
    action_code = '40'

    def __init__(self, host, ip):
        super().__init__()
        self.Action = self.action_code
        self.Host = host
        self.Ip = ip


class StopMediumBlock(BaseMessage):
    """
        关闭中级阻断
    """
    action_code = '41'

    def __init__(self, host, ip):
        super().__init__()
        self.Action = self.action_code
        self.Host = host
        self.Ip = ip


class StartSeniorBlock(BaseMessage):
    """
        开启高级阻断
    """
    action_code = '42'

    def __init__(self, host, ip):
        super().__init__()
        self.Action = self.action_code
        self.Host = host
        self.Ip = ip


class StopSeniorBlock(BaseMessage):
    """
        关闭高级阻断
    """
    action_code = '43'

    def __init__(self, host, ip):
        super().__init__()
        self.Action = self.action_code
        self.Host = host
        self.Ip = ip


def invoke_rpc_repair(contents):
    """
    调用RPC进行修复
    :param contents:
    :return: 执行状态
    """

    try:
        """
        result = TrustLog.objects.filter(id=log_id, state=0)
        if not result:
            return False
        confirm_item = result[0]
        """

        with BlackBoxRPCClient(BLACKBOX_RPC_IP, BLACKB0X_RPC_PORT) as client:
            for tmp_key in contents.keys():
                content = contents[tmp_key]
                for tmp in content:
                    repair_pack = RepairMessage(tmp['content'], tmp['host'], tmp['ip'])
                    logger.debug(vars(repair_pack))
                    result = client.command(json.dumps(vars(repair_pack)))
                    logger.debug(result)

                    # 更新trustlog表中的state值
                    error_log = TrustLog.objects.get(id=tmp['id'])
                    error_log.state = 1
                    error_log.save()

        logger.info("Invoking RPC to repair.")
        return True
    except Exception as e:
        logger.error(e)
    return False


@transaction.atomic
def invoke_rpc_reset(log_id):
    """
    调用RPC进行重置
    :param log_id: 主机IP
    :return: 执行状态
    """

    try:
        result = TrustLog.objects.filter(id=log_id)
        if not result:
            return False
        confirm_item = result[0]
        msg = ResetMessage(confirm_item.host, confirm_item.ip)
        with BlackBoxRPCClient(BLACKBOX_RPC_IP, BLACKB0X_RPC_PORT) as client:
            result = client.command(json.dumps(vars(msg)))
            logger.debug(result)
        logger.info("Invoking RPC to reset.")
        return True
    except Exception as e:
        logger.error(e)
    return False


def proctect_start(ips):
    """
    开启可信防护
    :param ips: 调用的一组主机IP
    :return:
    """

    try:
        result = None

        confirm_items = BlackboxHost.objects.filter(hostip__in=ips, status=1)
        for item in confirm_items:
            msg = StartProtectionMessage(item.hostname, item.hostip)
            with BlackBoxRPCClient(BLACKBOX_RPC_IP, BLACKB0X_RPC_PORT) as client:
                result = client.command(json.dumps(vars(msg)))
                logger.debug(result)

        logger.info("Invoking RPC to start protection.")
        return result
    except Exception as e:
        logger.error(e)


def start_midu(ids):
    """
    开启可信防护
    :param ids: 调用的一组主机ID
    :return:
    """

    try:
        result = None

        confirm_items = BlackboxHost.objects.filter(id__in=ids, status=1)
        for item in confirm_items:
            msg = StartProtectionMessage(item.hostname, item.hostip)
            with BlackBoxRPCClient(BLACKBOX_RPC_IP, BLACKB0X_RPC_PORT) as client:
                result = client.command(json.dumps(vars(msg)))
                logger.debug(result)
            if result:
                _update_host_status(ids, 0)

        logger.info("Invoking RPC to start protection.")
        return result
    except Exception as e:
        logger.error(e)


def proctect_stop(ips):
    """
    关闭可信防护
    :param ips: 调用的一组主机IP
    :return:
    """

    try:
        result = None
        confirm_items = BlackboxHost.objects.filter(hostip__in=ips, status__in=[0, 2])
        for item in confirm_items:
            msg = StopProtectionMessage(item.hostname, item.hostip)
            with BlackBoxRPCClient(BLACKBOX_RPC_IP, BLACKB0X_RPC_PORT) as client:
                result = client.command(json.dumps(vars(msg)))
                logger.debug(result)

        logger.info("Invoking RPC to stop protection.")
        return result
    except Exception as e:
        logger.error(e)


def start_m_block(ids):
    """
    开启中级阻断
    :param ids: 调用的一组主机ID
    :return:
    """

    try:
        result = None
        confirm_items = BlackboxHost.objects.filter(id__in=ids)
        for item in confirm_items:
            msg = StartMediumBlock(item.hostname, item.hostip)
            with BlackBoxRPCClient(BLACKBOX_RPC_IP, BLACKB0X_RPC_PORT) as client:
                result = client.command(json.dumps(vars(msg)))
                logger.debug(result)

        logger.info("Invoking RPC to start medium block.")
        return result
    except Exception as e:
        logger.error(e)


def stop_m_block(ids):
    """
    关闭中级阻断
    :param ids: 调用的一组主机ID
    :return:
    """

    try:
        result = None
        confirm_items = BlackboxHost.objects.filter(id__in=ids)
        for item in confirm_items:
            msg = StopMediumBlock(item.hostname, item.hostip)
            with BlackBoxRPCClient(BLACKBOX_RPC_IP, BLACKB0X_RPC_PORT) as client:
                result = client.command(json.dumps(vars(msg)))
                logger.debug(result)

        logger.info("Invoking RPC to stop medium block.")
        return result
    except Exception as e:
        logger.error(e)


def start_s_block(ips):
    """
    开启高级阻断
    :param ips: 调用的一组主机IP
    :return:
    """

    try:
        result = None
        confirm_items = BlackboxHost.objects.filter(hostip__in=ips)
        for item in confirm_items:
            msg = StartSeniorBlock(item.hostname, item.hostip)
            with BlackBoxRPCClient(BLACKBOX_RPC_IP, BLACKB0X_RPC_PORT) as client:
                result = client.command(json.dumps(vars(msg)))
                logger.debug(result)

        logger.info("Invoking RPC to start senior block.")
        return result
    except Exception as e:
        logger.error(e)


def stop_s_block(ips):
    """
    关闭高级阻断
    :param ips: 调用的一组主机IP
    :return:
    """

    try:
        result = None
        confirm_items = BlackboxHost.objects.filter(hostip__in=ips)
        for item in confirm_items:
            msg = StopSeniorBlock(item.hostname, item.hostip)
            with BlackBoxRPCClient(BLACKBOX_RPC_IP, BLACKB0X_RPC_PORT) as client:
                result = client.command(json.dumps(vars(msg)))
                logger.debug(result)

        logger.info("Invoking RPC to stop senior block.")
        return result
    except Exception as e:
        logger.error(e)


def invoke_rpc_writelog():
    try:
        with BlackBoxRPCClient(BLACKBOX_RPC_IP, BLACKB0X_RPC_PORT) as client:
            result = client.command("/8lab/blackbox -w -n eth0")
            logger.debug(result)
        return result
    except Exception as e:
        logger.error(e)


def save_whitelog(white_dict):
    with BlackBoxRPCClient(BLACKBOX_RPC_IP, BLACKB0X_RPC_PORT) as client:
        client.command(json.dumps(white_dict))  # RPC 调用黑盒子


def scan_trustlog_file():
    """
    使用clamd-deamon扫描TrustLog记录的文件
    :return: dict, 文件状态
    """

    file_list = trust_log_files()
    return ClamdScanner().multiscan_files(file_list)


def trust_log_files():
    """
    从TrustLog记录中去除文件路径列表
    :return: 文件路径列表
    """

    files = list()
    trustlogs = TrustLog.objects.filter(state=0)
    for item in trustlogs:
        content = item.content
        for e in content.strip().split():
            files.append(e[16:])

    return files


def handle_repair(contents):
    return invoke_rpc_repair(contents)  # and invoke_rpc_reset(contents)


def handle_found(result):
    """
    处理异常文件
    :param result: {filename: ("FOUND", virusname)}
    :return: None
    """

    logger.info("Attempt to remove found virus.")
    for k, v in result.iteritems():
        if v[0] == "FOUND":
            os.remove(k)


@transaction.atomic
def virus_init():
    # 威胁分析结果存入virusbook表中
    update_virus_book()
    path_value = []
    state_code = 2  # 判断是否有威胁的标志

    white_list = []
    for item in Virusbook.objects.all():
        if item.fileName:
            path_value.append(item.fileName)
        if item.isWhite == 0:
            state_code = 1
        else:
            # 将微步认为是白名单的信息添加在表whitelist中
            white_list_item = WhiteList(
                client_name=item.host, ip=item.ip,
                file_router=item.fileName,
                file_data=item.resource
            )
            white_list.append(white_list_item)

            # 将微步认为是白名单信息的记录通过rpc发送给blackbox
            save_whitelog(model_to_dict(white_list_item))
            # 并在trustlog中设置level为DEBUG
            TrustLog.objects.filter(host=item.host, ip=item.ip, filename=item.fileName).update(level='DEBUG')
            # 在virusbook中删除该条记录
            Virusbook.objects.filter(id=item.id).delete()
    WhiteList.objects.bulk_create(white_list)
    path_value.append(state_code)

    (status, output) = subprocess.getstatusoutput("/8lab/blackbox -w")
    if status != 0:
        logger.error("[BLACKBOX][ERROR] blackbox reset white list failed!")
    return path_value


def page_search(keyword, page, size):
    if keyword != ("" or None):
        # 当关键字不为空，在数据库中搜索关键字，返回匹配的项
        result = TrustLog.objects.filter(state=0).filter(content__contains=keyword).values()
    else:
        # 当关键字为空，显示全部
        result = TrustLog.objects.filter(state=0).values()
    totalpage = 0  # 总页数
    if len(result) > 0:
        # 因为记录的条数不一定正好是size的倍数，所以需要根据查询结果进行计算处理
        count = len(result) / 10
        totalpage = count if count == int(count) else int(count) + 1
    return_dict = {"totalpage": totalpage}
    if int(page) < totalpage:  # 每次返回一页的内容
        return_dict["logs"] = result[(int(page) - 1) * int(size):int(size) * int(page)]
    else:
        return_dict["logs"] = result[(int(page) - 1) * int(size):]
    return return_dict


def handle_scan_repair():
    handle_found(scan_trustlog_file())  # 尝试修复异常的trust_log记录文件
    return_list1 = []
    return_list2 = []

    for e in Virusbook.objects.all():
        data = {'id': e.id, 'host': e.host, 'ip': e.ip, 'fileName': e.filename}
        if e.isWhite == "0":
            return_list1.append(data)
        else:
            res = []
            for s in e.scans:
                if s == "'":
                    res.append("\"")
                elif len(s) == 0:
                    continue
                else:
                    res.append(s)
            data['scans'] = [k for k, v in eval("".join(res)).items()]
            return_list2.append(data)
    return [return_list1, return_list2]


@transaction.atomic
def update_virus_book():
    try:
        trustlogs = TrustLog.objects.filter(level='ERROR', state=0)

        if trustlogs:
            create_list = []
            for item in trustlogs:
                for filename in item.filename.split("\n"):
                    length = len('file_error_path:')
                    path_index = filename.find('file_error_path:') + length
                    hash_index = filename.find('file_error_hash:') + length
                    file_hash = filename[path_index:filename.find('file_error_hash:')].strip()
                    file_path = filename[hash_index:].strip()

                    virus = Virusbook(
                        resource=file_hash, responseCode=1, fileName=file_path, host=item['host'], ip=item['ip']
                    )
                    create_list.append(virus)
            TrustLog.objects.bulk_create(create_list)
        else:
            Virusbook.objects.raw("truncate virusbook")
    except Exception as e:
        logger.error(e)


def get_trust_log_count(keyword=""):
    """
    从数据库中获取trustlog表中state为0的个数
    :return: log_count
    """
    if keyword:
        log_count = TrustLog.objects.filter(state=0).filter(content__contains=keyword).count()
    else:
        log_count = TrustLog.objects.filter(state=0).count()
    return log_count


def get_trust_log2(offset, limit, keyword=""):
    """
    # 从数据库中获取trustlog表中state为0的值,安装time值从大到小逆序排列
    :return:
    """
    if keyword:
        state_result = TrustLog.objects.filter(state=0).filter(content__contains=keyword).order_by('-time').values()[offset:limit]
    else:
        state_result = TrustLog.objects.filter(state=0).order_by('-time').values()[offset:limit]
    return state_result


@transaction.atomic
def query_hosts_section(start, end, field, condition, type=-1):
    """
    按区间进行用户查询
    :param start: 起始位置
    :param end: 结束位置
    :param field: {column}-0/1 排序字段和方式
    :param condition: 查询条件
    :param type: 0表示status为0主机，1表示status为1的主机，-1表示所有主机
    :return: 记录总数和分段结果
    """

    logger.info("start: %s, end: %s" % (start, end))

    if not 0 <= start < end:
        return

    try:
        result = BlackboxHost.objects.all()

        if type >= 0:
            result = result.filter(status=type)

        if condition:  # 有查询条件，进行模糊查询
            result = result.filter(
                # 按主机IP、主机名进行模糊查询
                Q(hostip__contains=condition) | Q(hostname__contains=condition)
            )

        if field:  # 有排序条件，按字段和排序方式进行排序
            args = field.split("-")
            column = args[0]  # 排序的列
            sort = int(args[1])  # 排序方式，0表示升序，1表示降序

            if not sort:
                result = result.order_by(column)
            else:
                result = result.order_by('-' + column)

        # 将PO转换成VO再返回
        return {"total": len(result), "data": [model_to_dict(e) for e in list(result[start:end])]}
    except Exception as e:
        logger.error(e)
    return list()


def update_op_host(op_type, mac, exe_path):
    """
    更新可信运维主机
    :param op_type: 
    :param mac: 
    :param exe_path: 
    :return: 
    """
    result = {"status": 'error'}
    try:
        if op_type == "create":
            OperationHost.objects.create(id=None, mac_address=mac, exe_path=exe_path)
            result['status'] = 'success'
        elif op_type == "delete":
            objs = list(OperationHost.objects.filter(mac_address=mac))
            if len(objs) > 0:
                objs[0].delete()
            result['status'] = 'success'
    except Exception as e:
        result['status'] = 'error'
        logger.error(e)

    return result


def get_op_host(mac_address):
    """
    查询可信运维主机是否存在
    :param mac_address: 
    :return: 
    """
    result = {"status": 'error'}
    try:
        objs = list(OperationHost.objects.filter(mac_address=mac_address))
        if len(objs) > 0:
            result['status'] = 'success'
    except Exception as e:
        result['status'] = 'error'
        logger.error(e)
    return result

def del_block(ips):
    """
    数据库删除主机
    :param ips: 调用的一组主机IP
    :return:
    """

    try:
        BlackboxHost.objects.filter(hostip__in=ips).delete()
        return "success"
    except Exception as e:
        logger.error(e)

def query_hosts_partition(start, length, field, condition, type=-1):
    return query_hosts_section(start, start + length, field, condition, type)


def query_hosts_page(page_num, page_length, field, condition, type=-1):
    return query_hosts_partition((page_num - 1) * page_length, page_length, field, condition, type)


def _get_ips(ids, status):
    confirm_items = BlackboxHost.objects.filter(id__in=ids, status=status)
    return [e.hostip for e in confirm_items]


def _update_host_status(ids, new_status):
    BlackboxHost.objects.filter(id__in=ids).update(status=new_status)

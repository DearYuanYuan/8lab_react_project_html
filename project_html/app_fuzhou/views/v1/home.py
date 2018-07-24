"""
主页的四个图以及分数
"""
import json

from django.http import HttpResponse

from app_fuzhou.views_utils.utils_home import *
from app_fuzhou.views_utils import utils_home
from app_fuzhou.util.metricbeat import *
from app_fuzhou.models import TrustLog
from app_fuzhou.views.v1.chain import __chain_node_count
from app_fuzhou.models import WhiteList, BlackboxHost

from app_fuzhou.views_utils.utils_waf import get_state_info_dict

# 初始化常量类
GLOBAL_CONFIG = GlobalConf()
BUG_WEIGHT = 1
FULL_SCORE = 100


def score(request):
    """
    主页的分数
    :param request:
    :return json.dumps(return_dic):
    """
    return_dic = {"score": _get_score()}
    return HttpResponse(json.dumps(return_dic))


def global_score(request):
    """
    登录页的分数
    :param request:
    :return json.dumps(return_dic):
    """
    return score(request)


def _get_score():
    count = FULL_SCORE - get_trust_log_count() * BUG_WEIGHT
    _score = count if count > 0 else 0
    return _score


def sql_count(request):
    """
    获取mysql连接数
    :param request:
    :return:
    """
    import MySQLdb
    _jc = JsonConfiguration()
    mysql_host = _jc.mysql_host
    mysql_port = _jc.mysql_port
    mysql_user = _jc.mysql_user
    mysql_passwd = _jc.mysql_pass
    # 连接mysql数据库
    try:
        con = MySQLdb.connect(host=mysql_host, port=mysql_port, user=mysql_user,
                              passwd=mysql_passwd)
    except Exception as e:
        logger.error(e)
        count = 0
        return_dic = {"quantity_of_server": count}
        return HttpResponse(json.dumps(return_dic))
    cursor = con.cursor()
    sql = "show status like 'Threads%';"
    cursor.execute(sql)  # 执行sql命令
    record = cursor.fetchall()  # 获取sql命令执行结果
    count = record[1][1]  # 获取连接总数
    con.close()
    return_dic = {"quantity_of_server": count}  # 组织数据，返回前端
    return HttpResponse(json.dumps(return_dic))


def proc_loadvag(request):
    """
    首页展示当前CPU和磁盘I/O的负载平均值
    多个节点（大于等于1个）
    :param request:
    :return:
    """
    # 多个节点的磁盘访问平均值
    diskio_pct, disk_name = avg_diskio()
    # 多个节点，占用cpu较多的前5个进程
    names, cpus = nodes_top5_process_cpu()
    return_dic = {"ratioCPU": cpus, "nameCPU": names, "ratioDisk": diskio_pct, "nameDisk": disk_name}
    return HttpResponse(json.dumps(return_dic))


def proc_memory(request):
    """
    首页展示集群内存信息:
    多个节点（大于等于1个）
    多个节点内存信息的平均值
    :param request:
    :return:
    """
    cached, page_bufferpool, nonpage_bufferpool, committed = avg_memory()
    return_dic = {"cached": [cached], "city": ["福州政务云"], "page_bufferpool": [page_bufferpool],
                  "nonpage_bufferpool": [nonpage_bufferpool], "committed": [committed]}
    return HttpResponse(json.dumps(return_dic))


def proc_net(request):
    """
    首页展示网络通讯流量信息
    :param request:
    :return:
    """
    # 多个节点，网络上传下载的平均值
    network_in, network_out = avg_network()
    # 获取连接数
    conn = read_file('/proc/net/tcp', 0).__len__() - 1
    # 组织数据，返回前端
    return_dic = {"uploadSpeed": network_in, "downloadSpeed": network_out, "connectQuantity": conn}
    return HttpResponse(json.dumps(return_dic))


def statis_info(request):
    """
    获取首页的统计信息:区块链个数.被保护的机器数等信息
    :param request:
    :return:
    """
    _whitelist_count = WhiteList.objects.all().count()  # 白名单总数
    _chain_count = __chain_node_count()  # 区块链节点数量
    _trust_count = TrustLog.objects.filter(state=0).count()  # 可信日志总数
    _pro_node_count = BlackboxHost.objects.filter(status=0).count()  # 被保护的节点数
    _global_score = _get_score()
    defense_count = get_state_info_dict()['intercepted']
    shenji_count = utils_home.shenji_count()

    return_dic = {"chain_count": _chain_count, "shenji_count": shenji_count,
                  "trust_count": _trust_count, "pro_node_count": _pro_node_count,
                  "whitelist_count": _whitelist_count, "defense_count": defense_count,
                  "score": _global_score, "nisa_count": utils_home.nisa_count()}
    return HttpResponse(json.dumps(return_dic))


def get_trust_log_count():
    """
    # 从数据库中获取trustlog表中state为0的总数
    state=1,表示正常,=0表示异常
    :return: int
    """
    try:
        return TrustLog.objects.filter(state=0).count()
    except Exception as e:
        logger.error(e)
        return 0

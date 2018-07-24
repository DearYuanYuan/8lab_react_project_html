#!/usr/bin/env python
# encoding: utf-8
"""
此模块的功能主要是获取在数据库中保存的主机节点和数据库几点的信息并建立连通性关系
"""
import re

from elasticsearch import Elasticsearch

from app_fuzhou.util import mysql_base_api
from app_fuzhou.models import Database, TrustLog
from app_fuzhou.views_utils.localconfig import JsonConfiguration
from app_fuzhou.views_utils.logger import logger
from app_fuzhou.views_utils.utils_waf import get_waf_logs_timestamp_count
from app_fuzhou.util.RequestSimulator import RequestSimulator

jc = JsonConfiguration()
es_server_ip_port = jc.es_server_ip_port

# 连接elasticsearch,默认是9200
es = Elasticsearch(es_server_ip_port)
WAF_MODEL = "alarm"  # waf防火墙模式  alarm  defense
HOST_STATUS = "safe"
REPEAT_COUNTS = 0


class Response(object):
    """
    描述主机节点信息和数据库节点信息
    """

    def __init__(self, state=0, context='', ip=[], nodes={}, edges={},
                 begin='8lab', end='8lab', status='safe'):
        self.state = state
        self.ip = ip
        self.nodes = nodes
        self.edges = edges
        self.context = context
        self.begin = begin
        self.end = end
        self.status = status


class HostNode(object):
    """
    描述主机节点信息
    """

    def __init__(self, host, value=1, state='safe'):
        self.type = 'host'
        self.hostIP = host['ip']
        self.subnetmask = host['mask']
        self.hostname = host['name']
        self.value = DBNode.node_value + value
        self.state = state


class DBNode(object):
    """
    描述数据库节点信息
    """
    node_value = 1

    def __init__(self, node, visible=True):
        self.type = 'db'
        self.name = node['dbname']
        self.parent = node['hostip']
        self.value = DBNode.node_value
        self.visible = visible


class HostEdge(object):
    """
    描述主机节点之间的连通性
    """

    def __init__(self, source, target):
        self.type = 'hosthost'
        self.source = source
        self.target = target


class DBEdge(object):
    """
    描述数据库节点之间的连通性
    """

    def __init__(self, source, target):
        self.type = 'hostdb'
        self.source = source
        self.target = target


def is_same_subnet(ip_source, mask_source, ip_target, mask_target):
    """
    根据子网掩码两个IP是否属于同一子网
    :param ip_source: 源主机IP
    :param mask_source: 源子网掩码
    :param ip_target: 目的主机IP
    :param mask_target: 目的子网掩码
    :return: 是否属于同一子网
    """
    subnet_a = ip2int(ip_source) & ip2int(mask_source)
    subnet_b = ip2int(ip_target) & ip2int(mask_target)
    return subnet_a == subnet_b


def ip2int(ip):
    """
    将字符型IP地址转换成整型
    :param ip: 字符型IP地址
    :return: 整型IP地址
    """
    part = ip.split('.')
    return int(part[0]) * 256 * 256 * 256 + int(part[1]) * 256 * 256 + int(
        part[2]) * 256 + int(part[3])


def get_all_hosts():
    """
    获取所有的主机信息
    :return: 所有主机信息
    """
    return jc.db_ip_list


def get_all_hostip():
    """
    获取所有主机的IP
    :return: 所有主机的IP
    """
    hosts = get_all_hosts()
    ips = []
    for host in hosts:
        ips.append(host['ip'])
    return ips


def get_database_details():
    """
    获取主机节点和数据库节点的信息和关系
    :return: 主机节点和数据库节点的详细信息以及连通性
    """
    host_nodes = []
    db_nodes = []
    host_edges = []
    db_edges = []

    try:
        global WAF_MODEL, REPEAT_COUNTS, HOST_STATUS
        waf_logs = get_waf_logs_timestamp_count(25)

        if waf_logs["data"] and len(waf_logs["data"]) > 0:  # 有攻击切换waf防火墙状态
            HOST_STATUS = "error"

            client_ip = jc.client_audit_hosts[0]["ip"]
            url = "http://" + client_ip + ":" + str(jc.switch_waf_port)
            rs = RequestSimulator(url)
            rs.post(url='/setwafstatus', data={'model': 'defense'}, ignore_http_error=True)
            logger.debug("defense operation successful...")

            WAF_MODEL = "defense"  # 重置模式
            REPEAT_COUNTS = 0  # 重置计数
        else:
            REPEAT_COUNTS = REPEAT_COUNTS + 1
            if REPEAT_COUNTS > 1000:  # 防止计数过大
                REPEAT_COUNTS = 4

        if WAF_MODEL == "defense" and REPEAT_COUNTS > 3:  # 如果当前处于 defense模式 连续三次没有攻击 表示已经处于安全状态
            HOST_STATUS = 'safe'

            client_ip = jc.client_audit_hosts[0]["ip"]
            url = "http://" + client_ip + ":" + str(jc.switch_waf_port)
            rs = RequestSimulator(url)
            rs.post(url='/setwafstatus', data={'model': 'alarm'}, ignore_http_error=True)
            logger.debug("alarm operation successful...")

            WAF_MODEL = "alarm"  # 重置模式
            REPEAT_COUNTS = 0  # 重置计数

    except Exception as e:
        logger.error(e)
        HOST_STATUS = 'safe'
        WAF_MODEL = "alarm"  # 重置模式
        REPEAT_COUNTS = 0  # 重置计数

    ip = get_all_hostip()
    all_hosts = get_all_hosts()  # 获取数据库保存的所有数据库管理系统主机

    for i, host in enumerate(all_hosts):
        # 获取对应主机下的所有数据库节点
        all_host_dbs = get_db_by_host(host['ip'])
        db_size = len(all_host_dbs)

        db_contained = trustlog_db_contain_host(host['ip'])

        # 当log 错误日志和trustlog 数据库中都没有该ip地址时，表示安全
        if not db_contained:
            host_state = "safe"
        else:
            host_state = "error"

        host_nodes.append(HostNode(host, db_size, host_state).__dict__)

        if db_size > 0:
            # 当host的value值大于9时设置为不可见
            visible = False if db_size > 9 else True
            for j in range(db_size):
                db_nodes.append(DBNode(all_host_dbs[j], visible).__dict__)
                # 建立主机节点和数据库节点的对应关系，用节点在列表中的下表表示
                db_edges.append(
                    DBEdge(i, len(all_hosts) + len(db_nodes) - 1).__dict__)

    # 建立主机节点之间的关系
    for i in range(len(host_nodes)):
        for j in range(i + 1, len(host_nodes)):
            node_a = host_nodes[i]
            node_b = host_nodes[j]
            # 如果两个IP属于同一子网则表示两个主机可连通，建立节点的边
            if is_same_subnet(node_a['hostIP'], node_a['subnetmask'],
                              node_b['hostIP'], node_b['subnetmask']):
                host_edges.append(HostEdge(i, j).__dict__)

    response = Response(ip=ip, nodes=host_nodes + db_nodes,
                        edges=host_edges + db_edges, status=HOST_STATUS)
    return response.__dict__


def get_db_by_host(ip_address):
    """
    根据主机IP获得对应数据库信息
    :param ip_address: 主机IP
    :return: 该主机上保存的数据库
    """
    nodes = []

    # conn, cursor = get_conn_cursor() 88888

    try:
        # sql = 'SELECT db_name, db_ip, db_type, db_size FROM client_info WHERE db_ip=%s'
        # sql = 'SELECT * FROM client_info WHERE db_ip=%s' 88888
        # result = mysql_base_api.sql_execute(conn, cursor, sql, (ip_address,)) 88888
        result = Database.objects.filter(db_ip=ip_address).values()
        if result and len(result) > 0:
            for row in result:
                nodes.append(
                    {'dbname': row['db_name'], 'hostip': row['db_ip'], 'dbtype': row['db_type'],
                     'dbsize': row['db_size'], 'dbport': row['db_port']
                    }
                )
    except Exception as e:
        logger.error(e)
    # finally: 88888
    #     mysql_base_api.sql_close(conn, cursor) 88888

    return nodes


# 获取数据库->> 主机列表
def get_hosts_by_page(page, size):
    all_hosts = get_all_hosts()
    all_hosts.sort(key=lambda obj: obj.get('ip'), reverse=False)  # 按ip升序排列

    total_host = len(all_hosts)  # host总数
    total_page = int((total_host + int(size) - 1) / int(size))  # 总页数

    hosts_detail = []
    display_host = []

    if int(page) <= total_page:
        display_host = all_hosts[(int(page) - 1) * int(size):(int(page) - 1) * int(size) + int(size)]

    metricbeat_index = "metricbeat"
    for host in display_host:
        host_detail = {}  # host 详细信息

        # 获取host  cpu men 使用率
        used_cpu_pct, used_mem_pct, disk_in, disk_out, runtime, connections = get_host_info(
            metricbeat_index + str(host['ip']))
        host_detail['host_ip'] = host['ip']
        host_detail['host_name'] = host['name']
        host_detail['cpu_pct'] = used_cpu_pct
        host_detail['mem_pct'] = used_mem_pct
        host_detail['sent'] = disk_out
        host_detail['received'] = disk_in
        host_detail['runtime'] = runtime
        host_detail['connections'] = connections

        # 获取对应主机下的所有数据库节点
        all_host_dbs = get_db_by_host(host['ip'])
        host_detail['databases'] = all_host_dbs

        hosts_detail.append(host_detail)

    return hosts_detail, total_page


# 获取搜索相关
def get_search_db(ip_dbname):
    hosts_detail = []
    metricbeat_index = "metricbeat"

    all_hosts = get_all_hosts()
    all_hosts.sort(key=lambda obj: obj.get('ip'), reverse=False)  # 按ip升序排列

    is_ip = check_ip(ip_dbname)
    if is_ip:  # 查询的是ip
        db_ip = ip_dbname

        for host in all_hosts:
            if host['ip'] == db_ip:
                host_detail = {}  # host 详细信息
                # 获取host  cpu men 使用率
                used_cpu_pct, used_mem_pct, disk_in, disk_out, runtime, connections = get_host_info(
                    metricbeat_index + str(host['ip']))
                host_detail['host_ip'] = host['ip']
                host_detail['host_name'] = host['name']
                host_detail['cpu_pct'] = used_cpu_pct
                host_detail['mem_pct'] = used_mem_pct
                host_detail['sent'] = disk_out
                host_detail['received'] = disk_in
                host_detail['runtime'] = runtime
                host_detail['connections'] = connections

                # 获取对应主机下的所有数据库节点
                all_host_dbs = get_db_by_host(host['ip'])
                host_detail['databases'] = all_host_dbs

                hosts_detail.append(host_detail)

                break

    else:  # 查询的数据库名字
        for host in all_hosts:
            # 获取对应主机下的所有数据库节点
            all_host_dbs = get_db_by_host(host['ip'])
            for db_detail in all_host_dbs:
                if db_detail['dbname'] == ip_dbname:
                    db_node = []
                    db_node.append(db_detail)

                    host_detail = {}  # host 详细信息
                    # 获取host  cpu men 使用率
                    used_cpu_pct, used_mem_pct, disk_in, disk_out, runtime, connections = get_host_info(
                        metricbeat_index + str(host['ip']))
                    host_detail['host_ip'] = host['ip']
                    host_detail['host_name'] = host['name']
                    host_detail['cpu_pct'] = used_cpu_pct
                    host_detail['mem_pct'] = used_mem_pct
                    host_detail['sent'] = disk_out
                    host_detail['received'] = disk_in
                    host_detail['runtime'] = runtime
                    host_detail['connections'] = connections

                    host_detail['databases'] = db_node

                    hosts_detail.append(host_detail)
                    break

    return hosts_detail, 1


# 获取cpu mem的使用率
def get_host_info(index):
    cpu_body = {"query": {"match": {'metricset.name': 'cpu'}},
                'sort': {'@timestamp': {'order': 'desc'}},
                'size': 1}

    mem_body = {"query": {"match": {'metricset.name': 'memory'}},
                'sort': {'@timestamp': {'order': 'desc'}},
                'size': 1}

    diskio_body = {"query": {"match": {'metricset.name': 'diskio'}},
                   'sort': {'@timestamp': {'order': 'desc'}},
                   'size': 1}

    used_cpu_pct = 0
    used_mem_pct = 0
    disk_in = 0
    disk_out = 0
    connections = 0
    runtime = 0

    try:
        # 获取cpu使用率
        res = es.search(index=index, body=cpu_body)
        cpu_info = res['hits']['hits']
        if len(cpu_info) > 0:
            latest_cpu_info = cpu_info[0]
            idle_pct = latest_cpu_info['_source']['system']['cpu']['idle']['pct']
            used_cpu_pct = 1 - idle_pct

        # 获取内存使用率
        res = es.search(index=index, body=mem_body)
        mem_info = res['hits']['hits']
        if len(mem_info) > 0:
            latest_mem_info = mem_info[0]
            sys_mem = latest_mem_info['_source']['system']['memory']
            used_mem_pct = sys_mem['used']['pct']

        # 获取磁盘读写速度
        res = es.search(index=index, body=diskio_body)
        disk_info = res['hits']['hits']
        if len(disk_info) > 0:
            latest_disk_info = disk_info[0]
            sys_diskio = latest_disk_info['_source']['system']['diskio']
            disk_out = sys_diskio['write']['bytes']
            disk_in = sys_diskio['read']['bytes']

    except Exception as e:
        logger.error(e)

    return used_cpu_pct, used_mem_pct, disk_in, disk_out, runtime, connections


def get_conn_cursor():
    try:
        conn, cursor = mysql_base_api.sql_init(
            db_host=jc.mysql_host,
            db_port=jc.mysql_port,
            db_user=jc.mysql_user,
            db_passwd=jc.mysql_pass,
            db_name=jc.mysql_database
        )
    except Exception as e:
        logger.error(e)

    return conn, cursor


def trustlog_db_contain_host(host):
    """
    判断trustlog表中是否包含host
    :param host: 
    :return: 
    """

    # conn, cursor = get_conn_cursor() 88888

    try:
        # sql = 'SELECT ip FROM app_fuzhou_trustlog WHERE state=0' 88888
        # result = mysql_base_api.sql_execute(conn, cursor, sql, ()) 88888
        result = TrustLog.objects.filter(state=0).values('ip')
        for host_ip in result:
            if host_ip['ip'].strip() == host.strip():
                return True
    except Exception as e:
        logger.error(e)
        return False
    # finally: 88888
    #     mysql_base_api.sql_close(conn, cursor) 88888

    return False


# 检查是否是ip
def check_ip(ip):
    p = re.compile(r'^((25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(25[0-5]|2[0-4]\d|[01]?\d\d?)$')
    if p.match(ip):
        return True
    else:
        return False

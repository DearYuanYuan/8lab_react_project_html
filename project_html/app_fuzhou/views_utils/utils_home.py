"""
home.py 需要用到的辅助函数
"""
import linecache
import os
from elasticsearch import Elasticsearch
from app_fuzhou.views_utils.logger import logger
from app_fuzhou.views_utils.global_config import GlobalConf
from app_fuzhou.views_utils.localconfig import JsonConfiguration

tmp_io = ""  # 全局变量用于存放io信息
state = []  #
# 初始化常量类
gc = GlobalConf()
CONFIG = JsonConfiguration()


'''
def read_diskio():
    # 连接elasticsearch,默认是9200
    es = Elasticsearch()
    body = {"query": {"match": {'metricset.name': 'diskio'}},
            'sort': [{'@timestamp': {'order': 'desc'}},{'system.diskio.io.time': {'order': 'desc'}}],
            'size': 4}
    res = es.search(index="metricbeat155-*", body=body)
    # timestamp = res['hits']['hits'][0]['_source']['@timestamp']
    # print(timestamp)
    # print(res['hits']['hits'])
    diskio_top5 = res['hits']['hits']
    disk_name = []
    diskio_time = []
    total_time = 0
    for hit in diskio_top5:
        tmp_time = hit['_source']['system']['diskio']['io']['time']
        diskio_time.append(tmp_time)
        disk_name.append(hit['_source']['system']['diskio']['name'])
        total_time += tmp_time

    diskio_pct = []
    for time in diskio_time:
        diskio_pct.append(round(time / total_time, 4))

    # print(diskio_time)
    # print(disk_name)
    # print(total_time)
    # print(diskio_pct)
    return diskio_pct, disk_name
'''

def read_diskio():
    #连接elasticsearch,默认是9200
    es = Elasticsearch()
    # 获得最新的时间戳,以便进一步获得磁盘数量!
    body={"query":{"match":{'metricset.name':'diskio'}},'sort':{'@timestamp':{'order':'desc'}},'size':1}
    res = es.search(index="metricbeat155-*", body=body)
    timestamp = res['hits']['hits'][0]['_source']['@timestamp']
    # print(timestamp)
    # print(res['hits']['hits'])
    # print('-------------------')
    # query = {"match":{'metricset.name':'diskio'}}

    # 通过最新的时间戳 来 确定磁盘的数量
    query = {'bool':{"must":{'match':{'metricset.name':'diskio'}},'must':{'match':{'@timestamp':timestamp}}}}
    sort = [{'@timestamp':{'order':'desc'}},{'system.diskio.io.time':{'order':'desc'}}]
    body={"query":query,'sort':sort}
    res = es.search(index="metricbeat155-*", body=body)

    diskio_top = res['hits']['hits']
    # print(diskio_top)
    # print(len(diskio_top)) # 磁盘的数量
    disk_name = [] # 函数返回值之一
    diskio_time = []
    total_time = 0
    # 通过循环 获得 磁盘名字和io时间!
    for hit in diskio_top:
        tmp_time = hit['_source']['system']['diskio']['io']['time']
        diskio_time.append(tmp_time)
        disk_name.append(hit['_source']['system']['diskio']['name'])
        total_time += tmp_time
    # print(diskio_time)
    # print(disk_name)
    # print(total_time)
    diskio_pct = [] # 函数返回值之一
    # 计算磁盘访问百分比
    for time in diskio_time:
        diskio_pct.append(round(time/total_time,4))
    # print(diskio_pct)
    return diskio_pct, disk_name

#read_diskio()





# ok
#占用CPU最多的前5个进程
def read_process_cpu():
    #连接elasticsearch,默认是9200
    es = Elasticsearch()
    res = es.search(index="metricbeat155-*", body={"query":{"match":{'metricset.name':'process'}},'sort':[{'@timestamp':{'order':'desc'}},{'system.process.cpu.total.pct':{'order':'desc'}}]})

    #res = es.search(index="metricbeat-*", body={"query":{"match_all":{}}},size=1)
    #print(res['hits']['hits'][0]
    #print(res)
    cup_use_top5=res['hits']['hits'][0:5] # 前5个进程
    cpu_use_top5_process = [] # 进程名字
    cpu_use_top5_pct = [] # 占用CUP百分比
    for hit in cup_use_top5:
        cpu_use_top5_process.append(hit['_source']['system']['process']['name'])
        cpu_use_top5_pct.append(hit['_source']['system']['process']['cpu']['total']['pct'])
    # print(cpu_use_top5_process)
    # print(cpu_use_top5_pct)
    return cpu_use_top5_process, cpu_use_top5_pct
# read_process_cpu()

# ok
def read_memory():
    # 连接elasticsearch,默认是9200
    es = Elasticsearch()
    body = {"query": {"match": {'metricset.name': 'memory'}},'sort': {'@timestamp': {'order': 'desc'}}}
    res = es.search(index="metricbeat155-*", body=body)

    # 以MB为单位
    cached = round(res['hits']['hits'][0]['_source']['system']['memory']['swap']['total']/1024/1024, 3)
    nonpage_bufferpool = round(res['hits']['hits'][0]['_source']['system']['memory']['actual']['used']['bytes']/1024/1024, 3)
    page_bufferpool = round(res['hits']['hits'][0]['_source']['system']['memory']['actual']['free']/1024/1024, 3)
    committed = round(res['hits']['hits'][0]['_source']['system']['memory']['used']['bytes']/1024/1024, 3)
    #print(cached, page_bufferpool, nonpage_bufferpool, committed)
    return cached, page_bufferpool, nonpage_bufferpool, committed

#read_memory()


# ok
def read_network():
    es = Elasticsearch()
    body = {"query": {"match": {'system.network.name': 'ens33'}},
            'sort': {'@timestamp': {'order': 'desc'}}}
    res = es.search(index="metricbeat155-*", body=body)
    # 取第一次
    network_out0 = res['hits']['hits'][0]['_source']['system']['network']['out']['bytes']
    network_in0 = res['hits']['hits'][0]['_source']['system']['network']['in']['bytes']
    # 取第二次
    network_out1 = res['hits']['hits'][1]['_source']['system']['network']['out']['bytes']
    network_in1 = res['hits']['hits'][1]['_source']['system']['network']['in']['bytes']
    # 做差，以KB为单位，保留3位小数
    network_out = abs(round((network_out0 - network_out1) / 1024, 3))
    network_in = abs(round((network_in0 - network_in1) / 1024, 3))
    # print('network_out=', network_out)
    # print('network_in=', network_in)
    return network_in, network_out
# read_network()

def read_file(filepath, flag):
    """
    读取文件的公共方法
    :param filepath:
    :param flag:
    :return records:
    """
    records = ""
    try:
        f = open(filepath, 'r')
        records = f.read() if flag else f.readlines()
        f.close()
    except Exception as e:
        logger.error("read file failed:", e)
    return records


def get_iotop():
    """
    获取proc文件信息
    实时获取iotop命令的输出结果
    :return io_top_five, io_five_process:
    """
    global tmp_io
    io_top_five = []
    io_five_process = []
    io_top = read_file('/tmp/iotop.txt', 0)
    if len(io_top) > 1:
        tmp_io = io_top
    else:
        io_top = tmp_io
    try:
        for i in range(5):
            details = io_top[i + 4].strip().split()
            io_top_five.append(details[9])
            io_five_process.append(details[11])
    except IOError as e:
        logger.error("ERROR : get list details failed !!")
        logger.error(e)
    return io_top_five, io_five_process


def cache_mem(data):
    """
    获取iotop命令的输出结果
    :param data:
    :return:
    """
    cpus_top_five = [0, 0, 0, 0, 0]
    memories_top_five = [0, 0, 0, 0, 0]
    process_top_five = ["apache2", "python3", "top", "iotop", "java"]
    if len(data) > 1:
        for i in range(5):
            content = data[7 + i].strip().split()  # 读取top文件的内容
            cpus_top_five.append(content[8])  # 把cpu占用率前五的占用率数值放在一个list里
            memories_top_five.append(content[9])  # 把内存占用率前五的占用率数值放在一个list里
            process_top_five.append(content[11])  # 把cpu、内存占用率前五的进程名放在一个list里
        linecache.clearcache()
    return cpus_top_five, memories_top_five, process_top_five


def execute_top():
    """
    执行top命令
    :return:
    """
    try:
        os.system('top -bw -n 1 > /tmp/top.txt')
    except Exception as e:
        logger.error("top command excute error:", e)


def get_top():
    """
    实时获取iotop命令的输出结果
    :return cpus_top_five, memories_top_five, process_top_five:
    """
    execute_top()   # 执行top命令
    cpus_top_five = []
    memories_top_five = []
    process_top_five = []
    try:
        f_data = open("/tmp/top.txt", "r")
        data = f_data.readlines()
        # 获取iotop命令的输出结果
        cpus_top_five, memories_top_five, process_top_five = cache_mem(data)
    except IOError as io_error:
        logger.error("ERROR : read iotop file failed !!")
        logger.error(io_error)
    return cpus_top_five, memories_top_five, process_top_five  # 将文件内容返回


def download():
    """
    读取/proc/net/dev文件,获取下载流量信息
    :return:
    """
    global state
    ifstat = read_file('/proc/net/dev', 0)
    for interface in ifstat:
        if gc.INTERFACE in interface:
            stat = float(interface.split()[1])
            state[0:] = [stat]


def upload():
    """
    读取/proc/net/dev文件,获取上传流量信息
    :return:
    """
    global state
    ifstat = read_file('/proc/net/dev', 0)
    for interface in ifstat:
        if gc.INTERFACE in interface:
            stat = float(interface.split()[9])
            state[1:] = [stat]


def shenji_count():
    """
    :return: count
    """
    try:
        es = Elasticsearch(CONFIG.es_server_ip_port)
        index_list = ['filebeat*', 'nisalog*', 'trustlog*']
        """
        for host in hosts:  # 生成索引列表
            index_list.append(index + host['ip'])
        """
        # 首先在es中搜索各索引全部的wafLog记录
        body = {"query": {}}
        result = es.search(index=index_list, body=body,
                           ignore_unavailable=True)  # 从es中读取
        count = result['hits']['total']
        return count
    except Exception as e:
        logger.error(e)
        return 0


def nisa_count():
    """
    :return: count
    """
    try:
        es = Elasticsearch(CONFIG.es_server_ip_port)
        index_list = ['nisalog*']
        """
        for host in hosts:  # 生成索引列表
            index_list.append(index + host['ip'])
        """
        # 首先在es中搜索各索引全部的wafLog记录
        body = {"query": {}}
        result = es.search(index=index_list, body=body,
                           ignore_unavailable=True)  # 从es中读取
        count = result['hits']['total']
        return count
    except Exception as e:
        logger.error(e)
        return 0
# coding:utf-8
"""
home.py 需要用到的辅助函数
"""
from elasticsearch import Elasticsearch
from app_fuzhou.views_utils.localconfig import JsonConfiguration

from app_fuzhou.util.RequestSimulator import RequestSimulator

jc = JsonConfiguration()
es_server_ip_port = jc.es_server_ip_port
ip = es_server_ip_port[0]["host"]
port = es_server_ip_port[0]["port"]

# print(es_server_ip_port)
# print(ip, port)
#es = Elasticsearch([{'host':'10.10.13.12','port':9200}])
# 连接elasticsearch,默认是9200
es = Elasticsearch(es_server_ip_port)

class metricbeat(object):
    def __init__(self, index):
        self.index = index

    # 读取单个节点的磁盘访问情况
    def read_diskio(self):
        # # 连接elasticsearch,默认是9200
        # es = Elasticsearch()
        global es
        # 获得最新的时间戳,以便进一步获得磁盘数量!
        body = {"query": {"match": {'metricset.name': 'diskio'}},
                'sort': {'@timestamp': {'order': 'desc'}}, 'size': 1}
        res = es.search(index=self.index, body=body)
        timestamp = res['hits']['hits'][0]['_source']['@timestamp']
        # 通过最新的时间戳 来 确定磁盘的数量
        query = {'bool': {"must": [{'match': {'metricset.name': 'diskio'}},
                          {'match': {'@timestamp': timestamp}}]}}
        sort = [{'@timestamp': {'order': 'desc'}},
                {'system.diskio.io.time': {'order': 'desc'}}]
        body = {"query": query, 'sort': sort}
        res = es.search(index=self.index, body=body)

        diskio_top = res['hits']['hits']
        disk_name = []  # 函数返回值之一
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
        diskio_pct = []  # 函数返回值之一
        # 计算磁盘访问百分比
        for time in diskio_time:
            diskio_pct.append(round(time / total_time, 4))
        # print(diskio_pct)
        return diskio_pct, disk_name

    # 读取单个节点占用cpu最多的5个进程
    def read_process_cpu(self):
        # # 连接elasticsearch,默认是9200
        # es = Elasticsearch()
        global es
        res = es.search(index=self.index,
                        body={"query": {"match": {'metricset.name': 'process'}},
                              'sort': [{'@timestamp': {'order': 'desc'}}, {
                                  'system.process.cpu.total.pct': {
                                      'order': 'desc'}}]})

        cup_use_top5 = res['hits']['hits'][0:5]  # 前5个进程
        cpu_use_top5_process = []  # 进程名字
        cpu_use_top5_pct = []  # 占用CUP百分比
        for hit in cup_use_top5:
            cpu_use_top5_process.append(
                hit['_source']['system']['process']['name'])
            cpu_use_top5_pct.append(
                hit['_source']['system']['process']['cpu']['total']['pct'])

        return cpu_use_top5_process, cpu_use_top5_pct

    # 读取单个节点内存信息
    def read_memory(self):
        # # 连接elasticsearch,默认是9200
        # es = Elasticsearch()
        global es
        body = {"query": {"match": {'metricset.name': 'memory'}},
                'sort': {'@timestamp': {'order': 'desc'}}}
        res = es.search(index=self.index, body=body)

        # 以MB为单位
        cached = round(
            res['hits']['hits'][0]['_source']['system']['memory']['swap'][
                'total'] / 1024 / 1024, 3)
        nonpage_bufferpool = round(
            res['hits']['hits'][0]['_source']['system']['memory']['actual'][
                'used']['bytes'] / 1024 / 1024, 3)
        page_bufferpool = round(
            res['hits']['hits'][0]['_source']['system']['memory']['actual'][
                'free'] / 1024 / 1024, 3)
        committed = round(
            res['hits']['hits'][0]['_source']['system']['memory']['used'][
                'bytes'] / 1024 / 1024, 3)
        return cached, page_bufferpool, nonpage_bufferpool, committed

    # 读取单个节点的网络上传和下载信息
    def read_network(self):
        # es = Elasticsearch()
        global es

        body = {"query": {'bool':
                         {"must": {'match': {'metricset.name': 'network'}},
                          'must_not': {'match': {'system.network.name': 'lo'}}
                          }
                          },
                'sort': {'@timestamp': {'order': 'desc'}}
                }
        res = es.search(index=self.index, body=body, size=1)
        # print(res['hits']['hits'])   #列表
        # print(res['hits']['hits'][0])#字典

        network_name = res['hits']['hits'][0]['_source']['system']['network']['name']
        # print(network_name)

        body = {"query": {"match": {'system.network.name': network_name}},
                'sort': {'@timestamp': {'order': 'desc'}}}
        res = es.search(index=self.index, body=body)
        # 取第一次
        network_out0 = \
        res['hits']['hits'][0]['_source']['system']['network']['out']['bytes']
        network_in0 = \
        res['hits']['hits'][0]['_source']['system']['network']['in']['bytes']
        # 取第二次
        network_out1 = \
        res['hits']['hits'][1]['_source']['system']['network']['out']['bytes']
        network_in1 = \
        res['hits']['hits'][1]['_source']['system']['network']['in']['bytes']
        # 做差，以KB为单位，保留3位小数
        network_out = abs(round((network_out0 - network_out1) / 1024, 3))
        network_in = abs(round((network_in0 - network_in1) / 1024, 3))
        return network_in, network_out


# 获取所有的索引（即获得被监控节点的个数）ok
# 因此，创建的索引名字请遵守一定的规范：如metricbeat192.168.114.155,请务必以metricbeat开头！！
# def get_indexs():
#     global ip, port
#     cmd = "curl \'" + ip + ":" + str(port) + "/_cat/indices?v\'"
#     status, output = subprocess.getstatusoutput(cmd)
#     lines = output.split('\n')
#     lines = lines[5:]  # 去掉前面无用的行
#     # print('lines=', lines)
#     indexs = []
#     for line in lines:
#         temp_list = line.split()
#         temp_str = temp_list[2]
#         if temp_str.startswith('metricbeat'):
#             indexs.append(temp_str)
#     return indexs


def get_indexs():
    global ip, port
    MAIN_URL = "http://" + ip + ":" + str(port)
    # MAIN_URL = "http://192.168.1.243:9200"
    rs = RequestSimulator(MAIN_URL)
    get_data = {'pretty': ''}
    resp = rs.get(url='/_cat/indices', params=get_data, ignore_http_error=True)
    res = resp.read().decode('utf-8')
    lines = res.split('\n')
    lines = lines[:-1]
    #print('lines=', lines)
    indexs = []
    for line in lines:
        temp_list = line.split()
        temp_str = temp_list[2]
        if temp_str.startswith('metricbeat'):
            indexs.append(temp_str)
    return indexs

# indexs = get_indexs()
# print(indexs)


# 获取多个节点磁盘访问情况(平均值)
def avg_diskio():
    indexs = get_indexs()
    length = len(indexs) #索引的个数，即：被监控节点个数
    diskio_pct_list = []
    disk_name = []
    avg_diskio_pct = []
    if length != 0:
        for i in range(length):
            #global disk_name
            node_diskio_pct, disk_name = metricbeat(indexs[i]).read_diskio()
            diskio_pct_list.append(node_diskio_pct)

        n = len(disk_name)
        for i in range(n):
            temp_sum = 0.0
            for j in range(length):
                temp_sum += diskio_pct_list[j][i]
            temp = round(temp_sum*1.0/length, 4)
            avg_diskio_pct.append(temp)

    return avg_diskio_pct, disk_name

# avg_diskio_pct, disk_name = avg_diskio()
# print('avg_diskio_pct=', avg_diskio_pct)
# print('disk_name=', disk_name)


# 获取多个节点的内存信息（平均值）
def avg_memory():
    indexs = get_indexs()
    length = len(indexs)  # 索引的个数，即：被监控节点个数
    memory_list = []
    cached, page_bufferpool, nonpage_bufferpool, committed = (0, 0, 0, 0)
    if length != 0:
        for i in range(length):
            t = metricbeat(indexs[i]).read_memory()
            memory_list.append(t)

        cached_sum = 0.0
        for i in range(length):
            cached_sum += memory_list[i][0]
        cached = round(cached_sum*1.0/length, 4)

        page_bufferpool_sum = 0.0
        for i in range(length):
            page_bufferpool_sum += memory_list[i][1]
        page_bufferpool = round(page_bufferpool_sum*1.0/length, 4)

        nonpage_bufferpool_sum = 0.0
        for i in range(length):
            nonpage_bufferpool_sum += memory_list[i][2]
        nonpage_bufferpool = round(nonpage_bufferpool_sum*1.0/length, 4)

        committed_sum = 0.0
        for i in range(length):
            committed_sum += memory_list[i][3]
        committed = round(committed_sum*1.0/length, 4)

    return cached, page_bufferpool, nonpage_bufferpool, committed

# t = avg_memory()
# print('avg_memory=', t)


# 获取多个节点的网络上传下载信息（平均值）
def avg_network():
    # return network_in, network_out
    indexs = get_indexs()
    length = len(indexs)  # 索引的个数，即：被监控节点个数
    network_in_out_list = []
    avg_network_in, avg_network_out = (0, 0)
    if length != 0:
        for i in range(length):
            t = metricbeat(indexs[i]).read_network()
            network_in_out_list.append(t)

        network_in_sum = 0.0
        for i in range(length):
            network_in_sum += network_in_out_list[i][0]
        avg_network_in = round(network_in_sum*1.0/length,4)

        network_out_sum = 0.0
        for i in range(length):
            network_out_sum += network_in_out_list[i][1]
        avg_network_out = round(network_out_sum*1.0/length, 4)
    return avg_network_in/10.0, avg_network_out/10.0

# avg_network_in, avg_network_out = avg_network()
# print('avg_network_in=', avg_network_in)
# print('avg_network_out=', avg_network_out)


# 获取多个节点占用cpu较多的5个进程
def nodes_top5_process_cpu():
    # return cpu_use_top5_process, cpu_use_top5_pct
    # t = (cpu_use_top5_process, cpu_use_top5_pct)
    indexs = get_indexs()
    length = len(indexs)  # 索引的个数，即：被监控节点个数
    process_list = []
    cpu_pct_list = []
    cpu_use_top5_process = []
    cpu_use_top5_pct = []
    if length != 0:
        for i in range(length):
            top5_process,top5_pct = metricbeat(indexs[i]).read_process_cpu()
            process_list.append(top5_process)
            cpu_pct_list.append(top5_pct)
        # 取占用cpu的百分比较高的前5个进程
        process_num = 0
        for i in range(5):
            for j in range(length):
                if process_num < 5:
                    cpu_use_top5_process.append(process_list[j][i])
                    process_num += 1
        # 取前5个进程占用cpu的百分比
        pct_num = 0
        for i in range(5):
            for j in range(length):
                if pct_num < 5:
                    cpu_use_top5_pct.append(cpu_pct_list[j][i])
                    pct_num += 1

    return cpu_use_top5_process, cpu_use_top5_pct

# cpu_use_top5_process, cpu_use_top5_pct = nodes_top5_process_cpu()
# print('cpu_use_top5_process=', cpu_use_top5_process)
# print('cpu_use_top5_pct=', cpu_use_top5_pct)

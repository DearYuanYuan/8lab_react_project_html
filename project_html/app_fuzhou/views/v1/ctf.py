"""
靶场页面所需数据，不涉及数据库修改，因此全用GET请求方式
"""

import re
import redis
from django.http import JsonResponse
from elasticsearch import Elasticsearch
from datetime import datetime, timedelta
from app_fuzhou.models import AlarmDetail, BlackboxHost, TrustLog
from app_fuzhou.util.RequestSimulator import RequestSimulator
from app_fuzhou.views_utils.logger import logger
from app_fuzhou.views_utils.utils_attack_server import get_server_status
from app_fuzhou.views_utils.global_config import JsonConfiguration
from app_fuzhou.views_utils import utils_whitelist
from django.db.models import F


jc = JsonConfiguration()
es_server_ip_port = jc.es_server_ip_port
es_ip = es_server_ip_port[0]["host"]
es_port = es_server_ip_port[0]["port"]

red = redis.Redis(jc.redis4bigchanidb_host, jc.redis4bigchanidb_port)


def get_unhealth_host():
    """
    获取异常主机
    :return:
    """
    data = []

    try:
        all_query = AlarmDetail.objects.all()
        # 因为ip可以重复，所以数据类似 [‘ip1’, 'ip1', 'ip2', 'ip3']
        original_ips = list(all_query.order_by('-create_time').values_list('ip', flat=True))
        # ip去重 最多取10个
        ips = list(set(original_ips))
        ips.sort(key=original_ips.index)
        ips = ips[0:10]
        # 遍历每个ip获取一个对象
        if ips:
            for ip in ips:
                if ip:
                    per_dict = list(all_query.filter(ip=ip).order_by('-create_time').values())[0]
                    # 如果最近一分钟没有数据，则说明主机正常
                    last_time = per_dict.get('create_time')
                    # 如果是最近1分钟的数据, 则是异常, 添加到data里. 否则不视为异常.
                    if (datetime.now() - last_time).seconds <= 60:
                        data.append(per_dict)
    except Exception as e:
        logger.error(e)
    total = len(data)
    return data, total


def unhealth_host(request):
    """
    橙色圆柱，代表不正常主机列表，返回前端的主机ip不重复，最多取10个
    :param request:
    :return: 不正常主机个数，及IP
    """

    # 返回数据
    data, total = get_unhealth_host()
    for per_data in data:
        info = eval(per_data['info'])
        per_data['file_error_path'] = info.get('file_error_path', '')
        per_data['file_error_hash'] = info.get('file_error_hash', '')
        try:
            obj = BlackboxHost.objects.filter(hostip=per_data['ip'])
            if obj.exists():
                status = obj[0].status
            else:
                status = 1
            per_data['status'] = status
        except Exception as e:
            logger.error(e)
            per_data['status'] = 1

    return JsonResponse({'code': 200, 'message': 'OK', 'data': data, 'total': total})


def protected_host(request):
    """
    被保护的主机列表
    :param request:
    :return: data里status 0表示受到保护，1表示未受到保护
    """

    # 返回数据
    data = []
    total = 0

    try:
        data = list(BlackboxHost.objects.all().values())
        total = len(data)
    except Exception as e:
        logger.error(e)

    return JsonResponse({'code': 200, 'message': 'OK', 'data': data, 'total': total})


def all_host(request):
    """
    所有的主机列表，从es中查询所有主机ip，从数据库中获取异常主机ip，根据数据库ip给所有主机加个状态（正常或异常）
    :param request:
    :return:
    """

    # 返回数据 全部主机数 异常主机数
    data = []
    all_total = 0
    unhealth_total = 0
    sys_ips = []

    # 处理异常主机
    ips = []
    items, total = get_unhealth_host()
    if total:
        for item in items:
            ips.append(item['ip'])

    # 先尝试从redis中获取数据
    # try:
    #     cache_data = red.get('all_host')
    #     if cache_data:
    #         data = eval(cache_data)[0]
    #         all_total = eval(cache_data)[1]
    #         unhealth_total = eval(cache_data)[2]
    #         for per_data in data:
    #             sys_ips.append(per_data['ip'])
    #
    #         # 如果数据库有,sys没有
    #         if total:
    #             for item in items:
    #                 if item['ip'] not in sys_ips:
    #                     data.append({'ip': item['ip'], 'name': item['hostname'], 'status': 1})
    #                     unhealth_total += 1
    #                     all_total += 1
    #
    #         return JsonResponse({'code': 200, 'message': 'OK', 'data': data,
    #                              'all_total': all_total, 'unhealth_total': unhealth_total})
    # except Exception as e:
    #     logger.error(e)
    # 根据 syslog 和 时间筛选索引
    today = datetime.now().strftime('%Y%m%d')
    try:
        # 获取所有索引index
        global es_ip, es_port
        MAIN_URL = "http://" + es_ip + ":" + str(es_port)
        # MAIN_URL = "http://192.168.1.243:9200"
        rs = RequestSimulator(MAIN_URL)
        get_data = {'pretty': ''}
        resp = rs.get(url='/_cat/indices', params=get_data, ignore_http_error=True)
        res = resp.read().decode('utf-8')
        lines = res.split('\n')
        lines = lines[:-1]

        indexs = []
        for line in lines:
            temp_list = line.split()
            temp_str = temp_list[2]
            if temp_str.startswith('syslog') and temp_str.endswith(today):
                indexs.append(temp_str)

        # 索引总数
        all_total = len(indexs)

        # 遍历索引取出每个主机名
        # 链接es
        es = Elasticsearch(es_server_ip_port)
        body = {
                "query": {
                    "match_all": {}
                        },
                "size": 1
                }

        # 异常主机数量
        unhealth_total = 0

        sys_ips = []

        for index in indexs:
            # 从es中读取
            result = es.search(index=index, body=body, ignore_unavailable=True)
            ip = result['hits']['hits'][0]['_source']['type']  # 主机ip
            sys_ips.append(ip)
            name = result['hits']['hits'][0]['_source']['host']
            status = 0  # 0代表主机正常 1代表主机异常
            if ip in ips:
                status = 1
                unhealth_total += 1
            data.append({'ip': ip, 'name': name, 'status': status})

        # 如果数据库有,sys没有
        if total:
            for item in items:
                if item['ip'] not in sys_ips:
                    data.append({'ip': item['ip'], 'name': item['hostname'], 'status': 1})
                    unhealth_total += 1
                    all_total += 1

        # 将结果存入redis
        # red.setex('all_host', [data, all_total, unhealth_total], 30)

    except Exception as e:
        logger.error(e)

    for per_data in data:
        try:
            if per_data['status'] == 1:
                for per_item in items:
                    if per_item['ip'] == per_data['ip']:
                        info = eval(per_item['info'])
                        per_data['file_error_path'] = info.get('file_error_path', '')
                        per_data['file_error_hash'] = info.get('file_error_hash', '')
            obj = BlackboxHost.objects.filter(hostip=per_data['ip'])
            if obj.exists():
                 is_protect = obj[0].status
            else:
                is_protect = 1
            per_data['is_protect'] = is_protect
        except Exception as e:
            logger.error(e)
            per_data['status'] = 1
        # is_block=1表示未阻断状态 0表示阻断状态　
        per_data['is_block'] = 1

    return JsonResponse({'code': 200, 'message': 'OK', 'data': data,
                         'all_total': all_total, 'unhealth_total': unhealth_total})


def detail_log(request):
    """
    被保护主机详细日志
    :param request: 主机ip
    :return:
    """

    # 返回数据
    message_list = []

    # 接收参数
    ip = request.GET.get('ip', '')
    # 校验
    if not ip:
        return JsonResponse({'code': 200, 'message': '请输入指定IP', 'data': message_list})

    res = re.match(r'^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$', ip)
    if res is None:
        return JsonResponse({'code': 200, 'message': 'IP不合法', 'data': message_list})

    # 根据 syslog 和 时间筛选索引
    today = datetime.now().strftime('%Y%m%d')
    index = 'syslog' + ip + '-' + today

    try:
        es = Elasticsearch(es_server_ip_port)
        body = {
            "query": {
                "bool": {
                    "must": [
                        {"match_phrase": {"_type": "sysLog"}},  # 必须匹配规则
                    ],
                }
            },
            "size": 20,
        }
        result = es.search(index=index, body=body, ignore_unavailable=True)
        data_list = result['hits']['hits']
        for data in data_list:
            message = data['_source']['message']
            message_list.append(message)
    except Exception as e:
        logger.error(e)

    return JsonResponse({'code': 200, 'message': 'OK', 'data': message_list})


def run_ctf_host_info(request):
    """
    跑这个靶场服务的主机信息
    获取流量实时统计, 磁盘写入, 磁盘读取, ipv4流入, ipv4流出,
    cpu, memory, swap, 进程总数, 磁盘利用率, vda 的数据
    :param request:
    :return:
    """

    # 返回数据 调用接口获取数据
    data = get_server_status()
    return JsonResponse({'code': 200, 'message': 'OK', 'data': data})


def syslog_incr_count(request):
    """
    每4小时产生了多少条syslog日志
    :param request:
    :return:
    """
    # 返回数据
    result_list = []

    es = Elasticsearch(jc.es_server_ip_port)  # 连接ES

    now = datetime.now()
    now_str = datetime.strftime(now, '%Y-%m-%d %H:%M:%S')  # 2018-03-19 17:28:40

    # 如果是18分钟，取10分；29九分钟取20分；40分钟取40分
    # minute = str((now.minute//10)*10)
    # if minute == '0':
    #     minute = '00'

    # 拼接字符串获取整点(10分。20分，30分...)
    # new_time = now_str[:10] + 'T' + now_str[11:14] + '00:00.000Z'  # es搜索需要的时间格式 2018-03-20T14:00:00.000Z
    return_time = datetime.strptime(now_str[:-5] + '00:00', '%Y-%m-%d %H:%M:%S')  # 将2018-03-20 14:00:00转为datetime格式

    # pre_time = new_time + '||-12h'  # 前12小时 2018-03-20T14:00:00.000Z||-10m

    # 因为要显示历史记录, 所以再取前面的五条
    for i in range(6):
        # 查询的结束时间  datetime.datetime(2018, 3, 22, 19, 00, 00)
        new_time = return_time - timedelta(hours=4 * i)

        # 查询的起始时间  datetime.datetime(2018, 3, 22, 15, 00, 00)
        pre_time = return_time - timedelta(hours=4 * (i + 1))

        # es搜索需要的时间格式 2018-03-22T19:00:00.000Z es里存的时间是-８小时
        new_time_for = datetime.strftime((new_time - timedelta(hours=8)), "%Y-%m-%dT%H:%M:%S.000Z")

        # es搜索需要的时间格式 2018-03-20T18:50:00.000Z es里存的时间是-８小时
        pre_time_for = datetime.strftime(pre_time - timedelta(hours=8), "%Y-%m-%dT%H:%M:%S.000Z")


        body = {
            "query": {
                "bool": {
                    "must": [
                        {"match_phrase": {"_type": "sysLog"}},  # 必须匹配规则
                    ],
                    "filter": {"range": {"@timestamp": {"gte": pre_time_for, "lt": new_time_for}}}  # 时间过滤器
                }
            },
        }
        try:
            result = es.search(index=['syslog*'], body=body, ignore_unavailable=True)['hits']['total']  # 从es中读取
        except Exception as e:
            logger.error(e)
            result = 0
        per_dict = {}
        per_dict[str(result)] = [datetime.strftime(pre_time, '%d日%H时'), datetime.strftime(new_time, '%d日%H时')]
        result_list.append(per_dict)

    return JsonResponse({'code': 200, 'total': result_list})


def warn_handle(request):
    """
    ctf 异常主机确认
    :param request:
    :return:
    """
    ip = request.POST.get('ip', '')
    results = []
    if not ip:
        return JsonResponse({'code': 201, 'message': '参数不完整'})
    try:
        trustlog_objs =  TrustLog.objects.filter(ip=ip)

        if trustlog_objs.exists():
            if trustlog_objs.count() > 10:
                return JsonResponse({'code': 201, 'message': "异常数据过多, 请前往'可新防护-异常确认'页面进行操作"})

            for trustlog_obj in trustlog_objs:
                result = utils_whitelist.handle_repair(trustlog_obj.ip, trustlog_obj.host, trustlog_obj.content)
                results.append(result)
        else:
            return JsonResponse({'code': 201, 'message': '异常数据不存在'})

        if not all(results):
            return JsonResponse({'code': 201, 'message': '确认失败'})

        trustlog_objs.update(state=1)

    except Exception as e:
        logger.error(e)
        return JsonResponse({'code': 201, 'message': '确认失败'})

    return JsonResponse({'code': 200, 'message': '确认成功'})




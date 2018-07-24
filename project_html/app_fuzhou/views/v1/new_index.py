"""
更新后的新首页视图
"""

import redis
import random
import datetime

from django.http import JsonResponse
from app_fuzhou.views_utils.utils_home import *
from app_fuzhou.views_utils import utils_home
from app_fuzhou.util.metricbeat import *
from app_fuzhou.views.v1.chain import __chain_node_count
from app_fuzhou.models import WhiteList, BlackboxHost, TrustLog
from app_fuzhou.views_utils.utils_attack_server import _get_watcherlab_count_info, string2time, get_watcherlab_info_limit
from app_fuzhou.views_utils import utils_waf
from elasticsearch import Elasticsearch

from app_fuzhou.views_utils.localconfig import JsonConfiguration
from app_fuzhou.views_utils.utils_waf import get_state_info_dict
from app_fuzhou.views_utils.utils_attack_server import get_server_status

jc = JsonConfiguration()  # share.json
server_ip = jc.server_ip
es = Elasticsearch(jc.es_server_ip_port)  # 连接ES

# 初始化常量类
GLOBAL_CONFIG = GlobalConf()
BUG_WEIGHT = 1
FULL_SCORE = 100


def index_score(request):
    """
    主页的分数
    :param request:
    :return json.dumps(return_dic):
    """
    return_dic = {"code": 200, "score": _get_score()}
    return JsonResponse(return_dic)


def _get_score():
    """
    获取首页分数
    :return:
    """
    count = FULL_SCORE - get_trust_log_count() * BUG_WEIGHT
    _score = count if count > 0 else 0
    return _score


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


def attack_radar(request):
    """
    返回首页五种攻击的雷达图数据
    :param request:
    :return: 如果某个攻击没有数据。设置默认值
    """
    return_dict = {}
    try:

        # 返回近7天每天的每种攻击类型的统计,和每种类型的总数统计
        week, total = utils_waf.get_waf_log_aggregations_week()
        return_dict = {}
        # return_dict["total"] = {"web-attack": 10, "sensitive-data-tracking": 0,
        #                         "identification-error": 50, "dos-attack": 15,
        #                         "http-defense": 30}
        return_dict['web-attack'] = total['web-attack'] if total['web-attack'] else 130
        return_dict['sensitive-data-tracking'] = total['sensitive-data-tracking'] if total['sensitive-data-tracking'] else 80
        return_dict['identification-error'] = total['identification-error'] if total['identification-error'] else 30
        return_dict['dos-attack'] = total['dos-attack'] if total['dos-attack'] else 70
        return_dict['http-defense'] = total['http-defense'] if total['http-defense'] else 90

    except Exception as e:
        logger.error(e)
    return JsonResponse({'code': 200, 'data': return_dict})


def get_one_log_count(alarm_type):
    """
    根据 LEVEL 类型获取一个直方图,从es中获取数据
    :param alarm_type:
    :return:
    """

    now = datetime.datetime.now()  # datetime.datetime(2018, 3, 22, 19, 5, 52, 196627)
    now_str = datetime.datetime.strftime(now, '%Y-%m-%d %H:%M:%S')  # '2018-03-22 19:05:52'

    # 如果是18分钟，取10分；29九分钟取20分；40分钟取40分
    minute = str((now.minute // 10) * 10)
    if minute == '0':
        minute = '00'

    # 拼接字符串获取整点(10分，20分，30分...)
    return_time = datetime.datetime.strptime(now_str[:-5] + minute + ':00',
                                             '%Y-%m-%d %H:%M:%S')  # 将2018-03-22 19:00:00转为datetime格式

    # 每种 LEVEL 对应的查询结果，包括12条数据
    per_data = []

    for i in range(12):
        # 查询的结束时间  datetime.datetime(2018, 3, 22, 19, 00, 00)
        new_time = return_time - datetime.timedelta(minutes=10 * i)

        # 查询的起始时间  datetime.datetime(2018, 3, 22, 18, 50, 00)
        pre_time = return_time - datetime.timedelta(minutes=10 * (i + 1))

        # es搜索需要的时间格式 2018-03-22T19:00:00.000Z
        new_time_for = datetime.datetime.strftime(new_time, "%Y-%m-%dT%H:%M:%S.000Z")

        # es搜索需要的时间格式 2018-03-20T18:50:00.000Z
        pre_time_for = datetime.datetime.strftime(pre_time, "%Y-%m-%dT%H:%M:%S.000Z")

        # es查询条件
        body = {
            "query": {
                "bool": {
                    "must": [
                        {"match_phrase": {"_type": "trustLog"}},  # 必须匹配规则
                        {"match_phrase": {"message": "[" + alarm_type + "]"}},  # 必须匹配规则
                    ],
                    # "filter": {"range": {"@timestamp": {"gte": new_time + "||-" + str((i+1)*10) + "m", "lt": new_time + "||-" + str(i*10) + "m"}}}  # 时间过滤器
                    # "filter": {"range": {"@timestamp": {"gte": "now-" + str((i+1)*10) + "m", "lt": "now-" + str(i*10) + "m"}}}  # 时间过滤器
                    "filter": {"range": {"@timestamp": {"gte": pre_time_for, "lt": new_time_for}}}  # 时间过滤器
                }
            },
        }
        try:
            # 从es中读取查询结果－查询到的总数
            count = es.search(index=['trustlog*'], body=body, ignore_unavailable=True)['hits']['total']
        except Exception as e:
            logger.error(e)
            count = 0

        # 组织返回数据 {"INFO": 2345, "time": new_time}，将一条时间段的数据加到 per_data 列表中
        result = {eval(alarm_type): count, 'time': new_time}
        per_data.append(result)

    # 将结果存入redis 过期时间为15分钟
    try:
        redis_client = redis.Redis(jc.redis4bigchanidb_host, jc.redis4bigchanidb_port)
        key = alarm_type + datetime.datetime.now().strftime('%Y-%m-%d')
        # 存之前删除原来的数据
        redis_client.delete(key)
        # 遍历该 LEVEL 类型的每条result，依次从右侧插入，即时间越近的越靠左，设置过期时间15分钟
        for data in per_data:
            redis_client.rpush(key, data)
        redis_client.expire(key, 60*15)
    except Exception as e:
        logger.error(e)

    return per_data


def get_one_log_redis(alarm_type):
    """
    先从redis获取数据，没有或不够12条则从es获取全部，如果够12条则踢掉最后一条，从0位置添加一条
    :param alarm_type:
    :return:
    """

    # 每种 LEVEL 对应的查询结果，包括12条数据
    per_data = []

    try:
        redis_client = redis.Redis(jc.redis4bigchanidb_host, jc.redis4bigchanidb_port)
        key = alarm_type + datetime.datetime.now().strftime('%Y-%m-%d')
        # 如果数据量为12,则踢出最右边的，从左侧加入新数据
        if redis_client.llen(key) == 12:
            # 根据索引获取第一个datetime
            close_date = eval(redis_client.lindex(key, 0))['time']
            # 如果不够10分钟的请求，继续用redis数据
            if (datetime.datetime.now() - close_date).seconds < 10 * 60:
                # 对redis列表进行切片，这里取全部，添加到per_data返回
                result_data = redis_client.lrange(key, 0, -1)
                for data in result_data:
                    per_data.append(eval(data))
                return per_data

            # 如果超过10分钟，查取最新的一条数据
            now_date = close_date + datetime.timedelta(minutes=10)
            # 从es查取close_date到now_date 对时间格式化
            pre_date_for = datetime.datetime.strftime(close_date, '%Y-%m-%dT%H:%M:%S.000Z')
            now_date_for = datetime.datetime.strftime(now_date, '%Y-%m-%dT%H:%M:%S.000Z')
            body = {
                "query": {
                    "bool": {
                        "must": [
                            {"match_phrase": {"_type": "trustLog"}},  # 必须匹配规则
                            {"match_phrase": {"message": "[" + alarm_type + "]"}},  # 必须匹配规则
                        ],
                        # "filter": {"range": {"@timestamp": {"gte": pre_time, "lt": new_time}}}  # 时间过滤器
                        "filter": {"range": {"@timestamp": {"gte": pre_date_for, "lt": now_date_for}}}  # 时间过滤器
                    }
                },
            }

            # 从es中读取最新的一条数据
            count = es.search(index=['trustlog*'], body=body, ignore_unavailable=True)['hits']['total']
            result = {eval(alarm_type): count, 'time': now_date}
            # 更新redis，删除最后一个 并将最新的插入到列表左端
            redis_client.brpop(key)
            redis_client.lpushx(key, result)
            result_data = redis_client.lrange(key, 0, -1)
            for data in result_data:
                per_data.append(eval(data))
        # 如果redis数据不正确，则再从es查全部数据
        else:
            per_data = get_one_log_count(alarm_type)
    except Exception as e:
        logger.error(e)
        per_data = get_one_log_count(alarm_type)
    return per_data


def log_incr_count(request):
    """
    放回前端首页三个直方图列表
    :param request:
    :return:
    """
    return_data = []
    type_list = ['"INFO"', '"WARNING"', '"ERROR"']
    for alarm_type in type_list:
        per_data = get_one_log_redis(alarm_type)
        # 更改时间的返回格式 {'time': datetime.datetime(2018, 3, 23, 18, 0), 'INFO': 10523}
        for one in per_data:
            if 'time' in one:
                one['time'] = datetime.datetime.strftime(one['time'], '%H:%M')
        return_data.append(per_data)
    return JsonResponse({'code': 200, 'total_list': return_data})


# def old_log_incr_count(request):
#     """
#     每十分钟产生了多少条LEVEL日志
#     GET trustlog192.168.1.239-*/_search
#       {
#         "query" : {
#           "bool": {
#             "must": {"match_phrase": {"message": "[WARNING]"}},
#             "filter": {"range": {"@timestamp": {"gte": "2018-03-20T14:20:00.000Z", "lt": "2018-03-20T14:30:00.000Z"}}}
#           }
#         }
#       }
#     :param request:
#     :return:
#     """
#
#     return_data = []
#
#     now = datetime.datetime.now()
#     now_str = datetime.datetime.strftime(now, '%Y-%m-%d %H:%M:%S')  # 2018-03-19 17:28:40
#
#     # 如果是18分钟，取10分；29九分钟取20分；40分钟取40分
#     minute = str((now.minute//10)*10)
#     if minute == '0':
#         minute = '00'
#
#     # 拼接字符串获取整点(10分。20分，30分...)
#     return_time = datetime.datetime.strptime(now_str[:-5] + minute + ':00', '%Y-%m-%d %H:%M:%S')  # 将2018-03-20 14:00:00转为datetime格式
#
#     type_list = ['"INFO"', '"WARNING"', '"ERROR"']
#
#     for alarm_type in type_list:
#         per_data = []
#         for i in range(12):
#             new_time = return_time - datetime.timedelta(minutes=10 * i)
#             pre_time = return_time - datetime.timedelta(minutes=10*(i+1))
#             new_time_for = datetime.datetime.strftime(new_time, "%Y-%m-%dT%H:%M:%S.000Z")  # es搜索需要的时间格式 2018-03-20T14:00:00.000Z
#             pre_time_for = datetime.datetime.strftime(pre_time, "%Y-%m-%dT%H:%M:%S.000Z")  # es搜索需要的时间格式 2018-03-20T14:00:00.000Z
#
#             body = {
#                 "query": {
#                     "bool": {
#                         "must": [
#                             {"match_phrase": {"_type": "trustLog"}},  # 必须匹配规则
#                             {"match_phrase": {"message": "[" + alarm_type + "]"}},  # 必须匹配规则
#                         ],
#                         # "filter": {"range": {"@timestamp": {"gte": new_time + "||-" + str((i+1)*10) + "m", "lt": new_time + "||-" + str(i*10) + "m"}}}  # 时间过滤器
#                         # "filter": {"range": {"@timestamp": {"gte": "now-" + str((i+1)*10) + "m", "lt": "now-" + str(i*10) + "m"}}}  # 时间过滤器
#                         "filter": {"range": {"@timestamp": {"gte": pre_time_for, "lt": new_time_for}}}  # 时间过滤器
#                     }
#                 },
#             }
#             try:
#                 result = {eval(alarm_type): es.search(index=['trustlog*'], body=body, ignore_unavailable=True)['hits']['total'],
#                           'time': new_time}  # 从es中读取
#             except Exception as e:
#                 logger.error(e)
#                 result = {eval(alarm_type): 0, 'time': new_time}
#             per_data.append(result)
#         return_data.append(per_data)
#
#
#     return JsonResponse({'code': 200, 'total_list': return_data})


def index_host_info(request):
    """
    跑这个web server的主机信息  数据暂时和ctf数据一样
    获取流量实时统计, 磁盘写入, 磁盘读取, ipv4流入, ipv4流出,
    cpu, memory, swap, 进程总数, 磁盘利用率, vda 的数据
    :param request:
    :return:
    """
    # 返回数据 调用接口获取数据
    data = get_server_status()
    return JsonResponse({'code': 200, 'message': 'OK', 'data': data})


def index_statis_info(request):
    """
    获取首页的统计信息:区块链个数.被保护的机器数等8种信息
    :param request:
    :return:
    """
    return_dic = {}
    try:
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
    except Exception as e:
        logger.error(e)
    return JsonResponse({'data': return_dic, 'code': 200})


def index_watcherlab_info(request):
    """
    首页2D地球
    :param request:
    :return: [{}]
    例如:
        [{'name': '美国', "value": "189"},
        {'name': '英国', "value": '12'}]
    """
    try:
        redis_client = redis.Redis(jc.redis4bigchanidb_host, jc.redis4bigchanidb_port)
        key = 'watcherlab_' + datetime.datetime.now().strftime('%Y-%m-%d')
        info = redis_client.get(key)
        if info:
            info = eval(redis_client.get(key))
        else:  # 如果redis中没有缓存,从ES查询计算
            info = _get_watcherlab_count_info()  # 直接把json数据存入redis
            redis_client.setex(key, info, 60 * 60 * 24)
    except Exception as e:
        logger.error(e)
        info = _get_watcherlab_count_info()
    return JsonResponse({'code': 200, 'data': info})


def index_real_log(request):
    """
    首页刷新实时日志
    :param request:
    :return:
    """
    det = get_watcherlab_info_limit(random.randint(5, 50), True)
    return JsonResponse({'data': det, 'code': 200, 'total': len(det)})


def real_log_incr(request):
    """
    首页实时日志波峰图 每10分钟统计一次
    :param request:
    :return:
    """
    return_data = []

    now = datetime.datetime.now()
    now_str = datetime.datetime.strftime(now, '%Y-%m-%d %H:%M:%S')  # 2018-03-19 17:28:40

    # 如果是18分钟，取10分；29九分钟取20分；40分钟取40分
    minute = str((now.minute // 10) * 10)
    if minute == '0':
        minute = '00'

    # 拼接字符串获取整点(10分。20分，30分...)
    # new_time = now_str[:10] + 'T' + now_str[11:14] + str(minute) + ':00.000Z'  # es搜索需要的时间格式 2018-03-20T14:00:00.000Z
    return_time = datetime.datetime.strptime(now_str[:-5] + minute + ':00',
                                    '%Y-%m-%d %H:%M:%S')  # 将2018-03-20 14:00:00转为datetime格式

    # pre_time = new_time + '||-12h'  # 前12小时 2018-03-20T14:00:00.000Z||-10m

    # 因为要显示历史记录, 所以再取前面的五条
    for i in range(6):

        # 查询的结束时间  datetime.datetime(2018, 3, 22, 19, 00, 00)
        new_time = return_time - datetime.timedelta(minutes=10 * i)

        # 查询的起始时间  datetime.datetime(2018, 3, 22, 18, 50, 00)
        pre_time = return_time - datetime.timedelta(minutes=10 * (i + 1))

        # es搜索需要的时间格式 2018-03-22T19:00:00.000Z
        new_time_for = datetime.datetime.strftime(new_time, "%Y-%m-%dT%H:%M:%S.000Z")

        # es搜索需要的时间格式 2018-03-20T18:50:00.000Z
        pre_time_for = datetime.datetime.strftime(pre_time, "%Y-%m-%dT%H:%M:%S.000Z")

        body = {
            "query": {
                "bool": {
                    "must": [
                        {"match_phrase": {"_type": "trustLog"}},  # 必须匹配规则
                    ],
                    "filter": {"range": {"@timestamp": {"gte": pre_time_for, "lt": new_time_for}}}  # 时间过滤器
                }
            },
        }
        try:
            count = es.search(index=['trustlog*'], body=body, ignore_unavailable=True)['hits']['total']  # 从es中读取
        except Exception as e:
            logger.error(e)
            count = 0
        per_dict = {}
        per_dict['count'] = count
        time = return_time - datetime.timedelta(minutes=10*i)
        per_dict['time'] = datetime.datetime.strftime(time, '%H:%M分')
        return_data.append(per_dict)

    return JsonResponse({'code': 200, 'data': return_data})


def real_network(request):
    """
    首页网络流量实时统计 暂时每10分钟统计一次
    :param request:
    :return:
    """
    # return_data = {}
    #
    # for i in range(6):
    #     index = "metricbeat" + "192.168.1.182" + "-" + datetime.datetime.now().strftime('%Y%m%d')
    #     # index = "metricbeat" + "192.168.1.182" + "-" + (datetime.now() - timedelta(minutes=10*i)).strftime('%Y%m%d')
    #     res = get_network(index)
    #     network = '%.2f' % (res['network_in'] + res['network_out'])  # 流量实时统计定义为网络流入和流出速度和
    #     time = datetime.datetime.now() - datetime.timedelta(minutes=10*i)
    #     return_data['time'] = datetime.datetime.strftime(time, '%Y-%m-%dT%H:%M:%S')
    #     return_data['network'] = network
    # return JsonResponse({'code': 200, 'data': return_data})

    # [{"time": "2018-03-23T11:20:00", "count": 9443}, {"time": "2018-03-23T11:10:00"," count": 9402},...]
    return_data = []

    # index = "metricbeat" + "192.168.1.182" + "-" + datetime.datetime.now().strftime('%Y%m%d')
    index = "metricnetworkmetricsets" + "-" + datetime.datetime.now().strftime('%Y%m%d')

    # 获取网络上传和下载速度
    for i in range(6):
        try:
            # body = {"query": {"match": {'system.network.name': 'eth0'}},
            #         'sort': {'@timestamp': {'order': 'desc'}},
            #         'size': 7}
            body = {"query": {"bool": {"must": [{"match": {"metricset.name": "network"}},
                                                {"match": {'system.network.name': 'eth0'}},
                                                {"match": {"fields.ip": server_ip}}]}},
                    'sort': {'@timestamp': {'order': 'desc'}},
                    'size': 7}
            res = es.search(index=index, body=body)
            network_info = res['hits']['hits']
            network_all, time = get_network_all(network_info, i, i + 1)
        except:
            network_all, time = 0, 0
        # 将时间加8个小时
        time = datetime.datetime.fromtimestamp(time) + datetime.timedelta(hours=8)
        return_data.append({'network_all': network_all, 'time': datetime.datetime.strftime(time, '%M:%S秒')})

    return JsonResponse({'code': 200, 'data': return_data})


def get_network_all(network_info, start, end):
    """
    根据索引获取对应时间间隔的数据，每十秒
    :param network_info:
    :param start:
    :param end:
    :return:
    """
    network_out = 0
    network_in = 0
    network_time0 = 0
    try:
        # 取第一次
        network_out0 = network_info[start]['_source']['system']['network']['out']['bytes']
        network_in0 = network_info[start]['_source']['system']['network']['in']['bytes']
        network_time0 = string2time(network_info[start]['_source']['@timestamp'])
        # 取第二次
        network_out1 = network_info[end]['_source']['system']['network']['out']['bytes']
        network_in1 = network_info[end]['_source']['system']['network']['in']['bytes']
        network_time1 = string2time(network_info[end]['_source']['@timestamp'])

        time_span = int(network_time0 - network_time1)
        time_span = 1 if time_span is 0 else time_span

        # 做差，以KB为单位，保留2位小数
        network_out = (network_out0 - network_out1) / 1024 / time_span
        network_in = (network_in0 - network_in1) / 1024 / time_span

    except Exception as e:
        logger.error(e)

    return '%.2f' % (network_in + network_out), network_time0  # 流量实时统计定义为网络流入和流出速度和








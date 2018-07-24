# encoding: utf-8
import json
import datetime
import traceback
import redis

from django.http.response import HttpResponse, JsonResponse
from itsdangerous import JSONWebSignatureSerializer

from octastack_fuzhou_web.settings import django_setup_time
from app_fuzhou.views_utils.localconfig import JsonConfiguration
from app_fuzhou.views_utils.logger import logger
from app_fuzhou.models import Alarm, AlarmDetail
from django.db.models import Count
from app_fuzhou import constants
from django.db.models import Q

jc = JsonConfiguration()

# 连接redis
red = redis.Redis(jc.redis4bigchanidb_host, jc.redis4bigchanidb_port)


def get_alarm_status(request):
    """
    @api {post} api/alarm/status/  ★获取最新的alarm报警内容
    @apiDescription 获取最新的alarm报警内容
    @apiGroup alarm
    @apiParam {string} time_delta 时间段，默认15秒
    @apiSuccessExample Success-Response:
        {
            'machine_alarm':[
                {
                    'record_time': '2018-05-09 15:30:55',
                    'alarm_type': '异常行为',
                    'count': 8111
                },
                {
                    'record_time': '2018-05-09 15:30:55',
                    'alarm_type': '系统',
                    'count': 8111
                }
            ]
            'pay_alarm': 0 0不弹购买报警，1弹
        }
    """
    results = {'machine_alarm': [], 'pay_alarm': 0}
    try:
        time_delta = int(request.POST.get('time_delta', 15))
        datetime_time_delta = datetime.timedelta(seconds=time_delta)
        beginning = datetime.datetime.now() - datetime_time_delta
        records = []
        for alarm_types in constants.ALARM_TYPES:  # 对每种类型,分别取其最新
            try:
                records.append(Alarm.objects.filter(create_time__gte=beginning)
                               .filter(alarm_type=alarm_types)  # 每种类型
                               .latest('create_time'))  # 时间过滤并取最新
            except Alarm.DoesNotExist:  # 如果这个类型没有最新值,则跳过
                continue
        for record in records:
            if record.count > 0:  # 只返回大于0的记录
                temp_dict = {'record_time': record.create_time.strftime('%Y-%m-%d %H:%M:%S'),
                             'alarm_type': constants.ALARM_TYPES.get(record.alarm_type, "Other"),
                             'count': record.count}
                results['machine_alarm'].append(temp_dict)
        results['pay_alarm'] = check_pay_alarm(jc.pay_alarm_key)
    except Exception as e:
        logger.error(e)
        logger.error(traceback.format_exc())
    finally:
        return HttpResponse(json.dumps(results))


def check_pay_alarm(key):
    # 0符合要求【已购买】，1不符合要求【未购买】
    # 至少10位
    # 回文
    # 含有"8lab"子字符串
    key_len = len(key)
    if key_len < 10:
        return 1

    if '8lab' not in key:
        return 1

    i = 0
    count = 1
    while i <= (key_len / 2):
        if key[i] == key[key_len - i - 1]:
            count = 1
            i += 1
        else:
            count = 0
            break
    if count == 1:
        return 0
    return 1

def get_alarm_records_by_count(request):
    """
    @api {get} api/alarm/get_alarm_records_by_count/  ★获取报警列表
    @apiDescription 获取报警列表
    @apiGroup alarm
    @apiParam {string} alarm_type 报警类型：-1全部,1防御系统,2异常行为,3系统,4用户画像,5区块链数据篡改
    @apiParam {string} keyword  关键字：ip或hostname
    @apiParam {string} page   页码,默认1
    @apiParam {string} size 每页条数，默认10
    @apiSuccessExample Success-Response:
        {
            'totalpage': 100,
            'curr_page':
            [
                {
                    'id': '216883',
                    'ip': '192.168.1.235',
                    'alarm_type': 2,
                    'type_info': '异常行为',
                    'hostname':'vtpm-t2',
                    'time':'2018-05-08 15:39:44'
                },
                {
                    'id': '216883',
                    'ip': '192.168.1.235',
                    'alarm_type': 3,
                    'type_info': '系统',
                    'hostname':'vtpm-t2',
                    'time':'2018-05-08 15:39:44'
                }
            ]
        }
    """
    results = {'totalpage': 0 , 'curr_page': []}
    try:
        alarm_type = int(request.GET.get('alarm_type', -1))
        keyword = request.GET.get('keyword', '')
        page = int(request.GET.get('page', 1))
        size = int(request.GET.get('size', 10))
        if keyword != ("" or None) and len(keyword) > 0:
            if alarm_type == -1:
                result = AlarmDetail.objects.filter(Q(ip__contains=keyword) | Q(hostname__contains=keyword)).order_by('-create_time').values()
            else:
                result = AlarmDetail.objects.filter(alarm_type=alarm_type).filter(Q(ip__contains=keyword) | Q(hostname__contains=keyword)).order_by('-create_time').values()
        else:
            if alarm_type == -1:
                result = AlarmDetail.objects.order_by('-create_time').values()
            else:
                result = AlarmDetail.objects.filter(alarm_type=alarm_type).order_by('-create_time').values()
        totalpage = 0
        if len(result) > 0:
            count = len(result) / 10
            totalpage = count if count == int(count) else int(count) + 1

        results['totalpage'] = totalpage
        return_dict = []
        if int(page) < totalpage:
            return_dict = result[(int(page) - 1) * int(size):int(size) * int(page)]
        else:
            return_dict = result[(int(page) - 1) * int(size):]

        for item in return_dict:
            info = {
                'id': item['id'],
                'ip': item['ip'],
                'alarm_type': item['alarm_type'],
                'type_info': constants.ALARM_TYPES.get(item['alarm_type'], "Other"),
                'hostname': item['hostname'],
                'time': str(item['create_time']),
            }
            results['curr_page'].append(info)
    except Exception as e:
        logger.error(e)
        logger.error(traceback.format_exc())
    finally:
        return HttpResponse(json.dumps(results))


def get_alarm_details(request):
    """
    @api {get} api/alarm/get_alarm_details/  ★获取单条报警详情
    @apiDescription 获取报警列表
    @apiGroup alarm
    @apiParam {string} id  序号
    @apiSuccessExample Success-Response:
        [
            {
                'id': '216883',
                'ip': '192.168.1.235',
                'alarm_type': 2,
                'type_info': '异常行为',
                'alarm_info': '{"ip":"","file_error_path":"","file_error_hash":""}',
                'hostname':'vtpm-t2',
                'time':'2018-05-08 15:39:44'
            },
            {
                'id': '216883',
                'ip': '192.168.1.235',
                'alarm_type': 3,
                'type_info': '系统',
                'alarm_info': '{"ip":"","file_error_path":"","file_error_hash":""}',
                'hostname':'vtpm-t2',
                'time':'2018-05-08 15:39:44'
            }
        ]
    """
    results = []
    try:
        detail_id = int(request.GET.get('id', 0))
        fuzhou_alarm_detail = AlarmDetail.objects.filter(id=detail_id)
        for item in fuzhou_alarm_detail:
            info = {
                'id': item.id,
                'ip': item.ip,
                'alarm_type': item.alarm_type,
                'type_info': constants.ALARM_TYPES.get(item.alarm_type, "Other"),
                'alarm_info': item.info,
                'hostname': item.hostname,
                'time': str(item.create_time),
            }
            results.append(info)
    except Exception as e:
        logger.error(e)
        logger.error(traceback.format_exc())
    finally:
        return HttpResponse(json.dumps(results))


# 从redis中获取使用时限
def get_limit_time(request):

    TIME_KEY = 'limit_dead'
    try:
        time_org = red.get(TIME_KEY)
        if not time_org:
            # 没有时间，代表服务已过期
            return JsonResponse({'status': 0, 'msg': '服务已过期, 请及时续费'})

        else:

            # 有时间，则判断是否符合标准　datetime#使用时长
            s = JSONWebSignatureSerializer('8labbal8_')
            info_list = s.loads(time_org).get('key', '')

            date_list = info_list.split('#')
            if len(date_list) != 2:
                # 日期格式不对，表示服务已过期
                return JsonResponse({'status': 0, 'msg': '服务已过期, 请及时续费'})

            else:
                start_time = date_list[0]
                time_range = date_list[1]

                start_time = datetime.datetime.strptime(start_time,'%Y-%m-%d')
                surplus_time = (datetime.datetime.now() - start_time).days
                if (surplus_time > 0) and (surplus_time > int(time_range)):
                    # 表示已过期
                    return JsonResponse({'status': 0, 'msg': '服务已过期, 请及时续费'})

                elif surplus_time < 0:
                    # 表示已过期
                    return JsonResponse({'status': 0, 'msg': '服务已过期, 请及时续费'})

                else:
                    return JsonResponse({'status': 1, 'msg': '使用正常'})
    except Exception as e:
        logger.error(e)
        return JsonResponse({'status': 0, 'msg': '服务已过期, 请及时续费'})




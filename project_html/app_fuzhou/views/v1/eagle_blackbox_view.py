# -*- coding: utf-8 -*-
"""
本模块用于 eagle日志和blackbox日志 统计分析
"""
from django.http import JsonResponse, HttpResponse
import json
from app_fuzhou.views_utils import utils_eagle
from app_fuzhou.views_utils import utils_blackbox

FILTER_TIME = 3600*24*15  # 默认取最近15天的eagle日志和blackbox日志,以妙为单位
JSONP_RETURN_FORMAT = "%s(%s)"


def get_eagle_blackbox_status(request):
    # 统计处理eagle日志,目前eagle日志只能分为2种:正常日志和报警日志
    return_dic = {}
    filter_time = request.POST.get("filter_time", FILTER_TIME)
    eagle_alarm_total = utils_eagle.get_alert_count_from_eagle(filter_time)  # 获取eagle报警日志总数
    eagle_log_total = utils_eagle.get_eagle_log_total_from_es(filter_time)  # 获取eagle日志总数(包含报警日志和正常日志)
    eagle_normal_total = eagle_log_total - eagle_alarm_total  # 计算eagle正常日志总数

    # 统计处理blackbox日志,该日志在ES中被分为5种,取出后,在本代码中被划分为3种:报警(错误)日志,可疑日志,正常日志
    blackbox_dic = utils_blackbox.get_blackbox_logs_count(filter_time)  # 获取blackbox各种级别日志数量
    # blackbox_dic = {'WARNING': 0, 'CRITICAL': 0, 'DEBUG': 0, 'ERROR': 0, 'INFO': 168}
    # 将"CRITICAL"和"ERROR"日志 视为 报警(错误)日志; "WARNING"日志视为可疑日志;其他的2种日志视为正常日志
    blackbox_alarm_total = blackbox_dic.get("CRITICAL", 0) + blackbox_dic.get("ERROR", 0)
    blackbox_suspicious_total = blackbox_dic.get("WARNING", 0)
    blackbox_normal_total = blackbox_dic.get("DEBUG", 0) + blackbox_dic.get("INFO", 0)

    # 将 eagle日志和blackbox日志 数量相加
    return_dic["alarm"] = eagle_alarm_total + blackbox_alarm_total
    return_dic["normal"] = eagle_normal_total + blackbox_normal_total
    # 从blackbox日志中获取可疑日志数
    return_dic["suspicious"] = blackbox_suspicious_total
    # 跨域:返回结果前面要加上一个回调函数的名称
    return JsonResponse(return_dic)



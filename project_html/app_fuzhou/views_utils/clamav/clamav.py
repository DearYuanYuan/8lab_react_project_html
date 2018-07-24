#!/usr/bin/env python
# coding: utf-8
"""
此模块的功能主要是提供给前段相应的接口，实现扫描病毒的相关功能
"""
import json
import os
import threading

from app_fuzhou.views_utils.logger import logger
from app_fuzhou.views_utils.localconfig import JsonConfiguration
from app_fuzhou.util import mysql_base_api
from app_fuzhou.views_utils.rpc.clamav.clamav_rpc_client import ClamavRPCClient
from app_fuzhou.views_utils.scheduler_single_instance import SchedulerSingleInstance
from app_fuzhou.models import AppFuzhouGroupIp, ClamavTaskID, TaskGroupIp, ClamavTask
from app_fuzhou.views.v1.antivirus import Scan
from app_fuzhou.models import AppFuzhouGroupIp, AppFuzhouGroup, MachineList

CONFIG = JsonConfiguration()
TYPE = "clamav"


class FileScanDetail(object):
    """
    ClamAV扫描文件的信息
    """

    def __init__(self, file="", status="", flag=0):
        """
        :param file: 文件全限定名
        :param status: 文件状态
        :param flag: 通信状态码,0表示正在扫描中,1表示扫描结束,2表示终止扫描,3表示初始化
        """
        self.file = file
        self.status = status
        self.flag = flag


def update_online(invoke_ip):
    client = None
    try:
        client = ClamavRPCClient(invoke_ip)
        return client.freshClam()
    finally:
        if client is not None:
            client.close()


def update_offline(invoke_ip, db_file_path):
    pass  # TODO 预留离线更新病毒数据库的API


def update_auto(checks):
    """
    启动自动更新，checks参数表示每天的更新频次
    :param checks: 每天更新频次
    :return: None
    """
    try:
        os.system('freshclam -d --checks=%s' % checks)
    except Exception as e:
        logger.info(e)


def clam_scan(invoke_ip, conf_str):
    client = None
    try:
        client = ClamavRPCClient(invoke_ip)
        return client.clamScan(conf_str)
    finally:
        if client is not None:
            client.close()


def stop_scan(invoke_ip):
    client = None
    try:
        client = ClamavRPCClient(invoke_ip)
        return client.stopScan()
    finally:
        if client is not None:
            client.close()


def check_version(invoke_ip):
    client = None
    try:
        client = ClamavRPCClient(invoke_ip)
        return client.checkVersion()
    finally:
        if client is not None:
            client.close()


def get_summary(invoke_ip):
    client = None
    try:
        client = ClamavRPCClient(invoke_ip)
        return client.getSummary()
    finally:
        if client is not None:
            client.close()


def suspend_scan(invoke_ip):
    client = None
    try:
        client = ClamavRPCClient(invoke_ip)
        return client.suspendScan()
    finally:
        if client is not None:
            client.close()


def resume_scan(invoke_ip):
    client = None
    try:
        client = ClamavRPCClient(invoke_ip)
        return client.resumeScan()
    finally:
        if client is not None:
            client.close()


def is_running(invoke_ip):
    client = None
    try:
        client = ClamavRPCClient(invoke_ip)
        return client.isRunning()
    finally:
        if client is not None:
            client.close()


def set_clamav_config(host_ip, config):
    """
    保存clamascan配置的参数
    :param config: 配置参数
    :return: 是否保存成功
    """
    if host_ip is None or config is None:
        return False

    execute_now(config)
    # 若相应主机IP的记录存在则更新,否则更新
    sql = "INSERT INTO system_config(host_ip, type, config) VALUES(%s, %s, %s) " \
          "ON DUPLICATE KEY UPDATE config=%s"
    conn = None
    cursor = None

    try:
        conn, cursor = mysql_base_api.sql_init(
            CONFIG.mysql_host, CONFIG.mysql_user,
            CONFIG.mysql_pass, CONFIG.mysql_database
        )
        config_str = json.dumps(config)
        mysql_base_api.sql_execute(conn, cursor, sql, [host_ip, TYPE, config_str, config_str])
        return True
    except Exception as e:
        logger.error(e)
    finally:
        if conn is not None and cursor is not None:
            mysql_base_api.sql_close(conn, cursor)

    return False


def get_scan_config(host_ip):
    """
    获取制定主机的扫描配置
    :param host_ip: 主机IP,
    :return: 配置信息
    """
    conn = None
    cursor = None
    default = "{}"

    try:
        conn, cursor = mysql_base_api.sql_init(
            CONFIG.mysql_host, CONFIG.mysql_user,
            CONFIG.mysql_pass, CONFIG.mysql_database
        )
        sql = "SELECT config FROM system_config WHERE host_ip=%s and type=%s"
        result = mysql_base_api.select_one_row(cursor, sql, [host_ip, TYPE])
        if result is None:
            return default
        return result.get('config', default)
    except Exception as e:
        logger.error(e)
    finally:
        if conn is not None and cursor is not None:
            mysql_base_api.sql_close(conn, cursor)


def execute_now(info):
    """
    保存配置时需要立即执行的方法
    :param info: 方法参数
    :return:
    """

    flag = info.get("setup_update", False)
    if not flag:
        os.system('killall freshclam')
        return

    per_frequency = info.get("per_frequency")
    if per_frequency == "":
        return

    times = int(per_frequency)
    if times > 0:
        update_auto(times)


def get_clamav_log(invoke_ip):
    """
    获取目的主机扫描日志
    :param invoke_ip: 目的主机
    :return: 目的主机扫描日志
    """
    client = None
    try:
        client = ClamavRPCClient(invoke_ip)
        return client.getClamavLog()
    finally:
        if client is not None:
            client.close()


def sayHello(invoke_ip):
    """
    判断RPC是否连通
    :param invoke_ip: 目的主机
    :return: True 连通    False 不连通
    """
    client = None
    try:
        client = ClamavRPCClient(invoke_ip)
        return client.sayHello()
    except Exception as e:
        logger.error(e)
        return False
    finally:
        if client is not None:
            client.close()


def clock_scan(ips, inters, conf_str, type=0):
    """
    任务定时扫描
    :param ips: 主机列表或主机组列表
                主机列表形式: 主机ip1#主机ip2
                主机组列表形式: 组名１#组名2#组名３
    :param type: 0表示单个主机　１表示主机组
    :param inters: interval时间间隔　日d　周w　月m
    :return: True or False
    """
    try:
        scan = Scan()
        inter_list = inters.split('#')
        target_list = ips.split('#')  # [ip1, ip2]  [组1, 组2]
        sched = SchedulerSingleInstance()
        if type == 0:
            #ids格式如 主机id1#主机id2
            for host_ip in target_list:
                # 根据host_id获取host_ip
                # ip = MachineList.objects.filter(id=host_id)[0].hostip
                # 对每个主机ip分别设置定是扫描
                # 某特定时间执行
                for inter in inter_list:
                    day_list = inter.split('_')
                    uuid = '%s-%s' % (host_ip, inter)
                    # if ClamavTaskID.objects.filter(host_id=host_id, task_uuid=uuid).exists():
                    #     continue
                    # ClamavTaskID.objects.create(ip=ip, task_uuid=uuid, config=conf_str)
                    if day_list[0] == 'd' and len(day_list) == 3:
                        # d_小时_分钟
                        sched.add_job(scan.start_scan, 'cron', day_of_week='0-6', hour=day_list[1], minute=day_list[2], id=uuid, args=[host_ip, conf_str])
                    elif day_list[0] == 'w' and len(day_list) == 4:
                        # w_周几_小时_分钟
                        sched.add_job(scan.start_scan, 'cron', day_of_week=day_list[1], hour=day_list[2], minute=day_list[3], id=uuid, args=[host_ip, conf_str])
                    elif day_list[0] == 'm' and len(day_list) == 4:
                        # m_几号_小时_分钟
                        sched.add_job(scan.start_scan, 'cron', day = day_list[1], hour = day_list[2], minute = day_list[3], id=uuid, args=[host_ip, conf_str])
                    else:
                        return False

        elif type == 1:
            #ids格式如 组名１#组名2#组名３
            # 遍历group_list分别获取 组１, 组２
            for group in target_list:
                # obj_list = '通过group获取该组所有主机列表id'
                group_obj = AppFuzhouGroupIp.objects.filter(group_id=group)
                host_ip_list = group_obj.values_list('ip', flat=True)
                group_id = group_obj[0].group_id

                for host_ip in host_ip_list:
                    for inter in inter_list:
                        day_list = inter.split('_')
                        uuid = '%s-%s-%s' % (host_ip, group_id, inter)

                        # todo:注意．．．．该上一个接口
                        # if ClamavTaskID.objects.filter(ip=ip, task_uuid=uuid).exists():
                        #     continue
                        # ClamavTaskID.objects.create(ip=ip, task_uuid=uuid, config=conf_str)

                        if day_list[0] == 'd' and len(day_list) == 3:
                            # d_小时_分钟
                            sched.add_job(scan.start_scan, 'cron', hour=day_list[1], minute=day_list[2], id=uuid, args=[host_ip, conf_str])
                        elif day_list[0] == 'w' and len(day_list) == 4:
                            # w_周几_小时_分钟
                            sched.add_job(scan.start_scan, 'cron', day_of_week=day_list[1], hour=day_list[2],
                                          minute=day_list[3], id=uuid, args=[host_ip, conf_str])
                        elif day_list[0] == 'm' and len(day_list) == 4:
                            # m_几号_小时_分钟
                            sched.add_job(scan.start_scan, 'cron', day=day_list[1], hour=day_list[2], minute=day_list[3],
                                          id=uuid, args=[host_ip, conf_str])
                        else:
                            return False
                    # t = threading.Thread(target=sched.start)
                    # t.start()
                    # sched.start()

        else:
            return False

    except Exception as e:
        logger.error(e)
        return False
    t = threading.Thread(target=sched.start)
    t.start()
    return True


def update_group_clam(group_id, add_ips_str, del_ips_str):
    """
    主机组的更新, 增加或删除　需要更新受影响主机的定时任务
    1. 根据group_id通过TaskGroupIp表获取task_id 根据task_id通过ClamavTask获取多个杀毒配置 －－杀毒参数
    2. 遍历多个ClamavTask, 分别如果没有config | time 或　ClamavTask表的state=0　则只更新主机组，不参与任务
    3. uuid = '%s-%s-%s' % (host_ip, group_id, 杀毒时间)
    4. 删除：
        4.1 根据group_id和del_ids删除AppFuzhouGroupIp里离开分组的ip
        4.2 根据group_id和uuid删除ClamavTaskID表的数据
        4.3 根据uuid删除任务
    5. 增加：
        5.1 根据group_id和app_ips增加AppFuzhouGroupIp里加入分组的ip
        5.2 增加ClamavTaskID表和开启任务　通过调用clock_scan(ips, inters, conf_str, type=0)
            ips=add_ips, inters为第一步查到的所有time(用#组合), conf_str=组的config, type=0
    :param group_id:
    :param add_ips_str: 127.0.0.1#127.0.0.2
    :param del_ips_str: 127.0.0.1#127.0.0.2
    :return:
    # 根据group_id获取到包含该组的所有任务id TaskGroupIp表 type=1
    # 根据这些任务id，获取到任务对应的confs = config和time [(cof1, time1), (cof2, time2), (cof2, time2)]
    # add_ips_str增加任务 遍历ip 拆包confs　组成uuid　调用clock_scan　type=0
    # AppFuzhouGroup 改组信息name等  AppFuzhouGroupIp增加ip到组  ClamavTaskID-暂时不动

    # del_ids_str删除任务　跟上一步差不多 遍历ip 拆包confs　组成uuid remove
    # AppFuzhouGroupIp删除ip到组 ClamavTaskID-暂时不动
    """
    # 1. 根据group_id获取到包含该组的所有任务id TaskGroupIp表 type=1
    cur_group = AppFuzhouGroup.objects.filter(id=group_id)
    if not cur_group.exists():
        return False, "主机组不存在"

    cur_group_id = cur_group[0].id
    is_tasks_exist = TaskGroupIp.objects.filter(target_id=cur_group_id, type=1, state=1)

    task_ids = list(set(list(is_tasks_exist.values_list('task_id', flat=True))))

    # 2. 根据这些任务id，获取到任务对应的confs = config和time [(cof1, time1), (cof2, time2), (cof2, time2)]
    configs = []
    for task_id in task_ids:
        task_obj = ClamavTask.objects.filter(id=task_id, state=1)[0]
        configs.append((task_obj.config, task_obj.time))

    # 3. add_ips_str增加任务 遍历ip 拆包confs　组成uuid　调用clock_scan　type=0
    add_ips_list = add_ips_str.split('#')
    for add_ip in add_ips_list:
        for config, time in configs:
            # uuid = '%s-%s-%s' % (add_id, group_id, time)
            clock_scan(add_ip, time, config, type=0)

    # 4. del_ids_str删除任务　跟上一步差不多 遍历ip 拆包confs　组成uuid remove
    sched = SchedulerSingleInstance()
    del_ips_list = del_ips_str.split('#')
    for del_ip in del_ips_list:
        for config, time in configs:
            uuid = '%s-%s-%s' % (del_ip, group_id, time)
            sched.remove_job(job_id=uuid)

        # 5. AppFuzhouGroupIp删除host_id到组 ClamavTaskID-暂时不动
        AppFuzhouGroupIp.objects.filter(group_id=group_id, ip=del_ip).delete()

    return True, "更新成功"













    # add_ips_list = add_ips_str.split('#')
    # del_ips_list = del_ips_str.split('#')
    # # 对groupip表操作 不管有无杀毒都要做的
    # for add_ip in add_ips_list:
    #     # 添加主机　
    #     AppFuzhouGroupIp.objects.update_or_create(defaults={"state": 1}, group_id=group_id, ip=add_ip)
    # for del_ip in del_ips_list:
    #     # 删除主机
    #     is_del_ip = AppFuzhouGroupIp.objects.filter(group_id=group_id, ip=del_ip, state=1)
    #     if is_del_ip.exists():
    #         is_del_ip.update(state=0)
    #
    # cla_times_query = AppFuzhouGroupTimer.objects.filter(group_id=group_id)
    # # 2. 没cla_times就没任务 或　有cla_times但是没有time数据　该主机组没有杀毒任务
    # if (not cla_times_query.exists()) or (not cla_times_query.values_list('time', flat=True)):
    #     logger.error("该主机组没有杀毒任务")
    #     return True, "操作成功"
    #
    # # 有杀毒任务时
    # # 3. uuid = '%s-%s-%s' % (host_ip, group_id, 杀毒时间) 有杀毒时间
    # cla_times = list(set(cla_times_query.values_list('time', flat=True)))  # 去重后的该组的时间列表
    # inters = '#'.join(cla_times)
    #
    # config = cur_group[0].config
    # # 增加任务
    # result = clock_scan(add_ips_str, inters, config, 0)
    #
    # # 删除任务
    # sched = SchedulerSingleInstance()
    # for del_ip in del_ips_list:
    #     for cla_time in cla_times:
    #         uuid = '%s-%s-%s' % (del_ip, cur_group[0].id, cla_time)
    #         sched.remove_job(job_id=uuid)
    #         is_task = ClamavTaskID.objects.filter(ip=del_ip, task_uuid=uuid)
    #         if is_task.exists():
    #             is_task.delete()
    #
    # logger.error("变化主机杀毒任务设置成功")
    # return result, "操作成功"












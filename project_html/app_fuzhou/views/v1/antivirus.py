#!/usr/bin/python
# -*-coding:utf-8-*-
"""
病毒扫描开始、结束、停止接口
"""
import json
import threading

from app_fuzhou.models import MachineList
from app_fuzhou.views_utils.localconfig import JsonConfiguration

from app_fuzhou.views_utils.clamav import clamav
from app_fuzhou.views_utils.logger import logger
from app_fuzhou.util import mysql_base_api

LOCAL_CONFIG = JsonConfiguration()
SCAN_KILLED = False  # 扫描进程终止标记位


class Scan(object):
    """
    此类为新版杀毒RPC 接口类, 提供病毒扫描, 终止扫描, 获取查杀日志, 判断RPC是否连通, 判断杀毒进程是否运行, 更新病毒库,
    检查病毒库版本, 挂起杀毒进程, 唤醒杀毒进程接口
    """

    def start_scan(self, invoke_ip, conf_str):
        """
        系统检查-病毒扫描
        :param invoke_ip: 目的主机
        """
        flag = clamav.is_running(invoke_ip)
        if flag:
            return True
        t = threading.Thread(target=self.clam_scan, args=(invoke_ip, conf_str))
        t.start()
        return True

    def clam_scan(self, invoke_ip, conf_str):
        """
        执行病毒扫描的线程
        :param invoke_ip:
        :return:
        """
        global SCAN_KILLED
        try:
            # 更新数据扫描标记位
            # MachineList.objects.filter(hostip=invoke_ip).update(is_scan=True)
            # 开始扫描
            result = clamav.clam_scan(invoke_ip, conf_str)
            if len(result) is not 0 and not SCAN_KILLED:
                # 将扫描日志和标记位更新
                conn, cursor = mysql_base_api.sql_init(LOCAL_CONFIG.mysql_host,
                                                       LOCAL_CONFIG.mysql_user,
                                                       LOCAL_CONFIG.mysql_pass,
                                                       LOCAL_CONFIG.mysql_database,
                                                       LOCAL_CONFIG.mysql_port)  # 初始化数据库
                # 从数据库中查询
                sql = 'update app_fuzhou_machinelist set is_scan=0,scan_log="%s" where hostip="%s"' \
                      % (result, invoke_ip)
                mysql_base_api.sql_execute(conn, cursor, sql, "")
                # 关闭数据库
                mysql_base_api.sql_close(conn, cursor)

                # MachineList.objects.filter(hostip=invoke_ip).update(
                #     scan_log=str(result), is_scan=False)
        except Exception as e:
            logger.error(e)
        finally:
            try:
                MachineList.objects.filter(hostip=invoke_ip).update(is_scan=False)
            except Exception as e:
                logger.error(e)

    def stop_scan(self, invoke_ip):
        """
        系统检查-终止扫描
        :param invoke_ip: 目的主机
        """
        global SCAN_KILLED
        # 终止前检查扫描进程是否运行
        flag = clamav.is_running(invoke_ip)
        if not flag:
            return True
        SCAN_KILLED = True
        # 终止运行扫描进程
        clamav.stop_scan(invoke_ip)
        # 将数据库中的标记位更新
        try:
            MachineList.objects.filter(hostip=invoke_ip).update(is_scan=False)
            SCAN_KILLED = False
        except Exception as e:
            logger.error(e)
        return True

    def get_clamav_log(self, invoke_ip):
        """
        系统检查-获取查杀日志
        :param invoke_ip: 目的主机
        :return: clamav 扫描摘要信息
        """
        # 获得远程主机最近一次扫描日志摘要
        result = clamav.get_clamav_log(invoke_ip)
        # 将日志摘要更新
        try:
            MachineList.objects.filter(hostip=invoke_ip).update(scan_log=str(result))
        except Exception as e:
            logger.error(e)
        return result

    def say_hello(self, invoke_ip):
        """
        判断RPC是否连通
        :param invoke_ip: 目的主机
        :return: True 连通    False 不连通
        """
        flag = clamav.sayHello(invoke_ip)
        return flag

    def is_running(self, invoke_ip):
        """
        判断杀毒进程是否运行
        :param invoke_ip: 目的主机
        :return: True 正在运行  False 没有运行
        """
        flag = clamav.is_running(invoke_ip)
        if flag:
            return True
        return False

    def update(self, invoke_ip):
        """
        更新病毒库
        :param invoke_ip: 目的主机
        """
        clamav.update_online(invoke_ip)
        return True

    def check_version(self, invoke_ip):
        """
        检查病毒库版本
        :param invoke_ip: 目的主机
        :return: True 需要更新, False 不需要更新
        """
        result = json.loads(clamav.check_version(invoke_ip))
        flag = result.get('checkUpdate', False)
        return flag

    def suspend_scan(self, invoke_ip):
        """
        挂起杀毒进程
        :param invoke_ip: 目的主机
        :return: True 挂起成功  False 挂起失败
        """
        result = json.loads(clamav.suspend_scan(invoke_ip))
        flag = result.get('result', False)
        return flag

    def resume_scan(self, invoke_ip):
        """
        唤醒杀毒进程
        :param invoke_ip: 目的主机
        :return: True 唤醒成功  False 唤醒失败
        """
        result = json.loads(clamav.resume_scan(invoke_ip))
        flag = result.get('result', False)
        return flag

    # def get_conf_str(self, invoke_ip, conf_str):
    #     """
    #     发送扫描配置
    #     :param invoke_ip:
    #     :param conf_str:
    #     :return:
    #     """
    #     result = json.loads(clamav.get_conf_str(invoke_ip, conf_str))
    #     flag = result.get('result', False)
    #     return flag


#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
example.py - 2011.11.09

Author : Alexandre Norman - norman@xael.org
Contributor: Steve 'Ashcrow' Milner - steve@gnulinux.net
Licence : GPL v3 or any later version


This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.

"""

import sys
import nmap
import json
from app_fuzhou.models import SystemConfig

from app_fuzhou.util import mysql_base_api
from app_fuzhou.views_utils.logger import logger
from app_fuzhou.views_utils.localconfig import JsonConfiguration

CONFIG = JsonConfiguration()
TYPE = "scan_port"


def black_box_port_scanner(ip_address, port):
    """
    黑盒子进行端口扫描
    :param ip_address: 整型或字符型的IP地址范围
    :param port: 端口范围
    :return:每个主机上扫描到的端口状态
    """

    try:
        scanner = nmap.PortScanner()  # 创建端口扫描对象
        scanner.scan(hosts=ip_address, arguments=' -v -sS -p ' + port, sudo=True)  # scan host, ports from ALL
    except nmap.PortScannerError as e:
        logger.error(e)
        sys.exit(1)
    except Exception as e:
        logger.error(e)
        sys.exit(1)

    info = {}
    for host in scanner.all_hosts():
        logger.debug("host : %s (%s)" % (host, scanner[host].hostname()))
        logger.debug("state : %s" % scanner[host].state())

        info['host'] = host + ('(%s)' % scanner[host].hostname())
        info['state'] = scanner[host].state()

        for proto in scanner[host].all_protocols():
            logger.debug('protocol : {0}'.format(proto))
            info['protocol'] = format(proto)

            lport = list(scanner[host][proto].keys())
            lport.sort()
            details = list()
            for port in lport:
                detail = {}
                logger.debug('port : {0}\tstate : {1}'.format(port, scanner[host][proto][port]['state']))
                detail['port'] = format(port)
                detail['status'] = format(scanner[host][proto][port]['state'])
                details.append(detail)

            info['details'] = details

    info['csv'] = scanner.csv()
    return info


def set_scanport_config(host_ip, config):
    """
    设置端口扫描的配置
    :return: 是否设置成功
    """
    # 92-95 88888
    # sql = "INSERT INTO system_config(host_ip, type, config) VALUES(%s, " \
    #       "%s, %s) ON DUPLICATE KEY UPDATE config=%s"
    # conn = None
    # cursor = None

    try:
        # 99-103 88888
        # conn, cursor = mysql_base_api.sql_init(
        #     CONFIG.mysql_host, CONFIG.mysql_user,
        #     CONFIG.mysql_pass, CONFIG.mysql_database
        # )
        # mysql_base_api.sql_execute(conn, cursor, sql, [host_ip, TYPE, config, config])
        SystemConfig.objects.update_or_create(host_ip=host_ip, type=TYPE, defaults={'config': config})
        # 相当于先去 get(host_ip=host_ip, type=TYPE) 如果存在更新 config
        # 不存在 create(host_ip=host_ip, type=TYPE, config=config)
        return True
    except Exception as e:
        logger.error(e)
        return False
    # 112-115 88888
    # finally:
    #     if conn is not None and cursor is not None:
    #         mysql_base_api.sql_close(conn, cursor)
    # return False


def get_scanport_config(host_ip):
    """
    获取端口扫描的配置
    :return: 扫描端口相关配置
    """

    # conn = None
    # cursor = None
    default = "{}"

    try:
        # 130-135 88888
        # conn, cursor = mysql_base_api.sql_init(
        #     CONFIG.mysql_host, CONFIG.mysql_user,
        #     CONFIG.mysql_pass, CONFIG.mysql_database
        # )
        # sql = "SELECT config FROM system_config WHERE host_ip=%s AND type=%s"
        # result = mysql_base_api.select_one_row(cursor, sql, [host_ip, TYPE])
        result = SystemConfig.objects.filter(host_ip=host_ip, type=TYPE).values('config')[0]

        if result is None:
            return default
        return result.get('config', default)
    except Exception as e:
        logger.error(e)
    # 144-146 88888
    # finally:
    #     if conn is not None and cursor is not None:
    #         mysql_base_api.sql_close(conn, cursor)


def scan_port(ip, port_range):
    """
　　对指定IP的主机的指定端口范围进行扫描
    :param ip: 主机IP，形如：127.0.0.1
    :param port_range: 扫描的端口范围
    :return: 该IP主机的端口信息
    """
    try:
        info = black_box_port_scanner(ip, port_range)
        return info
    except Exception as e:
        logger.error(e)


def scan_port_all(host_ip):
    """
    扫描所有指定主机的所有制定端口
    :return: 扫描结果
    """

    config = eval(get_scanport_config(host_ip))
    result = {}
    if not config:
        return result
    ip_start = _ip2int(config.get("ip_start"))
    ip_end = _ip2int(config.get("ip_end"))
    port_range = "%s-%s" % (config.get("port_start", 0), config.get("port_end", 65535))

    for ip in range(ip_start, ip_end):
        result[_int2ip(ip)] = scan_port(str(ip), port_range)
    return result


def _ip2int(ip):
    """
    将IP地址转换成整形
    :param ip: 标准格式IP地址
    :return: 整形IP
    """
    if ip is "":
        return _ip2int("127.0.0.1")
    part = [int(x) for x in ip.split(".")]
    int_ip = (part[0] << 24) + (part[1] << 16) + (part[2] << 8) + part[3]
    return int_ip


def _int2ip(int):
    part = ["", "", "", ""]
    part[0] = str((int & 0xFF000000) >> 24)
    part[1] = str((int & 0xFF0000) >> 16)
    part[2] = str((int & 0xFF00) >> 8)
    part[3] = str(int & 0xFF)
    return ".".join(part)

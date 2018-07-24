#!/usr/bin/python
# coding=utf-8
"""
    解析 waflog日志 攻击ip 的信息
"""

import os
import subprocess
import time
import re

from app_fuzhou.views_utils.service.queryip.wafrules import Rules
from app_fuzhou.views_utils.logger import logger
from app_fuzhou.views_utils.localconfig import JsonConfiguration
from app_fuzhou.views_utils.service.attack_ip_server import save_attack_ip
from app_fuzhou.views_utils.service.queryip.GeoLite2_Instance import GeoLiteInstance

jc = JsonConfiguration()


class IPContent(object):
    """
    描述IP content信息的格式

    """
    def __init__(self, source, source_dimension, des, des_dimension, attack_type, attack_time):
        self.source = source
        self.source_dimension = source_dimension
        self.des = des
        self.des_dimension = des_dimension
        self.attack_type = attack_type
        self.attack_time = attack_time


class Dimension(object):
    """
    根据单独取出的经纬度整合成结构
    longitude:经度
    latitude:纬度
    """

    def __init__(self, longitude, latitude):
        self.x = longitude
        self.y = latitude


# 主函数
class MainIP:
    """
    发送IP和经纬度信息给后台并将更新存入数据库

    """
    def __init__(self):
        # 最开始读取的行数
        self.old_line_num = 0
        # 发送给server的IP_DIMEN对应关系
        self.ip_send_list = []

        # IP信息的结构
        # 将MMDB的数据库加载到内存
        self.reader = {}

        self.attack_time = 0
        self.source_ip = 0
        self.source_port = 0
        self.des_ip = 0
        self.des_port = 0
        self.source = 0
        self.des = 0
        self.source_dimension = 0
        self.des_dimension = 0
        self.attack_type = 0

        # 日志文件配置
        self.ip_log_path = jc.ip_log_path

        # 日志判断
        self.head = re.compile(r"--.*-A--")
        self.type = re.compile(r"--.*-H--")
        self.end = re.compile(r"--.*-Z--")
        self.intranet_ip = re.compile(
            r"^((192\.168|172\.([1][6-9]|[2]\d|3[01]))(\.([2][0-4]\d|[2][5][0-5]|[01]?\d?\d)){2}"
            r"|10(\.([2][0-4]\d|[2][5][0-5]|[01]?\d?\d)){3})|127.0.0.1$")

        # 其他配置
        self.SEND_SLEEP = 2
        self.MAX_IP = 1000

        # 初始化mmdb
        self.init_db()

    def init_db(self):
        try:
            self.reader = GeoLiteInstance().get_db()
        except FileNotFoundError as e:
            self.send_error()

    def get_dimension(self, ip):
        """
        调用API查询IP对应的经纬度

        :param ip: 要查询经纬度的IP
        :return: 成功返回dict类型的对应信息。返回-1：数据库被损坏或正在更新
        """
        logger.info("searching" + ip)
        try:
            ip_dimension = self.reader.get(ip)
        except ValueError as e:
            logger.error("wrong ip")
            longitude = "-97.822"
            latitude = "37.751"
            dimension = Dimension(longitude, latitude).__dict__
            return dimension
        else:
            assert isinstance(ip_dimension, object)
            if ip_dimension == None:
                longitude = "-97.822"
                latitude = "37.751"
            else:
                ip_dimension = ip_dimension['location']
                longitude = str(ip_dimension['longitude'])
                latitude = str(ip_dimension['latitude'])
            dimension = Dimension(longitude, latitude).__dict__
            logger.info(dimension)
            return dimension

    def get_ip(self, tmp_ip):
        self.attack_time = tmp_ip[0] + tmp_ip[1]
        self.source_ip = tmp_ip[3]
        self.source_port = tmp_ip[4]
        self.des_ip = tmp_ip[5]
        self.des_port = tmp_ip[6]
        self.source = self.source_ip + ':' + self.source_port
        self.des = self.des_ip + ':' + self.des_port

    def get_dimension_info(self):
        self.source_dimension = self.get_dimension(self.source_ip)
        self.des_dimension = self.get_dimension(self.des_ip)

    def get_attack_type(self, cont):
        for w in range(len(cont)):
            if cont[w].find("[file") != -1:
                rule = cont[w + 1].split("/")[-1].strip("]").strip("\"")
                if rule in Rules['BASE_RULES']:
                    self.attack_type = "http-defense"
                    break
                if rule in Rules['EXPERIMENTAL_RULES']:
                    self.attack_type = "web-attack"
                    break
                if rule in Rules['OPTIONAL_RULES']:
                    self.attack_type = "sensitive-data-tracking"
                    break
                if rule in Rules['SLR_RULES']:
                    self.attack_type = "identification-error"
                    break
                if rule in Rules['DOS_RULES']:
                    self.attack_type = "dos-attack"
                    break
                else:
                    self.attack_type = "http-defense"
                    break
        if self.attack_type == 0:
            self.attack_type = "http-defense"

    def send_error(self):
        """
        打开数据库失败，返回错误信息
        :return: None
        """
        logger.error("the GeoLite2-City.mmdb is corrupt or invalid")


    def read_update(self, content):
        """
        读取更新的日志记录的IP信息，放入发送IP和写DB的两个队列

        :param dif_line_num: 更新的日志行数
        :return: None
        """
        i = 0
        # command = 'tail -n ' + str(dif_line_num) + ' ' + self.ip_log_path
        # (status, output) = subprocess.getstatusoutput(command)
        output = content.split('\n')
        logLength = len(output)

        for i in range(0, logLength):
            line = output[i]
            head_match = self.head.findall(line)
            if head_match and i + 1 < logLength:
                tmp_ip = output[i + 1]
                tmp_ip = tmp_ip.split()
                self.get_ip(tmp_ip)

                source_match = self.intranet_ip.findall(self.source_ip)
                des_match = self.intranet_ip.findall(self.des_ip)
                if source_match or des_match:
                    assert isinstance(logger, object)
                    logger.error(
                        self.source_ip + " " + self.des_ip + "是内网IP地址，无法解析")
                else:
                    self.get_dimension_info()
                    while i + 1 < logLength:
                        temp_head = i + 1
                        temp_line = output[temp_head]
                        type_match = self.type.findall(temp_line)
                        end_match = self.end.findall(temp_line)
                        if type_match and temp_head + 1 < logLength and output[temp_head + 1].find("[file \"/") != -1:
                            cont = output[temp_head + 1].split()
                            self.get_attack_type(cont)
                            logger.info(self.attack_type)
                        if end_match:
                            self.attack_type = "http-defense"
                            logger.debug("no file so http")
                        if self.attack_type != 0:
                            break
                        else:
                            i += 1
                    self.ip_send_list.append(
                        IPContent(self.source, self.source_dimension,
                                  self.des,
                                  self.des_dimension, self.attack_type,
                                  self.attack_time).__dict__)
                    self.attack_type = 0
        #保存 攻击ip 地址到数据库
        save_attack_ip(self.ip_send_list)


    def read_file(self):
        """
        检查日志所更新的行数，传递给读取更新的函数
        :return: None
        """
        dif_line_num = 0
        command = 'cat ' + self.ip_log_path + ' | wc -l'
        (status, output) = subprocess.getstatusoutput(command)
        output = int(output)
        if output > self.old_line_num:
            dif_line_num = output - self.old_line_num
            self.old_line_num = output
            logger.info("ip info is increasing by:" + str(dif_line_num))
        elif output == self.old_line_num:
            logger.info("ip info not refresh")
            return
        elif (output < self.old_line_num) and (output > 0):
            dif_line_num = output
            logger.info("ip info begin a new file by:" + str(dif_line_num))
        if dif_line_num > self.MAX_IP:
            dif_line_num = self.MAX_IP
        self.read_update(dif_line_num)


    def queryip(self):
        """
            开始解析log日志, 分析ip信息
        :return: None
        """
        logger.info("begin to queryip attack ip info...")

        if os.path.exists(self.ip_log_path):
            while True:
                self.read_file()
                time.sleep(2)
        else:
            logger.error("ip_log file doesn't exist")
            exit(0)


    def begin(self):
        """
            开始执行程序,先初始化数据库，再开始发送
        :return: None
        """
        logger.info("main_ip start")
        self.init_db()
        self.queryip()

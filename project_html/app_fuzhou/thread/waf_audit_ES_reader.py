#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
本例用来从ElasticSearch中读取waf&audit状态,线程运行
Author waf_audit_msg_receiver.py & YangZe
Date 2017-4-24
"""
import time
import re
import datetime
import json

from threading import Thread
from elasticsearch import Elasticsearch

from app_fuzhou.views_utils.localconfig import JsonConfiguration
from app_fuzhou.views_utils.global_config import GlobalConf
from app_fuzhou.views_utils.logger import logger
from app_fuzhou.views_utils.service.queryip.query_ip_server import MainIP
# from app_fuzhou.util import octa_bdb_api
from app_fuzhou.util import mysql_base_api


GLOBAL_CONFIG = GlobalConf()
LOCAL_CONFIG = JsonConfiguration()  # share.json

# 初始化 geolite2
QUERY_IP_INSTANCE = MainIP()


class ReadWafAuditFromES(Thread):
    """
    审计和防火墙信息接收端
    """
    WAF_FIREWALL = 1  # 防火墙日志信息
    AUDIT_LOG = 2  # 审计日志信息

    RE_AUDIT_HEAD = re.compile(r"msg-type")
    KEY_SINGLE = ["date", "user", "host", "query"]
    KEY_OBJECTS = "objects"
    KEY_NEST = ["db", "name"]

    HEAD = re.compile(r"--.*-A--")
    MID_B = re.compile(r"--.*-B--")
    MID_H = re.compile(r"--.*-H--")
    END = re.compile(r"--.*-Z--")

    interception_sums = 0
    waf_log_list = []  # waf日志
    waf_log_list_capacity = 1000  # waf_log_list容量
    state_info_dict = dict()  # 防火墙状态
    audit_content = {}  # audit日志内容
    audit_content_capacity = 1000  # audit_content容量
    # records_loc = {}  # 时间坐标

    def __init__(self, index, es_config=None):
        """
        构造方法
        :param index: index名称
        :param es_config: es集群配置文件,[{}]格式
        """
        super(ReadWafAuditFromES, self).__init__()
        # 连接elasticsearch,默认是9200
        self.read_audit_size = 10  # es获取数据最大值为10000,超过报错
        self.read_waf_size = 10  # es获取数据最大值为10000,超过报错
        if not es_config:
            es_config = [{'host': 'localhost', 'port': 9200}]
        self.es = Elasticsearch(es_config)
        self.index = index
        ReadWafAuditFromES._init_params()

    @classmethod
    def _init_params(cls):
        """
        初始化变量
        :return:
        """
        hosts = LOCAL_CONFIG.client_audit_hosts
        cls.state_info_dict = {"intercepted": 0, "unrecognized": 0}
        for host in hosts:
            cls.audit_content[host['ip']] = []

    def run(self):
        # logger.debug("=========Thread ReadWafAuditFromES start running========")
        hosts = LOCAL_CONFIG.client_audit_hosts
        while True:
            try:
                # index 按照ip区分
                for host in hosts:
                    # logger.debug("==================访问IP" + host['ip'] + "==================")
                    # 1.获取对应ip的最新audi数据,如果有则返回数据,没有返回-1
                    content = self._read_audit_from_es(host['ip'])
                    if content != -1:
                        # 如果有新数据数据, 则将格式化后的数据暂存在线程的变量里
                        ReadWafAuditFromES._handle_audit_log_info(host['ip'], content)
                        # 写入到Bigchaindb
                        # ReadWafAuditFromES._save_2_bdp_mysql(content, host['ip'])
                    # 2.获取对应ip的最新waf数据,如果有保存到变量里并返回数据,没有返回-1
                    content = self._read_waf_from_es(host['ip'])  # 时间坐标
                    if content != -1:
                        # 如果有新数据数据, 分析攻击ip
                        QUERY_IP_INSTANCE.read_update(content)
            except Exception as e:
                logger.error(e)
            time.sleep(3)  # 暂停3秒

    def _read_audit_from_es(self, ip):
        """
        从es中与ip对应的index中,检索最新记录,如果有最新的日志信息,则进行匹配，得到想要的字段
        :param: ip字符串
        :return: 成功返回日志列表，失败返回-1
        """
        dam_log = []
        log_num = 1
        # 筛选类型:mysqlAudit日志
        body = {"query": {"term": {"_type": "mysqlAudit"}},  # 类型固定为mysqlAudit
                "size": self.read_audit_size,
                "sort": {"@timestamp": "desc"}}  # 降序获取最新size条记录
        result = self.es.search(index=self.index+ip, body=body)  # 从es中读取
        # logger.debug("========================mysqlAudit result=========================")
        # 错误处理
        _result = result['hits']['hits'][::-1]  # 转换为升序
        # logger.debug("获取记录数目:"+str(len(_result)))
        # logger.debug("获取记录内容:"+str(_result))
        if len(_result):  # 有新数据
            for hit in _result:
                try:
                    # 对每一条日志进行关键词匹配,并返回全部字典
                    log_dict = json.loads(hit['_source']['message'])
                    log_parser = {}
                    if len(log_dict) == 0:
                        continue

                    for key in ReadWafAuditFromES.KEY_SINGLE:  # K_SINGLE = ["date", "user", "host", "query"]
                        if key in log_dict:
                            if key == "date":
                                log_dict[key] = int(log_dict[key])
                                log_parser[
                                    key] = datetime.datetime.fromtimestamp(
                                    log_dict[key] / 1000.0) \
                                    .strftime('%Y-%m-%d %H:%M:%S')
                            else:
                                log_parser[key] = log_dict[key]
                        else:
                            log_parser[key] = ""
                    if ReadWafAuditFromES.KEY_OBJECTS in log_dict:
                        for key in ReadWafAuditFromES.KEY_NEST:
                            for one_obj in log_dict[ReadWafAuditFromES.KEY_OBJECTS]:
                                if key in one_obj:
                                    log_parser[key] = one_obj[key]
                    for key in ReadWafAuditFromES.KEY_NEST:
                        if key not in log_parser:
                            log_parser[key] = ""
                    dam_log.append(log_parser)
                    log_num += 1
                except Exception as e:
                    logger.error(e)
                    return -1
            return dam_log
        else:
            return -1

    @classmethod
    def _handle_audit_log_info(cls, ip, content):
        cls.audit_content[ip] += content
        len_audit_content = len(cls.audit_content[ip])
        if len_audit_content > cls.audit_content_capacity:  # audit_log 缓存大小不超过capacity
            cls.audit_content[ip] = cls.audit_content[ip][len_audit_content-cls.audit_content_capacity:]  # 只存最新

    def _read_waf_from_es(self, ip):
        """
        读取最新的5条waf日志

        :return:成功返回日志行，失败返回-1
        """
        # 筛选类型:modsec_audit.log日志
        body = {"query": {"term": {"_type": "wafLog"}},
                "size": self.read_waf_size,
                "sort": {"@timestamp": "desc"}}  # 升序排列, size最大1万
        result = self.es.search(index=self.index + ip, body=body)  # 从es中读取
        # logger.debug("========================wafLog result=========================")
        if len(result['hits']['hits']) == 0:
            # logger.debug("wafLog Empty")
            return -1
        recognized_interception = 0  # 拦截数
        logs = {}
        inter_time = []  # 日志中的时间
        defend_type = []  # 防御类型
        inter_source = []  # 攻击源ip
        inter_tool = []  # 攻击工具
        one_interception = False
        interception_recorded = False
        message = ""
        waf_content_list = result['hits']['hits'][::-1]
        interception_sums = 0  # 读取的数据可能有重叠也可能有跳过,该字段
        for hit in waf_content_list:
            one_record = hit['_source']['message'].split('\n')
            i = 0
            while i < len(one_record):
                line = one_record[i]  # 每一行数据
                if (not one_interception) and ReadWafAuditFromES.HEAD.findall(line):  # 正确表达式r"--.*-A--"
                    interception_sums += 1  # 拦截总数+1
                    inter_time.append(one_record[i+1].split()[0].strip("["))  # 记录拦截时间
                    inter_source.append(one_record[i+1].split()[3])  # 记录拦截ip
                    one_interception = True  # 进入一条记录
                    i += 1  # 下一行数据已记录
                elif ReadWafAuditFromES.MID_H.findall(line):  # 正确表达式r"--.*-H--"
                    self._handle_type(one_record[i+2], defend_type)  # 处理下一行
                    i += 2  # 下一行数据已记录
                elif line.find("Referer") != -1:  # 如果找到Referer
                    recognized_interception += 1  # 识别的拦截数+1
                    inter_tool.append(line.split(":")[1])  # 记录攻击工具
                    interception_recorded = True  # 本条攻击工具已记录
                elif one_interception and ReadWafAuditFromES.END.findall(line):  # 正确表达式r"--.*-Z--"
                    if not interception_recorded:  # 如果仍在一条记录内,且攻击还没有被记录
                        inter_tool.append("unknow_tool")  # 则记录攻击工具为unknow_tool
                    one_interception = False  # 设别到"Z",退出一条记录
                    interception_recorded = False  # 记录位清空
                i += 1
            message = message + hit['_source']['message']
        # logger.info("记录总数%s 防御数%s 识别攻击数%s", len(inter_time), len(defend_type), len(inter_tool))
        for i in range(len(inter_time)):  # 把每条记录中提取的值都存进入waf_log_list
            logs["inter_time"] = inter_time[i]
            logs["defend_type"] = defend_type[i]
            logs["inter_source"] = inter_source[i]
            logs["inter_tool"] = inter_tool[i]
            logs["inter_ip"] = ip
            ReadWafAuditFromES.waf_log_list.append(logs)
        len_waf_log_list = len(ReadWafAuditFromES.waf_log_list)  # 存完以后
        max_len = ReadWafAuditFromES.waf_log_list_capacity
        if len_waf_log_list > max_len:  # 如果数量大于100条(存在内存中)
            ReadWafAuditFromES.waf_log_list = ReadWafAuditFromES.waf_log_list[len_waf_log_list-max_len:]  # 则只保留后面100条
        unrecognized = interception_sums - recognized_interception  # 未识别数
        ReadWafAuditFromES.interception_sums += interception_sums
        ReadWafAuditFromES.state_info_dict["intercepted"] = recognized_interception  # 识别数+
        ReadWafAuditFromES.state_info_dict["unrecognized"] = unrecognized  # 未识别数+
        return message

    @staticmethod
    def _handle_type(line, defend_type):
        if line.find("[file \"/") != -1:
            cont = line.split()
            for w in range(len(cont)):
                if cont[w].find("[file") != -1:
                    rule = cont[w+1].split("/")[-1].strip("]").strip(
                        "\"")
                    if rule in GLOBAL_CONFIG.RULES['BASE_RULES']:
                        defend_type.append("wafhttp")
                    if rule in GLOBAL_CONFIG.RULES['EXPERIMENTAL_RULES']:
                        defend_type.append("wafweb")
                    if rule in GLOBAL_CONFIG.RULES['OPTIONAL_RULES']:
                        defend_type.append("wafdataFllow")
                    if rule in GLOBAL_CONFIG.RULES['SLR_RULES']:
                        defend_type.append("waferrorCheck")
                    if rule in GLOBAL_CONFIG.RULES['DOS_RULES']:
                        defend_type.append("wafdos")
                    else:
                        defend_type.append("wafhttp")
        else:
            defend_type.append("wafhttp")

    # @classmethod
    # def audit_log(cls, ip):
    #     return cls.audit_content[ip]

    @classmethod
    def get_waf_log(cls, flag):
        log_list = []
        offset = 1
        for log in cls.waf_log_list:  # waf_log_list里存的是207行附近的logs,是一个字典
            timestamp = int(round(time.time() * 1000))
            log["id"] = timestamp * 10 + offset
            offset += 1
            if flag == log["defend_type"]:
                log_list.append(log)
        return log_list, cls.interception_sums

    @classmethod
    def get_state_info_dict(cls):
        return cls.state_info_dict


if __name__ == "__main__":
    index_name = "filebeat"
    config = [{'host': '192.168.1.243', 'port': 9200}]
    ReadWafAuditFromES(index_name, config).start()  # 测试!!!!

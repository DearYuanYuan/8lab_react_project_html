import json
import time

from threading import Thread

from app_fuzhou.views_utils.localconfig import JsonConfiguration
from app_fuzhou.views_utils.global_config import GlobalConf
from app_fuzhou.views_utils.logger import logger
from app_fuzhou.util import mysql_base_api
from app_fuzhou.views_utils.service.queryip.query_ip_server import MainIP


GLOBAL_CONFIG = GlobalConf()
LOCAL_CONFIG = JsonConfiguration()

#初始化 geolite2
# QUERY_IP_INSTANCE = MainIP()


class WafAuditMsgReceiver(Thread):
    """
    审计和防火墙信息接收端
    """
    WAF_FIREWALL = 1  # 防火墙日志信息
    AUDIT_LOG = 2  # 审计日志信息
    WAF_FIREWALL_RULE = 5  # 防火墙规则
    USER_WHITELIST = 6  # 用户白名单信息

    sums = 0
    log_list = list()
    content_list = list()
    state_info_dict = dict()  # 防火墙状态
    audit_content = {}  # audit日志内容
    user_content = []  # 白名单用户集合
    action_content = []  # 白名单行为集合
    waf_status_result = {}  # waf 防火墙规则处理信息结果列表

    def __init__(self, queue, connection):
        """
        构造方法
        :param queue: 队列名称
        :param connection: RabbitMQ连接
        """
        super(WafAuditMsgReceiver, self).__init__()
        # self.queue = queue
        # self.channel = connection.new_channel(self.queue)
        # self.channel.basic_consume(self.callback, queue=self.queue)

        # self._init_params()
        self._init_tables()

    def _init_tables(self):
        """
        初始化表格 octa_waf_host_status:
                    初次使用此模块的时候,安装zmq client的客户端主机,配置在配置文件中,
                    需要同步到数据库中
        初始化表格 octa_global_setting:
                    默认全部都是打开状态
        :return:
        """
        conn, cursor = mysql_base_api.sql_init(
            LOCAL_CONFIG.mysql_host, LOCAL_CONFIG.mysql_user, LOCAL_CONFIG.mysql_pass,
            LOCAL_CONFIG.mysql_database, LOCAL_CONFIG.mysql_port
        )
        hosts = LOCAL_CONFIG.client_audit_hosts
        for host in hosts:
            _ip = host['ip']
            _name = host['name']
            sql = "select count(id) as count from octa_waf_host_status WHERE ip = %s "
            count = mysql_base_api.sql_execute(conn, cursor, sql, [_ip])
            _int_count = count[0]['count']

            if _int_count == 0:
                mysql_base_api.sql_execute(
                    conn, cursor,
                    "insert into octa_waf_host_status(ip, name, http, web, "
                    "dataTrack, errorCheck, dos, whole) VALUES (%s, %s, 'on', "
                    "'on', 'on', 'on', 'on', 'on')",
                    [_ip, _name]
                )
                logger.debug(
                    "the ip :%s ,the name %s insert to table: octa_waf_host_status successfully",
                    _ip, _name
                )

        waf_rule_param_keys = ['http', 'web', 'dataTrack', 'errorCheck', 'dos',
                               'all']
        for key in waf_rule_param_keys:
            count = mysql_base_api.sql_execute(
                conn, cursor,
                "select count(id) as count from octa_global_setting WHERE param = %s",
                [key]
            )
            _int_count = count[0]['count']
            if _int_count == 0:
                mysql_base_api.sql_execute(
                    conn, cursor,
                    "insert into octa_global_setting (param,value) VALUES (%s,'on')",
                    [key]
                )
                logger.debug(
                    "the key :%s not exist, insert to table:octa_global_setting successfully",
                    key
                )
        # 关闭数据库
        mysql_base_api.sql_close(conn, cursor)

    # def _init_params(self):
    #     """
    #     初始化变量
    #     :return:
    #     """
    #     hosts = LOCAL_CONFIG.client_audit_hosts
    #     self.state_info_dict = {"intercepted": 0, "unrecognized": 0}
    #     for host in hosts:
    #         self.audit_content[host['ip']] = []
    #         self.waf_status_result[host['ip']] = ''

    def run(self):
        logger.info("WAF-Audit receiver is running...")
        # self.channel.start_consuming()

    # def callback(self, ch, method, properties, body):
    #     logger.info("WAF-Audit message received.")
    #     try:
    #         ch.basic_ack(delivery_tag=method.delivery_tag)  # 回复确认收到
    #         self._handle_msg(body)
    #     except Exception as e:
    #         logger.error(e)

    # def _handle_msg(self, body):
    #     """
    #     对接收到的消息进行处理
    #     :param body: bytes, 消息
    #     :return: None
    #     """
    #     msg = json.loads(str(body, "UTF-8"))
    #     msg_type = msg['header']['type']
    #     content = msg['content']
    #     ip = msg['ip']
    #
    #     # 根据消息的类型选择不同的处理方式
    #     # if msg_type == WafAuditMsgReceiver.WAF_FIREWALL:
    #     #     # # 防火墙日志信息
    #     #     self._handle_waf_firewall_data(content, ip)
    #     #     #开始解析 attack ip
    #     #     QUERY_IP_INSTANCE.read_update(content)
    #     # elif msg_type == WafAuditMsgReceiver.AUDIT_LOG:
    #     #     # 审计日志信息
    #     #     self._handle_audit_log_info(content, ip)
    #     if msg_type == WafAuditMsgReceiver.WAF_FIREWALL_RULE:
    #         # 防火墙规则
    #         self._handle_waf_firewall_rule(content, ip, msg)
    #     elif msg_type == WafAuditMsgReceiver.USER_WHITELIST:
    #         # 用户白名单信息
    #         self._handle_user_white_list(content, msg)

    # def _handle_user_white_list(self, content, message):
    #     dam_type = content['dam_type']
    #     if dam_type == "audit_whitelist_users":
    #         self.user_content.append(message)
    #     elif dam_type == "audit_whitelist_cmds":
    #         self.action_content.append(message)

    # def _handle_waf_firewall_data(self, content, ip):
    #     mess = content.split("\n")
    #     if len(self.content_list) > 220000:
    #         self.content_list += mess
    #         self.content_list = self.content_list[::-1][:220000]
    #     else:
    #         self.content_list += mess
    #     sums = 0
    #     intercepted = 0  # 拦截数
    #     logs = {}
    #     inter_time = []  # 日志中的时间
    #     defend_type = []  # 防御类型
    #     inter_source = []  # 攻击源ip
    #     inter_tool = []  # 攻击工具
    #
    #     for c in range(len(self.content_list)):
    #         if self.content_list[c].find("-A--") != -1:
    #             sums += 1
    #             inter_time.append(self.content_list[c + 1].split()[0].strip("["))
    #             inter_source.append(self.content_list[c + 1].split()[3])
    #         if self.content_list[c].find("-H--") != -1:
    #             self._handle_type(c, defend_type)
    #         if self.content_list[c].find("Referer") != -1:
    #             intercepted += 1
    #             inter_tool.append(self.content_list[c].split(":")[1])
    #         else:
    #             inter_tool.append("unknow_tool")
    #
    #     logger.info(
    #         "%s %s %s %s",
    #         len(inter_time), len(defend_type), len(inter_source), len(inter_tool)
    #     )
    #     append_len = len(inter_time)
    #     if append_len > 5:  # 如果大于5,就取前5条
    #         append_len = 5
    #     for i in range(append_len):
    #         logs["inter_time"] = inter_time[i]
    #         logs["defend_type"] = defend_type[i]
    #         logs["inter_source"] = inter_source[i]
    #         logs["inter_tool"] = inter_tool[i]
    #         logs["inter_ip"] = ip
    #         self.log_list.append(logs)
    #     unrecognized = sums - intercepted  # 未识别数
    #     self.state_info_dict["intercepted"] = intercepted
    #     self.state_info_dict["unrecognized"] = unrecognized

    # def _handle_type(self, c, defend_type):
    #     if self.content_list[c + 1].find("[file \"/") != -1:
    #         cont = self.content_list[c + 1].split()
    #         for w in range(len(cont)):
    #             if cont[w].find("[file") != -1:
    #                 rule = cont[w + 1].split("/")[-1].strip("]").strip(
    #                     "\"")
    #                 if rule in GLOBAL_CONFIG.RULES['BASE_RULES']:
    #                     defend_type.append("wafhttp")
    #                 if rule in GLOBAL_CONFIG.RULES['EXPERIMENTAL_RULES']:
    #                     defend_type.append("wafweb")
    #                 if rule in GLOBAL_CONFIG.RULES['OPTIONAL_RULES']:
    #                     defend_type.append("wafdataFllow")
    #                 if rule in GLOBAL_CONFIG.RULES['SLR_RULES']:
    #                     defend_type.append("waferrorCheck")
    #                 if rule in GLOBAL_CONFIG.RULES['DOS_RULES']:
    #                     defend_type.append("wafdos")
    #                 else:
    #                     defend_type.append("wafhttp")
    #     else:
    #         defend_type.append("wafhttp")

    # def _handle_audit_log_info(self, content, ip):
    #     ip_audit_content = self.audit_content[ip]
    #     # 当审计日志信息个数大于10000，只取前10000值
    #     if len(ip_audit_content) > 10000:
    #         ip_audit_content = content + ip_audit_content
    #         ip_audit_content = ip_audit_content[:10000]
    #     else:
    #         ip_audit_content = content + ip_audit_content
    #     self.audit_content[ip] = ip_audit_content
    #     logger.info(len(ip_audit_content))

    # def _handle_waf_firewall_rule(self, content, ip, message):
    #     self.waf_status_result[ip] += content['option'] + content['switch'] + \
    #                                   str(message['result'])
    #
    # @classmethod
    # def audit_log(cls, ip):
    #     return cls.audit_content[ip]

    # @classmethod
    # def deal_content(cls, my_content, deal_type):
    #     if deal_type == "1" or deal_type == "5":
    #         # deal_type为1表示删除一条用户白名单，5 添加一条用户白名单。添加和删除正好是一对相反操作
    #         for item in cls.user_content:
    #             item_content = item['content']['objects']
    #             item_result = item['result']
    #             # 返回值中result值保持了，执行操作的结果，0表示成功
    #             if my_content == item_content and item_result == 0:
    #                 cls.user_content.remove(item)
    #                 return 0
    #     elif deal_type == "3" or deal_type == "6":
    #         # 3，删除一条用户行为，6添加一条用户行为
    #         for item in cls.action_content:
    #             item_content = item['content']['objects']
    #             item_result = item['result']
    #             if my_content == item_content and item_result == 0:
    #                 cls.action_content.remove(item)
    #                 return 0
    #     elif deal_type == "2":
    #         # 清空用户白名单
    #         if len(cls.user_content) > 0:
    #             result = cls.user_content[0]['result']
    #             if result == 0:
    #                 del cls.user_content[:]
    #                 return 0
    #     elif deal_type == "4" and len(cls.action_content) > 0:
    #         # 4 清空用户行为
    #         result = cls.action_content[0]['result']
    #         del cls.action_content[:]
    #         return 0
    #
    #     return -1

    # @classmethod
    # def get_waf_log(cls, flag):
    #     waf_log_list = []
    #     offset = 1
    #     for log in cls.log_list:
    #         timestamp = int(round(time.time() * 1000))
    #         log["id"] = timestamp * 10 + offset
    #         offset += 1
    #         if flag == log["defend_type"]:
    #             waf_log_list.append(log)
    #     return waf_log_list, cls.sums
    #
    # @classmethod
    # def get_state_info_dict(cls):
    #     return cls.state_info_dict

    # @classmethod
    # def deal_waf_status(cls, ip, option, switch):
    #     """
    #     判断对应的IP的对应规则的关闭或者打开的状态
    #
    #     如果成功,code返回200
    #     如果失败,code返回201
    #     :param ip: client ip
    #     :param option: 规则
    #     :param switch: "on" or "off"
    #     :return: 200:success; 201:fail
    #     """
    #     result = {}
    #
    #     waf_status_result_ip_list = cls.waf_status_result[ip]
    #     _success_str = option + switch + '0'
    #     logger.debug(waf_status_result_ip_list)
    #     logger.debug(_success_str)
    #     try:
    #         if waf_status_result_ip_list.find(_success_str) > -1:
    #             waf_status_result_ip_list = waf_status_result_ip_list.replace(
    #                 _success_str, ''
    #             )
    #             cls.waf_status_result[ip] = waf_status_result_ip_list
    #             result['code'] = '200'
    #             return result
    #     except ValueError:
    #         pass
    #
    #     result['code'] = "201"
    #     return result

    # @classmethod
    # def deal_whole_waf_status(cls, option, switch):
    #     """
    #     判断对应的IP的对应规则的关闭或者打开的状态
    #     如果全部成功,code返回200
    #     如果全部失败,code返回201
    #     如果部分成功,code返回202,message:进度信息
    #     :author jiashuai.wang
    #     :param option: 规则
    #     :param switch: "on" or "off"
    #     :return: 0:success; -1:fail
    #     """
    #     result = {}
    #     success_host_count = 0
    #     hosts = LOCAL_CONFIG.client_audit_hosts
    #     for host in hosts:
    #         ip = host['ip']
    #         waf_status_result_ip_list = cls.waf_status_result[ip]
    #         _success_str = option + switch + '0'
    #         logger.debug(_success_str)
    #         try:
    #             if waf_status_result_ip_list.find(_success_str) > -1:
    #                 success_host_count += 1
    #                 waf_status_result_ip_list = waf_status_result_ip_list.replace(
    #                     _success_str, ''
    #                 )
    #                 cls.waf_status_result[ip] = waf_status_result_ip_list
    #         except ValueError:
    #             continue
    #
    #     if success_host_count == len(hosts):
    #         result['code'] = "200"
    #         return result
    #
    #     if success_host_count == 0:
    #         result['code'] = "201"
    #         return result
    #
    #     result['code'] = 202
    #     result['message'] = '本次总共处理主机数量: ' + str(len(hosts)) + \
    #     ',已成功主机数量: ' + str(success_host_count)
    #     return result

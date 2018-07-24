"""
# local config for parse share.json vars
"""
import json

from octastack_fuzhou_web.settings import STATICFILES_DIRS

SHARE_JSON = STATICFILES_DIRS[1] + "/share.json"


class JsonConfiguration:
    """
        初始化常量
    """
    def __init__(self):
        with open(SHARE_JSON, 'r') as conf:
            rec = conf.read()
        records = json.loads(rec)

        self.server_ip = records["server_ip"]
        self.mysql_pass = records["mysql_password"]
        self.mysql_port = records["mysql_port"]
        self.mysql_user = records["mysql_user"]
        self.mysql_database = records["mysql_database"]
        self.mysql_host = records["mysql_host"]
        self.db_ip_list = records['db_ip_list']
        self.blackbox_ip =records['blackbox_ip']
        self.client_audit_hosts = records['client_audit_hosts']
        self.used_ports = records['used_ports']
        self.bdb_host = records["bdb_host"]
        self.bdb_port = records["bdb_port"]
        self.mongo_port = records["mongo_port"]
        self.es_server_ip_port = records["es_server_ip_port"]
        self.rabbitmq_server = records['rabbitmq_server']
        self.rabbitmq_port = records['rabbitmq_port']
        self.alarm_second = records['alarm_second']
        self.alarm_enable = records['alarm_enable']
        self.redis4bigchanidb_host = records['redis4bigchanidb_host']
        self.redis4bigchanidb_port = records['redis4bigchanidb_port']
        self.eagle_host = records['eagle_host']
        self.eagle_port = records['eagle_port']
        self.switch_waf_port = records['switch_waf_port']
        self.enable_register = records['enable_register']
        self.ifr_urls = records['ifr_urls']
        self.bak_mongo_host = records['bak_mongo_host']
        self.bak_mongo_port = records['bak_mongo_port']
        self.trustlog_index = records['trustlog_index']
        self.tamper_proof_url = records['tamper_proof_url']
        self.chain_attach_mount_dir = records['chain_attach_mount_dir']
        self.chain_attach_url = records['chain_attach_url']
        self.snort_rpc_port = records['snort_rpc_port']
        self.des_ip_addr = records['des_ip_addr']
        self.waf_index = records['waf_index']
        self.face = records['face']
        self.dtamper_redis_host = records['dtamper_redis_host']
        self.dtamper_redis_port = records['dtamper_redis_port']
        self.aes_key = records['aes_key']
        self.aes_iv = records['aes_iv']
        self.pay_alarm_key = records['pay_alarm_key']
        self.qingyun_user = records['qingyun_user']
        self.qingyun_pwd = records['qingyun_pwd']


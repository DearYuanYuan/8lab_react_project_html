from app_fuzhou.util import mysql_base_api
from app_fuzhou.views_utils.localconfig import JsonConfiguration

jc = JsonConfiguration()


class GlobalConf:
    def __init__(self):
        self.LOCALHOST = '127.0.0.1'
        self.TEST_IP2 = "10.0.0.2"
        self.ML_TAG = "ima-ng sha1:"
        self.INTERFACE = 'eth1'
        self.TRUST_LOG_PATH = '/8lab/trustfile'
        # 初始化数据库默认参数
        self.default_dict = {
            "db_size": 0.0,
            "db_volume": 0.0
        }
        self.RULES = {
            # BASE_RULES 对应HTTP防御（http --> http-defense）
            'BASE_RULES': ['REQUEST-920-PROTOCOL-ENFORCEMENT.conf', 'REQUEST-921-PROTOCOL-ATTACK.conf',
                           'RESPONSE-980-CORRELATION.conf'],
            # EXPERIMENTAL_RULES 对应常见的Web攻击防护(web --> web-attack)
            'EXPERIMENTAL_RULES': ['REQUEST-941-APPLICATION-ATTACK-XSS.conf',
                                   'REQUEST-942-APPLICATION-ATTACK-SQLI.conf',
                                   'REQUEST-943-APPLICATION-ATTACK-SESSION-FIXATION.conf'],
            # OPTIONAL_RULES 对应敏感数据跟踪(data --> Sensitive-data-tracking)
            'OPTIONAL_RULES': ['REQUEST-910-IP-REPUTATION.conf', 'RESPONSE-950-DATA-LEAKAGES.conf',
                               'RESPONSE-951-DATA-LEAKAGES-SQL.conf', 'RESPONSE-952-DATA-LEAKAGES-JAVA.conf',
                               'RESPONSE-953-DATA-LEAKAGES-PHP.conf', 'RESPONSE-954-DATA-LEAKAGES-IIS.conf'],
            # SLR_RULES 对应缺陷鉴定和错误检测(error --> identification-error)
            'SLR_RULES': ['REQUEST-911-METHOD-ENFORCEMENT.conf', 'REQUEST-913-SCANNER-DETECTION.conf',
                          'REQUEST-930-APPLICATION-ATTACK-LFI.conf', 'REQUEST-931-APPLICATION-ATTACK-RFI.conf',
                          'REQUEST-932-APPLICATION-ATTACK-RCE.conf', 'REQUEST-933-APPLICATION-ATTACK-PHP.conf'],
            # DOS_RULES 对应DOS攻击防护(dos --> dos-attack)
            'DOS_RULES': ['REQUEST-912-DOS-PROTECTION.conf', 'REQUEST-949-BLOCKING-EVALUATION.conf',
                          'RESPONSE-959-BLOCKING-EVALUATION.conf']
        }

    def connect_localhost(self):
        """
        连接本地mysql数据库octastack_fuzhou
        update by wangjiashuai:不能连本地,要连配置的
        :return conn, cursor:
        """
        conn, cursor = mysql_base_api.sql_init(jc.mysql_host, jc.mysql_user,
                                               jc.mysql_pass, jc.mysql_database,
                                               jc.mysql_port)
        return conn, cursor

# coding=utf-8
"""
    snort 规则编辑服务
"""

from thrift import Thrift
from thrift.transport import TSocket
from thrift.transport import TTransport
from thrift.protocol import TBinaryProtocol

from app_fuzhou.views_utils.logger import logger
from app_fuzhou.views_utils.rpc.snort import SnortService


class SnortRpcClient(object):

    def __init__(self, ip, port):
        super().__init__()
        self.ip = ip
        self.port = port
        try:
            self.transport = TSocket.TSocket(self.ip, self.port)
            self.transport = TTransport.TBufferedTransport(self.transport)
            self.protocol = TBinaryProtocol.TBinaryProtocol(self.transport)
            self.client = SnortService.Client(self.protocol)
            self.transport.open()
        except Thrift.TException as tx:
            logger.error(tx.message)

    def add_rule(self, action, protocol, source, dest, rule, sid):
        _t = self.client.add_rule(action, protocol, source, dest, rule, sid)
        self.transport.close()
        return _t

    def del_rule(self, sid):
        _t = self.client.del_rule(sid)
        self.transport.close()
        return _t

    def del_rules(self, sids):
        _t = self.client.del_rules(sids)
        self.transport.close()
        return _t

    def edit_rule(self, rule, sid):
        _t = self.client.edit_rule(rule, sid)
        self.transport.close()
        return _t


if __name__ == "__main__":
    try:
        snort_rpc = SnortRpcClient("192.168.1.234", 30303)
        value = 'aaaa'
        import time
        c_time = str(int(time.time()))
        rpc_result = snort_rpc.add_rule("drop", "tcp", "any any", "any any", value, c_time)
    except Exception as e:
        print(e)

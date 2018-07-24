#!/usr/bin/python
# coding=utf-8
"""
# waf防火墙 客户端所有远程调用
"""

from thrift import Thrift
from thrift.transport import TSocket
from thrift.transport import TTransport
from thrift.protocol import TBinaryProtocol

from app_fuzhou.views_utils.rpc.waf import WafRPCService
from app_fuzhou.views_utils.logger import logger


class WafRpcClient(object):
    """
        waf 本地调用
    """

    def __init__(self, ip, port):
        super().__init__()
        self.ip = ip
        self.port = port
        try:
            self.transport = TSocket.TSocket(self.ip, self.port)
            self.transport = TTransport.TFramedTransport(self.transport)
            self.protocol = TBinaryProtocol.TBinaryProtocol(self.transport)
            self.client = WafRPCService.Client(self.protocol)
            self.transport.open()
        except Thrift.TException as tx:
            logger.error(tx.message)

    def close(self):
        """
        关闭连接
        :return:
        """
        try:
            self.transport.close()
        except Exception as e:
            logger.error(e)

    def switch_waf(self, operation):
        _t = self.client.switch_waf(operation)
        self.transport.close()
        return _t

    def test(self, msg):
        return self.client.test(msg)


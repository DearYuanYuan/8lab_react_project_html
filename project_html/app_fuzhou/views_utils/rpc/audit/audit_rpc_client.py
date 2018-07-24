#!/usr/bin/python
# coding=utf-8
"""
# DB审计插件客户端所有远程调用
"""

from thrift import Thrift
from thrift.transport import TSocket
from thrift.transport import TTransport
from thrift.protocol import TBinaryProtocol

from app_fuzhou.views_utils.logger import logger
from app_fuzhou.views_utils.rpc.audit import AuditRPCService


class AuditRpcClient(object):
    """
        数据库审计 本地调用
    """

    def __init__(self, ip, port):
        super().__init__()
        self.ip = ip
        self.port = port
        try:
            self.transport = TSocket.TSocket(self.ip, self.port)
            self.transport = TTransport.TFramedTransport(self.transport)
            self.protocol = TBinaryProtocol.TBinaryProtocol(self.transport)
            self.client = AuditRPCService.Client(self.protocol)
            self.transport.open()
        except Thrift.TException as tx:
            logger.error(tx.message)

    def delete_all(self, type):
        _t = self.client.delete_all(type)
        self.transport.close()
        return _t

    def delete_part(self, names, type):
        _t = self.client.delete_part(names, type)
        self.transport.close()
        return _t

    def add(self, names, type):
        _t = self.client.add(names, type)
        self.transport.close()
        return _t

    def test(self, msg):
        _t = self.client.test(msg)
        self.transport.close()
        return _t


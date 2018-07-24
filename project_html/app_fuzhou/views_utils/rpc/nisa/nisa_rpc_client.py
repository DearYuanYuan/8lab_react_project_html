# coding=utf-8

from thrift.transport import TSocket
from thrift.transport import TTransport
from thrift.protocol import TBinaryProtocol

from app_fuzhou.views_utils.logger import logger
from app_fuzhou.views_utils.rpc.nisa import NisaRPC

from octastack_fuzhou_web.settings import STATICFILES_DIRS

CONFIG_PATH = STATICFILES_DIRS[1] + "/rpc.json"


class NisaRpcClient(object):

    def __init__(self):
        super().__init__()
        config = rpc_config()
        self.ip = config["user_portrait"]['host']
        self.port = config["user_portrait"]['port']
        try:
            # 建立socket
            self.transport = TSocket.TSocket(self.ip, self.port)
            # 选择传输层，这块要和服务端的设置一致
            self.transport = TTransport.TBufferedTransport(self.transport)
            # 选择传输协议，这个也要和服务端保持一致，否则无法通信
            self.protocol = TBinaryProtocol.TBinaryProtocol(self.transport)
            # 创建客户端
            self.client = NisaRPC.Client(self.protocol)
            self.transport.open()
        except Exception as e:
            logger.error(e.message)

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()

    def train(self, argslist, ttype):
        return self.client.train(argslist, ttype)

    def getmodel(self, user):
        return self.client.getmodel(user)

    def getuserlist(self):
        return self.client.getuserlist()

    def controlCentre(self, argslist):
        return self.client.controlCentre(argslist)

    def putknowledge(self, knowledge):
        return self.client.putknowledge(knowledge)

    def getmodelsknowledge(self, argslist):
        return self.client.getmodelsknowledge(argslist)

    def updatemodelsknowledge(self, argslist):
        return self.client.updatemodelsknowledge(argslist)

    def deletemodelsknowledge(self, argslist):
        return self.client.deletemodelsknowledge(argslist)

    def mergemodelsknowledge(self, argslist):
        return self.client.mergemodelsknowledge(argslist)

    def loadmodels2knowledge(self, argslist):
        return self.client.loadmodels2knowledge(argslist)

    def close(self):
        try:
            self.transport.close()
        except Exception as e:
            logger.error(e)


def rpc_config():
    import json

    with open(CONFIG_PATH) as file:
        return json.load(file)
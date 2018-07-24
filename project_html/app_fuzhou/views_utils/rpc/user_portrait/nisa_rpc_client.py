from thrift.protocol import TBinaryProtocol
from thrift.transport import TSocket
from thrift.transport import TTransport

from app_fuzhou.views_utils.logger import logger
from app_fuzhou.views_utils.rpc.user_portrait import NisaRPC
from octastack_fuzhou_web.settings import STATICFILES_DIRS

CONFIG_PATH = STATICFILES_DIRS[1] + "/rpc.json"


class NisaRpcClient(NisaRPC.Iface):
    def __init__(self):
        try:
            config = rpc_config()
            server_host = config["user_portrait"]['host']
            server_port = config["user_portrait"]['port']
            self.socket = TSocket.TSocket(server_host, server_port)
            self.transport = TTransport.TBufferedTransport(self.socket)
            self.protocal = TBinaryProtocol.TBinaryProtocol(self.transport)
            self.client = NisaRPC.Client(self.protocal)
        except Exception as e:
            logger.error(e)

    def __enter__(self):
        try:
            self.transport.open()
            logger.info("Nisa RPC Client connected.")
            return self.client
        except Exception as e:
            logger.error(e)

    def __exit__(self, exc_type, exc_val, exc_tb):
        self._close()

    def getmodel(self, user):
        self._verify_connect()
        result = self.client.getmodel(user)
        return result

    def getuserlist(self):
        self._verify_connect()
        result = self.client.getuserlist()
        return result

    def train(self, argslist, ttype="normal"):
        self._verify_connect()
        return self.client.train(argslist, ttype)

    def controlCentre(self, argslist):
        self._verify_connect()
        return self.client.controlCentre(argslist)

    def putknowledge(self, knowledge):
        self._verify_connect()
        return self.client.putknowledge(knowledge)

    def _close(self):
        try:
            self.transport.close()
        except Exception as e:
            logger.error(e)

    def _verify_connect(self):
        if not self.client:
            self.client = NisaRPC.Client(self.protocal)


def rpc_config():
    import json

    with open(CONFIG_PATH) as file:
        return json.load(file)

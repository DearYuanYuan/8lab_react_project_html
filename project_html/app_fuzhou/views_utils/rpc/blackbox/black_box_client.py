from app_fuzhou.views_utils.rpc.blackbox import BlackboxControl

from thrift.transport import TSocket
from thrift.transport import TTransport
from thrift.protocol import TBinaryProtocol


class BlackBoxRPCClient(BlackboxControl.Iface):
    def __init__(self, ip, port):
        super(BlackBoxRPCClient, self).__init__()
        self.ip = ip
        self.port = port
        self.socket = TSocket.TSocket(self.ip, self.port)
        self.transport = TTransport.TFramedTransport(self.socket)
        self.protocal = TBinaryProtocol.TBinaryProtocol(self.transport)
        self.client = BlackboxControl.Client(self.protocal)
        self.transport.open()

    def __enter__(self):
        return self.client

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()

    def close(self):
        self.transport.close()

    def ping(self):
        return self.client.ping()

    def say(self, msg, msg2):
        return self.client.say(msg, msg2)

    def command(self, msg):
        return self.client.command(msg)


from thrift.transport import TSocket
from thrift.transport import TTransport
from thrift.protocol import TBinaryProtocol

from app_fuzhou.views_utils.rpc.clamav import ClamavRPCService
from app_fuzhou.views_utils.logger import logger
from app_fuzhou.views_utils.localconfig import JsonConfiguration


class ClamavRPCClient(object):
    """
    用于调用RPC Server上Clamav的Client
    """
    def __init__(self, invoke_addr):
        """
        构造方法
        :param invoke_addr: RPC Server得治
        """
        super(ClamavRPCClient, self).__init__()
        config = JsonConfiguration()
        self.ip = invoke_addr
        self.port = config.used_ports['clamav_rpc']
        try:
            # socket连接
            self.socket = TSocket.TSocket(self.ip, self.port)
            # 传输类,TFramedTransport使用非阻塞方式，按块的大小，进行传输
            self.transport = TTransport.TFramedTransport(self.socket)
            # 协议类,二进制编码格式进行数据传输
            self.protocol = TBinaryProtocol.TBinaryProtocol(self.transport)
            # 客户端
            self.client = ClamavRPCService.Client(self.protocol)
            # 开启传输
            self.transport.open()
        except Exception as e:
            logger.error(e)

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()

    def freshClam(self):
        """
        更新病毒数据库
        :return:
        """
        logger.info("Invoke Clamav-RPC freshClam().")
        return self.client.freshClam()

    def clamScan(self, conf_str):
        """
        扫描文件路径列表
        :return:
        """
        logger.info("Invoke Clamav-RPC clamScan().")
        return self.client.clamScan(conf_str)

    def stopScan(self):
        """
        终止扫描
        :return:
        """
        logger.info("Invoke Clamav-RPC stopScan().")
        return self.client.stopScan()

    def suspendScan(self):
        """
        挂起扫描
        :return:
        """
        logger.info("Invoke Clamav-RPC suspendScan().")
        return self.client.suspendScan()

    def resumeScan(self):
        """
        回复扫描
        :return:
        """
        logger.info("Invoke Clamav-RPC resumeScan().n")
        return self.client.resumeScan()

    def isRunning(self):
        """
        判断是否运行
        :return:
        """
        logger.info("Invoke Clamav-RPC isRunning().")
        return self.client.isRunning()

    def checkVersion(self):
        """
        检查版本
        :return:
        """
        logger.info("Invoke Clamav-RPC checkoutVersion().")
        return self.client.checkVersion()

    def getSummary(self):
        """
        获得摘要
        :return:
        """
        logger.info("Invoke Clamav_RPC getSummary()")
        return self.client.getSummary()

    def getClamavLog(self):
        """
        获得扫描日志
        :return:
        """
        logger.info("Invoke Clamav_RPC getClamavLog()")
        return self.client.getClamavLog()

    def sayHello(self):
        """
        判断是否连通
        :return:
        """
        logger.info("Invoke Clamav_RPC sayHello()")
        return self.client.sayHello()

    def close(self):
        """
        关闭连接
        :return:
        """
        try:
            self.transport.close()
            logger.info("Clamav-RPC client has closed.")
        except Exception as e:
            logger.error(e)


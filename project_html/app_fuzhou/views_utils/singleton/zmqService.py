"""
# service for DetailLog
"""
from app_fuzhou.views_utils.zeromq.zmqServer import recv_scan_message


# ZMQ服务器，以单例模式运行，作为守护线程随系统一起启动
class DetailLogServiceSingleton(object):
    """
    @:param
        INSTANCE
    """
    INSTANCE = None

    def __new__(cls):
        """
        :return:
        """
        if cls.INSTANCE is None:
            cls.INSTANCE = super(DetailLogServiceSingleton, cls).__new__(cls)
            recv_scan_message()
        return cls.INSTANCE

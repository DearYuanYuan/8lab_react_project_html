"""
与waf通讯的zmq程序，以多线程方式启动作为守护进程
使用单例模式，防止zmq被重复启动从而避免address already in use的bug
Author idear
Date 2016-11-18
"""
from app_fuzhou.views_utils.zeromq.zmqWaf import waf


class WafSingleton(object):
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
            cls.INSTANCE = super(WafSingleton, cls).__new__(cls)
            waf()
        return cls.INSTANCE

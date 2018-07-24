import os
import threading
import maxminddb
import traceback

from app_fuzhou.views_utils.logger import logger

Lock = threading.Lock()
BASE_DIR = os.path.dirname(os.path.abspath(__file__))


class GeoLiteInstance(object):
    # 定义静态变量实例
    __instance = None

    def __new__(cls, *args, **kwargs):
        if not cls.__instance:
            try:
                Lock.acquire()
                # double check
                if not cls.__instance:
                    cls.__instance = super(GeoLiteInstance, cls).__new__(cls, *args, **kwargs)
            finally:
                Lock.release()
        return cls.__instance

    def __init__(self):
        try:
            self.database = maxminddb.open_database(BASE_DIR + '/GeoLite2-City.mmdb',
                                                    maxminddb.MODE_MEMORY)
        except FileNotFoundError as e:
            raise e

    def get_db(self):
        return self.database


class IpToCoordinate(object):
    """
    IP转换地理坐标工具类
    """

    def __init__(self):
        self.reader = {}
        self.init_db()

    def init_db(self):
        """
        从GeoLiteInstance()单例中获取maxminddb数据库
        :return:
        """
        try:
            self.reader = GeoLiteInstance().get_db()  # GeoLiteInstance单例模式
        except FileNotFoundError as e:
            logger.error(e)
            logger.error(traceback.format_exc())

    def get_coordinate_by_ip(self, ip):
        """
        从数据库中获取该IP对应的GPS坐标
        :param ip:
        :return:
        """
        ip_coordinate = self.reader.get(ip)
        if not ip_coordinate:  # 如果是内网IP则会返回空
            raise ValueError('Not Find ' + ip)  # 内网地址,将返回空
        else:
            longitude = str(ip_coordinate['location']['longitude'])  # 经度
            latitude = str(ip_coordinate['location']['latitude'])  # 纬度
        return longitude, latitude

    def get_information_by_ip(self, ip):
        ip_coordinate = self.reader.get(ip)
        if not ip_coordinate:  # 如果是内网IP则会返回空
            raise ValueError('Not Find ' + ip)  # 内网地址,将返回空
        return ip_coordinate

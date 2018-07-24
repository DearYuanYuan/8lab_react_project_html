import json, pika

from pika.exceptions import AMQPConnectionError
from threading import Thread
from app_fuzhou.views_utils.clamav.clamav import FileScanDetail
from app_fuzhou.views_utils.global_config import GlobalConf
from app_fuzhou.views_utils.localconfig import JsonConfiguration
from app_fuzhou.views_utils.logger import logger


GLOBAL_CONFIG = GlobalConf()
LOCAL_CONFIG = JsonConfiguration()


class ClamavMsgReceiver:
    """
    Clamav扫描信息接收端
    """
    detail_queue = list()  # 存储所有扫描信息
    exception_list = list()  # 存储异常扫描信息

    def __init__(self, queue):
        """
        构造方法
        :param queue: 队列名称
        """
        self.queue = queue

        credentials = pika.PlainCredentials('8lab', '8lab')
        self.channel = None

        try:
            connection = pika.BlockingConnection(
                # heartbeat_interval=0表示关闭server的心跳检测, 防止超时关闭
                pika.ConnectionParameters(
                    host=LOCAL_CONFIG.rabbitmq_server,
                    port=LOCAL_CONFIG.rabbitmq_port,
                    virtual_host='/',
                    credentials=credentials,
                    heartbeat_interval=1
                )
            )

            if connection:
                print('connected to rabbitMQ successfully.')
                self.channel = connection.channel()
                self.channel.queue_declare(queue=queue)  # 生命channel的队列名称
                self.channel.basic_consume(self.callback, queue=self.queue)
            else:
                print('[8lab][ERROR] init clamav_msg_receiver error ')
                logger.error('init clamav_msg_receiver error ')
        except Exception as e:
            logger.error(
                "ProbableAuthenticationError: Cannot connect RabbitMQ server.")

    def start_receive(self):
        try:
            logger.debug('clamav started--')
            self.channel.start_consuming()
        except Exception as e:
            logger.error(e)

    def callback(self, ch, method, properties, body):
        logger.info("Clamv message received.")
        ch.basic_ack(delivery_tag=method.delivery_tag)  # 回复确认收到
        self.handle_details(body)

    def handle_details(self, body):
        """
        具体处理收到的消息
        :param body: bytes, 收到的消息
        :return: None
        """
        detail_list = json.loads(str(body, "UTF-8"))
        for e in detail_list:

            flag = e.get('flag')
            if flag == 0:   # 正在扫描
                file = e.get('file')
                self.detail_queue.append(file)
                # 如果扫描到异常文件，单独记录
                if e['status'] == 'FOUND':
                    self.exception_list.append(file)
            elif flag == 3:
                e.pop("flag")

    @classmethod
    def init(cls):
        """
        初始化缓存
        :return: None
        """
        cls.detail_queue.clear()
        cls.exception_list.clear()

    # 从队列中获得一条扫描信息。扫描真正开始前返回标志-1，正在进行返回0，已经结束返回1
    @classmethod
    def get_detail(cls):
        """
        获取扫描信息的接口
        :return: 所有类型的扫描信息
        """
        _len = len(cls.detail_queue)
        if _len > 0:
            files = cls.detail_queue.copy()
            cls.detail_queue.clear()
            logger.debug("Fetch %s clamav scan messages." % _len)
            return json.dumps(FileScanDetail(file=files).__dict__)
        logger.debug('No clamav scan message to fetch.')
        # 队列中暂时没有信息
        return json.dumps(FileScanDetail().__dict__)

    # 获得异常信息列表
    @classmethod
    def get_exception_list(cls):
        """
        获取异常信息的接口
        :return: 异常信息
        """
        res = cls.exception_list.copy()
        cls.init()  # 获得列表后将其清空
        return json.dumps({'problemItems': res})

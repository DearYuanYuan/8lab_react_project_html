import pika

from threading import Lock

from app_fuzhou.views_utils.localconfig import JsonConfiguration
from app_fuzhou.views_utils.global_config import GlobalConf
from app_fuzhou.views_utils.logger import logger


GLOBAL_CONFIG = GlobalConf()
LOCAL_CONFIG = JsonConfiguration()


class RabbitMQConnection(object):
    """
    用于新建RabbitMQ连接, RabbitMQ的接收端都必须通过这个连接建立通信的channel
    """
    _instance = None
    _connection = None

    def __init__(self):
        pass

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()

    # 单例模式
    def __new__(cls, *args, **kwargs):
        lock = Lock()
        logger.debug("init rabbitMQ instance")
        if cls._instance is None:
            try:
                lock.acquire()   # 上锁, 用于保证线程安全性
                # 双重锁
                if cls._instance is None:
                    cls._instance = super(RabbitMQConnection, cls).__new__(cls)
                    credentials = pika.PlainCredentials('8lab', '8lab')
                    cls._connection = pika.BlockingConnection(
                        # heartbeat_interval=0表示关闭server的心跳检测, 防止超时关闭
                        pika.ConnectionParameters(
                            host=LOCAL_CONFIG.rabbitmq_server,
                            port=LOCAL_CONFIG.rabbitmq_port,
                            virtual_host='/',
                            credentials=credentials,
                            heartbeat_interval=0
                        )
                    )
                    logger.info("Message server(%s:%s) started." % (LOCAL_CONFIG.rabbitmq_server, LOCAL_CONFIG.rabbitmq_port))
            except Exception as e:
                logger.error(e)
            finally:
                lock.release()  # 解锁
        return cls._instance

    @classmethod
    def new_channel(cls, queue):
        """
        新建一个channel, 一个队列对应一个channel
        :param queue: 队列名称
        :return: channel
        """
        if cls._connection:
            channel = cls._connection.channel()
            channel.queue_declare(queue=queue)  # 生命channel的队列名称
            return channel
        else:
            return None

    @classmethod
    def close(cls):
        if cls._connection:
            cls._connection.close()

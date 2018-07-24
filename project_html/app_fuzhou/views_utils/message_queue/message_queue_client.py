import json

from app_fuzhou.views_utils.logger import logger
from app_fuzhou.views_utils.message_queue.message_queue_connection import RabbitMQConnection


class MessageSender(object):
    """
    RabbitMQ的消息发送器
    """
    def __init__(self, ip, port, queue):
        """
        构造方法
        :param ip: MQ服务器地址
        :param queue: 消息队列标识
        """
        super(MessageSender, self).__init__()
        self.ip = ip
        self.port = port
        self.queue = queue
        self.connection = None
        self.channel = None
        try:
            self.connection = RabbitMQConnection()
            self.channel = self.connection.new_channel(queue)
        except Exception as e:
            logger.error(e)

    def __exit__(self, exc_type, exc_val, exc_tb):
        if self is not None:
            self.close()

    def send_obj(self, obj):
        """
        发送作为消息的Python对象
        :param obj: 可序列化的Python对象
        :return: None
        """
        self.send(json.dumps(obj))

    def send_obj_once(self, obj):
        """
        发送一次Python对象
        :param obj: 可序列化的Python对象
        :return: None
        """
        self.send_obj(obj)
        self.close()

    def send(self, message):
        """
        持续发送消息
        :param message: str, 可序列化的
        :return:
        """
        if self.channel is not None:
            try:
                self.channel.basic_publish(
                    # 空字符串表示默认或无名交换：消息路由到具有由route_key
                    # 指定的名称的队列（如果存在）。
                    exchange="", routing_key=self.queue, body=message
                )
            except Exception as e:
                logger.error(e)

    def send_once(self, message):
        """
        发送一次str消息
        :param message: str, 消息
        :return: None
        """
        self.send(message)
        self.close()

    def close(self):
        """
        关闭连接
        :return: None
        """
        if self.connection is not None:
            self.connection.close()


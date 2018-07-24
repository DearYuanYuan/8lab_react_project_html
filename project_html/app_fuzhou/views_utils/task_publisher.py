#!/usr/bin/env python3
# encoding: utf-8
import time

from app_fuzhou.views_utils.octa_redis import OCTARedis
from app_fuzhou.views_utils.logger import logger


class TaskPublisher(object):
    """
    负责异步任务的发布
    """
    def __init__(self):
        self.redis = OCTARedis()

    def async_publish(self, message, task_id):
        """
        用于restful接口发布异步任务

        :param message: 任务消息
        :param task_id: 任务ID
        :return:
        """

        dispather_channel = 'TASK_DISPATCHER_CHANNEL'
        message_confirmed_key = 'TASK_CONFIRMED_' + str(task_id)

        return self.publish_confirmed(dispather_channel, message, message_confirmed_key, task_id)

    def server_publish(self, channel, message, task_id):
        """
        用于server向client发送消息

        :param channel: 队列名称
        :param message: 消息内容
        :param task_id: 任务ID
        :return:
        """

        message_confirmed_key = 'TASK_CLIENT_CONFIRMED_' + str(task_id)

        return self.publish_confirmed(channel, message, message_confirmed_key, task_id)

    def publish_confirmed(self, channel, message, message_confirmed_key, task_id):
        """
        发送任务之后, 检验消息是否收到

        :param channel: 消息队列名称
        :param message: 消息
        :param message_confirmed_key: 用于获取确认消息的key
        :param task_id: 任务ID
        :return:
        """
        # 发布任务
        self.redis.rdb.publish(channel, message)

        # 校验任务是否收到, 时间为3秒钟
        for i in range(300):
            message = self.redis.rdb.get(message_confirmed_key)
            # 任务已被确认收到
            if message and message == 'confirmed':
                msg = 'GET Task %s confirmed.' % str(task_id)
                logger.info(msg)
                return True, msg

            time.sleep(0.01)

        msg = 'Task %s unconfirmed' % str(task_id)
        logger.error(msg)
        return False, msg


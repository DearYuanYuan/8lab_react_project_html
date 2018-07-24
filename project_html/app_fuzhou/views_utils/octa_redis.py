#!/usr/bin/env python3
# encoding: utf-8

import redis
from redis import StrictRedis
from app_fuzhou.views_utils.localconfig import JsonConfiguration

jc = JsonConfiguration()


class OCTARedis(object):
    def __init__(self):
        self.pool = None
        self.rdb = None
        self.redis_instance()

    def redis_instance(self):
        # redis实例
        # 这里需要在定义connectionpool时候指定decode_reponse=True, 否则解析到的所有消息均会为bytes类型
        pool = redis.ConnectionPool(host=jc.dtamper_redis_host, port=jc.dtamper_redis_port, decode_responses=True)
        self.rdb = StrictRedis(connection_pool=pool, socket_timeout=0.5, decode_responses=True,
                               socket_keepalive=True, retry_on_timeout=True)

    def release(self):
        """
        释放redis连接池
        """
        self.pool.disconnect()

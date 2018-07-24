#!/usr/bin/env python3
# encoding: utf-8
"""
    创建Redis
"""
import redis
from app_fuzhou.views_utils.localconfig import JsonConfiguration

jc = JsonConfiguration()


class RedisModel(object):
    HOST = jc.redis4bigchanidb_host
    PORT = jc.redis4bigchanidb_port
    DB_ID = 0

    def __init__(self):
        if not hasattr(RedisModel, 'pool'):
            RedisModel.create_pool()
        # python中，所有类的实例中的成员变量，都是公用一个内存地址，因此，及时实例化多个RedisCache类，内存中存在的pool也只有一个
        self._connection = redis.Redis(connection_pool=RedisModel.pool)

    @staticmethod
    def create_pool():
        RedisModel.pool = redis.ConnectionPool(
            host=RedisModel.HOST,
            port=RedisModel.PORT,
            db=RedisModel.DB_ID)

    def get_redis(self):
        return self._connection


if __name__ == "__main__":
    re = RedisModel().get_redis()
    aa = re.get("chenkai")
    aa = int(aa)
    print(aa)
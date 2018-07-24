#!/usr/bin/env python
# coding: utf-8
"""
# 一直在跑一个While (True)
# 读取Redis日志,存到Bigchaindb
# author : jiashuai.wang
"""
import redis
import re
import time

from datetime import datetime
from app_fuzhou.views_utils.localconfig import JsonConfiguration
from app_fuzhou.util.octa_bdb_api import exec_write
from app_fuzhou.views_utils.logger import logger
from app_fuzhou.util import mysql_base_api

LOCAL_CONFIG = JsonConfiguration()  # share.json

MAX_LOG_COUNT = 10000  # 每次从redis中取的日志数量

HOST_LIST = LOCAL_CONFIG.client_audit_hosts
LOG_KEY_HEADS = ['sysAudit', 'mysqlAudit', 'wafLog'] #
client = redis.StrictRedis(host=LOCAL_CONFIG.redis4bigchanidb_host, port=LOCAL_CONFIG.redis4bigchanidb_port)

TIME_VALUE = 60


class SaveLog2BigchainDB2(object):
    """
    class log thread

    @:param
        object
    """

    INSTANCE = None

    def __new__(cls):
        """
        重写实现单例
        :return: 单例
        """
        if cls.INSTANCE is None:
            cls.INSTANCE = super(SaveLog2BigchainDB2, cls).__new__(cls)
            read_and_save_log()
        return cls.INSTANCE


def read_and_save_log():
    """
    read log and save
    :return:
    """
    while True:
        try:
            for key in LOG_KEY_HEADS:
                _get_from_redis_to_bigchain_mysql(key)
        except Exception as e:
            logger.error(e)
        time.sleep(TIME_VALUE)


def _get_from_redis_to_bigchain_mysql(key):
    """
    处理过程:
    1,根据机器情况,分别获取相应机器的最新日志,如果日志大于10万条,先取出10万存入bigchaindb,剩下的存完后继续取.最后删除ridis中的日志.
    2,把日志存入bigchaindb后,相应的把交易id和私钥保存到mysql
    :return: 无
    """
    global client

    # try:
    log_len = client.llen(key)
    if log_len == 0:
        logger.debug('the key %s length is 0 .' % key)
        return
    if log_len > MAX_LOG_COUNT:
        logger.info(log_len)
        i = int(log_len / MAX_LOG_COUNT)
        for x in range(i):
            array_list = client.lrange(key, x * MAX_LOG_COUNT, (x + 1) * MAX_LOG_COUNT - 1)
            if array_list:
                _save_2_bdp_mysql(array_list)
                logger.debug("===========================")

        array_list = client.lrange(key, i * MAX_LOG_COUNT, log_len)
        if array_list:
            _save_2_bdp_mysql(array_list)
        # 为了测试,下面这行注释,方式数据删了没有测试数据,
        client.delete(key)
    else:  # pop所有的
        array_list = client.lpop(key)
        if array_list:
            _save_2_bdp_mysql(array_list)
    # except Exception as e:
    #     logger.error(e)


def _save_2_bdp_mysql(log_results):
    logger.debug("----")

    if not log_results:
        return
    
    results = {}
    for host in HOST_LIST:  # 初始化每台机器对应的拆分后的日志结合结果
        results[host['ip']] = []
    for log in log_results:
        for host in HOST_LIST:
            _re_rex = re.compile(host['ip'])
            try:
                if _re_rex.findall(str(log)):
                    results[host['ip']].append(log)
                    continue
            except Exception as e:
                logger.debug(log)
                logger.error(e)
                continue

    for host in HOST_LIST:  # 初始化每台机器对应的拆分后的日志结合结果
        tx_id, private_key, public_key = exec_write(str(results[host['ip']]), None, LOCAL_CONFIG.bdb_host, LOCAL_CONFIG.bdb_port, False)
        logger.debug(tx_id)

        # 获取数据库中的数据，用户白名单 和用户行为值
        conn, cursor = mysql_base_api.sql_init(LOCAL_CONFIG.mysql_host,
                                               LOCAL_CONFIG.mysql_user,
                                               LOCAL_CONFIG.mysql_pass,
                                               LOCAL_CONFIG.mysql_database)

        insert_list = {'bdb_whitelist': [
            {"tx_id": tx_id, "private_key": private_key, "host": host['ip'], "create_time": datetime.now()}]}
        mysql_base_api.insert_row(conn, cursor, insert_list)
        mysql_base_api.sql_close(conn, cursor)
        logger.debug(insert_list)
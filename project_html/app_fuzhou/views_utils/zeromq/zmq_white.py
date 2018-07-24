#!/usr/bin/python
# coding=utf-8
"""
# zmq for connecting white list
"""
import zmq
from struct import pack
from app_fuzhou.views_utils.logger import logger
from app_fuzhou.views_utils.localconfig import JsonConfiguration

GLOBAL_CONFIG = JsonConfiguration()

blackbox_ip = GLOBAL_CONFIG.blackbox_ip
server_port = GLOBAL_CONFIG.used_ports['whitelist']
SERVER_ADDR = "tcp://%s:%s" % (blackbox_ip, server_port)


def send_repair(white_dict):
    """
    删除或者增加白名单
    :param white_dict:
    :param flag:
    :return:
    """
    action = u"17"  # 数据暗号
    unify_send(action, white_dict)


def send_reset(white_dict):
    action = u"14"
    unify_send(action, white_dict)


def unify_send(action, white_dict):
    socket = get_zmq_socket()
    header = "9APORRIDGEML"  # 数据包头header信息
    hostname = white_dict['clientname']
    white_ip = white_dict['ip']
    file_path = white_dict['filerouter']
    file_hash = white_dict['filedata']
    end = "9BPORRIDGEML"
    send_data = pack('20s99s20s8s300s100s20s', header.encode('utf-8'),
                   hostname.encode('utf-8'),
                   white_ip.encode('utf-8'), action.encode('utf-8'),
                   file_path.encode('utf-8'),
                   file_hash.encode('utf-8'), end.encode('utf-8'))
    socket.send(send_data)
    # message = socket.recv()
    # logger.debug("Received reply " + str(message))
    socket.close()


def get_zmq_socket():
    context = zmq.Context.instance()
    socket = context.socket(zmq.REQ)
    socket.connect(SERVER_ADDR)
    logger.info("Connected to white list server(%s)..." % SERVER_ADDR)
    return socket

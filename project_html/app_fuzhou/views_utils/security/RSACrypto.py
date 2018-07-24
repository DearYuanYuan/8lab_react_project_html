#!/usr/bin/env python3
# coding: utf-8
"""
此模块提供通过RSA对数据进行加密、解密接口
Author: Jing Qingyun
"""

import base64
import math
import os

from Crypto import Random
from Crypto.Cipher import PKCS1_v1_5
from Crypto.PublicKey import RSA


PUBLIC_KEY_FILE = os.path.join(os.path.dirname(__file__), 'public_key.pem')
PRIVATE_KEY_FILE = os.path.join(os.path.dirname(__file__), 'private_key.pem')

MAX_TEXT_LENGTH = 245
PIECE_LENGTH = 344


def encrypt(text):
    """
    对文本进行加密
    :param text: 需要加密的str类型的文本
    :return: 经加密处理的bytes类型的二进制文本
    """

    try:
        cipher = __get_cipher(PUBLIC_KEY_FILE)
        result = b""

        for e in __split_long_text(text, MAX_TEXT_LENGTH):
            after = base64.b64encode(cipher.encrypt(bytes(e, 'utf-8')))
            result += after

        return result
    except Exception as e:
        print(e)


def decrypt(data):
    """
    对文本进行解密
    :param data: 需要解密的bytes类型的二进制文本
    :return: 经过解密处理的str类型的文本
    """

    random_generator = Random.new().read

    try:
        cipher = __get_cipher(PRIVATE_KEY_FILE)
        result = ""
        for e in __split_long_text(data, PIECE_LENGTH):
            bstr = cipher.decrypt(base64.b64decode(e), random_generator)
            result += str(bstr, 'utf-8')
        return result
    except Exception as e:
        print(e)


def __get_cipher(key_file):
    """
    通过密钥文件获得相应加密器
    :param key_file: 密钥文件
    :return: 加密器
    """

    with open(key_file, 'r') as file:
        key = RSA.importKey(file.read())
        cipher = PKCS1_v1_5.new(key)
    return cipher


def __split_long_text(text, length):
    """
    将超过一定长度的数据进行分片
    :param text: 字符串，str和bytes都可以
    :param length:　片长度
    :return:　片数组
    """

    pieces = []
    blocks = math.ceil(len(text) / length)
    for i in range(blocks):
        pieces.append(text[i * length:(i + 1) * length])
    return pieces


if __name__ == "__main__":
    import sys

    if len(sys.argv) != 3:
        print("Illegal parameters.")
    else:
        if sys.argv[1] == "encrypt":
            print(encrypt(sys.argv[2]).decode())
        elif sys.argv[1] == "decrypt":
            print(decrypt(sys.argv[2]))

#!/usr/bin/env python3
# encoding: utf-8

import os
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import top.api
from app_fuzhou.views_utils.logger import logger


def send_message(content):
    """
    发送短信
    :return: 
    """
    req = top.api.AlibabaAliqinFcSmsNumSendRequest()
    req.set_app_info(top.appinfo("23827310", "24dbb9f199ea5fbc2826e4f2662c15df"))

    req.extend = ""
    req.sms_type = "normal"
    req.sms_free_sign_name = "八分量持续免疫系统"

    if content == "":
        req.sms_param = ""
        req.sms_template_code = "SMS_67765123"
    else:
        req.sms_param = {'errorinfo': content}
        req.sms_template_code = "SMS_67715193"

    req.rec_num = "13488690980,17610000528"

    try:
        req.getResponse()
    except Exception as e:
        if hasattr(e, "submsg"):
            logger.error("短信发送失败：" + e.submsg)
        else:
            logger.error(e)

if __name__ == "__main__":
    send_message("test")
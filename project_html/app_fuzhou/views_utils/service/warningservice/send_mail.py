#!/usr/bin/env python3
# encoding: utf-8
import os
import smtplib
import redis
import json
from email.mime.text import MIMEText
from app_fuzhou.views_utils.logger import logger
from app_fuzhou.views_utils.global_config import JsonConfiguration
from app_fuzhou.util import mysql_base_api

me = "Warning" + "<" + "warn@8lab.cn" + ">"

# mail_to_list = ["wm@8lab.cn", 'wjs@8lab.cn']
mail_host = "smtp.ym.163.com"  # 设置发件服务器
mail_port = 25  # 服务器端口号
mail_user = "warn@8lab.cn"  # 用户名
mail_pass = "8labtestinfo"  # 口令
CONF = JsonConfiguration()
MAIL_TO_KEY = "whole_mail_to_list"


def mail_to_list():
    """
    查询发送邮件的收件人
    :return:
    """
    try:
        re = redis.Redis(CONF.redis4bigchanidb_host, CONF.redis4bigchanidb_port)
        w_list = re.get(MAIL_TO_KEY)
        if w_list is None:  # 如果redis中没有缓存,从ES查询计算
            w_list = query_mail_to_list()
            re.setex(MAIL_TO_KEY, w_list, 60 * 60 * 24)
            return w_list
        else:
            return json.loads(str(w_list, 'utf-8').replace("'", '"'))
    except Exception as e:
        logger.error(e)
        return query_mail_to_list()


def clear_mail_to_list_cache():
    try:
        re = redis.Redis(CONF.redis4bigchanidb_host, CONF.redis4bigchanidb_port)
        delete_re = re.delete(MAIL_TO_KEY)
        logger.debug(delete_re)
    except Exception as e:
        logger.error('clear redis key ' + MAIL_TO_KEY + 'error:--')
        logger.error(e)


def query_mail_to_list():
    """
    从数据库中查询收件人
    :return:
    """

    mail_to = []
    conn, cursor = mysql_base_api.sql_init(CONF.mysql_host, CONF.mysql_user,
                                           CONF.mysql_pass,
                                           CONF.mysql_database, CONF.mysql_port)
    conn_list = mysql_base_api.sql_execute(conn, cursor,
                                           "select email from app_fuzhou_warninglist where enabled = 1",
                                           "")
    # 关闭数据库
    mysql_base_api.sql_close(conn, cursor)
    if len(conn_list) == 0:
        return ["devinfo@8lab.cn"]

    for item in conn_list:
        mail_to.append(item['email'])
    return mail_to


def send_mail(to_list, sub, content):
    """
    发送邮件
    :param to_list: 
    :param sub: 
    :param content: 
    :return: 
    """
    email_server = None
    is_send_successful = False
    try:
        msg = MIMEText(content, _subtype='plain', _charset='gb2312')
        msg['Subject'] = sub
        msg['From'] = me
        msg['To'] = ";".join(to_list)

        email_server = smtplib.SMTP()
        email_server.connect(mail_host, mail_port)
        email_server.login(mail_user, mail_pass)
        email_server.sendmail(me, to_list, msg.as_string())
        is_send_successful = True
    except Exception as e:
        logger.error(e)
    finally:
        if email_server:
            email_server.close()
    return is_send_successful


if __name__ == "__main__":
    re = redis.Redis(CONF.redis4bigchanidb_host, CONF.redis4bigchanidb_port)
    w_list = re.get(MAIL_TO_KEY)
    send_mail(w_list, "测试邮件", "this is a teset email")

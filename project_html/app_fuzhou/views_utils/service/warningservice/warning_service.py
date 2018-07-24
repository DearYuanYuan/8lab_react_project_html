#!/usr/bin/env python3
# encoding: utf-8
"""
    警告服务
    主要提供 短信 邮件 弹框警告， 每60秒检测一次
"""
import datetime
import http
import base64
import json
from urllib import request
from app_fuzhou.util import mysql_base_api
from app_fuzhou.views_utils.logger import logger
from app_fuzhou.views_utils.localconfig import JsonConfiguration
from app_fuzhou.views_utils.service.warningservice.RedisModel import RedisModel
from app_fuzhou.views_utils.service.warningservice.send_wechat import send_wechat
from app_fuzhou.views_utils.utils_audit import get_audit_log_from_es
from app_fuzhou.views_utils.service.warningservice.send_mail import (
    send_mail,
    mail_to_list
)

jc = JsonConfiguration()


def warning_service():
    # 警报服务目前提供一下三种类型的报警
    # 1. 读取es中trustlog的错误信息
    # 2. 读取数据库中的trustlog表，该表表示的是未确认的白名单内容
    # 3. 读取eagle中的错误信息（用户行为）
    logger.info("Warning service: waiting for " + str(jc.alarm_second) + " seconds.")

    try:
        re = RedisModel().get_redis()

        # 1.查询es中trustlog错误信息
        es_init_trustlog_error_count = re.get("es_init_trustlog_error_count")
        if not es_init_trustlog_error_count:
            result, total = get_audit_log_from_es("8labinfoerror", 1, 0, sort="")
            # 初始化, 从es中获取trustlog的ERROR总数
            re.set("es_init_trustlog_error_count", total)

        result, current_counts = get_audit_log_from_es("8labinfoerror", 1, 1)  # 初始化,从es中获取ERROR总数
        if len(result) > 0:
            diff = current_counts - int(re.get("es_init_trustlog_error_count"))
            logger.info("trustlog es error length: " + str(diff))
            if diff > 0:
                temp_error_content = result[0]["_source"]["message"]  # 取出ERROR的具体信息
                re.set("es_init_trustlog_error_count", current_counts)  # 更新es中trustlog初始值
                insert_alarm(diff, 3)  # 将ERROR信息插入alarm数据库
                if jc.alarm_enable == 1:
                    now = datetime.datetime.now()
                    now = now.strftime('%Y-%m-%d %H:%M:%S')
                    send_error_info_email_result = send_mail(mail_to_list(), "异常行为警告", "异常信息(" + now + "):" + temp_error_content)
                    send_wechat("异常行为警告(" + now + "):" + temp_error_content)
                    logger.debug('send_error_info_email_result = %s' %(send_error_info_email_result))

        # 2. 查询trustlog表,是否有新的警告
        error_logs = get_trustlog_errors()
        error_count = len(error_logs)
        logger.info("trustlog table error length: " + str(error_count))
        if error_count > 0:
            # 将错误日志条数插入alarm数据库中，前端定时查询alarm数据库报警
            insert_alarm(error_count, 2)
            if jc.alarm_enable == 1:
                error_content = error_logs[0]["content"]
                error_content = eval(error_content)
                error_content = "异常主机:" + error_content['ip'] + \
                                "  异常文件或进程:" + error_content['file_error_path'] + \
                                "  异常哈希:" + error_content['file_error_hash']

                now = datetime.datetime.now()
                now = now.strftime('%Y-%m-%d %H:%M:%S')
                insert_alarm_detail(info=error_content, ip=error_logs[0]["ip"],
                                    hostname=error_logs[0]["host"],
                                    create_time=now,
                                    alarm_type=2)
                logger.info("start to send email...")
                send_mail(mail_to_list(), "可信防护异常", "异常信息(" + now + "):" + error_content)
                logger.info("start to send wechat...")
                send_wechat("可信防护异常(" + now + "):" + error_content)


        # 3. 查询eagle错误
        eagle_info = get_alert_from_eagle(jc.alarm_second)
        eagle_info_count = len(eagle_info)
        if eagle_info_count > 0:
            # 将错误日志插入alarm数据库中，前端定时查询alarm数据库报警
            insert_alarm(eagle_info_count, 4)
            if jc.alarm_enable == 1:
                _eagle_obj = eagle_info[0]['alertContext']['properties']
                eagle_content = _eagle_obj['alertMessage']
                _eagle_host = _eagle_obj['host']
                logger.info("start send wechat and email: ")

                now = datetime.datetime.now()
                now = now.strftime('%Y-%m-%d %H:%M:%S')
                insert_alarm_detail(info=eagle_content, ip=_eagle_host,
                                    hostname=_eagle_host,
                                    # 目前eagle中没有返回hostname
                                    create_time=now,
                                    alarm_type=4)
                # send_message('')
                send_mail(mail_to_list(), "用户画像异常", "异常信息(" + now + "):" + eagle_content)
                send_wechat("用户画像异常(" + now + "):" + eagle_content)


    except Exception as e:
        logger.error(e)


def get_conn_cursor():
    conn = None
    cursor = None

    try:
        conn, cursor = mysql_base_api.sql_init(
            db_host=jc.mysql_host,
            db_port=jc.mysql_port,
            db_user=jc.mysql_user,
            db_passwd=jc.mysql_pass,
            db_name=jc.mysql_database
        )
    except Exception as e:
        logger.error(e)
    return conn, cursor


def get_trustlog_errors():
    """
    查询数据库中trustlog表的行数  每一行代表一条错误信息
    :return: 
    """
    conn, cursor = get_conn_cursor()
    result = ()
    try:
        time_delta = jc.alarm_second
        beginning = datetime.datetime.now() - datetime.timedelta(seconds=time_delta)  # 计算时间点
        sql = "SELECT * FROM app_fuzhou_trustlog WHERE state = 0 and time > '{start_time}' ORDER BY time DESC"
        result = mysql_base_api.sql_execute(conn, cursor, sql.format(start_time=beginning.strftime(format="%Y/%m/%d %H:%M:%S")), ())
    except Exception as e:
        logger.error(e)
    finally:
        mysql_base_api.sql_close(conn, cursor)

    return result


def get_alert_from_eagle(seconds):
    """
    从eagle获取警告信息
    :param seconds: 
    :return: 
    """

    objs = []
    try:
        logger.info("get warning info from eagle...")

        # 创建全局cookie
        cookie = http.cookiejar.CookieJar()
        cookie_proc = request.HTTPCookieProcessor(cookie)
        opener = request.build_opener(cookie_proc)
        #request.install_opener(opener)

        # 登录操作 保存cookie
        user_password = "admin:secret"
        bytes_string = user_password.encode(encoding="utf-8")
        _hash = base64.b64encode(bytes_string)
        headers = {"Authorization": "Basic " + _hash.decode()}

        base_url = get_full_url(jc.eagle_host) + ":" + str(jc.eagle_port)
        login_url = base_url + "/eagle-service/rest/authentication"
        logger.info("login eagle header: " + _hash.decode())
        logger.info("login eagle url: " + login_url)

        req = request.Request(url=login_url, headers=headers)
        result = opener.open(req, timeout=10).read().decode("utf-8")
        logger.info(result)

        req_url = base_url + "/eagle-service/rest/entities?query=AlertService[@site=%22sandbox%22%20AND%20@application=%22hdfsAuditLog%22]{*}"
        # 计算查询时间 生成最新的url
        current_time = datetime.datetime.now()
        start_time = current_time - datetime.timedelta(hours=8, seconds=seconds)  # 解决时区问题 UTC和本地时区差8小时
        start_time = start_time.strftime('%Y-%m-%d %H:%M:%S').replace(' ', '%20')
        end_time = current_time - datetime.timedelta(hours=8)
        end_time = end_time.strftime('%Y-%m-%d %H:%M:%S').replace(' ', '%20')

        #start_time = '2017-11-28%2009:40:40'
        #end_time = '2017-11-28%2010:06:05'
        logger.info("start time: " + start_time + "; end time: " + end_time)

        req_url = req_url + "&pageSize=10000" + "&startTime=" + start_time + "&endTime=" + end_time

        req = request.Request(url=req_url)
        result = opener.open(req, timeout=5).read().decode("utf-8")

        logger.info(result)

        re_json = json.loads(result)
        objs = re_json['obj']

    except Exception as e:
        logger.error(e)

    return objs


def insert_alarm(error_count, error_type):
    """
    向alarm表中插入错误信息，前端会定时查询该表，展示报警
    :param error_count: 
    :param error_type: 
    :return: 
    """
    conn, cursor = get_conn_cursor()
    try:
        # 将错误信息保存到数据库 前端定时查询数据库
        datetime_now = datetime.datetime.now()
        sql = "INSERT INTO app_fuzhou_alarm (create_time, alarm_type, count) VALUES (%s, %s, %s)"
        mysql_base_api.sql_execute(conn, cursor, sql, (datetime_now, error_type, error_count))
    except Exception as e:
        logger.error(e)
    finally:
        mysql_base_api.sql_close(conn, cursor)


def insert_alarm_detail(ip, hostname, alarm_type, create_time, info):
    """
    插入告警详情
    :param ip:机器ip
    :param hostname:主机名
    :param alarm_type:类型
    :param create_time:时间
    :param info:详情
    :return:
    """
    conn, cursor = get_conn_cursor()
    try:
        # 将错误信息保存到数据库 前端定时查询数据库
        sql = "INSERT INTO app_fuzhou_alarm_detail (ip,hostname,info,alarm_type,create_time) " \
              "VALUES (%s, %s, %s,%s,%s)"
        mysql_base_api.sql_execute(conn, cursor, sql,
                                   (ip, hostname, info, alarm_type, create_time))
    except Exception as e:
        logger.error(e)
    finally:
        mysql_base_api.sql_close(conn, cursor)


def get_full_url(url):
    if url.startswith('http://') or url.startswith('https://'):
        return url
    else:
        return 'http://' + url


if __name__ == "__main__":
    warning_service()


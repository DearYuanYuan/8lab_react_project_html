#!/usr/bin/env python
# encoding: utf-8

import json
import multiprocessing
import os

import django
from django.db import connection
from django.test import Client

from app_fuzhou.util import mysql_base_api
from app_fuzhou.views_utils.global_config import GlobalConf

os.environ['DJANGO_SETTINGS_MODULE'] = 'octastack_fuzhou_web.settings'
django.setup()  # 添加的代码
client = Client()

response = client.post('api/get_scan_config',)
print(response.content)

gc = GlobalConf()


# Function: test interface with Django connection
def django_test():
    mysql_base_api.django_setup('database_base_api', 'base_api.settings')
    f = open("6.json")
    scripts = json.load(f)
    mysql_base_api.base_api(connection, connection.cursor(), scripts)
    f.close()
    connection.close()


def uniform_test(conn, cursor, filename):
    f = open(filename)
    json_data = json.load(f)
    ret = mysql_base_api.base_api(conn, cursor, json_data)
    f.close()
    return ret


# Function: process
def process_test(filename, sql_pool):
    f = open(filename)
    json_data = json.load(f)
    insert_data = json_data['insert_many']
    f.close()
    # fetch a connection from pool
    conn = sql_pool.connect()
    cursor = conn.cursor()
    for i in range(0, 10000):
        mysql_base_api.insert_row_nocommit(cursor, insert_data)
        if i % 1000 == 0:
            print(i)
    # commit
    conn.commit()
    cursor.close()
    conn.close()
    print('Finished')


# Function:  multiple processes operate database through connection pool
def multi_update_test(file_list):
    # initialize connection pool
    sql_pool = mysql_base_api.connect_pool_init(5, 1, 100)
    pp = []
    # start a process to operate databse according JSON file
    for file in file_list:
        pp.append(multiprocessing.Process(target=process_test, args=(file, sql_pool,)))

    for i in range(0, len(pp)):
        pp[i].start()

    for i in range(0, len(pp)):
        pp[i].join()

    print('All join')


def api_test():
    conn, cursor = mysql_base_api.sql_init(gc.TEST_IP3, "finger", "finger", None)
    print("Create Database: api_test")
    print(uniform_test(conn, cursor, '1.json'))
    mysql_base_api.sql_close(conn, cursor)

    conn, cursor = mysql_base_api.sql_init(gc.TEST_IP3, "finger", "finger", "base_api_test")
    print("Create Tables: ")
    print(uniform_test(conn, cursor, '3.json'))

    print("Insert data with foreignkey")
    print(uniform_test(conn, cursor, '6.json'))

    print("Select")
    print(uniform_test(conn, cursor, '9.json'))

    print("Insert data without foreignkey")
    print(uniform_test(conn, cursor, '5.json'))

    print("Select")
    print(uniform_test(conn, cursor, '9.json'))

    print("Insert data without commit")
    print(uniform_test(conn, cursor, '16.json'))
    conn.commit()

    mysql_base_api.sql_close(conn, cursor)


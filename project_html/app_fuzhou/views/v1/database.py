"""
数据库页面的则删改查及迁移操作
"""
import json
import os
import psycopg2

from django.http import HttpResponse

from app_fuzhou import database_view
from app_fuzhou.apps import BIZ_CODE, Response
from app_fuzhou.util import mysql_base_api
from app_fuzhou.views_utils.global_config import GlobalConf
from app_fuzhou.views_utils.logger import logger
from app_fuzhou.views_utils.utils_database import judge_port, get_temp, insert_data, get_common_set, organize_db_info
from app_fuzhou.views_utils.localconfig import JsonConfiguration

# 初始化常量类
gc = GlobalConf()
# 获取share.json配置
jc = JsonConfiguration()


# 获取主机节点和数据库节点的信息和关系
def get_host_db_details(request):
    return HttpResponse(json.dumps(database_view.get_database_details()))


# 获取 数据库 --> 主机列表
def get_db_host(request):
    page = request.POST.get("page", 1)
    size = request.POST.get("size", 10)
    return HttpResponse(json.dumps(database_view.get_hosts_by_page(page, size)))


# 数据库 搜索
def search_db(request):
    ip_dbname = request.POST.get("ip_dbname")
    return HttpResponse(json.dumps(database_view.get_search_db(ip_dbname)))


def create_db(request):
    """
    # 创建数据库
    :param request:
    :return:
    """
    if request.method == 'POST':
        username = request.POST['username']
        password = request.POST['password']
        ip = request.POST['ip']
        port = request.POST['port']
        dbname = request.POST['dbname']
        sql_type = request.POST['type']
        temp = {'name': dbname, 'type': sql_type, 'ip': ip, 'port': port}
        if sql_type == 'MySQL':
            # 根据port的数据类型做相应处理
            try:
                conn, cursor = judge_port(ip, username, password, port)
            except Exception as e:
                logger.error(str(e))
                ret = [BIZ_CODE['WRONG_CONNECTION']]
                return HttpResponse(json.dumps(ret))

            # 判断数据库是否存在
            sql = "SELECT COUNT(*) AS total FROM information_schema.SCHEMATA where SCHEMA_NAME=%s"
            count = mysql_base_api.sql_execute(conn, cursor, sql, (dbname,))
            if count[0]['total'] > 0:
                ret = [BIZ_CODE['DATABASE_EXIST']]
                return HttpResponse(json.dumps(ret))

            r = mysql_base_api.create_database(conn, cursor, dbname)
            if str(type(r)).find('tuple'):
                # 获取包括size和volume的temp数据
                temp = get_temp(conn, cursor, username, password, temp)
                # 返回给前端显示
                ret = [temp, BIZ_CODE['SUCCESS']]
                return HttpResponse(json.dumps(ret))
            else:
                ret = [BIZ_CODE['WRONG_CONNECTION']]
                return HttpResponse(json.dumps(ret))
        elif sql_type == 'PostgreSQL':
            # 数据库连接参数
            try:
                conn = psycopg2.connect(user=username, password=password, host=ip, port=port)
            except Exception as e:
                logger.error(str(e))
                ret = [BIZ_CODE['WRONG_CONNECTION']]
                return HttpResponse(json.dumps(ret))

            conn.set_isolation_level(0)
            cur = conn.cursor()
            sql = "SELECT u.datname FROM pg_catalog.pg_database u where u.datname='" + dbname + "';"
            cur.execute(sql)
            db_list = cur.fetchall()
            if len(db_list) == 0:
                cur.execute("CREATE DATABASE " + dbname + " ;")
            else:
                ret = [BIZ_CODE['DATABASE_EXIST']]
                return HttpResponse(json.dumps(ret))

            if conn is not None:
                conn.commit()  # DELETE, INSERT, UPDATE operations should commit.
            conn.set_isolation_level(1)
            cur.close()
            conn.close()

            temp['size'] = 0
            temp['volume'] = 0
            insert_data(username, password, temp)
            ret = [temp, BIZ_CODE['SUCCESS']]
            return HttpResponse(json.dumps(ret))
        else:
            ret = [BIZ_CODE['NOT_SUPPORT_DABABASE_TYPE']]
            return HttpResponse(json.dumps(ret))
    else:
        # 非post访问
        ret = [BIZ_CODE['WRONG_CONNECTION']]
        return HttpResponse(json.dumps(ret))


# 获取数据库信息
def db_info(request):
    """

    :param request:
    :return:
    """
    response = Response()
    ret = []
    data_list = []
    # 用于判断是否连接上数据库
    is_connected = False
    # 连接本地mysql数据库octastack_fuzhou
    conn, cursor = gc.connect_localhost()
    # 从数据库取出client_info数据
    data_set = mysql_base_api.sql_execute(conn, cursor, "select * from client_info;", None)
    if len(data_set) > 0:   # 若client_info有数据
        # 获取主机相关信息
        common_set, record_list = get_common_set(data_set)
        # 按照注释中的形式组织数据
        data_list = organize_db_info(common_set, record_list)
    for d_list in data_list:
        if len(d_list) > 0:
            infos = d_list['diff']  # 取出diff中的list
            conn, cursor = mysql_base_api.sql_init(d_list['db_ip'], d_list['sql_uname'],
                                                   d_list['sql_passwd'], None, d_list['db_port'])
            if str(type(conn)).find('int') != -1:   # 若连接时返回的是整数，说明连接失败，则继续连接其他数据库
                continue
            check_db = mysql_base_api.sql_execute(conn, cursor, "show databases;", "")
            db_list = []
            if len(check_db) > 0:   # 首先将连接接到的远程数据库放在list中
                for db in check_db:
                    db_list.append(db['Database'])
            for info in infos:
                if info[0] != 'octastack_fuzhou':  # octastack_fuzhou这个是系统数据库，不展示
                    if info[0] in db_list:
                        temp = {'name': info[0], 'type': 'MySQL', 'ip': d_list['db_ip'],
                                'port': d_list['db_port'], 'size': info[1], 'volume': info[3]}
                        ret.append(temp)
                    else:
                        conn, cursor = mysql_base_api.sql_init(jc.mysql_host, jc.mysql_user, jc.mysql_pass,
                                                               None, jc.mysql_port)
                        mysql_base_api.sql_execute(conn, cursor, "use octastack_fuzhou;", "")
                        mysql_base_api.sql_execute(conn, cursor,
                                                   "delete from `client_info` WHERE db_name = '" +
                                                   info[0] + "';", "")
                    is_connected = True
            mysql_base_api.sql_close(conn, cursor)
    if is_connected:
        response.setcode('SUCCESS')
        ret.append(BIZ_CODE['SUCCESS'])
    else:
        response.setcode('WRONG_CONNECTION')
        ret = [BIZ_CODE['WRONG_CONNECTION']]
        return HttpResponse(json.dumps(ret))
    return HttpResponse(json.dumps(ret))


# 更新数据库信息
def update_db(request):
    response = Response()
    if request.method != 'POST':
        # 非post访问
        response.setcode('WRONG_CONNECTION')
        ret = [BIZ_CODE['WRONG_CONNECTION']]
        return HttpResponse(json.dumps(ret))

    dbname = request.POST['dbname']
    new_dbname = request.POST['newDBname']
    sql_type = request.POST['type']
    ip = request.POST['ip']
    port = request.POST['port']
    user = request.POST['username']
    cur_password = request.POST['curPassword']
    new_password = request.POST['newPassword']
    if sql_type == 'MySQL':
        if port == "":
            port = 3306
            conn, cursor = mysql_base_api.sql_init(ip, user, cur_password, None, port)
        else:
            conn, cursor = mysql_base_api.sql_init(ip, user, cur_password, None, int(port))
        if str(type(conn)).find('int') != -1:
            response.setcode('WRONG_CONNECTION')
            ret = [BIZ_CODE['WRONG_CONNECTION']]
            return HttpResponse(json.dumps(ret))
        # 如果数据库名有变更，则修改数据库名
        if dbname != new_dbname:
            # 首先创建目标数据库
            r = mysql_base_api.create_database(conn, cursor, new_dbname)  # 创建新的数据库
            if len(r) > 0 and r[0] == 1007:
                ret = [BIZ_CODE['DATABASE_EXIST']]
                return HttpResponse(json.dumps(ret))
            elif str(type(r)).find('tuple'):
                # 获取所有源库的表名
                mysql_base_api.sql_execute(conn, cursor, "use information_schema;", "")
                tables = mysql_base_api.sql_execute(conn, cursor, "select table_name from TABLES where "
                                                                  "TABLE_SCHEMA='" + dbname + "';", "")
                # 按照以下命令一个个修改原数据库表名
                if len(tables) > 0:
                    for table in tables:
                        table_name = table['table_name']
                        mysql_base_api.sql_execute(conn, cursor,
                                                   "rename table " + dbname + "." + table_name + " to " +
                                                   new_dbname + "." + table_name + ";", "")
                mysql_base_api.drop_database(cursor, dbname)  # 删除原来的数据库
                # 获取新数据库的size和volume
                mysql_base_api.sql_execute(conn, cursor, "use information_schema;", "")
                volume = mysql_base_api.sql_execute(
                    conn, cursor, "select concat(round(sum(DATA_LENGTH/1024/1024),2)) as data from TABLES", "")
                size = mysql_base_api.sql_execute(conn, cursor,
                                                  "select concat(round(sum(DATA_LENGTH/1024/1024),2)) as "
                                                  "data from TABLES where table_schema='" + new_dbname + "';",
                                                  "")
                if size[0]['data'] is None:
                    size[0]['data'] = 0
                # 更新client_info表
                conn, cursor = mysql_base_api.sql_init(jc.mysql_host, jc.mysql_user, jc.mysql_pass,
                                                       None, jc.mysql_port)
                mysql_base_api.sql_execute(conn, cursor, "use octastack_fuzhou;", "")
                update_row = [
                    "UPDATE `client_info` SET db_name='" + new_dbname + "', db_size = " + str(size[0]['data']) +
                    ", db_volume = " + str(volume[0]['data']) + " where db_name='" + dbname + "'" + " and db_ip='" + ip + "'"]
                mysql_base_api.update_row(conn, cursor, update_row)
            else:
                ret = [BIZ_CODE['WRONG_CONNECTION']]
                return HttpResponse(json.dumps(ret))
        # 如果数据库用户密码有变更，则修改密码
        if new_password != "":
            # 同时修改密码
            logger.debug("---------------- test change password ---------------" + new_password)
            mysql_base_api.sql_execute(conn, cursor, "use mysql;", None)
            mysql_base_api.sql_execute(conn, cursor,
                                       "UPDATE user SET Password = "
                                       "PASSWORD(" + new_password + ") WHERE user = '" + user + "';", None)
            mysql_base_api.sql_execute(conn, cursor, "FLUSH PRIVILEGES;", None)
            logger.debug("-------------------- success changed password-----------------")
        # 获取数据库的size和volume
        mysql_base_api.sql_execute(conn, cursor, "use information_schema;", None)
        volume = mysql_base_api.sql_execute(
            conn, cursor, "select concat(round(sum(DATA_LENGTH/1024/1024),2)) as data from TABLES", "")
        size = mysql_base_api.sql_execute(conn, cursor,
                                          "select concat(round(sum(DATA_LENGTH/1024/1024),2)) as "
                                          "data from TABLES where table_schema='" + dbname + "';", "")
        if size[0]['data'] is None:
            size[0]['data'] = 0
        ret = []
        mysql_base_api.sql_close(conn, cursor)
        temp = {'name': new_dbname, 'type': sql_type, 'ip': ip, 'port': port,
                'size': float(size[0]['data']), 'volume': float(volume[0]['data'])}
        ret.append(temp)
        response.setcode('SUCCESS')
        ret.append(BIZ_CODE['SUCCESS'])
        return HttpResponse(json.dumps(ret))

    elif sql_type == 'PostgreSQL':
        conn = psycopg2.connect(user=user, password=cur_password, host=ip, port=port)
        conn.set_isolation_level(0)
        cur = conn.cursor()
        if dbname != new_dbname:
            cur.execute("ALTER DATABASE " + dbname + " RENAME TO " + new_dbname + ";")
        conn.set_isolation_level(1)
        cur.close()
        conn.close()

        # 更新client_info表
        mysql_conn, mysql_cursor = mysql_base_api.sql_init(jc.mysql_host, jc.mysql_user, jc.mysql_pass,
                                               None, jc.mysql_port)
        mysql_base_api.sql_execute(mysql_conn, mysql_cursor, "use octastack_fuzhou;", "")
        update_row = [
            "UPDATE `client_info` SET db_name='" + new_dbname + "', db_size = 0" +
            ", db_volume = 0" + " where db_name='" + dbname + "'" + " and db_ip='" + ip + "'"]
        mysql_base_api.update_row(mysql_conn, mysql_cursor, update_row)
        mysql_base_api.sql_close(mysql_conn, mysql_cursor)

        ret = []
        temp = {'name': new_dbname, 'type': sql_type, 'ip': ip, 'port': port,
                'size': 0, 'volume': 0}
        ret.append(temp)
        response.setcode('SUCCESS')
        ret.append(BIZ_CODE['SUCCESS'])
        return HttpResponse(json.dumps(ret))
    else:
        response.setcode('NOT_SUPPORT_DABABASE_TYPE')
        ret = [BIZ_CODE['NOT_SUPPORT_DABABASE_TYPE']]
        return HttpResponse(json.dumps(ret))


# 删除数据库
def deletedb(request):
    response = Response()
    if request.method != 'POST':
        # 非post访问
        response.setcode('WRONG_CONNECTION')
        ret = [BIZ_CODE['WRONG_CONNECTION']]
        return HttpResponse(json.dumps(ret))

    dbname = request.POST['dbname']
    ip = request.POST['ip']
    port = request.POST['port']
    user = request.POST['username']
    password = request.POST['password']
    sql_type = request.POST['type']
    if sql_type == 'MySQL':
        try:
            if port == '':
                conn, cursor = mysql_base_api.sql_init(ip, user, password, dbname)
            else:
                conn, cursor = mysql_base_api.sql_init(ip, user, password, dbname, int(port))
            if str(type(conn)).find('int') != -1:
                response.setcode('WRONG_CONNECTION')
                ret = [BIZ_CODE['WRONG_CONNECTION']]
                return HttpResponse(json.dumps(ret))
            # 删除数据库
            mysql_base_api.drop_database(cursor, dbname)
            # 删除client_info表中对应数据
            conn, cursor = mysql_base_api.sql_init(jc.mysql_host, jc.mysql_user, jc.mysql_pass,
                                                   None, jc.mysql_port)
            mysql_base_api.sql_execute(conn, cursor, "use `octastack_fuzhou`", "")
            del_list = ["DELETE FROM `client_info` where db_name = '" + dbname + "'" + " and db_ip='" + ip + "'"]
            mysql_base_api.update_row(conn, cursor, del_list)
            mysql_base_api.sql_close(conn, cursor)
            response.setcode('SUCCESS')
            ret = [BIZ_CODE['SUCCESS']]
            return HttpResponse(json.dumps(ret))
        except:
            response.setcode('WRONG_CONNECTION')
            ret = [BIZ_CODE['WRONG_CONNECTION']]
            return HttpResponse(json.dumps(ret))
    elif sql_type == 'PostgreSQL':
        try:
            # 数据库连接参数
            conn = psycopg2.connect(user=user, password=password, host=ip, port=port)
            conn.set_isolation_level(0)
            cur = conn.cursor()
            cur.execute("DROP DATABASE IF EXISTS " + dbname + " ;")
            if conn is not None:
                conn.commit()  # DELETE, INSERT, UPDATE operations should commit.
            conn.set_isolation_level(1)

            # 删除client_info表中对应数据
            mysql_conn, mysql_cursor = mysql_base_api.sql_init(jc.mysql_host, jc.mysql_user, jc.mysql_pass,
                                                   None, jc.mysql_port)
            mysql_base_api.sql_execute(mysql_conn, mysql_cursor, "use `octastack_fuzhou`", "")
            del_list = ["DELETE FROM `client_info` where db_name = '" + dbname + "'" + " and db_ip='" + ip + "'"]
            mysql_base_api.update_row(mysql_conn, mysql_cursor, del_list)
            mysql_base_api.sql_close(mysql_conn, mysql_cursor)

            ret = [BIZ_CODE['SUCCESS']]
            return HttpResponse(json.dumps(ret))
        except:
            response.setcode('WRONG_CONNECTION')
            ret = [BIZ_CODE['WRONG_CONNECTION']]
            return HttpResponse(json.dumps(ret))
        finally:
            cur.close()
            conn.close()


# ssh connection and excute shell command
def ssh_cmd(params, cmd_port):
    import pexpect
    ssh_connect = pexpect.spawn('ssh %s@%s' % (params['osName'], params['ip2']))
    ssh_connect.timeout = 10
    i = ssh_connect.expect(['continue connecting (yes/no)?', 'password',
                            pexpect.EOF, pexpect.TIMEOUT])
    if i == 0:
        ssh_connect.sendline('yes')
        i = ssh_connect.expect(['password', 'Warning: Permanently added'])
        if i == 0:
            ssh_connect.sendline(params['osPassword'])
            if params['port1'] != params['port2']:
                ssh_connect.sendline(cmd_port)
                # j = ssh_connect.expect(['password', pexpect.EOF, pexpect.TIMEOUT])
                # if j == 0:
                #     ssh_connect.sendline(params['osPassword'])
                # else:
                ssh_connect.sendline(params['osPassword'])
                return {'result': True}
    if i == 1:
        ssh_connect.sendline(params['osPassword'])
        if params['ip1'] != params['ip2']:
            ssh_conn = pexpect.spawn("scp /tmp/database.sql " + params['osName'] + "@" +
                                     params['ip2'] + ":/tmp/database.sql")
            r2 = ssh_conn.expect(['continue connecting (yes/no)?', 'password',
                                  pexpect.EOF, pexpect.TIMEOUT])
            if r2 == 0:
                ssh_conn.sendline(params['preOSPassword'])
                r = ssh_conn.expect(['password:', pexpect.EOF, pexpect.TIMEOUT])
                if r == 0:
                    ssh_conn.sendline(params['osPassword'])
            if r2 == 1:
                ssh_conn.sendline(params['osPassword'])
            if params['port1'] != params['port2']:
                ssh_connect.sendline(cmd_port)
                # j = ssh_connect.expect(['password', pexpect.EOF, pexpect.TIMEOUT])
                # if j == 0:
                #     ssh_connect.sendline(params['osPassword'])
                # else:
                ssh_connect.sendline(params['osPassword'])
            conn, cursor = mysql_base_api.sql_init(params['ip2'], params['username2'],
                                                   params['password2'], None, int(params['port2']))
            return_dic = {}
            if str(type(conn)).find('int') != -1:
                if conn == 2003 and str(cursor).find('113'):  # 1. 网络不通 conn为整数2003， cursor 中包含错误(113)
                    ret = [BIZ_CODE['NET_UNREACHABLE']]
                    return HttpResponse(json.dumps(ret))
                if conn == 2003 and str(cursor).find('111'):  # 2. 没有数据库或无法连接到数据库，conn为2003，cursor中包含错误(111)
                    ret = [BIZ_CODE['NOT_SUPPORT_DABABASE_TYPE']]
                    return HttpResponse(json.dumps(ret))
                if conn == 1045:  # 3. 用户名密码错误，conn为1045
                    ret = [BIZ_CODE['WRONG_CONNECTION']]
                    return HttpResponse(json.dumps(ret))
                if conn == 1130:  # 4. 主机被限制连接，conn为1130
                    ret = [BIZ_CODE['HOST_BINDED']]
                    return HttpResponse(json.dumps(ret))
                if conn == 1049:  # 5. database is not exist
                    ret = [BIZ_CODE['NOT_SUPPORT_DABABASE_TYPE']]
                    return HttpResponse(json.dumps(ret))
            else:
                r = mysql_base_api.create_database(conn, cursor, params['dbname'])  # 创建新的数据库
                if len(r) > 0 and r[0] == 1007:
                    mysql_base_api.sql_execute(conn, cursor, "use " + params['dbname'] + "", "")
                    mysql_base_api.sql_execute(conn, cursor, 'source /tmp/database.sql;', "")
                    # 获取新数据库的size和volume
                    mysql_base_api.sql_execute(conn, cursor, "use information_schema;", "")
                    volume = mysql_base_api.sql_execute(
                        conn, cursor, "select concat(round(sum(DATA_LENGTH/1024/1024),2)) as data from TABLES", "")
                    size = mysql_base_api.sql_execute(conn, cursor,
                                                      "select concat(round(sum(DATA_LENGTH/1024/1024),2)) as "
                                                      "data from TABLES where table_schema='" + params['dbname'] + "';",
                                                      "")
                    if size[0]['data'] is None:
                        size[0]['data'] = 0
                    # 更新client_info表
                    conn, cursor = mysql_base_api.sql_init(jc.mysql_host, jc.mysql_user, jc.mysql_pass,
                                                           None, jc.mysql_port)
                    mysql_base_api.sql_execute(conn, cursor, "use octastack_fuzhou;", "")
                    update_row = [
                        "UPDATE `client_info` SET db_ip='" + params['ip2'] + "', db_size = " + str(size[0]['data']) +
                        ", db_volume = " + str(volume[0]['data']) + " where db_name='" + params['dbname'] + "'"]
                    mysql_base_api.update_row(conn, cursor, update_row)
                    # 删除数据库
                    conn, cursor = mysql_base_api.sql_init(params['ip1'], params['username1'], params['password1'],
                                                           params['dbname'], int(params['port1']))
                    mysql_base_api.drop_database(cursor, params['dbname'])
                elif str(type(r)).find('tuple'):
                    mysql_base_api.sql_execute(conn, cursor, "use " + params['dbname'] + "", "")
                    mysql_base_api.sql_execute(conn, cursor, 'source /tmp/database.sql;', "")

                    # 获取新数据库的size和volume
                    mysql_base_api.sql_execute(conn, cursor, "use information_schema;", "")
                    volume = mysql_base_api.sql_execute(
                        conn, cursor, "select concat(round(sum(DATA_LENGTH/1024/1024),2)) as data from TABLES", "")
                    size = mysql_base_api.sql_execute(conn, cursor,
                                                      "select concat(round(sum(DATA_LENGTH/1024/1024),2)) as "
                                                      "data from TABLES where table_schema='" + params['dbname'] + "';",
                                                      "")
                    if size[0]['data'] is None:
                        size[0]['data'] = 0
                    # 更新client_info表
                    conn, cursor = mysql_base_api.sql_init(jc.mysql_host, jc.mysql_user, jc.mysql_pass,
                                                           jc.mysql_database, jc.mysql_port)
                    # mysql_base_api.sql_execute(conn, cursor, "use octastack_fuzhou;", "")
                    update_row = [
                        "UPDATE `client_info` SET db_ip='" + params['ip2'] + "', db_size = " + str(size[0]['data']) +
                        ", db_volume = " + str(volume[0]['data']) + " where db_name='" + params['dbname'] + "'"]
                    mysql_base_api.update_row(conn, cursor, update_row)
                    # 删除数据库
                    conn, cursor = mysql_base_api.sql_init(params['ip1'], params['username1'], params['password1'],
                                                           params['dbname'], int(params['port1']))
                    mysql_base_api.drop_database(cursor, params['dbname'])

                    return_dic['volume'] = volume[0]['data']
                    return_dic['size'] = size[0]['data']
                mysql_base_api.sql_close(conn, cursor)
                return_dic['result'] = True
                return return_dic
    return {'result': False}


# 迁移数据库
# step1:    connection test
def connection_test(request):
    if request.method == 'POST':
        dbname = request.POST['dbname']
        uname = request.POST['username']
        passwd = request.POST['password']
        ip = request.POST['ip']
        port = int(request.POST['port']) if (request.POST['port'] != '') else 3306
        conn, cursor = mysql_base_api.sql_init(ip, uname, passwd, dbname, port)
        if str(type(conn)).find('int') != -1:
            if conn == 2003 and str(cursor).find('113'):  # 1. 网络不通 conn为整数2003， cursor 中包含错误(113)
                ret = [BIZ_CODE['NET_UNREACHABLE']]
                return HttpResponse(json.dumps(ret))
            if conn == 2003 and str(cursor).find('111'):  # 2. 没有数据库或无法连接到数据库，conn为2003，cursor中包含错误(111)
                ret = [BIZ_CODE['NOT_SUPPORT_DABABASE_TYPE']]
                return HttpResponse(json.dumps(ret))
            if conn == 1045:  # 3. 用户名密码错误，conn为1045
                ret = [BIZ_CODE['WRONG_CONNECTION']]
                return HttpResponse(json.dumps(ret))
            if conn == 1130:  # 4. 主机被限制连接，conn为1130
                ret = [BIZ_CODE['HOST_BINDED']]
                return HttpResponse(json.dumps(ret))
            if conn == 1049:  # 5. database is not exist
                ret = [BIZ_CODE['NOT_SUPPORT_DABABASE_TYPE']]
                return HttpResponse(json.dumps(ret))
        else:
            os.system("mysqldump --opt -h" + ip + " -u" + uname + " -p" + passwd +
                      " --skip-lock-tables " + dbname + " > /tmp/database.sql")  # export database
            ret = [BIZ_CODE['SUCCESS']]
            return HttpResponse(json.dumps(ret))


# step2:    transfer database
def transfer_db(request):
    if request.method != 'POST':
        response = Response()
        # 非post访问
        response.setcode('WRONG_CONNECTION')
        ret = [BIZ_CODE['WRONG_CONNECTION']]
        return HttpResponse(json.dumps(ret))

    username1 = request.POST['username1']
    dbname = request.POST['dbname']
    password1 = request.POST['password1']
    ip1 = request.POST['ip1']
    ip2 = request.POST['ip2']
    type2 = request.POST['type2']
    port1 = request.POST['port1']
    port2 = request.POST['port2']

    ip1 = 'localhost' if ip1 == gc.LOCALHOST else ip1
    ip2 = 'localhost' if ip2 == gc.LOCALHOST else ip2
    # 首先判断数据库类型在客户机上是否存在
    if type2 != 'MySQL':
        ret = [BIZ_CODE['NOT_SUPPORT_DABABASE_TYPE']]
        return HttpResponse(json.dumps(ret))
    if type2 == 'MySQL':
        conn, cursor = mysql_base_api.sql_init(ip1, username1, password1,
                                               dbname, int(port1))
        if str(type(conn)).find('int') != -1:
            if conn == 2003 and str(cursor).find('113'):  # 1. 网络不通 conn为整数2003， cursor 中包含错误(113)
                ret = [BIZ_CODE['NET_UNREACHABLE']]
                return HttpResponse(json.dumps(ret))
            if conn == 2003 and str(cursor).find('111'):  # 2. 没有数据库或无法连接到数据库，conn为2003，cursor中包含错误(111)
                ret = [BIZ_CODE['NOT_SUPPORT_DABABASE_TYPE']]
                return HttpResponse(json.dumps(ret))
            if conn == 1045:  # 3. 用户名密码错误，conn为1045
                ret = [BIZ_CODE['WRONG_CONNECTION']]
                return HttpResponse(json.dumps(ret))
            if conn == 1130:  # 4. 主机被限制连接，conn为1130
                ret = [BIZ_CODE['HOST_BINDED']]
                return HttpResponse(json.dumps(ret))
            if conn == 1049:
                ret = [BIZ_CODE['NOT_SUPPORT_DABABASE_TYPE']]
                return HttpResponse(json.dumps(ret))
        else:
            command1 = "sudo sed -i 's/^port/port            = " + port2 + \
                       "#/' /etc/mysql/my.cnf"
            res = ssh_cmd(request.POST, command1)
            if res['result']:
                ret = []
                temp = {'name': dbname, 'type': type2, 'ip': ip2, 'size': float(res['size']),
                        'volume': float(res['volume']), 'port': port2}
                ret.append(temp)
                ret.append(BIZ_CODE['SUCCESS'])
                return HttpResponse(json.dumps(ret))
            else:
                ret = [BIZ_CODE['TRANSFER_DB_FAILED']]
                return HttpResponse(json.dumps(ret))

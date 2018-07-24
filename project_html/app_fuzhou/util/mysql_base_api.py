#!/usr/bin/env python
# encoding: utf-8

import MySQLdb
import MySQLdb.cursors
import os
import django
import sys
from app_fuzhou.views_utils.logger import logger

from passlib.hash import pbkdf2_sha256


# Function:  connect to MySQL and get the connection and cursor objects.
# Parameter: db_host: host name or IP; dn_user: MySQL's username; db_passwd: MySQL's password; db_port: MySQL's port, 3306 by default.
#            db_name should be set to None while creating database.
# Return:    MySQL connection and cursor.
def sql_init(db_host, db_user, db_passwd, db_name, db_port=3306):
    # conn = None
    # cursor = None
    if db_name is None:
        """
        通过查看api 参数cursorclass应该在connect中，
        如果放在conn.cursor()中，应该是参数应该是cursor   modifed by ck
        """
        conn = MySQLdb.connect(host=db_host, user=db_user, passwd=db_passwd, port=db_port,
                               cursorclass=MySQLdb.cursors.DictCursor, charset="utf8")  # connect to MySQL
        cursor = conn.cursor()  # get the cursor
    else:
        # 同上 modifed by ck
        conn = MySQLdb.connect(host=db_host, user=db_user, passwd=db_passwd, db=db_name,
                               port=db_port, cursorclass=MySQLdb.cursors.DictCursor, charset="utf8")  # connect to MySQL
        cursor = conn.cursor()  # get the cursor
    return conn, cursor


# Function:  close MySQL cursor and connect.
# Parameter: conn: MySQL connection; cursor: MySQL cursor.
def sql_close(conn, cursor):
    if conn and cursor:
        try:
            cursor.close()      # close cursor
            conn.close()        # close connection
        except MySQLdb.Error as e:
            logger.error("Error %d: %s" % (e.args[0], e.args[1]))


# Function:  configure django database settings.
# Parameter: file_path: settings.py; db_engine: type of database.
def django_db_configure(file_path, db_engine, db_name, db_user, db_passwd, db_host, db_port=3306):
    db_dict = {}        # dictionary assigned to DATABASES of settings.py
    db_conf = {'ENGINE': db_engine, 'NAME': db_name, 'USER': db_user, 'PASSWORD': db_passwd, 'HOST': db_host,
               'PORT': db_port}  # dictionary assigned to database configure

    db_dict['default'] = db_conf

    reader = open(file_path, 'r')
    lines = reader.readlines()
    reader.close()
    writer = open('settings.py', 'w')

    # delete DATABASES line.
    for line in lines:
        if 'DATABASES' not in line:
            writer.write(line)

    writer.write('DATABASES = ' + str(db_dict))   # update new DATABASES of settings.py
    writer.close()
    return


# Function:  setup django environment. You should setup django before using ORM standalone.
# Parameter: poj_directory: django project directory; settings: django settings module
def django_setup(poj_directory, settings):
    sys.path.append(os.path.join(os.path.abspath(os.path.dirname(__file__)), poj_directory))    # configure poject directory
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', settings)               # configure django settings
    django.setup()
    return


# Function:  execute orginal sql return insert_id and sql-execute results
# Parameter: conn: MySQL connection; cursor: MySQL cursor; sql: orginal SQL; args: SQL's arguments used by INSERT.
# Return:    primary keys of the table and sql-execute results.
def sql_execute(conn, cursor, sql, args):
    ret = None
    if conn and cursor:
        try:
            cursor.execute(sql, args)           # execute orginal SQL, with args or none.
            if conn is not None:
                conn.commit()                   # DELETE, INSERT, UPDATE operations should commit.
            ret = cursor.fetchall()
        except MySQLdb.Error as e:
            logger.error("mysql_base_api sql_execute Error %d: %s" % (e.args[0], e.args[1]))
            ret = (e.args[0], e.args[1])
    return ret         # sql-execute results.


# Function:  execute orginal sql return primary keys.
# Parameter: conn: MySQL connection; cursor: MySQL cursor; sql: orginal SQL; args: SQL's arguments used by INSERT.
# Return:    primary keys.
def sql_execute_keyreturn(conn, cursor, sql, args):
    pmkey = None                             # store primary keys
    try:
        cursor.execute(sql, args)           # execute orginal SQL, with args or none.
        pmkey = cursor.lastrowid
        if conn is not None:
            conn.commit()                   # DELETE, INSERT, UPDATE operations should commit.
    except MySQLdb.Error as e:
        logger.error("mysql_base_api sql_execute Error %d: %s" % (e.args[0], e.args[1]))

    return pmkey         # primary keys and sql-execute results.


# Function:  execute orginal sql without return.
# Parameter: cursor: MySQL cursor; sql: orginal SQL; args: SQL's arguments used by INSERT.
# Return:    None.
def sql_execute_noreturn(cursor, sql, args):
    try:
        cursor.execute(sql, args)
    except MySQLdb.Error as e:
        logger.error("Error %d: %s" % (e.args[0], e.args[1]))


# Function:  executemany
# Parameter: conn: db connection; cursor: MySQL cursor; sql: orginal SQL; args: SQL's arguments used by INSERT.
# Return:    last row's pmkey.
def sql_executemany(conn, cursor, sql, args):
    pmkey = None                             # store primary keys
    try:
        cursor.executemany(sql, args)           # execute orginal SQL, with args or none.
        pmkey = cursor.lastrowid
        if conn is not None:
            conn.commit()                   # DELETE, INSERT, UPDATE operations should commit.
    except MySQLdb.Error as e:
        logger.error("Error %d: %s" % (e.args[0], e.args[1]))

    return pmkey            # sql-execute results.


# Function:  create database
# Parameter: cursor: MySQL cursor; db_name: database name
# Format:    db_name: {"create_db":"base_api_test"}
# Return:    None.
def create_database(conn, cursor, db_name):
    r = 1
    try:
        sql = "CREATE DATABASE IF NOT EXISTS %s" % db_name      # orginal database-create sql
        r = sql_execute(conn, cursor, sql, None)
    except MySQLdb.Error as e:
        logger.error("------------Error %d: %s" % (e.args[0], e.args[1]))
    return r


# Function:  drop database
# Parameter: cursor: MySQL cursor; db_name: database name
# Format:    db_name: {"drop_db":"base_api_test"}
# Return:    None.
def drop_database(cursor, db_name):
    sql = "DROP DATABASE IF EXISTS %s" % db_name            # orginal drop-database sql
    sql_execute_noreturn(cursor, sql, None)


# Function:  create tables
# Parameter: cursor: MySQL cursor; create_scripts: orignal create tables sql
# Format:    create_scripts: {"create_tb":["script1","script2"]}, scripts is ordered according to foreign key
# Return:    None.
def create_tables(cursor, create_scripts):
    if len(create_scripts) == 0:            # none sql script
        logger.info("None table to create.")
        return -1

    try:
        for script in create_scripts:       # fetch one table-create script a time
            cursor.execute(script)
            logger.error("SQL Result: %s", cursor.fetchone())
    except MySQLdb.Error as e:
        logger.error("Error %d: %s" % (e.args[0], e.args[1]))
        return 0
    return 1


# Function:  drop tables list, ordered by foreign key dependence
# Parameter: cursor: MySQL cursor; tables_list: tables to be dropt
# Format:    tables_list: {"drop_tb":["table1","table2"]}
# Return:    None.
def drop_tables(cursor, tables_list):
    if len(tables_list) == 0:               # none table to drop
        logger.error("None table to drop.")
        return -1

    try:
        for table in tables_list:           # fetch one table a time
            cursor.execute("DROP TABLE %s" % table)
            logger.debug("SQL Result: %s", cursor.fetchone())
    except MySQLdb.Error as e:
        logger.error("Error %d: %s" % (e.args[0], e.args[1]))

    return 1


# Function:  build INSERT orignal SQL: INSERT INTO table (col1, col2, ..) VALUES (%s, %s, ...)
# Parameter: table: table name; row_data: columns and coresponding values
# Return:    INSERT orignal SQL
def build_insertsql(table, row_data):
    qmarks = ','.join(["%s"] * len(row_data))         # build VALUES sub string: "%s, %s, ..."
    cols = ','.join(row_data.keys())                  # build COLUMNS sub string: "col1, col2, ..."
    sql = "INSERT INTO %s (%s) VALUES (%s)" % (table, cols, qmarks)  # build orginal INSERT SQL with table, columns and %s for values
    return sql


# Function:  insert
# Parameter: conn: MySQL connection; cursor: MySQL cursor; insert_data: table name and data to be inserted.
# Format:    tables_list: {"insert":{"table_name":["col1":val1, "col2":val2]}}
# Return:    Primary keys list.
def insert_row(conn, cursor, insert_data):
    if len(insert_data) == 0:               # none data to insert
        logger.debug("None data to insert.")
        return []

    pmkey = []              # store inserted row id
    for table, data in insert_data.items():     # fetch table name and data list
        for one_script in data:                 # fetch a row, keys coresponding to column name
            # qmarks = ','.join(["%s"] * len(one_script))         # build VALUES sub string: "%s, %s, ..."
            # cols = ','.join(one_script.keys())                  # build COLUMNS sub string: "col1, col2, ..."
            # sql = "INSERT INTO %s (%s) VALUES (%s)" % (table, cols, qmarks)     # build orginal INSERT SQL with table, columns and %s
            sql = build_insertsql(table, one_script)
            pmkey.append(sql_execute_keyreturn(None, cursor, sql, one_script.values()))     # execute INSERT SQL, values of dict as the arguments

    conn.commit()

    return pmkey            # return rows' primary keys list


# Function:  insert without commit.
# Parameter: cursor: MySQL cursor; insert_data: table name and data to be inserted.
# Format:    tables_list: {"insert_nocmt":{"table_name":["col1":val1, "col2":val2]}}
# Return:    Primary keys list.
def insert_row_nocommit(cursor, insert_data):
    if len(insert_data) == 0:               # none data to insert
        logger.debug("None data to insert.")
        return []
    pmkey = []              # store inserted row id
    for table, data in insert_data.items():     # fetch table name and data list
        for one_script in data:                 # fetch a row, keys coresponding to column name
            sql = build_insertsql(table, one_script)
            pmkey.append(sql_execute_keyreturn(None, cursor, sql, one_script.values()))     # execute INSERT SQL, values of dict as the arguments

    return pmkey            # return rows' primary keys list


# Function:  insert one sql with multi arguments.
# Parameter: cursor: MySQL cursor; insert_data: table name and data to be inserted.
# Format:    tables_list: {"insert_many":{"table_name":["col1":val1, "col2":val2]}}
# Return:    Primary keys list.
def insert_many(cursor, insert_data):
    if len(insert_data) == 0:               # none data to insert
        logger.debug("None data to insert.")
        return []

    args = []
    pmkey = []
    # sql= ""
    for table, data in insert_data.items():     # fetch table name and data list
        if len(data) == 0:
            return []
        else:
            sql = build_insertsql(table, data[0])

        for one_script in data:                 # fetch a row, keys coresponding to column name
            args.append(one_script.values())    # build arguments list

        pmkey.append(sql_executemany(None, cursor, sql, args))

    return pmkey        # return rows' primary keys list


# Function:  insert row table one by one with foreignkey
# Parameter: conn: MySQL connection; cursor: MySQL cursor; insert_data: table name and data to be inserted.
# Format:    tables_list: {"insert_fk":[{"table_name":{"data":{"col1":val1, "col2":val2}, "foreignkey":"col"}}]}
# Return:    Last inserted primary key.
def insert_row_foreignkey(conn, cursor, insert_data):
    if len(insert_data) == 0:               # none data to insert
        logger.debug("None data to insert.")
        return -1

    row_id = 0              # row primary key id
    sql = ''
    for one_script in insert_data:          # fetch each table's data: {"table_name":{"data":{"col1":val1, "col2":val2}, "foreignkey":"col"}}]}
        for table, one_row in one_script.items():       # fetch table name and row data
            data_dict = one_row             # copy data for adding foreignkey key-val pair
            if "foreignkey" in one_row:     # check if table has a foreign key
                data_dict = one_row["data"]
                data_dict[one_row["foreignkey"]] = row_id       # last table's insert-row id as foreignkey value

            sql = build_insertsql(table, data_dict)
            logger.debug(data_dict)
            pmkey = sql_execute_keyreturn(conn, cursor, sql, data_dict.values())
            row_id = pmkey               # store insert-row id
            logger.debug(pmkey)

    return row_id           # last inserted primary key


# Function:  UPDATE & DELETE operation using orignal SQL
# Parameter: conn: MySQL connection; cursor: MySQL cursor; sql_list: SQL script list
# Format:    sql_list: UPDATE-{"update":["sql1"]}, DELETE-{"delete":["sql1"]}
# Return:    sql result
def update_row(conn, cursor, sql_list):
    ret = ["success"]
    for sql in sql_list:
        sql_result = sql_execute(conn, cursor, sql, None)
        if len(sql_result) > 0:
            ret = ["fail", sql_result]
    return ret


# Function:  SELECT operation using orignal SQL
# Parameter: cursor: MySQL cursor; sql_list: SQL script list
# Format:    sql_list: {"select":["sql1"]}
# Return:    sql result
def select_row(cursor, sql_list):
    ret = []
    for sql in sql_list:
        sql_result = sql_execute(None, cursor, sql, None)
        if len(sql_result) > 0:
            ret.append(sql_result)
    return ret


# Function: Querying with original SQL and fetch one result
# Parameter: cursor: MySQL Cursor; sql: SQL script; param: Query parameter
def select_one_row(cursor, sql, param=None):
    cursor.execute(sql, param)
    return cursor.fetchone()


# Function:  SELECT operation using orignal SQL, with only 1 sql as parameter
# Parameter: cursor: MySQL cursor; sql: SQL script
# Format:    sql_list: {"select":"sql1"}
# Return:    sql result
def select_onesql(cursor, sql):
    ret = sql_execute(None, cursor, sql, None)
    return ret


# Function:  create user
# Parameter: conn: MySQL connection; cursor: MySQL cursor; user_info: user name and password
# Format:    tables_list: {"create_user":{"user":"finger", "password":"ca$hc0w"}}
# Return:    sql result
def db_user_create(conn, cursor, user_info):
    sql = "CREATE USER %s IDENTIFIED BY %s"
    args = [user_info["user"], user_info["password"]]       # build sql arguments

    ret = sql_execute(conn, cursor, sql, args)
    logger.debug("User: %s is created." % user_info["user"])
    return ret


# Function:  delete user
# Parameter: conn: MySQL connection; cursor: MySQL cursor; user_name: user name
# Format:    tables_list: {"delete_user":"finger"}
# Return:    sql result
def db_user_delete(conn, cursor, user):
    sql = "DROP USER %s"
    args = [user]

    sql_execute(conn, cursor, sql, args)
    logger.debug("User: %s is deleted." % user)


# Function:  reset user's password
# Parameter: conn: MySQL connection; cursor: MySQL cursor; user_info: user name and password
# Format:    tables_list: {"set_passwd":{"user":"finger", "password":"finger"}}
# Return:    sql result
def set_passwd(conn, cursor, user_info):
    sql = "SET PASSWORD FOR %s = PASSWORD(%s)"
    args = [user_info["user"], user_info["password"]]       # build sql arguments

    sql_execute(conn, cursor, sql, args)
    logger.debug("Password of user: %s has changed." % user_info["user"])


# Function:  backup databases using mysqldump
# Parameter: backup_info: arguments needed by mysqldump
# Format:    tables_list: {"backup_db":{"user":"", "password":"", "file":"", "dblist":[db1]}}
# Return:    sql result
def db_backup(backup_info):
    db_user = backup_info["user"]
    db_passwd = backup_info["password"]
    backup_file = backup_info["file"]
    db_list = backup_info["dblist"]
    if len(db_list) == 0:
        logger.debug("None db to backup.")
        return -1

    db_join = ' '.join(db_list)             # build database list as "db1 db2 ..."
    logger.debug(db_join)
    # use mysqldump to backup databases. use "--password" to assign password without inputting while mysqldump
    cmd = "mysqldump -u %s --password=%s --databases %s > %s" % (db_user, db_passwd, db_join, backup_file)
    os.system(cmd)

    return 1


# Function:  restore databases from backup file
# Parameter: restore_info: arguments needed by mysqldump
# Format:    tables_list: {"restore_db":{"user":"", "password":"", "file":"", "dblist":[db1]}}
# Return:    sql result
def db_restore(restore_info):
    db_user = restore_info["user"]
    db_passwd = restore_info["password"]
    backup_file = restore_info["file"]
    db_list = restore_info["dblist"]
    if len(db_list) == 0:           # None database to restore
        logger.debug("None database to resotre.")
        return
    elif len(db_list) == 1:         # Only 1 database to restore
        cmd = "mysql -u %s --password=%s %s < %s" % (db_user, db_passwd, db_list[0], backup_file)
    else:                           # multi databases to restore
        cmd = "mysql -u %s --password=%s < %s" % (db_user, db_passwd, backup_file)
    os.system(cmd)


# Function:  create application user and store password as hash value
# Parameter: conn: MySQL connection; cursor: MySQL cursor; userinfo: table name, username, password
# Format:    tables_list: {"create_appuser":{"table_name":[{"username":val1, "password":val2}]}}
# Return:    Primary keys list.
def app_user_create(conn, cursor, userinfo):
    pmkey = []
    for table, data in userinfo.items():
        for one_user in data:       # fetch each user and coresponding password
            one_user["password"] = pbkdf2_sha256.encrypt(one_user["password"])      # HASH
            pmkey = pmkey + insert_row(conn, cursor, userinfo)          # insert to userinfo table
    return pmkey


# Function:  check user's password
# Parameter: cursor: MySQL cursor; userinfo: table name, username, password
# Format:    tables_list: {"check_pass":{"table":"val1", "username":"root", "password":"finger"}}
# Return:    password is correct or not.
def app_pass_check(cursor, userinfo):
    table = userinfo["table"]
    user = userinfo["username"]
    passwd = userinfo["password"]
    sql = "SELECT password FROM %s WHERE username='%s'" % (table, user)
    pass_result = sql_execute(None, cursor, sql, None)      # get hash value of password in database

    if len(pass_result) > 0:
        pass_hash = pass_result[0]["password"]
        return pbkdf2_sha256.verify(passwd, pass_hash)      # return password matched or not

    logger.debug("username: %s not exists.", user)
    return False


# Function:  uniform interface
# Parameter: conn, cursor: MySQL connection and cursor. When creating database, use sql_init by assigning dbname with None.
#            json_data: python dict struct with one key-value paire. key: operation ID, value: operation parameter.
# Format:    {"operation ID": "parameters"}
# Return:    sql result
def base_api(conn, cursor, json_data):
    if 'create_db' in json_data:            # '1': create database. Format: {"create_db":"base_api_test"}
        return create_database(conn, cursor, json_data['create_db'])
    elif 'drop_db' in json_data:            # '2': drop database.   Format: {"drop_db":"base_api_test"}
        return drop_database(cursor, json_data['drop_db'])
    elif 'create_tb' in json_data:          # '3': create tables.   Format: {"create_tb":["script1","script2"]}, scripts is ordered according to foreign key
        return create_tables(cursor, json_data['create_tb'])
    elif 'drop_tb' in json_data:            # '4': drop tables.     Format: {"drop_db":["table1","table2"]}
        return drop_tables(cursor, json_data['drop_tb'])
    elif 'insert' in json_data:             # '5': insert row.      Format: {"insert":{"table_name":[{"col1":val1, "col2":val2}]}}
        return insert_row(conn, cursor, json_data['insert'])
    elif 'insert_nocmt' in json_data:       # '16': insert without commit.      Format: {"insert_nocmt":{"table_name":["col1":val1, "col2":val2]}}
        return insert_row_nocommit(cursor, json_data['insert_nocmt'])
    elif 'insert_many' in json_data:        # '19': insert many.      Format: {"insert_many":{"table_name":["col1":val1, "col2":val2]}}
        return insert_row_nocommit(cursor, json_data['insert_many'])
    elif 'insert_fk' in json_data:          # '6': insert row foreignkey. Format: {"insert_fk":[{"table_name":{"data":{"col1":val1, "col2":val2}, "foreignkey":"col"}}]}
        return insert_row_foreignkey(conn, cursor, json_data['insert_fk'])
    elif 'update' in json_data:             # '7': update row.      Format: {"update":["sql1"]}
        return update_row(conn, cursor, json_data['update'])
    elif 'delete' in json_data:             # '8': delete row.      Format: {"delete":["sql1"]}
        return update_row(conn, cursor, json_data['delete'])
    elif 'select' in json_data:             # '9': select.          Format: {"select":["sql1"]}
        return select_row(cursor, json_data['select'])
    elif 'select_1sql' in json_data:        # '15': select.          Format: {"select_1sql":"sql"}
        return select_onesql(cursor, json_data['select_1sql'])
    elif 'create_user' in json_data:        # '10': user create.    Format: {"create_user":{"user":"finger", "password":"ca$hc0w"}}
        return db_user_create(conn, cursor, json_data['create_user'])
    elif 'delete_user' in json_data:        # '11': user delete.    Format: {"delete_user":"finger"}
        return db_user_delete(conn, cursor, json_data['delete_user'])
    elif 'set_passwd' in json_data:         # '12': set password.   Format: {"set_passwd":{"user":"finger", "password":"finger"}}
        return set_passwd(conn, cursor, json_data['set_passwd'])
    elif 'backup_db' in json_data:          # '13': db backup.      Format: {"backup_db":{"user":"", "password":"", "file":"", "dblist":[db1]}}
        return db_backup(json_data['backup_db'])
    elif 'restore_db' in json_data:         # '14': db resotre.     Format: {"restore_db":{"user":"", "password":"", "file":"", "dblist":[db1]}}
        return db_restore(json_data['restore_db'])
    elif 'create_appuser' in json_data:     # '17': create app user.     Format: {"create_appuser":{"userinfo": [{"username":"root", "password":"ca$hc0w"}]}}
        return app_user_create(conn, cursor, json_data['create_appuser'])
    elif 'check_pass' in json_data:         # '18': check user's password.     Format: {"check_pass":{"table": "", "username": "", "password": ""}}
        return app_pass_check(cursor, json_data['check_pass'])
    else:
        logger.error("Wrong Key.")


from django.db.models import Aggregate, CharField


class Concat(Aggregate):
    """ORM用来分组显示其他字段 相当于group_concat"""
    function = 'GROUP_CONCAT'
    template = '%(function)s(%(distinct)s%(expressions)s)'

    def __init__(self, expression, distinct=False, **extra):
        super(Concat, self).__init__(
            expression,
            distinct='DISTINCT ' if distinct else '',
            output_field=CharField(),
            **extra)

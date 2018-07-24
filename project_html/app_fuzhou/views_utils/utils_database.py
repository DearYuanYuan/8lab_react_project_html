from app_fuzhou.util import mysql_base_api
from app_fuzhou.views_utils.global_config import GlobalConf

# 初始化常量类
gc = GlobalConf()


def judge_port(ip, username, password, port):
    """
    根据port的数据类型做相应处理
    :param ip:
    :param username:
    :param password:
    :param port:
    :return:
    """
    if port == '':
        port = 3306
        conn, cursor = mysql_base_api.sql_init(ip, username, password, None, port)
    else:
        conn, cursor = mysql_base_api.sql_init(ip, username, password, None, int(port))
    return conn, cursor


def insert_data(username, password, temp):
    """
    把数据插入到表client_info中
    :param username:
    :param password:
    :param temp:
    :return:
    """
    # 连接本地mysql数据库octastack_fuzhou
    conn, cursor = gc.connect_localhost()
    # 将要插入数据库client_info表中的数据组织成json格式
    insert_row = {"client_info": [
        {
            "db_name": temp['name'],
            "db_type": temp['type'],
            "db_ip": temp['ip'],
            "db_port": temp['port'],
            "sql_uname": username,
            "sql_passwd": password,
            "db_size": temp['size'],
            'db_volume': temp['volume']
        }]}
    # 插入数据
    mysql_base_api.insert_row(conn, cursor, insert_row)
    # 关闭连接
    mysql_base_api.sql_close(conn, cursor)


def get_temp(conn, cursor, username, password, temp):
    """
    获取包括size和volume的temp数据
    :param conn:
    :param cursor:
    :param username:
    :param password:
    :param temp:
    :return:
    """
    # 使用数据库information_schema
    mysql_base_api.sql_execute(conn, cursor, "use information_schema;", None)
    # 获取数据库大小
    size_count = "select concat(round(sum(DATA_LENGTH/1024/1024),2)) as data from TABLES where table_schema='" + \
                 temp['name'] + "'"
    size = mysql_base_api.sql_execute(conn, cursor, size_count, None)
    if size[0]['data'] is None:
        temp['size'] = float(0)
    else:
        size = float(size[0]['data'])
        temp['size'] = float(size)
    # 获取数据库容量
    volume_count = "select concat(round(sum(DATA_LENGTH/1024/1024),2)) as data from TABLES"
    volume = mysql_base_api.sql_execute(conn, cursor, volume_count, "")
    volume = float(volume[0]['data'])
    # 把size和volume添加到temp字典中
    temp['volume'] = float(volume)
    # 把数据插入到表client_info中
    insert_data(username, password, temp)
    return temp


def get_common_set(data_set):
    """
    获取主机相关信息
    :param data_set:
    :return:
    """
    # "diff" 所表示的列表
    record_list = []
    # dict中除diff的部分，因为同一主机上的这些信息是相同的，故简化放入一个set中
    common_set = set()
    for d_s in data_set:
        # 若common_set中不包含某台主机ip信息，则将该主机ip信息添加到该set中
        # 并将diff信息组成的list添加到return_list中
        record_dict = {}
        if d_s['db_ip'] not in common_set:
            common_set.add(d_s['db_ip'])
        record_dict[d_s['db_ip']] = [d_s["db_name"], d_s["db_size"], d_s["db_id"],
                                     d_s['db_volume'], d_s['db_ip'], d_s['db_port'],
                                     d_s['sql_uname'], d_s['sql_passwd'], d_s['db_type']]
        record_list.append(record_dict)
    return common_set, record_list


def get_data_list(record_list, c_s, data_list):
    """

    :param record_list:
    :param c_s:
    :param data_list:
    :return:
    """
    return_list = []
    return_dict = {}
    for r_d in record_list:
        ip = gc.LOCALHOST
        value = []
        for k in r_d.keys():  # 取出key --- ip
            ip = k
        for v in r_d.values():  # 取出数据库信息
            value = v
        if c_s == ip:
            return_list.append(value[:4])
            return_dict['diff'] = return_list
            return_dict['db_ip'] = value[4]
            return_dict['db_port'] = value[5]
            return_dict['sql_uname'] = value[6]
            return_dict['sql_passwd'] = value[7]
            return_dict['db_type'] = value[8]
            data_list.append(return_dict)


def organize_db_info(common_set, record_list):
    """
    组织数据:
        最外层是一个列表，列表里每个元素都是一个dict,dict格式如下:
        {
            "db_ip":"", "db_port": "", "sql_uname": "", "sql_passwd": "", "db_type": "",
            "diff": [[db_name, db_size, db_id, db_volume], ..., []]
        }
        dict每个元素（除diff外），都是代表某一个主机的mysql信息，
        包括该主机的ip、port、数据库用户名、数据库密码、数据库类型
        diff表示的是在该主机上的各个数据库信息，有数据库名、数据库大小、数据库id、数据库容量,格式如下:
        "diff":[[db_name, db_size, db_id, db_volume], [], ..., []]
    :param common_set:
    :param record_list:
    :return:
    """
    data_list = []
    for c_s in common_set:
        get_data_list(record_list, c_s, data_list)
    return data_list

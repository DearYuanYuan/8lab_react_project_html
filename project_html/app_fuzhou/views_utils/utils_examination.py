from app_fuzhou.util import mysql_base_api
from app_fuzhou.views_utils.global_config import GlobalConf
from app_fuzhou.models import AppFuzhouGroup, AppFuzhouGroupIp, BlackboxHost

gc = GlobalConf()

def organize_insert_json(logtime, content, insert_list):
    """
    组织需要插入到数据库中的数据,并存在数组insert_list中
    :param logtime:
    :param content:
    :param insert_list:
    :return:
    """
    tmp_json = {"level": "ERROR", "time": logtime, "content": str(content), "host": content["Client"],
                "ip": content["Oat"], "filename": content['ErrorInfo']}
    insert_list.append(tmp_json)
    return insert_list


def get_insert_list(trust_logs, index, ret, insert_list):
    """
    根据数据库表trustlog中的情况来处理数据插入的情况
    :param trust_logs:
    :param index:
    :param ret:
    :param insert_list:
    :return insert_list:
    """
    logtime = trust_logs[index - 1].strip("[").split(",")[0].split(".")[0]
    content = eval(trust_logs[index])
    time_list = []
    # 若表trustlog中有数据，则保证数据要不重复
    if len(ret) > 0:
        # 组织需要插入到数据库中的数据, 并存在数组insert_list中
        for t in ret[0]:
            time_list.append(t["time"])
        # 确保同一时刻的日志内容不被重复插入
        if logtime not in time_list:
            insert_list = organize_insert_json(logtime, content, insert_list)
    # 若表trustlog中没有有数据，则插入数据
    else:
        insert_list = organize_insert_json(logtime, content, insert_list)
    return insert_list


def get_insert_data(conn, cursor, ret, trust_logs):
    """
    获得需要插入到数据库中的数据insert_list
    :param conn:
    :param cursor:
    :param ret:
    :param trust_logs:
    :return insert_list:
    """
    insert_list = []
    for index in range(1, len(trust_logs)):
        if trust_logs[index].find("ERROR") != -1:  # 只存error的日志
            # 获得insert_list
            insert_list = get_insert_list(trust_logs, index, ret, insert_list)
    if len(insert_list) == 0:
        # 如果没有error日志，则清空trustlog表,以保证trustfile文件和trustlog表数据一致
        mysql_base_api.sql_execute(conn, cursor, "delete from trustlog;", None)
    return insert_list


def insert_data(conn, cursor, trust_logs):
    """
    把日志内容按字段的键值分割，存入数据库中
    :param conn:
    :param cursor:
    :param trust_logs:
    :return:
    """
    # 按行分割日志内容
    trust_logs = trust_logs.splitlines()
    sql = ["select * from trustlog"]
    # 查询表trustlog
    ret = mysql_base_api.select_row(cursor, sql)
    # 获得需要插入到数据库中的数据insert_list
    insert_list = get_insert_data(conn, cursor, ret, trust_logs)
    # 组织数据，插入到数据库中
    insert_json = {"trustlog": insert_list}
    # 把错误日志存在数据库octastack_fuzhou的表trustlog中
    mysql_base_api.insert_row(conn, cursor, insert_json)


def get_group_host_ips(group_ids):
    """
    :param group_ids: "1,2,3,4,5"
    :return: ["192.168.1.1", "192.168.1.2", "192.168.1.3"]
    """
    fuzhou_group_ip = AppFuzhouGroupIp.objects.filter(group_id__in=group_ids.split(","))
    return_res = []
    for item in fuzhou_group_ip:
        if item.ip not in return_res:
            return_res.append(item.ip)
    return ",".join(return_res)


def get_group_host_ids(group_ids):
    """
    :param group_ids: "1,2,3,4,5"
    :return: "1,2,3,4,5"
    """
    fuzhou_group_ip = AppFuzhouGroupIp.objects.filter(group_id__in=group_ids.split(","))
    return_res = []
    for item in fuzhou_group_ip:
        if item.id not in return_res:
            return_res.append(item.id)
    return ",".join(return_res)


def del_group_invalid_ip(ip):
    pass
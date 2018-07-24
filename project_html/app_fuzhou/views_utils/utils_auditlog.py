"""
旧代码,不再调用
本例的作用是为auditlog.py提供内容,从logthread中读取并缓存的trustFile获取数据
新代码在utils_audit.py中
"""
from app_fuzhou.views_utils.logger import logger

log_pre = "[八分量] (可信云服务日志) "
levels = ['info', 'debug', 'warning', 'error', 'critical']
# # 定义5种level的日志数组
# debug_list = ["DEBUG"]
# info_list = ["INFO"]
# warning_list = ["WARNING"]
# error_list = ["ERROR"]
# critical_list = ["CRITICAL"]
# # 定义5种level的时间数组
# debug_time_list = ["DEBUG"]
# info_time_list = ["INFO"]
# warning_time_list = ["WARNING"]
# error_time_list = ["ERROR"]
# critical_time_list = ["CRITICAL"]


def level_classification(all_logs):  # 旧代码,不再调用
    """
    根据日志中某行所包含的关键字对该行日志信息进行分类存放在list中
    :param all_logs:
    :return level_dict[level][0], level_dict[level][1]:
    """
    level_dict = {'info': [[], []], 'debug': [[], []], 'warning': [[], []], 'error': [[], []], 'critical': [[], []]}
    temp_list = all_logs.split("\n")
    for i in range(len(temp_list)):
        try:
            _log = temp_list[i]
            if _log != '' and _log.strip() != ("" or None) and _log.strip()[0] != "[":
                if _log.find("ERROR") != -1:
                    # level_dict中每个键值对的值都是两个数组，第一个是xx_list第二个是xx_time_list
                    level_dict["error"][1].append(temp_list[i - 1][1:20])  # [2016/12/01 15:50:31.1,  0]
                    level_dict["error"][0].append("ERROR " + log_pre + _log.strip())
                elif _log.find("WARNING") != -1:
                    level_dict["warning"][1].append(temp_list[i - 1][1:20])
                    level_dict["warning"][0].append("WARNING " + log_pre + _log.strip())
                elif _log.find("CRITICAL") != -1:
                    level_dict["critical"][1].append(temp_list[i - 1][1:20])
                    level_dict["critical"][0].append("CRITICAL " + log_pre + _log.strip())
                elif _log.find("INFO") != -1:
                    level_dict["info"][1].append(temp_list[i - 1][1:20])
                    level_dict["info"][0].append("INFO " + log_pre + _log.strip())
                else:
                    level_dict["debug"][1].append(temp_list[i - 1][1:20])
                    level_dict["debug"][0].append("DEBUG " + log_pre + _log.strip())
        except IndexError as e:
            logger.error(temp_list[i])
            logger.error(e)
    return level_dict


def page_calculate(count, size):  # 旧代码,不再调用
    """
    计算总页数
    :param count:
    :param size:
    :return page_sum:
    update by : Yang Ze
    """
    pages = int(count) / int(size)
    page_sum = int(pages) + 1 if pages > int(pages) else int(pages)
    return page_sum


def get_return_list(level, page, size, sorted_list_dict, pages, return_array):  # 旧代码,不再调用
    """
    组织各个level的日志数据
    :param level:
    :param page:
    :param size:
    :param sorted_list_dict:
    :param pages:
    :param return_array:
    :return:
    update by : Yang Ze
    """
    for i in range((int(page) - 1) * int(size),
                   int(page) * int(size) if int(page) < pages else len(sorted_list_dict[level])):
        each_arr = [sorted_list_dict[level+'_time'][i], level.upper(), sorted_list_dict[level][i]]
        return_array.append(each_arr)


def get_return_data(level, page, size, sorted_list_dict):  # 旧代码,不再调用
    """
    获得需要返回的数组和总页数
    :param level:
    :param page:
    :param size:
    :param sorted_list_dict:
    :return return_array, pages:
    update by : Yang Ze
    """
    return_array = []
    pages = 0
    if level == 'INFO':
        # 先算出能分成几页pages
        pages = page_calculate(len(sorted_list_dict['info']), size)
        # 组织各个level的日志数据
        get_return_list('info', page, size, sorted_list_dict, pages, return_array)
    elif level == 'DEBUG':
        # 先算出能分成几页
        pages = page_calculate(len(sorted_list_dict['debug']), size)
        # 组织各个level的日志数据
        get_return_list('debug', page, size, sorted_list_dict, pages, return_array)
    elif level == 'WARNING':
        # 先算出能分成几页
        pages = page_calculate(len(sorted_list_dict['warning']), size)
        # 组织各个level的日志数据
        get_return_list('warning', page, size, sorted_list_dict, pages, return_array)
    elif level == 'ERROR':
        # 先算出能分成几页
        pages = page_calculate(len(sorted_list_dict['error']), size)
        # 组织各个level的日志数据
        get_return_list('error', page, size, sorted_list_dict, pages, return_array)
    elif level == 'CRITICAL':
        # 先算出能分成几页pages
        pages = page_calculate(len(sorted_list_dict['critical']), size)
        # 组织各个level的日志数据
        get_return_list('critical', page, size, sorted_list_dict, pages, return_array)
    return return_array, pages

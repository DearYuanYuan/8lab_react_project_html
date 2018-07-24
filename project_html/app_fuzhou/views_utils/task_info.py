#!/usr/bin/env python3
# encoding: utf-8

import datetime

import redis

from app_fuzhou.models import SVNTaskInfo, WebTaskInfo
from app_fuzhou.views_utils.localconfig import JsonConfiguration
from app_fuzhou.views_utils.logger import logger
from app_fuzhou.views_utils.octa_redis import OCTARedis

jc = JsonConfiguration()


class Task(object):
    """
    用于操作TaskInfo表
    """

    def __init__(self):
        pass

    @staticmethod
    def add_task(arguments):
        """
        添加异步任务到TaskInfo表

        :param arguments: 参数
        :return: 任务信息
        """

        service_type = arguments["service_type"]
        task_info_obj = SVNTaskInfo() if service_type == "svn" else WebTaskInfo()

        task_info_obj.timestamp = datetime.datetime.now()
        task_info_obj.operate_username = arguments['username']
        task_info_obj.protect_host_name = arguments['host_name']
        task_info_obj.protect_host_addr = arguments['host_addr']
        task_info_obj.protect_root_path = arguments['root_path']
        task_info_obj.operate_type = arguments['operate_type']
        task_info_obj.status = 'starting'

        task_info_obj.save()

        if service_type == "svn":
            task_info_obj = SVNTaskInfo.objects.using("dtamper_svn_mysql").filter(
                timestamp=task_info_obj.timestamp).first()
        elif service_type == "web":
            task_info_obj = SVNTaskInfo.objects.using("dtamper_web_mysql").filter(
                timestamp=task_info_obj.timestamp).first()

        ret = {
            'task_id': task_info_obj.id,
            'status': 'starting',
            'object_handled': 0,
            'object_count': 0
        }

        return task_info_obj.id, ret

    @staticmethod
    def delete_task(service_type, task_id):
        """
        删除任务
        :param service_type:
        :param task_id: 任务ID
        """
        task_info_obj = None
        if service_type == "svn":
            task_info_obj = SVNTaskInfo.objects.using("dtamper_svn_mysql").filter(id=task_id).first()
        elif service_type == "web":
            task_info_obj = SVNTaskInfo.objects.using("dtamper_web_mysql").filter(id=task_id).first()
        if not task_info_obj:
            task_info_obj.delete()

    @staticmethod
    def query_task_progress(service_type, task_id_list):
        """
        查询任务进度

        :param service_type: 服务类型
        :param task_id_list: 任务ID列表
        :return:
        """
        ret = []

        try:
            redis = OCTARedis()

            for task_id in task_id_list:
                data = {
                    'task_id': task_id
                }
                progress_data = {}

                task_obj = Task.check_task_valid(service_type, task_id)

                if task_obj:
                    key = '_'.join([service_type, str(task_obj.id), str(task_obj.protect_host_addr), task_obj.protect_root_path])

                    try:
                        progress_data = redis.rdb.hgetall(key)
                        logger.info(progress_data)
                    except Exception as error:
                        logger.info(error)

                    if progress_data:
                        data['status'] = progress_data.get('status', task_obj.status)
                        data['object_count'] = progress_data.get('object_count', 0)
                        data['object_handled'] = progress_data.get('object_handled', 0)

                        if isinstance(data['object_count'], str):
                            data['object_count'] = int(data['object_count'])
                        if isinstance(data['object_handled'], str):
                            data['object_handled'] = int(data['object_handled'])

                ret.append(data)

        except Exception as error:
            msg = 'Fail to query %s task progress.' % service_type
            logger.error(msg)
            logger.error(error)

            return False, ret, msg

        msg = 'Success to query %s task progress.' % service_type
        logger.info(msg)
        return True, ret, msg

    @staticmethod
    def check_task_valid(service_type, task_id):
        """
        依据任务ID获取任务
        :param service_type:
        :param task_id: 任务ID
        :return:
        """
        task_info_obj = None
        if service_type == "svn":
            task_info_obj = SVNTaskInfo.objects.using("dtamper_svn_mysql").filter(id=task_id).first()
        elif service_type == "web":
            task_info_obj = SVNTaskInfo.objects.using("dtamper_web_mysql").filter(id=task_id).first()

        if not task_info_obj:
            error_message = 'The task: %s does not exist.' % (str(task_id))
            logger.error(error_message)
            return None
        else:
            return task_info_obj

# 在线更新病毒库
import json
import re

from urllib import parse

from django.http import HttpResponse, JsonResponse
from app_fuzhou.views_utils.clamav import clamav
from app_fuzhou.views_utils.message_queue.clamav_msg_receiver import ClamavMsgReceiver
from app_fuzhou.models import ClamavTask, TaskGroupIp, AppFuzhouGroup, AppFuzhouGroupIp, ClamavTaskID, MachineList
from app_fuzhou.views_utils.scheduler_single_instance import SchedulerSingleInstance
from app_fuzhou.views_utils.logger import logger
from django.db import transaction

DEFUALT_HOST = "127.0.0.1"


def update_online(request):
    invoke_ip = request.POST.get("invoke_ip", DEFUALT_HOST)
    return HttpResponse(clamav.update_online(invoke_ip))


# 离线更新病毒库
def update_offline(request):
    invoke_ip = request.POST.get("invoke_ip", DEFUALT_HOST)
    db_path = request.POST.get("db_path")
    return HttpResponse(clamav.update_offline(invoke_ip, db_path))


# 扫描指定目录
def scan_path(request):
    invoke_ip = request.POST.get("invoke_ip", DEFUALT_HOST)
    conf_str = request.POST.get("conf_str", )
    if clamav.is_running(invoke_ip):
        return HttpResponse(json.dumps({"result": "is_running"}))
    return clamav.clam_scan(invoke_ip, conf_str)


# 终止扫描
def stop_scan(request):
    invoke_ip = request.POST.get("invoke_ip", DEFUALT_HOST)
    status = clamav.stop_scan(invoke_ip)
    ClamavMsgReceiver.init()  # 初始化, 清空旧数据
    return HttpResponse(status)


# 检查是否有新版本
def check_version(request):
    invoke_ip = request.POST.get("invoke_ip", DEFUALT_HOST)
    return HttpResponse(clamav.check_version(invoke_ip))


# 获取扫描状态
def get_scan_detail(request):
    invoke_ip = request.POST.get("invoke_ip", DEFUALT_HOST)
    return HttpResponse(ClamavMsgReceiver.get_detail())


# 获得异常文件列表
def get_exception_list(request):
    return HttpResponse(ClamavMsgReceiver.get_exception_list())


# 获取扫描结果总结
def get_last_summary(request):
    invoke_ip = request.POST.get("invoke_ip", DEFUALT_HOST)
    return HttpResponse(clamav.get_summary(invoke_ip))


# 挂起扫描进程
def suspend_scan(request):
    invoke_ip = request.POST.get("invoke_ip", DEFUALT_HOST)
    return HttpResponse(clamav.suspend_scan(invoke_ip))


# 唤醒扫描进程
def resume_scan(request):
    invoke_ip = request.POST.get("invoke_ip", DEFUALT_HOST)
    return HttpResponse(clamav.resume_scan(invoke_ip))


# 通过GET方式从URL中获得命令参数字典
def get_kwargs(url):
    query = parse.parse_qs(parse.urlparse(url).query)
    return dict([(k, v[0]) for k, v in query.items()])


# 配置ClamAV
def set_scan_config(request):
    """
    病毒扫描页面单个配置
    :param request:
    :return:
    """
    param = json.loads(request.POST.get("config"))
    host_ips = param.get("host_ips", '')
    config = param.get("config")
    host_list = host_ips.split('#')
    if not config:
        return JsonResponse({"code": 201, "message": "无配置参数"})

    if not all(host_list):
        return JsonResponse({"code": 201, "message": "请选择至少一个主机"})

    fail_host = ''
    fail_count = 0
    for host_ip in host_list:
        res = re.match(r'^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$', host_ip)
        if not res:
            return JsonResponse({"code": 201, "message": "ip不合法"})
        result = clamav.set_clamav_config(host_ip, config)
        if not result:
            if len(host_list) == 1:
                return JsonResponse({"code": 201, "message": "操作失败"})
            fail_host += (host_ip + ' ')
            fail_count += 1

    if not fail_count:
        return JsonResponse({"code": 200, "message": "操作成功"})

    if fail_count == len(host_list):
        return JsonResponse({"code": 201, "message": "操作失败"})

    return JsonResponse({"code": 202, "message": "部分主机设置失败(%s)" % fail_host})


@transaction.atomic
def set_scan_task_config(request):
    """
        @api {post} api/machinelist/set_scan_task_config/  ★设置定时任务扫描配置
        @apiDescription 设置定时任务扫描配置
        @apiGroup machinelist
        @apiParam {string} ids 主机列表或主机组列表 主机列表形式: 主机ip1#主机ip2  主机组列表形式: 组id1#组id2#组id3
        @apiParam {string} create 0 创建   1 更新
        @apiParam {string} type 0表示主机列表　１表示主机组列表
        @apiParam {string} inter interval时间间隔　日d　周w　月m  增加的定时
        @apiParam {string} task_id 任务id　create=1时才传
        @apiParam {string} name 任务名
        @apiParam {string} remark 任务便签
        @apiParam {string} conf_str 杀毒配置
        @apiSuccessExample Success-Response:
            {
                "code": 200
                "message": "操作成功"
            }
    """
    name = request.POST.get('name', '')
    create = request.POST.get('create', '')
    remark = request.POST.get('remark', '')
    ids = request.POST.get('ids', '')
    type = request.POST.get('type', 0)
    inters = request.POST.get('inters', '')
    conf_str = request.POST.get('conf_str', '')
    task_id = request.POST.get('task_id', '')

    sid = transaction.savepoint()
    try:

        if ids.strip() == '' or inters.strip() == '':
            return JsonResponse({'code': 201, "message": '请选择主机或主机组1'})

        if not all([type, conf_str, name, create]):
            return JsonResponse({'code': 201, "message": '请选择主机或主机组2'})

        # 判断name是否存在
        if ClamavTask.objects.filter(name=name).exists():
            return JsonResponse({'code': 201, "message": '任务名称已存在'})

        id_list = ids.split('#')
        inter_list = inters.split('#')

        create = int(create)
        type = int(type)

        # 如果create=0 表示创建杀毒定时, 不需要删除
        if create == 0:
            # 先创建当前任务任务
            # todo: 判断ｎａｍｅ是否存在，还没做
            cur_task = ClamavTask.objects.create(name=name, remark=remark, state=1, config=conf_str, time=inters)
            # 存表选中的组或主机
            # 更新　TaskGroupIp
            for id in id_list:
                if type == 1:
                    TaskGroupIp.objects.create(task_id=cur_task.id, target_id=id, state=1, type=type)
                elif type == 0:
                    # 根据ｉｐ获取ｉｄ
                    target_host_id = MachineList.objects.filter(hostip=id)[0].id
                    TaskGroupIp.objects.create(task_id=cur_task.id, target_id=target_host_id, state=1, type=type)
                # todo: 暂时先不搞，没什么用呢
                # # 更新　ClamavTaskID
                # for inter in inter_list:
                #     uuid = '%s-%s' % (id, inter)
                #     # todo:判断ip及uuid联合是否存在 不存在则创建
                #     if ClamavTaskID.objects.filter(host_id=id, task_uuid=uuid).exists():
                #         continue
                #     ClamavTaskID.objects.create(host_id=id, task_uuid=uuid, config=conf_str)

            # 不用删除，直接开启任务
            result = clamav.clock_scan(ids, inters, conf_str, type=0)

        # 如果create=0 表示更新, 创建杀毒定时, 需要全部删除，全部开启
        elif create == 1:
            task_id = int(task_id)
            sched = SchedulerSingleInstance()

            # 删除更新所有相关的表述据 三张表
            # 1. 更新ClamavTask表
            cur_task =  ClamavTask.objects.filter(id=task_id, state=1)
            # todo: 判断ｎａｍｅ是否存在，还没做
            cur_task.update(name=name, remark=remark, config=conf_str, time=inters)
            # 2. 删除 TaskGroupIp 表
            for id in id_list:
                TaskGroupIp.objects.filter(task_id=task_id, target_id=id).delete()
                # TaskGroupIp.objects.filter(task_id=task_id, target_id=id).update(state=0)
            # 3. 删除 ClamavTaskID 表 todo: 暂时先不搞，没什么用呢

            # 删除全部任务，再重新创建
            # 删除
            if type == 0:
                # uuid = '%s-%s' % (ip, inter)
                for ip in id_list:
                    for inter in inters:
                        uuid = '%s-%s' % (ip, inter)
                        sched.remove_job(job_id=uuid)

            elif type == 1:
                for group in id_list:
                    # obj_list = '通过group获取该组所有主机列表id'
                    group_obj = AppFuzhouGroupIp.objects.filter(group_id=group)
                    host_ip_list = group_obj.values_list('ip', flat=True)
                    group_id = group_obj[0].group_id

                    for host_ip in host_ip_list:
                        for inter in inter_list:
                            uuid = '%s-%s-%s' % (host_ip, group_id, inter)
                            sched.remove_job(job_id=uuid)

            # 任务删除完了, 重新创建
            for id in id_list:
                if type == 0:
                    host_id = MachineList.objects.filter(hostip=id)[0].id
                    TaskGroupIp.objects.create(task_id=cur_task.id, target_id=host_id, state=1, type=type)
                elif type == 1:
                    TaskGroupIp.objects.create(task_id=cur_task.id, target_id=id, state=1, type=type)
            result = clamav.clock_scan(ids, inters, conf_str, type=type)

        else:
            return JsonResponse({'code': 201, "message": '参数错误1'})
    except Exception as e:
        logger.error(e)
        result = False

    if result:
        return JsonResponse({'code': 200, "message": '操作成功'})

    transaction.savepoint_rollback(sid)
    return JsonResponse({'code': 201, "message": '操作失败'})





def remove_task(uuid):
    """
    取消杀毒任务
    :param uuid:
    :return:
    """
    sched = SchedulerSingleInstance()
    # 取消任务
    sched.remove_job(job_id=uuid)
    is_task = ClamavTaskID.objects.filter(task_uuid=uuid)
    if is_task.exists():
        is_task.delete()
    return True


    # sched = SchedulerSingleInstance()
    #
    # try:
    #     type = int(type)
    #
    #     # 先创建当前任务任务
    #     cur_task = ClamavTask.objects.create(name=name, remark=remark, state=1, config=conf_str)
    #
    #     # todo: 将配置保存到数据库
    #     for one in ips.split('#'):
    #         if type == 0:
    #             # todo: 先删除所有的定时任务, 再重新创建
    #             # 删除时间
    #             TaskGroupIp.objects.filter(cur_task,ip=one).update(state=0)
    #             # 删除路径
    #             for del_inter in del_inters:
    #                 uuid = '%s-%s' % (one, del_inter)
    #                 # 取消任务
    #                 sched.remove_job(job_id=uuid)
    #                 is_task = ClamavTaskID.objects.filter(ip=one, task_uuid=uuid)
    #                 if is_task.exists():
    #                     is_task.delete()
    #
    #             for inter in inters.split('#'):
    #                 # 127.0.0.1 或　127.0.0.2
    #                 AppFuzhouGroupTimer.objects.create(ip=one, type=0, state=1, time=inter)
    #         if type == 1:
    #             # 更新组的杀毒配置
    #             AppFuzhouGroup.objects.filter(id=one).update(config=conf_str)
    #
    #             # todo: 先删除取消的和取消删除的杀毒任务
    #             for del_inter in del_inters:
    #                 AppFuzhouGroupTimer.objects.filter(group_id=one, time=del_inter).update(state=0)
    #                 # 获取到one组的所有ip
    #                 del_ips = AppFuzhouGroupIp.objects.filter(group_id=one).values_list('ip')
    #                 # 分别删除指定ip的指定任务
    #                 for del_ip in del_ips:
    #                     uuid = '%s-%s-%s' % (del_ip, one, del_inter)
    #                     sched.remove_job(job_id=uuid)
    #                     is_task = ClamavTaskID.objects.filter(ip=del_ip, task_uuid=uuid)
    #                     if is_task.exists():
    #                         is_task.delete()
    #             # 添加任务
    #             for inter in inters.split('#'):
    #                 #组１ 或　组2　或　组３
    #                 AppFuzhouGroupTimer.objects.create(ip=one, type=1, state=1, time=inter)
    #
    #     clamav.clock_scan(ips, inters, conf_str, type)
    #     return JsonResponse({'code': 200, "message": '设置成功'})
    # except Exception as e:
    #     logger.error(e)
    #     return JsonResponse({'code': 201, "message": '设置失败'})


# 获取ClamAV的配置
def get_scan_config(request):
    """
    杀毒页面获取单个主机配置
    :param request:
    :return:
    """
    return HttpResponse(clamav.get_scan_config(request.POST.get("host_ip", DEFUALT_HOST)))

"""
系统检测页面 杀毒列表需要的查询、增加、修改、删除接口 扫描接口
使用 pylint 进行代码检查及优化 jiaxuechuan 2018-02-08
"""

import re
import redis
from django.http import JsonResponse
from django.db.models import Q
from django.core.paginator import Paginator
from app_fuzhou.models import MachineList, SystemConfig, AppFuzhouGroup, AppFuzhouGroupIp, TaskGroupIp, ClamavTask
from app_fuzhou.views_utils.logger import logger
from app_fuzhou.views_utils.global_config import JsonConfiguration
from app_fuzhou.views.v1.antivirus import Scan
from app_fuzhou.views_utils.clamav import clamav
from app_fuzhou.views_utils.scheduler_single_instance import SchedulerSingleInstance
from django.db import transaction

CONF = JsonConfiguration()
scan = Scan()


def show_machines(request):
    """
    显示主机列表　分页显示　每页默认十条
    :param: page: 显示第几页
    :param: sort: 排序方式 id 表示id升序　-id 表示id降序　默认-id
    :param: condition 查找条件
    :return: 200: 成功，有数据返回第page页数据列表　没有数据返回空列表　　　　其他: 失败
    """

    if request.method == 'POST':
        # 接收参数
        page = request.POST.get("page", 1)
        sort = request.POST.get("sort")
        count = request.POST.get("count", 10)
        condition = request.POST.get("condition", '')

        # 如果传过来的排序参数非法，按默认排序
        if sort not in ('id', '-id', 'hostip', '-hostip', 'is_scan', '-is_scan'):
            sort = '-id'

        try:
            page = int(page)
        except Exception as e:
            logger.error(str(e))
            # 如果页码参数不合法可以按第一页返回
            page = 1
            # return JsonResponse({'code': '201', 'message': '参数不合法'})

        # 返回数据
        data = []

        try:
            if condition:
                # 按主机IP或主机名进行模糊查询
                machines = MachineList.objects.filter(
                    Q(hostip__contains=condition) | Q(hostname__contains=condition)
                ).order_by(sort, '-id')
            else:
                # 获取全部的主机对象
                machines = MachineList.objects.all().order_by(sort, '-id')
        except Exception as e:
            logger.error(str(e))
            # return JsonResponse({'code': '201', 'message': '数据库查询错误'})
            return JsonResponse({'code': '200', 'data': data})

        if not machines.exists():
            return JsonResponse({'code': '200', 'data': data})

        # 创建paginator对象 按每页十条数据进行分页
        paginator = Paginator(machines, count)

        # 总页数 如果传过来的页码超出范围　返回第一页
        pages_num = paginator.num_pages
        if page < 0 or page > pages_num:
            page = 1

        # 获取第page页的Page对象
        page_obj = paginator.page(page)

        # 获取第page页的查询集
        page_query = page_obj.object_list

        # 从 redis 中获取主机的在线状态
        try:
            red = redis.Redis(CONF.redis4bigchanidb_host, CONF.redis4bigchanidb_port)
        except Exception as e:
            logger.error(e)
            red = {}

        for item in page_query:
            # 分别查询is_running状态, 防止数据库状态不对
            hp = item.hostip
            return_dict = item.toDict()
            key = 'client_' + item.hostip
            return_dict['status'] = True if red.get(key) else False
            if item.is_scan == True:
                try:
                    is_work = scan.is_running(hp)
                except Exception as e:
                    logger.error(e)
                    is_work = False
                return_dict['is_scan'] = is_work
                if is_work != item.is_scan:
                    # 更新数据库
                    try:
                        MachineList.objects.filter(hostip=hp).update(is_scan=is_work)
                    except Exception as e:
                        logger.error(e)
            data.append(return_dict)

        return JsonResponse({'code': '200', 'data': data, 'pages_num': pages_num})

    else:
        return JsonResponse({'code': '201', 'message': '访问方式出错'})


def show_all_machines(request):
    """
    @api {post} api/machinelist/show_all/  ★杀毒列表显示所有
    @apiDescription 杀毒列表显示所有
    @apiGroup machinelist
    @apiParam {string} condition 查询条件
    @apiSuccessExample Success-Response:
        {
            "code": "200",
            "data": [
                {
                    "hostname": "winw",
                    "hostip": "192.168.1.30",
                    "is_scan": false,
                    "remark": "ddddd",
                    "scan_log": "{'Engine version': '0.100.0', 'Data read': '0.00 MB (ratio 0.00:1)', 'Infected files': '0', 'Scanned directories': '0', 'Known viruses': '6564781', 'Time': '16.221 sec (0 m 16 s)', 'Data scanned': '0.00 MB', 'Scanned files': '0'}",
                    "status": false
                },
                {
                    "hostname": "suse-167",
                    "hostip": "192.168.1.167",
                    "is_scan": false,
                    "remark": "11111111111",
                    "scan_log": "{'Scanned files': '117', 'Data read': '24.30 MB (ratio 1.04:1)', 'Data scanned': '25.26 MB', 'Infected files': '0', 'Time': '15.420 sec (0 m 15 s)', 'Known viruses': '6562811', 'Engine version': '0.99.2', 'Scanned directories': '35'}",
                    "status": true
                }
            ]
        }
    @apiErrorExample Error-Response:
        {
        }

    """

    condition = request.POST.get("condition", '')
    page = 1
    page_num = 99999
    data = []
    if condition:
        machines = MachineList.objects.filter(Q(hostip__contains=condition) | Q(hostname__contains=condition))
    else:
        machines = MachineList.objects.all()

    if not machines.exists():
        return JsonResponse({'code': '200', 'data': data})

    paginator = Paginator(machines, page_num)
    pages_num = paginator.num_pages
    page_obj = paginator.page(page)
    page_query = page_obj.object_list

    # 从 redis 中获取主机的在线状态
    try:
        red = redis.Redis(CONF.redis4bigchanidb_host, CONF.redis4bigchanidb_port)
    except Exception as e:
        logger.error(e)
        red = {}

    for item in page_query:
        # 分别查询is_running状态, 防止数据库状态不对
        hp = item.hostip
        return_dict = item.toDict()
        key = 'client_' + item.hostip
        return_dict['status'] = True if red.get(key) else False
        if item.is_scan == True:
            try:
                is_work = scan.is_running(hp)
            except Exception as e:
                logger.error(e)
                is_work = False
            return_dict['is_scan'] = is_work
            if is_work != item.is_scan:
                # 更新数据库
                try:
                    MachineList.objects.filter(hostip=hp).update(is_scan=is_work)
                except Exception as e:
                    logger.error(e)
        data.append(return_dict)

    return JsonResponse({'code': '200', 'data': data})


def add_machine(request):
    """
    主机列表新增
    :param: hostip
    :param: hostname
    :param: remark　备注信息
    :return: 200 新增成功　　其他　新增失败
    """

    if request.method == 'POST':
        # 接收参数
        hostname = request.POST.get('hostname')
        hostip = request.POST.get('hostip')
        remark = request.POST.get('remark', '')

        res = re.match(r'^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$', hostip)

        # 校验参数
        if (not all([hostname, hostip])) or (res is None):
            return JsonResponse({'code': '201', 'message': 'IP或标签不合法'})

        # 如果 hostname 或 hostip 已经存在，则不能新建
        try:
            machine = MachineList.objects.filter(Q(hostip=hostip) | Q(hostname=hostname))
        except Exception as e:
            logger.error(str(e))
            return JsonResponse({'code': '201', 'message': '主机创建失败'})

        if not machine.exists():
            try:
                # 新增主机　默认未受保护　当前未查杀
                MachineList.objects.create(hostname=hostname, hostip=hostip, remark=remark)
            except Exception as e:
                logger.error(str(e))
                return JsonResponse({'code': '201', 'message': '主机创建失败'})
            return JsonResponse({'code': '200', 'message': '主机新建成功'})
        # 想要增加的主机已存在
        return JsonResponse({'code': '201', 'message': '主机已存在'})
    else:
        return JsonResponse({'code': '201', 'message': '访问方式出错'})


def delete_machine(request):
    """
    主机列表删除
    :param: hostips '127.0.0.1#127.0.0.2'
    :return: 200 删除成功　　其他　删除失败
    """

    if request.method == 'POST':
        # 接收参数
        hostips = request.POST.get('hostips')
        hostip_list = hostips.split('#')

        # 校验参数
        if not hostip_list:
            return JsonResponse({'code': '201', 'message': 'IP不能为空'})
        for hostip in hostip_list:
            res = re.match(r'^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$', hostip)
            if res is None:
                return JsonResponse({'code': '201', 'message': 'IP不合法'})

        # 先获取到要删除的所有主机对象
        try:
            machines = MachineList.objects.filter(hostip__in=hostip_list)
            # 如果查到的主机对象与传入的主机数量不相等，则说明有些主机不存在，此次操作不成功
            if machines.count() != len(hostip_list):
                return JsonResponse({'code': '201', 'message': '存在非法主机IP'})
            # 进行删除
            machines.delete()
        except Exception as e:
            logger.error(str(e))
            return JsonResponse({'code': '201', 'message': '删除主机失败'})

        return JsonResponse({'code': '200', 'message': '主机删除成功'})

    else:
        return JsonResponse({'code': '201', 'message': '访问方式出错'})


def change_machine(request):
    """
    主机信息更改
    :param: hostip
    :param: new_hostname
    :param: new_remark
    :return: 200 更新成功　　其他　更新失败
    """

    if request.method == 'POST':
        # 接收参数
        hostip = request.POST.get('hostip')
        new_hostname = request.POST.get('new_hostname')
        new_remark = request.POST.get('new_remark', '')

        res = re.match(r'^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$', hostip)

        # 校验参数
        if (not all([hostip, new_hostname])) or (res is None):
            return JsonResponse({'code': '201', 'message': '主机或标签不合法'})

        # 先获取到要更改的主机对象  不用get用filter是为了用到下面的update
        try:
            machine = MachineList.objects.filter(hostip=hostip)
            # 如果对象不存在
            if machine.count() != 1:
                return JsonResponse({'code': '201', 'message': '未查询到该主机'})

            # 因为hostname是唯一的　判断 new_hostname 是否在表中已存在
            hostname_exist = MachineList.objects.exclude(
                hostip=hostip).filter(hostname=new_hostname)
            # 如果 name 已存在　则不进行更新
            if hostname_exist.exists():
                return JsonResponse({'code': '201', 'message': 'IP或标签已存在'})

            # 进行更改
            machine.update(hostname=new_hostname, remark=new_remark)

        except Exception as e:
            logger.error(str(e))
            return JsonResponse({'code': '201', 'message': '更改主机信息失败'})

        return JsonResponse({'code': '200', 'message': '主机信息更改成功'})

    else:
        return JsonResponse({'code': '201', 'message': '访问方式出错'})


def detail_machine(request):
    """
    详细信息
    :param: hostip
    :return: 200 查询成功 data   其他 查询失败
    """

    if request.method == 'POST':
        # 接收参数
        hostip = request.POST.get('hostip')

        # 校验参数
        if not hostip:
            return JsonResponse({'code': '201', 'message': 'IP不能为空'})

        res = re.match(r'^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$', hostip)
        if res is None:
            return JsonResponse({'code': '201', 'message': 'IP不合法'})

        # 获主机对象
        try:
            machine = MachineList.objects.get(hostip=hostip)
        except Exception as e:
            logger.error(str(e))
            return JsonResponse({'code': '201', 'message': '未查询到该主机'})

        # 从 redis 中获取主机的在线状态
        try:
            red = redis.Redis(CONF.redis4bigchanidb_host, CONF.redis4bigchanidb_port)
        except Exception as e:
            logger.error(str(e))
            red = {}

        # 返回数据
        data = machine.toDict()
        key = 'client_' + machine.hostip
        data['status'] = True if red.get(key) else False

        return JsonResponse({'code': '200', 'data': data})

    else:
        return JsonResponse({'code': '201', 'message': '访问方式出错'})


def scan_start(request):
    """
    开始扫面
    :param: hostip
    :return: 200 开始扫描成功   其他 开始扫描失败
    """

    if request.method == 'POST':
        # 接收参数
        hostip = request.POST.get('hostip', '')
        host_list = hostip.split('#')
        # 校验参数
        if not all(host_list):
            return JsonResponse({'code': '201', 'message': '请选择至少一个主机'})
        # 从数据库获取扫描配置
        # TODO: 从数据库获取扫描配置 yes或no 还有扫描路径传递给 server

        for one_host in host_list:
            res = re.match(r'^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$', one_host)
            if res is None:
                return JsonResponse({'code': '201', 'message': 'IP不合法'})

        fail_host = ''
        fail_count = 0
        for one_host in host_list:
            try:

                conf_str = SystemConfig.objects.get(host_ip=one_host).config

                scan_res = scan.start_scan(one_host, conf_str)
                if scan_res:
                    # 更新数据扫描标记位
                    MachineList.objects.filter(hostip=hostip).update(is_scan=True)
                else:
                    fail_host += (one_host + '　')

            except Exception as e:
                logger.error(e)
                fail_count += 1
                if len(host_list) == 1:
                    return JsonResponse({'code': '201', 'message': '扫描失败'})
                continue

        if not fail_count:
            return JsonResponse({'code': '200', 'message': '开始扫描成功'})

        if fail_count == len(host_list):
            return JsonResponse({'code': '201', 'message': '扫描失败'})

        return JsonResponse({'code': '202', 'message': '部分主机开启扫描失败(%s)' % fail_host})

    else:
        return JsonResponse({'code': '201', 'message': '访问方式出错'})


def scan_stop(request):
    """
    停止扫面
    :param: hostip
    :return: 200 停止扫描成功   其他 停止扫描失败
    """

    if request.method == 'POST':
        # 接收参数
        hostip = request.POST.get('hostip')

        host_list = hostip.split('#')
        # 校验参数
        if not all(host_list):
            return JsonResponse({'code': '201', 'message': '请选择至少一个主机'})

        for one_host in host_list:
            res = re.match(r'^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$', one_host)
            if res is None:
                return JsonResponse({'code': '201', 'message': 'IP不合法'})

        fail_host = ''
        fail_count = 0
        for one_host in host_list:
            try:
                scan_res = scan.stop_scan(one_host)
                if scan_res:
                    # 更新数据扫描标记位
                    MachineList.objects.filter(hostip=hostip).update(is_scan=False)
                else:
                    fail_host += (one_host + '　')
            except Exception as e:
                logger.error(e)
                if len(host_list) == 1:
                    return JsonResponse({'code': '201', 'message': '停止扫描失败'})
                fail_count += 1
                continue

        if not fail_count:
            return JsonResponse({'code': '200', 'message': '停止扫描成功'})

        if fail_count == len(host_list):
            return JsonResponse({'code': '201', 'message': '停止扫描失败'})

        return JsonResponse({'code': '202', 'message': '部分主机停止扫描失败(%s)' % fail_host})

    else:
        return JsonResponse({'code': '201', 'message': '访问方式出错'})


def link_test(request):
    """
    测试连接
    :param: hostip
    :return: 200 测试连接成功   其他 测试连接失败
    """

    if request.method == 'POST':
        # 接收参数
        hostip = request.POST.get('hostip')

        # 校验参数
        if not hostip:
            return JsonResponse({'code': '201', 'message': 'IP不能为空'})

        res = re.match(r'^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$', hostip)
        if res is None:
            return JsonResponse({'code': '201', 'message': 'IP不合法'})

        try:
            res = scan.say_hello(hostip)
        except Exception as e:
            logger.error(str(e))
            return JsonResponse({'code': '201', 'message': '请开启本地服务'})

        if res:
            return JsonResponse({'code': '200', 'message': '测试连接成功'})
        return JsonResponse({'code': '201', 'message': '测试连接失败'})

    else:
        return JsonResponse({'code': '201', 'message': '访问方式出错'})


def clam_group_detail(request):
    """
    @api {post} api/machinelist/get_group_detail/  ★获取杀毒主机分组详细信息
    @apiDescription 获取杀毒主机分组详细信息(组内组外)
    @apiGroup machinelist
    @apiParam {string} id  组id
    @apiSuccessExample Success-Response:
        {
            "name": "333",
            "code": 200,
            "remark": "333333",
            "in_group": [
                {
                    "hostname": "123",
                    "scan_log": null,
                    "id": 275,
                    "hostip": "198.36.66.3",
                    "remark": "12312",
                    "is_scan": false
                }
            ],
            "out_group": [
                {
                    "hostname": "3",
                    "scan_log": null,
                    "id": 285,
                    "hostip": "168.36.3.9",
                    "remark": "66",
                    "is_scan": false
                }
            ]
        }
    @apiErrorExample Error-Response:
        {
            "code": 201
        }
    """
    group_id = request.POST.get("id")
    return_dic = {"code": 200, "name": "", "remark": "", "in_group": [], "out_group": []}

    # 分组是否存在
    app_fuzhou_group = AppFuzhouGroup.objects.filter(id=group_id)
    if not app_fuzhou_group.exists():
        return JsonResponse({"code": 201, "message": "分组信息无效，请重新操作！"})

    return_dic['name'] = app_fuzhou_group[0].name
    return_dic['remark'] = app_fuzhou_group[0].remark
    all_machines = MachineList.objects.all()

    for item in all_machines:
        app_fuzhou_group = AppFuzhouGroupIp.objects.filter(Q(state=1) & Q(group_id=group_id, ip=item.hostip))
        info = {
            "id": item.id,
            "hostip": item.hostip,
            "hostname": item.hostname,
            "remark": item.remark,
            "is_scan": item.is_scan,
            "scan_log": item.scan_log,
        }
        if app_fuzhou_group.exists():
            return_dic['in_group'].append(info)
        else:
            return_dic['out_group'].append(info)
    return JsonResponse(return_dic)


def all_host(request):
    """
    @api {get} api/machinelist/get_all_host/  ★所有主机
    @apiDescription 获取所有杀毒主机
    @apiGroup machinelist
    @apiSuccessExample Success-Response:
        {
            "count": 17,
            "code": 200,
            "all": [
                {
                    "remark": "",
                    "hostname": "235",
                    "hostip": "192.168.1.235",
                    "scan_log": "{'xxx'}",
                    "id": 289,
                    "is_scan": false
                },
                {
                    "remark": "ddddd",
                    "hostname": "winw",
                    "hostip": "192.168.1.30",
                    "scan_log": "{'xxx'}",
                    "id": 291,
                    "is_scan": false
                }
            ]
        }
    """
    try:
        host_all = MachineList.objects.all()
        if host_all.exists():
            return JsonResponse({"code": 200, "all": list(host_all.values()), "count": host_all.count()})
    except Exception as e:
        logger.error(e)
    return JsonResponse({"code": 200, "all": [], "count": 0})


def get_all_clam_group(request):
    """
    @api {post} api/machinelist/get_all_group/  ★获取所有杀毒分组
    @apiDescription 获取所有杀毒分组
    @apiGroup machinelist
    @apiParam {string} keyword 关键字：name或remark
    @apiParam {string} type 值为2
    @apiParam {string} num 第几页
    @apiParam {string} count 每页多少个 默认10
    @apiSuccessExample Success-Response:
        {
    "code": 200,
    "groups": [
        {
            "path": null,
            "config": null,
            "state": 1,
            "type": 2,
            "edittime": "2018-07-19T17:12:56",
            "id": 35,
            "name": "杀毒１",
            "remark": "杀毒１组",
            "createtime": "2018-07-19T17:12:56"
        }
    ],
    "count": 1
}
    """

    keyword = request.POST.get("keyword", "")
    type = request.POST.get("type", 2)

    try:
        page_num = int(request.POST.get("num", 1))
        count = int(request.POST.get("count", 10))
        app_fuzhou_group = AppFuzhouGroup.objects.filter(Q(state=1) & Q(type=type)).order_by('id')
        if keyword:
            app_fuzhou_group = AppFuzhouGroup.objects.filter(Q(state=1) & Q(type=type)).filter(Q(name__contains=keyword) | Q(remark__contains=keyword)).order_by('id')

        if not app_fuzhou_group.exists():
            return JsonResponse({'code': 200, 'groups': [], 'count': 0})

        # 创建paginator对象 按每页十条数据进行分页
        paginator = Paginator(app_fuzhou_group, count)

        # 总页数 如果传过来的页码超出范围　返回第一页
        pages_num = paginator.num_pages
        if page_num < 0 or page_num > pages_num:
            page_num = 1

        # 获取第page页的Page对象
        page_obj = paginator.page(page_num)

        # 获取第page页的查询集
        page_query = page_obj.object_list

        return JsonResponse({'code': 200, 'groups': list(page_query.values()), 'count': app_fuzhou_group.count()})
    except Exception as e:
        logger.error(e)

    return JsonResponse({'code': 200, 'groups': [], 'count': 0})


@transaction.atomic
def update_group(request):
    """
        @api {post} api/machinelist/update_group/  ★更新已有的杀毒分组
        @apiDescription 更新已有的杀毒分组
        @apiGroup machinelist
        @apiParam {string} name 组名称 不能为空
        @apiParam {string} remark 组备注
        @apiParam {string} group_id 主机组id
        @apiParam {string} add_ips_str 进组的主机(本身就在组里的不要传) 127.0.0.1#127.0.0.2
        @apiParam {string} del_ips_str 出组的主机 127.0.0.3#127.0.0.4
        @apiSuccessExample Success-Response:
            {
                "code": 200
                "message": "操作成功"
            }
        """
    group_id = request.POST.get('group_id', '')
    add_ips_str = request.POST.get('add_ips_str', '')
    del_ips_str = request.POST.get('del_ips_str', '')
    name = request.POST.get('name', '')
    remark = request.POST.get('remark', '')

    if not all([group_id, name]):
        return JsonResponse({'code': 201, 'message': '参数不全'})

    group_obj = AppFuzhouGroup.objects.filter(id=group_id, state=1)
    if not group_obj.exists():
        return JsonResponse({'code': 201, 'message': '主机组不存在'})

    sid = transaction.savepoint()
    try:
        # 无ip变动
        if not any([add_ips_str, del_ips_str]):
            group_obj.update(name=name ,remark=remark)
            return JsonResponse({'code': 200, 'message': '操作成功'})

        # 有ip变动
        host_list = add_ips_str.split('#')
        host_list.extend(del_ips_str.split('#'))
        for one_host in host_list:
            if one_host:
                is_machine = MachineList.objects.filter(hostip=one_host)
                res = re.match(r'^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$', one_host)
                if not (res and is_machine.exists()):
                    return JsonResponse({'code': 201, 'message': 'IP不合法'})

        is_tasks_exist = TaskGroupIp.objects.filter(target_id=group_id, type=1, state=1)
        # 没有相关的任务 更新组表
        if not is_tasks_exist.exists():
            # 增加
            for add_ip in add_ips_str.split('#'):
                is_ip_in_group = AppFuzhouGroupIp.objects.filter(group_id=group_id, ip=add_ip)
                if not is_ip_in_group.exists():
                    # 组里没有ip创建　有ip更新
                    AppFuzhouGroupIp.objects.create(group_id=group_id, ip=add_ip, state=1)
                else:
                    if is_ip_in_group[0].state == 1:
                        continue
                    elif is_ip_in_group[0].state == 0:
                        is_ip_in_group.update(state=1)

            # 删除
            for del_ip in del_ips_str.split('#'):
                AppFuzhouGroupIp.objects.filter(group_id=group_id, ip=del_ip).update(state=0)

            group_obj.update(name=name, remark=remark)
            return JsonResponse({'code': 200, 'message': '操作成功'})


        # 布置任务
        result, message = clamav.update_group_clam(group_id, add_ips_str, del_ips_str)
        if result:
            return JsonResponse({'code': 200, 'message': '操作成功'})
    except Exception as e:
        logger.error(e)

    transaction.savepoint_rollback(sid)
    return JsonResponse({'code': 201, 'message': '操作错误'})


@transaction.atomic
def del_task(request):
    """
        @api {post} api/machinelist/del_task/  ★删除任务
        @apiDescription 删除任务
        @apiGroup machinelist
        @apiParam {string} task_ids 任务id1#任务id2
        @apiSuccessExample Success-Response:
            {
                "code": 200
                "message": "操作成功"
            }
        """
    # 接受参数
    task_ids = request.POST.get('task_ids', '')
    if not task_ids:
        return JsonResponse({'code': 201, 'message': '缺少参数'})
    task_id_list = task_ids.split('#')  # [1, 2, 3]

    task_list = []

    # 根据task_id获取任务
    # ClamavTask表可以获取到config　和 time
    # TaskGroupIp表可以获取到targrt_id type  如果type=0,target_id为主机id　type=1,target_id为主机组id

    target_type = '123'

    sched = SchedulerSingleInstance()
    error_task = []

    sid = transaction.savepoint()
    try:
        for task_id in task_id_list:
            # task_id 3
            is_task = ClamavTask.objects.filter(id=task_id, state=1)
            if is_task.exists():
                is_task.update(state=0)
                task_group_ip_obj = TaskGroupIp.objects.filter(task_id=task_id, state=1)
                if task_group_ip_obj.exists():
                    # 时间列表
                    time_list = is_task[0].time.split('#')

                    if target_type == '123':
                        target_type = task_group_ip_obj[0].type

                    if target_type == 0:
                        # 任务id为主机列表任务
                        host_ip = MachineList.objects.filter(id=task_group_ip_obj[0].target_id)[0].hostip
                        for inter in time_list:
                            uuid = '%s-%s' % (host_ip, inter)
                            sched.remove_job(job_id=uuid)

                    elif target_type == 1:
                        # 获取terget_id组id 对应的所有ip
                        group_id = task_group_ip_obj[0].target_id
                        host_ips = AppFuzhouGroupIp.objects.filter(group_id=group_id).values_list('ip', flat=True)
                        for host_ip in host_ips:
                            for inter in time_list:
                                uuid = '%s-%s-%s' % (host_ip, group_id, inter)
                                sched.remove_job(job_id=uuid)
                is_task.update(state=0)
            else:
                error_task.append(task_id)
    except Exception as e:
        logger.error(e)
        transaction.rollback(sid)

    return JsonResponse({'code': 200, 'error_count': len(error_task), 'error_task': error_task})


def get_all_task(request):
    """
    @api {post} api/machinelist/get_all_task/  ★获取所有杀毒任务
    @apiDescription 获取所有杀毒任务
    @apiGroup machinelist
    @apiParam {string} keyword 关键字：name或remark
    @apiParam {string} num 第几页
    @apiParam {string} count 每页多少个 默认10
    @apiSuccessExample Success-Response:
            {
        "tasks": [
            {
                "id": 21,
                "remark": "任务标识2",
                "state": 1,
                "name": "新建任务2",
                "time": "d_17_04#d_17_05",
                "config": "{\"xmldocs\": True, \"pdf\": True, \"pe\": True, \"hwp3\": True, \"per_frequency\": \"8\", \"swf\": True, \"elf\": True, \"ole2\": False, \"scanPath\": \"C:\\OctaAv\", \"setup_update\": False, \"archive\": True, \"mail\": True, \"html\": True}"
            }
        ],
        "code": 200,
        "count": 1
    }
    """

    keyword = request.POST.get("keyword", "")

    try:
        page_num = int(request.POST.get("num", 1))
        count = int(request.POST.get("count", 10))
        app_fuzhou_task = ClamavTask.objects.filter(state=1).order_by('id')
        if keyword:
            app_fuzhou_task = ClamavTask.objects.filter(state=1).filter(Q(name__contains=keyword) | Q(remark__contains=keyword)).order_by('id')

        if not app_fuzhou_task.exists():
            return JsonResponse({'code': 200, 'tasks': [], 'count': 0})

        # 创建paginator对象 按每页十条数据进行分页
        paginator = Paginator(app_fuzhou_task, count)

        # 总页数 如果传过来的页码超出范围　返回第一页
        pages_num = paginator.num_pages
        if page_num < 0 or page_num > pages_num:
            page_num = 1

        # 获取第page页的Page对象
        page_obj = paginator.page(page_num)

        # 获取第page页的查询集
        page_query = page_obj.object_list

        return JsonResponse({'code': 200, 'tasks': list(page_query.values()), 'count': app_fuzhou_task.count()})
    except Exception as e:
        logger.error(e)

    return JsonResponse({'code': 200, 'tasks': [], 'count': 0})








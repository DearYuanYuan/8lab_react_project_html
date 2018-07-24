"""
体检页面 人工确认页面
使用 pylint 进行代码检查及优化 jiaxuechuan 2018-02-２３
"""

import json
from datetime import datetime
from django.http import HttpResponse, JsonResponse
from app_fuzhou.views_utils.scanner.Scanner import Scanner
from app_fuzhou.views_utils import utils_whitelist, utils_examination
from app_fuzhou.models import AppFuzhouGroup, AppFuzhouGroupIp, BlackboxHost
from django.db.models import Q

TIMESTAMP = 0


def scan_init(request):
    """
    trust_logs = ""
    # 连接本地mysql数据库octastack_fuzhou
    conn, cursor = gc.connect_localhost()
    if os.path.exists(gc.TRUST_LOG_PATH):
        # 获取trustfile文件内容
        trust_logs = get_trust_log()
    if len(trust_logs) < 1 or (trust_logs[0] == ""):
        # 如果没有日志，则清空trustlog表
        mysql_base_api.sql_execute(conn, cursor, "delete from trustlog;", None)
    else:
        # 把日志内容按字段的键值分割，存入数据库中
        insert_data(conn, cursor, trust_logs)
    mysql_base_api.sql_close(conn, cursor)
    response = Response()
    return HttpResponse(json.dumps(response.__dict__))
    """
    return HttpResponse("scan_init OK")


def scan_threat(request):
    """
    体检页面点击常规修复页面的立即扫描按钮
    启动杀毒进程
    :param request:
    :return:
    """
    Scanner(request).start()
    path_value = utils_whitelist.virus_init()
    return HttpResponse(json.dumps(path_value))


def scan_repair(request):
    """
    体检页面点击常规修复页面的立即修复按钮
    :param request:
    :return:
    """
    return_list = utils_whitelist.handle_scan_repair()
    return HttpResponse(json.dumps(return_list))


def repair_list(request):
    """
    体检->人工确认页面的日志展示
    :param request:
        参数1: sendTime 发送请求的时间
        参数2: page　页码 默认第一页
        参数3: size　每页条数 默认１０
        参数4: keyword　关键字
    :return:
    """
    # 接收参数
    send_time = request.POST.get("sendTime", "")
    page = request.POST.get("page", 1)
    size = request.POST.get("size", 10)
    keyword = request.POST.get("keyword", "")
    # level = request.POST["level"]
    global TIMESTAMP  # 全局时间变量，用于计算时间差

    # 计算总页数 获取log总条数除每页显示条数 <! 总条数为1,>1 总条数取整加1
    logcount = utils_whitelist.get_trust_log_count(keyword)  # 查询log的总数
    totalpage = int((logcount + int(size) - 1) / int(size))  # 总页数

    # 确认时间间隔
    timegap = 0
    if TIMESTAMP == 0:
        TIMESTAMP = int(send_time)
    else:
        timegap = (int(send_time) - TIMESTAMP) / 60000  # 将时间换算成分钟
        TIMESTAMP = int(send_time)
    return_dict = {"totalpage": totalpage, "timegap": timegap}

    if totalpage == 0:
        return_dict["logs"] = {}
        return JsonResponse(return_dict)

    # 查询当前页数数据
    if int(page) < totalpage:  # 当前页数小于总页数
        return_dict["logs"] = list(utils_whitelist.get_trust_log2((
            int(page) - 1) * int(size), int(page) * int(size), keyword))

    elif int(page) == totalpage:  # 当前页数等于总页数
        return_dict["logs"] = list(utils_whitelist.get_trust_log2((
            int(page) - 1) * int(size), logcount, keyword))

    else:  # 当前页数大于总页数
        return_dict["logs"] = list(utils_whitelist.get_trust_log2((
            int(totalpage) - 1) * int(size), logcount, keyword))

    return JsonResponse(return_dict)


def repair(request):
    """
    体检->人工确认->开始确认->标记误报
    :param request:　id
    :return:
    """
    # 接收参数
    param = eval(request.POST['id'])['param']

    # 将错误日志 按ip进行分组，然后分别对不同ip进行重启保护操作
    dict_parm = {}
    for tmp in param:
        tmp_ip = tmp['ip']

        if tmp_ip in dict_parm.keys():
            dict_parm[tmp_ip].append(tmp)
        else:
            dict_parm[tmp_ip] = [tmp]

    result = utils_whitelist.handle_repair(dict_parm)

    if result:
        return JsonResponse({'state': '200', 'message': '人工确认成功'})
    return JsonResponse({'state': '201', 'message': '人工确认失败'})


def invoke_rpc_writelog(request):
    """
    调用rpc写日志
    :param request:
    :return:
    """
    result = utils_whitelist.invoke_rpc_writelog()
    if result:
        return JsonResponse({"state": True, "message": result})
    return JsonResponse({"state": False, "message": ""})


def search(request):
    """
    体检->人工确认->开始确认->按条件搜索
    :param request:
        参数1: keyword 搜索关键字
        参数2: page　页码 默认第一页
        参数3: size　每页条数 默认１０
    :return:
    """
    # 接收参数
    keyword = request.POST.get("keyword")
    page = request.POST.get("page")
    size = request.POST.get("size")

    return_dict = utils_whitelist.page_search(keyword, page, size)
    return JsonResponse(return_dict)


def start_protection(request):
    """
    @api {post} api/blackbox/start_protection/  ★开始可信防护
    @apiDescription 开始可信防护
    @apiGroup blackbox
    @apiParam {string} type 接口类型：1主机，2分组
    @apiParam {string} ip 主机，type=1
    @apiParam {string} group_ids 分组，type=2
    @apiSuccessExample Success-Response:
        {
            "status": True,
            "message"：开启成功
        }
    @apiErrorExample Error-Response:
        {
            "status": False
        }
    """

    type = request.POST.get("type")
    ips = []
    if type == "1":
        ips = request.POST.get("ip")
    elif type == "2":
        group_ids = request.POST.get("group_ids")
        ips = utils_examination.get_group_host_ips(group_ids)

    if not ips:
        return JsonResponse({"status": False})

    # 开启可信防护
    result = utils_whitelist.proctect_start(ips.split(","))
    if result:
        return JsonResponse({"status": True, "message": result})
    return JsonResponse({"status": False})


def stop_protection(request):
    """
    @api {post} api/blackbox/stop_protection/  ★关闭可信防护
    @apiDescription 关闭可信防护
    @apiGroup blackbox
    @apiParam {string} type 接口类型：1主机，2分组
    @apiParam {string} ip 主机，type=1
    @apiParam {string} group_ids 分组，type=2
    @apiSuccessExample Success-Response:
        {
            "status": True,
            "message"：关闭成功
        }
    @apiErrorExample Error-Response:
        {
            "status": False
        }
    """

    type = request.POST.get("type")
    ips = []
    if type == "1":
        ips = request.POST.get("ip")
    elif type == "2":
        group_ids = request.POST.get("group_ids")
        ips = utils_examination.get_group_host_ips(group_ids)

    if not ips:
        return JsonResponse({"status": False})

    # 关闭可信防护
    result = utils_whitelist.proctect_stop(ips.split(","))
    if result:
        return JsonResponse({"status": True, "message": result})
    return JsonResponse({"status": False})


def start_medium_block(request):
    """
    @api {post} api/blackbox/start_medium_block/  ★开启中级阻断
    @apiDescription 开启中级阻断
    @apiGroup blackbox
    @apiParam {string} type 接口类型：1主机，2分组
    @apiParam {string} id 调用的一组主机ID，type=1
    @apiParam {string} group_ids 分组，type=2
    @apiSuccessExample Success-Response:
        {
            "status": True,
            "message"：开启成功
        }
    @apiErrorExample Error-Response:
        {
            "status": False
        }
    """

    type = request.POST.get("type")
    ids = []
    if type == "1":
        ids = request.POST.get("id")
    elif type == "2":
        group_ids = request.POST.get("group_ids")
        ids = utils_examination.get_group_host_ids(group_ids)

    if not ids:
        return JsonResponse({"status": False})

    # 开启中级阻断
    result = utils_whitelist.start_m_block(ids.split(","))
    if result:
        return JsonResponse({"status": True, "message": result})
    return JsonResponse({"status": False})


def stop_medium_block(request):
    """
    @api {post} api/blackbox/stop_medium_block/  ★关闭中级阻断
    @apiDescription 关闭中级阻断
    @apiGroup blackbox
    @apiParam {string} type 接口类型：1主机，2分组
    @apiParam {string} id 调用的一组主机ID，type=1
    @apiParam {string} group_ids 分组，type=2
    @apiSuccessExample Success-Response:
        {
            "status": True,
            "message"：关闭成功
        }
    @apiErrorExample Error-Response:
        {
            "status": False
        }
    """
    type = request.POST.get("type")
    ids = []
    if type == "1":
        ids = request.POST.get("id")
    elif type == "2":
        group_ids = request.POST.get("group_ids")
        ids = utils_examination.get_group_host_ids(group_ids)

    if not ids:
        return JsonResponse({"status": False})

    # 关闭中级阻断
    result = utils_whitelist.stop_m_block(ids.split(","))
    if result:
        return JsonResponse({"status": True, "message": result})
    return JsonResponse({"status": False})


def start_senior_block(request):
    """
    @api {post} api/blackbox/start_senior_block/  ★开启高级阻断
    @apiDescription 开启高级阻断
    @apiGroup blackbox
    @apiParam {string} type 接口类型：1主机，2分组
    @apiParam {string} ip 主机，type=1
    @apiParam {string} group_ids 分组，type=2
    @apiSuccessExample Success-Response:
        {
            "status": True,
            "message"：开启成功
        }
    @apiErrorExample Error-Response:
        {
            "status": False
        }
    """
    type = request.POST.get("type")
    ips = []
    if type == "1":
        ips = request.POST.get("ip")
    elif type == "2":
        group_ids = request.POST.get("group_ids")
        ips = utils_examination.get_group_host_ips(group_ids)
    if not ips:
        return JsonResponse({"status": False})

    # 开启高级阻断
    result = utils_whitelist.start_s_block(ips.split(","))
    if result:
        return JsonResponse({"status": True, "message": result})
    return JsonResponse({"status": False})


def stop_senior_block(request):
    """
    @api {post} api/blackbox/stop_senior_block/  ★关闭高级阻断
    @apiDescription 关闭高级阻断
    @apiGroup blackbox
    @apiParam {string} type 接口类型：1主机，2分组
    @apiParam {string} ip 主机，type=1
    @apiParam {string} group_ids 分组，type=2
    @apiSuccessExample Success-Response:
        {
            "status": True,
            "message"：关闭成功
        }
    @apiErrorExample Error-Response:
        {
            "status": False
        }
    """
    type = request.POST.get("type")
    ips = []
    if type == "1":
        ips = request.POST.get("ip")
    elif type == "2":
        group_ids = request.POST.get("group_ids")
        ips = utils_examination.get_group_host_ips(group_ids)
    if not ips:
        return JsonResponse({"status": False})

    # 关闭高级阻断
    result = utils_whitelist.stop_s_block(ips.split(","))
    if result:
        return JsonResponse({"status": True, "message": result})
    return JsonResponse({"status": False})


def get_blackbox_hosts(request):
    """
    @api {post} api/blackbox/get_hosts/  ★获取blackbox主机
    @apiDescription 获取blackbox主机
    @apiGroup blackbox
    @apiParam {string} page_num 页码
    @apiParam {string} page_size 每页个数
    @apiParam {string} field {column}-0/1 排序字段和方式
    @apiParam {string} condition 查询条件
    @apiParam {string} type 0表示status为0主机，1表示status为1的主机，-1表示所有主机
    @apiSuccessExample Success-Response:
        {
            "total": 12,
            "data": [{
                "id": 63,
                "hostip": "192.168.1.235",
                "hostname": "vtpm-t2",
                "description": "被保护的机器",
                "status": 0,    # 0:关闭状态;1：开启可信/关闭阻断状态，2：开启可信/开启阻断状态
                "connection": 0     0:未连接，1:连接
            }, {
                "id": 69,
                "hostip": "192.168.1.166",
                "hostname": "su12vtpm-166",
                "description": "被保护的机器",
                "status": 0,    # 0:关闭状态;1：开启可信/关闭阻断状态，2：开启可信/开启阻断状态
                "connection": 0     0:未连接，1:连接
            }]
        }
    """

    # 接收参数
    page_num = int(request.POST.get("page_num"))
    page_size = int(request.POST.get("page_size"))
    field = request.POST.get("field")
    condition = request.POST.get("condition")
    type = int(request.POST.get("type", -1))

    # 进行查询
    result = utils_whitelist.query_hosts_page(page_num, page_size, field, condition, type)
    return JsonResponse(result, safe=False)


def get_blackbox_ip_hosts(request):
    """
    @api {post} api/blackbox/get_blackbox_ip_hosts/  ★通过ip获取blackbox主机
    @apiDescription 通过ip获取blackbox主机
    @apiGroup blackbox
    @apiParam {string} ip 机器ip
    @apiSuccessExample Success-Response:
        {
            "total": 12,
            "data": [{
                "id": 63,
                "hostip": "192.168.1.235",
                "hostname": "vtpm-t2",
                "description": "被保护的机器",
                "status": 0,    # 0:关闭状态;1：开启可信/关闭阻断状态，2：开启可信/开启阻断状态
                "connection": 0     0:未连接，1:连接
            }]
        }
    """

    # 接收参数
    page_num = 1
    page_size = 99999
    field = ""
    condition = request.POST.get("ip")
    type = int(request.POST.get("type", -1))

    # 进行查询
    result = utils_whitelist.query_hosts_page(page_num, page_size, field, condition, type)
    return JsonResponse(result, safe=False)


def get_all_blackbox_hosts(request):
    """
    @api {get} api/blackbox/get_all_hosts/  ★获取所有的blackbox主机
    @apiDescription 获取blackbox主机
    @apiGroup blackbox
    @apiParam {string} condition 查询条件
    @apiSuccessExample Success-Response:
        {
            "ips": ['192.168.1.235', '192.168.1.235', '192.168.1.235', '192.168.1.235']
        }
    """

    # 接收参数
    page_num = 1
    page_size = 99999
    field = ""
    condition = request.POST.get("condition")
    type = int(request.POST.get("type", -1))

    # 进行查询
    result = utils_whitelist.query_hosts_page(page_num, page_size, field, condition, type)
    result = [l['hostip'] for l in result['data']]
    return JsonResponse(result, safe=False)

def update_op_host(request):
    """
    @api {post} api/blackbox/update_op_host/  ★更新运维主机
    @apiDescription 更新运维主机
    @apiGroup blackbox
    @apiParam {string} op_type create、delete
    @apiParam {FILES} file 文件
    @apiSuccessExample Success-Response:
        {
            "status"： success
        }
    @apiErrorExample Error-Response:
        {
            "status": error
        }
    """
    result = {"status": 'error'}

    op_type = request.POST.get("op_type")
    file = request.FILES.get("file")

    if not file:
        return JsonResponse(result)

    # 对file文件内容读取并提取出mac和path
    content = file.read().decode().strip()
    lists = content.split(';')
    if len(lists) == 2:
        mac = lists[0].upper().strip()
        path = lists[1].strip()
        # 更新可信运维主机
        result = utils_whitelist.update_op_host(op_type, mac, path)

    return JsonResponse(result)


def get_op_host(request):
    """
    @api {post} api/blackbox/get_op_host/  ★获取运维主机
    @apiDescription 获取运维主机
    @apiGroup blackbox
    @apiParam {string} mac_address  地址
    @apiSuccessExample Success-Response:
        {
            "status"： success
        }
    @apiErrorExample Error-Response:
        {
            "status": error
        }
    """

    mac_address = request.POST.get("mac_address")
    mac_address = mac_address.upper().strip()

    # 查询可信运维主机是否存在
    result = utils_whitelist.get_op_host(mac_address)
    return JsonResponse(result)


def del_host(request):
    """
    @api {post} api/blackbox/del_host/  ★删除运维主机
    @apiDescription 删除运维主机
    @apiGroup blackbox
    @apiParam {string} ips  ip地址
    @apiSuccessExample Success-Response:
        {
            "status"： True
            "message"：success
        }
    @apiErrorExample Error-Response:
        {
            "status": False
        }
    """

    ips = request.POST.get("ips")

    # 关闭可信防护
    result = utils_whitelist.proctect_stop(ips.split(","))

    if result:
        # 删除主机
        result = utils_whitelist.del_block(ips.split(","))
        return JsonResponse({"status": True, "message": result})

    return JsonResponse({"status": False})


def create_group(request):
    """
    @api {post} api/blackbox/create_group/  ★创建运维主机分组
    @apiDescription 创建运维主机分组
    @apiGroup blackbox
    @apiParam {string} name  组名称
    @apiParam {string} remark  组备注
    @apiParam {string} ips   组内主机ip
    @apiParam {string} type   组类型 １表示可信防护组　２表示杀毒组
    @apiSuccessExample Success-Response:
        {
            "status"： 200,
            "message"：success
        }
    @apiErrorExample Error-Response:
        {
            "status": 201
            "message": "分组名字重复，请重新命名！"
        }
    @apiErrorExample Error-Response:
        {
            "status": 201
            "message": "创建分组有误，请重新创建！"
        }
    """

    name = request.POST.get("name")
    remark = request.POST.get("remark", '')
    ips = request.POST.get("ips")
    type = request.POST.get("type")

    if not all([name, ips, type]):
        return JsonResponse({"status": 201, "message": "参数不全！"})

    datetime_now = datetime.now()
    app_fuzhou_group = AppFuzhouGroup.objects.filter(name=name)
    if app_fuzhou_group:
        return JsonResponse({"status": 201, "message": "分组名字重复，请重新命名！"})

    info_obj = AppFuzhouGroup.objects.create(name=name, remark=remark, type=type, state=1, createtime=datetime_now, edittime=datetime_now)
    for item in ips.split(","):
        if not item:
            continue
        AppFuzhouGroupIp.objects.create(group_id=info_obj.id, ip=item, state=1)

    return JsonResponse({"status": 200, "message": "success"})


def del_group(request):
    """
    @api {post} api/blackbox/del_group/  ★删除运维主机分组
    @apiDescription 删除运维主机分组
    @apiGroup blackbox
    @apiParam {string} id  组id
    @apiSuccessExample Success-Response:
        {
            "status"： 200
            "message"：success
        }
    @apiErrorExample Error-Response:
        {
            "status": 201
        }
    """

    id = request.POST.get("id")

    app_fuzhou_group = AppFuzhouGroup.objects.filter(id=id)
    if not app_fuzhou_group:
        return JsonResponse({"status": 201, "message": "分组信息无效，请重新操作！"})

    app_fuzhou_group.objects.filter(id=id).update(state=0)
    return JsonResponse({"status": 200, "message": "success"})


def update_group(request):
    """
    @api {post} api/blackbox/update_group/  ★更新运维主机分组
    @apiDescription 更新运维主机分组
    @apiGroup blackbox
    @apiParam {string} id  组id
    @apiParam {string} name  组名称
    @apiParam {string} remark  组备注
    @apiParam {string} ips   组内主机ip
    @apiSuccessExample Success-Response:
        {
            "status"： 200
            "message"：success
        }
    @apiErrorExample Error-Response:
        {
            "status": 201
        }
    """

    id = request.POST.get("id")
    name = request.POST.get("name")
    remark = request.POST.get("remark")
    ips = request.POST.get("ips")

    datetime_now = datetime.now()
    app_fuzhou_group = AppFuzhouGroup.objects.filter(id=id)
    if not app_fuzhou_group:
        return JsonResponse({"status": 201, "message": "分组信息无效，请重新操作！"})

    AppFuzhouGroup.objects.filter(id=id).update(name=name, remark=remark, edittime=datetime_now)

    app_fuzhou_group = AppFuzhouGroup.objects.filter(id=id, name=name, remark=remark)
    if not app_fuzhou_group:
        return JsonResponse({"status": 201, "message": "分组信息更新有误，请重新操作！"})

    AppFuzhouGroupIp.objects.filter(group_id=id).update(state=0)
    for item in ips.split(","):
        if not item:
            continue
        AppFuzhouGroupIp.objects.create(group_id=id, ip=item, state=1)

    return JsonResponse({"status": 200, "message": "success"})


def get_group_list(request):
    """
    @api {post} api/blackbox/get_group_list/  ★获取运维主机分组列表
    @apiDescription 获取运维主机分组列表
    @apiGroup blackbox
    @apiParam {string} keyword  关键字：name或remark
    @apiParam {string} page   页码,默认1
    @apiParam {string} size 每页条数，默认10
    @apiSuccessExample Success-Response:
        {
            "status": 200,
            "totalpage": 100,
            "data": [
                {
                    "id": 1,
                    "name": "可信1组",
                    "remark": "不可删除",
                    "createtime": "2017-11-11 00：00：00",
                    "edittime": "2017-11-11 00：00：00",
                },
                {
                    "id": 2,
                    "name": "可信1组",
                    "remark": "不可删除",
                    "createtime": "2017-11-11 00：00：00",
                    "edittime": "2017-11-11 00：00：00",
                },
            ]
        }
    @apiErrorExample Error-Response:
        {
            "status": 201
        }
    """

    keyword = request.POST.get("keyword", "")
    page = request.POST.get("page", 1)
    size = request.POST.get("size", 10)
    return_dic = {"status": 200, "totalpage": 0, "data": []}

    app_fuzhou_group = AppFuzhouGroup.objects.filter(Q(state=1) & Q(type=1))
    if keyword:
        app_fuzhou_group = AppFuzhouGroup.objects.filter(Q(state=1) & Q(type=1)).filter(Q(name__contains=keyword) | Q(remark__contains=keyword))

    if not app_fuzhou_group:
        return JsonResponse({"status": 200, "data": []})

    for item in app_fuzhou_group:
        info = {
            'id': item.id,
            'name': item.name,
            'remark': item.remark,
            'createtime': str(item.createtime),
            'edittime': str(item.edittime)
        }
        return_dic['data'].append(info)

    totalpage = 0
    if len(return_dic['data']) > 0:
        count = len(return_dic['data']) / 10
        totalpage = count if count == int(count) else int(count) + 1

    return_dic['totalpage'] = totalpage
    if int(page) < totalpage:
        return_dic['data'] = return_dic['data'][(int(page) - 1) * int(size):int(size) * int(page)]
    else:
        return_dic['data'] = return_dic['data'][(int(page) - 1) * int(size):]
    return JsonResponse(return_dic)


def get_group_detail(request):
    """
    @api {post} api/blackbox/get_group_detail/  ★获取运维主机分组详细信息
    @apiDescription 获取运维主机分组详细信息
    @apiGroup blackbox
    @apiParam {string} id  组id
    @apiSuccessExample Success-Response:
        {
            "status": 200,
            "name": "可信1组",
            "remark": "此分组不可删除",
            "in_group": [
                {
                    "id": 63,
                    "hostip": "192.168.1.1",
                    "hostname": "vtpm-t2",
                    "description": "被保护的机器",
                    "status": 0,  # 0:关闭状态;1：开启可信/关闭阻断状态，2：开启可信/开启阻断状态
                    "connection": 0  #0: 未连接，1:连接
                },{
                    "id": 63,
                    "hostip": "192.168.1.2",
                    "hostname": "vtpm-t2",
                    "description": "被保护的机器",
                    "status": 0,  # 0:关闭状态;1：开启可信/关闭阻断状态，2：开启可信/开启阻断状态
                    "connection": 0  # 0: 未连接，1:连接
                }
            ],
            "out_group": [
                {
                    "id": 63,
                    "hostip": "192.168.1.1",
                    "hostname": "vtpm-t2",
                    "description": "被保护的机器",
                },{
                    "id": 63,
                    "hostip": "192.168.1.2",
                    "hostname": "vtpm-t2",
                    "description": "被保护的机器",
                }
            ]
        }
    @apiErrorExample Error-Response:
        {
            "status": 201
        }
    """

    group_id = request.POST.get("id")
    return_dic = {"status": 200, "name": "", "remark": "", "in_group": [], "out_group": []}

    app_fuzhou_group = AppFuzhouGroup.objects.filter(id=group_id)
    if not app_fuzhou_group:
        return JsonResponse({"status": 201, "message": "分组信息无效，请重新操作！"})

    return_dic['name'] = app_fuzhou_group[0].name
    return_dic['remark'] = app_fuzhou_group[0].remark
    blackbox_host = BlackboxHost.objects.all()

    for item in blackbox_host:
        app_fuzhou_group = AppFuzhouGroupIp.objects.filter(Q(state=1) & Q(group_id=group_id, ip=item.hostip))
        info = {
            "id": item.id,
            "hostip": item.hostip,
            "hostname": item.hostname,
            "description": item.description
        }
        if app_fuzhou_group:
            return_dic['in_group'].append(info)
        else:
            return_dic['out_group'].append(info)
    return JsonResponse(return_dic)


def get_all_blackbox_group(request):
    """
    @api {get} api/blackbox/get_all_group/  ★获取所有blackbox分组
    @apiDescription 获取所有blackbox分组
    @apiGroup blackbox
    @apiParam {string} keyword 关键字：name或remark
    @apiSuccessExample Success-Response:
        {
            "ids": ['1', '2', '3', '4']
        }
    """

    keyword = request.POST.get("keyword", "")

    result = {"ids": []}
    app_fuzhou_group = AppFuzhouGroup.objects.filter(Q(state=1) & Q(type=1))
    if keyword:
        app_fuzhou_group = AppFuzhouGroup.objects.filter(Q(state=1) & Q(type=1)).filter(Q(name__contains=keyword) | Q(remark__contains=keyword))

    if not app_fuzhou_group:
        return JsonResponse(result)

    result['ids'] = [item.id for item in app_fuzhou_group]
    return JsonResponse(result)




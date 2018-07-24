"""
可信防护 白名单页面
使用 pylint 进行代码检查及优化 jiaxuechuan 2018-02-08
"""

import json
from django.http import HttpResponse
from django.core.paginator import Paginator, InvalidPage, EmptyPage, PageNotAnInteger
from app_fuzhou.models import WhiteList
from app_fuzhou.apps import Response
from app_fuzhou.util import mysql_base_api
from app_fuzhou.views_utils.global_config import GlobalConf
from app_fuzhou.views_utils.logger import logger
from app_fuzhou.views_utils.zeromq import zmq_white as zmq_class

gc = GlobalConf()


def get_all_whitelist(request):
    """
    查询数据库 whitelist 表的所有白名单的IP信息及其对应的id
    :param request:
    :return: {'127.0.0.1': '1,2,3,4', '127.0.0.2': '5,6,7'...}
    """
    return_dict = {}
    try:
        # 根据ip分组, 查询某个ip对应的所有id
        # 对应sql语句 'select ip,group_concat(id) as id from whitelist group by ip'
        lists = WhiteList.objects.values('ip').annotate(id=mysql_base_api.Concat('id'))

        # 将数据组织存入字典，返回给前端
        for r in lists:
            return_dict[r['ip']] = r['id']

    except Exception as e:
        logger.error("get_all_whitelist error : ")
        logger.error(e)

    return HttpResponse(json.dumps(return_dict))


def search_whitelist(request):
    """
    白名单列表,支持关键字搜索
    :param request:
        参数1: itemKey　搜索类型
        参数2: searchkeyWord　搜索关键字
        参数3: pageIndex　第几页
        参数4: pagesize　每页多少条
        参数5: sortKey　reverse为id倒序
    :return: whitelist 中符合搜索要求的数据
    update by YangZe
    """
    return_list = []
    try:
        # 接收参数
        item_key = request.POST.get("itemKey", "")
        search_word = request.POST.get("searchkeyWord", "")
        page = int(request.POST.get('pageIndex', 1))
        size = int(request.POST.get('pagesize', 20))
        sort_key = request.POST.get('sortKey', '')

        if item_key == "clientname":
            # 搜索clientname是否包含关键字
            white_lists = WhiteList.objects.filter(client_name__contains=search_word).order_by('id')
        elif item_key == "filedata":
            white_lists = WhiteList.objects.filter(file_data__contains=search_word).order_by('id')  # 同上
        elif item_key == "filerouter":
            white_lists = WhiteList.objects.filter(file_router__contains=search_word).order_by('id') # 同上
        else:
            white_lists = WhiteList.objects.all().order_by('id')  # 无关键字搜索或者关键字错误
        if sort_key == "reverse":  # 如果reverse
            white_lists.order_by("-id")  # 则按照id反序
        paginator = Paginator(white_lists, size)  # 分页
        try:
            w_list = paginator.page(page)  # 取第page页
        except(EmptyPage, InvalidPage, PageNotAnInteger):
            w_list = paginator.page(1)  # 页数不可用,默认返回第一页
        for i in w_list:  # 把QuerySet转换为dict,才可以用json.dumps
            temp = {"filerouter": i.file_router, "clientname": i.client_name, "id": i.id,
                    "ip": i.ip, "filedata": i.file_data}
            return_list.append(temp)
        return_list.append({'totalpages': paginator.num_pages})  # 总页数

    except Exception as e:
        logger.error(str(e))

    return HttpResponse(json.dumps(return_list))


def add_white(request):
    """
    添加白名单,发送
    :param request:
        参数1: wlName　主机名
        参数2: wlIP　IP
        参数3: wlText　文件哈希
        参数4: wlUrl　文件路径
    :return: 成功或失败
    """
    response = Response()
    try:
        # 接收参数
        wl_name = request.POST['wlName']
        wl_ip = request.POST['wlIP']
        wl_text = request.POST['wlText']
        wl_url = request.POST['wlUrl']

        white_dict = {'clientname': wl_name, 'ip': wl_ip,
                      'filerouter': wl_url, 'filedata': wl_text}
        zmq_class.send_repair(white_dict)
        white_lists = WhiteList.objects.filter(client_name=wl_name, ip=wl_ip,
                                               file_data=wl_text, file_router=wl_url)
        if white_lists.count == 0:
            WhiteList.objects.create(client_name=wl_name, ip=wl_ip,
                                     file_data=wl_text, file_router=wl_url)
        else:
            response.setcode('ERROR')
            response.adddata("message", "添加失败: 信息重复添加")
    except Exception as e:
        logger.error(e)
        response.setcode('ERROR')
        response.adddata("message", str(e))

    return HttpResponse(json.dumps(response.__dict__))


def edit_white(request):
    """
    编辑白名单
    :param request:
        参数1: id 主机id
        参数2: wlName　主机名
        参数3: wlIP　IP
        参数4: wlText　文件哈希
        参数5: wlUrl　文件路径
    :return:
    """
    response = Response()
    try:
        # 接收参数
        _id = request.POST['id']
        wl_name = request.POST['wlName']
        wl_ip = request.POST['wlIP']
        wl_text = request.POST['wlText']
        wl_url = request.POST['wlUrl']

        white_dict = {'clientname': wl_name, 'ip': wl_ip, 'filerouter': wl_url, 'filedata': wl_text}
        zmq_class.send_repair(white_dict)

        # 根据id获取白名单对象　进行更新
        target = WhiteList.objects.get(id=_id)
        target.client_name = wl_name
        target.ip = wl_ip
        target.file_router = wl_url
        target.file_data = wl_text
        target.save()
    except Exception as e:
        logger.error(str(e))
        response.setcode('ERROR')
        response.adddata("message", str(e))

    return HttpResponse(json.dumps(response.__dict__))


def del_white_one(request):
    """
    白名单删除一条记录
    :param request: ids
    :return:
    """
    response = Response()
    try:
        # 接收参数
        _id = request.POST['ids']

        # 根据id获取白名单对象　进行删除
        target = WhiteList.objects.get(id=_id)
        ret = {"filedata": target.file_data, "ip": target.ip,
               "filerouter": target.file_router, "id": target.id,
               "clientname": target.client_name}
        zmq_class.send_reset(ret)
        target.delete()
    except Exception as e:
        logger.error(str(e))
        response.setcode('ERROR')
        response.adddata("message", str(e))

    return HttpResponse(json.dumps(response.__dict__))


def del_white(request):
    """
    白名单删除多条记录
    :param request: ids = WL247153WL247177
    :return:
    """
    response = Response()
    try:
        # 这里split之后的list中，第一个元素会是一个空格，因此要从第二个元素开始取值
        id_list = request.POST.get("ids", "").split("WL")[1:]

        # 获取id在id_list范围里的所有白名单对象　进行删除
        targets = WhiteList.objects.filter(id__in=id_list)
        for target in targets:
            ret = {"filedata": target.file_data, "ip": target.ip,
                   "filerouter": target.file_router, "id": target.id,
                   "clientname": target.client_name}
            zmq_class.send_reset(ret)
        targets.delete()
    except Exception as e:
        logger.error(str(e))
        response.setcode('ERROR')
        response.adddata("message", str(e))

    return HttpResponse(json.dumps(response.__dict__))

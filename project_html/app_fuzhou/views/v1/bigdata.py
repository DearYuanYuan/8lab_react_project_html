# coding=utf-8

import json, base64
from app_fuzhou.views_utils.logger import logger
from app_fuzhou.views_utils.rpc.nisa.nisa_rpc_client import NisaRpcClient


from django.http import HttpResponse


def getmodelsknowledge(request):
    """
    获取智慧模型列表 
    :param request: 
    :return: 
    """
    return_dict = {"status": False}

    model_type = request.POST.get('model_type')  # 获取模型的类别，有三种 meta data sum
    size = request.POST.get('size')  # 分页查询，每页显示的条数
    start = request.POST.get('start')  # 分页查询起始页
    model_id = request.POST.get('id', -1)  # 智慧模型id, id为空时默认为-1
    search = request.POST.get('search')  # 搜索条件  search为空是默认为 -1

    args = {}

    if model_type:
        args['type'] = model_type

    if size:
        args['size'] = int(size)

    if start:
        args['start'] = (int(start) - 1) * int(size)

    if int(model_id) >= 0:
        args['id'] = int(model_id)

    if search != '"empty"':
        if isinstance(search, str):
            search = eval(search)
        args['search'] = search

    try:
        client = NisaRpcClient()
        r = client.getmodelsknowledge(json.dumps(args))
        return_dict = json.loads(r)

        # 解析 data格式
        if model_type == 'data':
            model = return_dict['data']['model']
            model = base64.b64decode(model)
            return_dict['data']['model'] = json.loads(model.decode())

        return_dict['status'] = True
    except Exception as e:
        logger.error(str(e))
        return_dict['msg'] = str(e)
    finally:
        return HttpResponse(json.dumps(return_dict))


def updatemodelsknowledge(request):
    """
    编辑模型
    :param request: 
    :return: 
    """
    return_dict = {"status": False}

    model_type = request.POST.get('type')
    model_id = request.POST.get('id')

    meta = request.POST.get('meta')
    data = request.POST.get('data')

    if isinstance(meta, str):
        meta = eval(meta)

    if isinstance(data, str):
        data = eval(data)

    args = {
        'type': model_type,
        'id': int(model_id)
    }

    if model_type and model_type == 'meta':
        args['meta'] = meta

    if model_type and model_type == 'data':
        args['data'] = data

    try:
        client = NisaRpcClient()
        r = client.updatemodelsknowledge(json.dumps(args))
        return_dict = json.loads(r)
        return_dict['status'] = True
    except Exception as e:
        logger.error(str(e))
        return_dict['msg'] = str(e)
    finally:
        return HttpResponse(json.dumps(return_dict))


def deletemodelsknowledge(request):
    """
    删除模型
    :param request: 
    :return: 
    """
    return_dict = {"status": False}

    del_type = request.POST.get('type', 'list')  # all和list两种
    del_list = request.POST.get('list')

    args = {'type': del_type}

    if del_type == 'list':
        if isinstance(del_list, str):
            del_list = eval(del_list)
        args['list'] = del_list

    try:
        client = NisaRpcClient()
        r = client.deletemodelsknowledge(json.dumps(args))
        return_dict = json.loads(r)
        return_dict['status'] = True
    except Exception as e:
        logger.error(str(e))
        return_dict['msg'] = str(e)
    finally:
        return HttpResponse(json.dumps(return_dict))


def mergemodelsknowledge(request):
    """
    融合模型
    :param request: 
    :return: 
    """
    return_dict = {'status': False}

    src = request.POST.get("src")  # 指定需要融合的模型id
    dst = request.POST.get("dst")  # 模型融合目标，detection和knowledge   detection存储到检测表，knowledge则存储到知识模型表
    mname = request.POST.get("mname")  # 新生成的模型命名
    desctext = request.POST.get("desctext")  # 新生成模型详细描述

    if isinstance(src, str):
        src = eval(src)

    args = {
        'src': src,
        'dst': dst,
        'mname': mname,
        'desctext': desctext
    }

    try:
        client = NisaRpcClient()
        r = client.mergemodelsknowledge(json.dumps(args))
        return_dict = json.loads(r)
        return_dict['status'] = True
    except Exception as e:
        logger.error(str(e))
        return_dict['msg'] = str(e)
    finally:
        return HttpResponse(json.dumps(return_dict))


def loadmodels2knowledge(request):
    """
    导入模型
    :param request: 
    :return: 
    """
    return_dict = {}

    user = request.POST.get("user")  # 加载指定用户的模型
    alg = request.POST.get("alg")  # 算法
    mname = request.POST.get("mname")  # 模型的名称
    desctext = request.POST.get("desctext")  # 指定知识模型的和描述

    if isinstance(user, str):
        user = eval(user)

    if isinstance(alg, str):
        alg = eval(alg)

    args = {
        'user': user,
        'alg': alg,
        'mname': mname,
        'desctext': desctext
    }

    try:
        client = NisaRpcClient()
        r = client.loadmodels2knowledge(json.dumps(args))
        return_dict = json.loads(r)
        return_dict['status'] = True
    except Exception as e:
        logger.error(str(e))
        return_dict['msg'] = str(e)
    finally:
        return HttpResponse(json.dumps(return_dict))

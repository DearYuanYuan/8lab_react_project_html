"""
可信防护 ML显示页面
使用 pylint 进行代码检查及优化 jiaxuechuan 2018-02-08
"""

import json
import linecache
from django.http import HttpResponse
from django.core.paginator import Paginator, InvalidPage, EmptyPage, PageNotAnInteger
from app_fuzhou.models import MList
from app_fuzhou.views_utils.global_config import GlobalConf
from app_fuzhou.views_utils.logger import logger
from app_fuzhou.views_utils.localconfig import JsonConfiguration
from app_fuzhou.views_utils.utils_audit import page_calculate

gc = GlobalConf()
jc = JsonConfiguration()


def set_ml():
    """
    读取日志文件到内存，并保存到mysql数据库
    :return: 无
    """
    # 读取数据库 mlist 表的所有内容
    try:
        ret = MList.objects.all().values()
    except Exception as e:
        logger.error(e)
        return

    # 设置5个set集合，用于存放读取的mlist表中所有字段的数据，以便后面判断mlfile文件是否有更新
    pcr_set = set()
    templatehash_set = set()
    tmptype_set = set()
    filedata_set = set()
    filerouter_set = set()
    for r in ret:
        pcr_set.add(r['pcr'])
        templatehash_set.add(r['templatehash'])
        tmptype_set.add(r['tmptype'])
        filedata_set.add(r['filedata'])
        filerouter_set.add(r['filerouter'])

    # linecache 可以实时更新文件信息，读取文件内容
    lines = linecache.updatecache(gc.TRUST_LOG_PATH)

    # 遍历文件内容 如果出现新的记录，就创建新对象，添加到临时列表 mlist
    mlist = []
    for line in lines:
        if (line is not None) and line[0] != 'None' and (line.find(gc.ML_TAG) != -1):
            line = line.split()
            if (line[0] not in pcr_set) or \
                    (line[1] not in templatehash_set) or \
                    (line[2] not in tmptype_set) or \
                    (line[3] not in filedata_set) or \
                    (line[4] not in filerouter_set):
                mlist.append(MList(pcr=line[0], template_hash=line[1],
                                   tmp_type=line[2], file_data=line[3], file_router=line[4]))
    # 将新记录批量插入数据库
    try:
        MList.objects.bulk_create(mlist)
    except Exception as e:
        logger.error(e)


def search_mlist(request):
    """
    可信审计ML列表,支持关键字搜索,按条件搜索ml信息
    :param request:
    :return: mlist 中符合搜索要求的数据
    """
    return_list = []
    try:
        item_key = request.POST.get("itemKey", "")  # 搜索类型
        search_word = request.POST.get("searchkeyWord", "")  # 搜索关键字
        page = int(request.POST.get('pageIndex', 1))  # 第几页
        size = int(request.POST.get('pagesize', 20))  # 每页多少条
        if item_key == "pcr":
            m_lists = MList.objects.filter(pcr__contains=search_word)  # 搜索pcr是否包含关键字
        elif item_key == "templatehash":
            m_lists = MList.objects.filter(template_hash__contains=search_word)  # 同上%templatehash
        elif item_key == "tmptype":
            m_lists = MList.objects.filter(tmp_type__contains=search_word)  # 同上
        elif item_key == "filedata":
            m_lists = MList.objects.filter(file_data__contains=search_word)  # 同上
        elif item_key == "filerouter":
            m_lists = MList.objects.filter(file_router__contains=search_word)  # 同上
        else:
            m_lists = MList.objects.all()  # 无关键字搜索或者关键字错误

        if request.POST.get("sortKey", "") == "reverse":  # 如果reverse
            m_lists.order_by("-id")  # 则按照id反序

        paginator = Paginator(m_lists, size)  # 分页
        try:
            m_list = paginator.page(page)  # 取第page页
        except(EmptyPage, InvalidPage, PageNotAnInteger):
            m_list = paginator.page(1)  # 页数不可用,默认返回第一页

        for i in m_list:  # 把QuerySet转换为dict,才可以用json.dumps
            temp = {"filerouter": i.file_router, "tmptype": i.tmp_type, "id": i.id,
                    "pcr": i.pcr, "templatehash": i.template_hash, "filedata": i.file_data}
            return_list.append(temp)
        return_list.append({'totalpages': page_calculate(m_lists.count(), size)})  # 总页数

    except Exception as e:
        logger.error(str(e))

    return HttpResponse(json.dumps(return_list))

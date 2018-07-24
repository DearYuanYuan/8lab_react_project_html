#!/usr/bin/env python
# encoding: utf-8

"""
区块链相关接口:
资产的创建,转让,查询等

author:Wangjiashuai
"""
import json
import time
import uuid
from datetime import datetime

from django.core.paginator import Paginator
from django.http import HttpResponse
import bigchaindb_driver
from pymongo import MongoClient, ASCENDING, DESCENDING

from app_fuzhou.views_utils.logger import logger
from app_fuzhou.views_utils.localconfig import JsonConfiguration
from app_fuzhou.database_view import get_host_info
from app_fuzhou.util.octa_bdb_api import (
    query_by_assert_id,
    query_by_tx_id
)
from app_fuzhou.models import ChainUser, ChainUserTran
from app_fuzhou.views_utils.service.warningservice.warning_service import (
    insert_alarm
)
from app_fuzhou.views_utils.service.warningservice.send_wechat import \
    send_wechat
from app_fuzhou.views_utils.service.warningservice.send_mail import (
    send_mail,
    mail_to_list
)

from app_fuzhou.util.mongo_chain_api import (
    recover_transaction_by_tx_id
)


CONFIG = JsonConfiguration()
# 存证、审计、网页、关键数据、物流信息、其它
TRANSACTION_TYPE = [{'key': 'gold_tran', 'name': '存证'},
                    {'key': 'shenji_tran', 'name': '审计'},
                    {'key': 'web_tran', 'name': '网页'},
                    {'key': 'data_tran', 'name': '关键数据'},
                    {'key': 'wuliu_tran', 'name': '物流信息'},
                    {'key': 'other_tran', 'name': '其他'}]
# 交易类型对应的键值对
TRANSACTION_TYPE_SET = {'gold_tran': '存证',
                        'shenji_tran': '审计',
                        'web_tran': '网页',
                        'data_tran': '关键数据',
                        'wuliu_tran': '物流信息',
                        'other_tran': '其他'}
# 交易列表页,每页展示的条数
TRAN_LIST_LIMIT = 50
# 峰值计算因子
FACTOR = 6


def get_block_count(request):
    """
    获取块总大小
    :return:
    """
    client = MongoClient(CONFIG.bdb_host, CONFIG.mongo_port)  # 获取mongo连接
    return_key = 'count'  # 返回值的key
    try:
        db = client.get_database('octachain')
        collection = db.get_collection('bigchain')  # 查询bigchain的count即可
        count = collection.find().count()
        client.close()
        return HttpResponse(json.dumps({return_key: count}))
    except Exception as e:  # 如果有异常,打印日志,返回0
        client.close()
        logger.error(e)
        return HttpResponse(json.dumps({return_key: 0}))


def get_chain_node_count(request):
    """
    获取区块链节点数量
    :return:
    """
    return_key = 'count'
    return HttpResponse(json.dumps({return_key: __chain_node_count()}))


def __chain_node_count():
    """
    获取区块链节点数量:
    副本集个数就是区块节点数
    """
    client = MongoClient(CONFIG.bdb_host, CONFIG.mongo_port)  # 连接mongo
    try:
        db = client.get_database('admin')
        rs = db.command('replSetGetStatus')  # 查询副本集个数
        count = len(rs['members'])
        client.close()
        return count
    except Exception as e:
        client.close()
        logger.error(e)
        return 0


def get_chain_node_ips(request):
    """
    获取区块链节点详细信息
    节点信息时与查询bigchaindb依赖的mongodb集群信息是一样的,
    所以最终还是通过查询mongol副本集来查
    :return:
    """
    client = MongoClient(CONFIG.bdb_host, CONFIG.mongo_port)
    return_key = 'members'
    try:
        db = client.get_database('admin')
        rs = db.command('replSetGetStatus')  # 通过查询副本集的状态来获取节点的信息
        members = []
        for _m in rs['members']:
            _ip = _m['name'].split(':')[0]
            members.append(_ip)
        client.close()
        return HttpResponse(json.dumps({return_key: members}))
    except Exception as e:
        client.close()
        logger.error(e)
        return HttpResponse(json.dumps({return_key: []}))


def get_chain_node_details(request):
    """
    获取区块链节点详细信息
    :return:
    """
    client = MongoClient(CONFIG.bdb_host, CONFIG.mongo_port)
    return_key = 'members'
    try:
        db = client.get_database('admin')
        rs = db.command('replSetGetStatus')
        members = []

        # 查询ES中,通过metricbeat收集到的主机信息
        metricbeat_index = "metricbeat"
        for _m in rs['members']:
            _ip = _m['name'].split(':')[0]
            host_detail = {}  # host 详细信息

            # 获取host  cpu men 使用率
            used_cpu_pct, used_mem_pct, disk_in, disk_out, runtime, connections = get_host_info(
                metricbeat_index + _ip)
            host_detail['host_ip'] = _ip
            host_detail['cpu_pct'] = used_cpu_pct
            host_detail['mem_pct'] = used_mem_pct
            host_detail['sent'] = disk_out
            host_detail['received'] = disk_in
            host_detail['runtime'] = runtime
            host_detail['connections'] = connections

            members.append(host_detail)
        client.close()
        return HttpResponse(json.dumps({return_key: members}))
    except Exception as e:
        client.close()
        logger.error(e)
        return HttpResponse(json.dumps({return_key: []}))


def get_peak_trans_count(request):
    """
    获取峰值交易数
    1,查询最新数据last交易时间 last_time
    2,查询最开始数据交易时间 first_time,在查询时,由于最开始部署区块链有几条测试数据,
    这部分数据一般就几条,并且严重影响最终结果,所以跳过这部分数据,类似于数据清洗功能
    3,依据二八定律计算峰值,我们的区块链跑的数据比较稳定,所以定律因子根据这个特色定为1.5

    :return:
    """
    client = MongoClient(CONFIG.bdb_host, CONFIG.mongo_port)
    return_key = 'count'
    skip = 50

    try:
        db = client.get_database('octachain')
        collection = db.get_collection('bigchain')
        first_time = 0
        last_time = 1
        _first_trans = collection.find().sort(
            [('block.timestamp', ASCENDING)]).skip(skip).limit(1)
        for _item in _first_trans:
            first_time = int(_item['block']['timestamp'])

        _last_trans = collection.find().sort(
            [('block.timestamp', DESCENDING)]).limit(1)
        for _item in _last_trans:
            last_time = int(_item['block']['timestamp'])

        count = collection.find().count()
        if count <= skip:  # 说明没有什么交易
            return HttpResponse(json.dumps({return_key: 0}))
        count -= skip
        logger.debug(count)
        logger.debug(last_time - first_time)
        res = round(count / (last_time - first_time) * FACTOR, 2)
        client.close()
        return HttpResponse(json.dumps({return_key: res}))
    except Exception as e:
        client.close()
        logger.error(e)
        return HttpResponse(json.dumps({return_key: 0}))


def get_day_trans_count(request):
    """
    当日交易总量
    查询mongo的collection:bigchain中的当天的记录总数
    :return:
    """
    client = MongoClient(CONFIG.bdb_host, CONFIG.mongo_port)
    db = client.get_database('octachain')
    collection = db.get_collection('bigchain')

    dt = datetime.now()
    ans_time = time.mktime(dt.timetuple())

    # 查询当前时间取整后,往前推24小时的数据
    js = {'block.timestamp':
              {'$lt': str(ans_time),
               '$gt': str(ans_time - ans_time % 86400)}}
    count = collection.find(js).count()
    client.close()
    return_key = 'count'
    return HttpResponse(json.dumps({return_key: count}))


def query_assets_by_page(page, page_size):
    """
    分页查询交易类型为"CREATE"的资产
    :param page:
    :param page_size:
    :return:
    """
    _list = ChainUserTran.objects.filter(tran_type='CREATE')\
        .order_by('-create_time', )
    paginator = Paginator(_list, page_size)

    chain_user_list = paginator.page(page)
    _l = chain_user_list.object_list
    return _l


def query_assets_count():
    """
    分页查询交易类型为"CREATE"的资产
    :return:
    """
    count = ChainUserTran.objects.filter(tran_type='CREATE').count()
    return count


def query_trans_lists(request):
    """
    交易列表
    :return:
    """
    return_dic = {}
    results = []
    page = request.POST.get('page', 1)
    page_size = request.POST.get('pageSize', 10)

    assets = query_assets_by_page(page, page_size)  # 查询类型为创建的资产
    count = query_assets_count()  # 查询类型为创建的资产总数

    """
        循环查询交易详情
    """
    for _ass in assets:

        """
            根据交易ID查询交易详细信息
        """
        try:
            _transaction = query_by_tx_id(_ass.tx_id,
                                          CONFIG.bdb_host,
                                          CONFIG.bdb_port)
            _asset = {}
            _asset['type'] = TRANSACTION_TYPE_SET[_ass.asset_type]
            if 'file_name' in _transaction and _transaction[
                'file_name'] is not None:  # 如果包括附件名字段
                _asset['filename'] = _transaction['file_name']
            else:
                _asset['filename'] = ''
            _asset['asset'] = _transaction['asset']  # 资产数据
            _asset['time'] = _ass.create_time.strftime('%Y-%m-%d %H:%M:%S')
            _asset['id'] = _ass.id
            _asset['confirm_status'] = _ass.confirm_status
            results.append(_asset)
        except Exception as e:
            logger.error('the tx_id %s query error: ' %(_ass.tx_id))
            logger.error(e)

    return_dic['code'] = 200
    return_dic['data'] = results
    return_dic['count'] = count
    return HttpResponse(json.dumps(return_dic))


def query_trans_contains_user(request):
    """
    交易列表,查询的同时查询抓让信息
    :return:
    """
    return_dic = {}
    results = []
    page = request.POST.get('page', 1)
    page_size = request.POST.get('pageSize', 10)
    assets = query_assets_by_page(page, page_size)  # 从Mysql中查询交易表的数据
    count = query_assets_count()

    #  拿到数据库中的交易信息后,根据tx_id, 通过区块链接口,查询区块链中的详细交易信息
    for _ass in assets:
        _asset = {}
        _asset['type'] = TRANSACTION_TYPE_SET[_ass.asset_type]
        _transaction = query_by_assert_id(_ass.tx_id, CONFIG.bdb_host, CONFIG.bdb_port)
        if not _transaction:
            continue
        _asset_details = []
        _transaction = _transaction[::-1]
        for _tran in _transaction:
            _a_detail = {}
            _public_key = _tran['outputs'][0]['condition']['details']['public_key']
            try:
                _user = ChainUser.objects.get(public_key=_public_key)
                _a_detail['username'] = _user.username
                _a_detail['is_active'] = _user.is_active
            except ChainUser.DoesNotExist:
                _a_detail['username'] = _public_key
                _a_detail['is_active'] = 0
            _asset_details.append(_a_detail)
        _asset['detail'] = _asset_details
        _asset['time'] = _ass.create_time.strftime('%Y-%m-%d %H:%M:%S')
        results.append(_asset)
    return_dic['code'] = 200
    return_dic['data'] = results
    return_dic['count'] = count
    return HttpResponse(json.dumps(return_dic))


def query_trans_detail(request):
    """
    交易详情
    :return:
    """
    return_dic = {}
    asset_id = request.POST.get('asset_id', '')
    _ass = ChainUserTran.objects.get(id=asset_id)

    # 如果交易类型为转让,同时还没有原始交易ID的,属于问题数据
    if _ass.tran_type == 'TRANSFER':
        if _ass.origin_tx_id == '':
            logger.error(_ass.id + ' is a problem transaction')
            return_dic['code'] = 201
            return HttpResponse(json.dumps(return_dic))
        _transaction = query_by_assert_id(_ass.origin_tx_id, CONFIG.bdb_host,
                                          CONFIG.bdb_port)
    else:
        _transaction = query_by_assert_id(_ass.tx_id, CONFIG.bdb_host, CONFIG.bdb_port)

    _asset_details = []
    _transaction = _transaction[::-1]

    # 分别根据交易中的public_key,来查询区块链用户表中的用户信息
    for _tran in _transaction:
        _a_detail = {}
        _public_key = _tran['outputs'][0]['condition']['details']['public_key']
        try:
            _user = ChainUser.objects.get(public_key=_public_key)
            _a_detail['username'] = _user.username
            _a_detail['job'] = _user.job
            _a_detail['department'] = _user.department
            _a_detail['tx_id'] = _tran['id']
            _a_detail['email'] = _user.email
            _a_detail['phone'] = _user.phone
            _a_detail['photo'] = _user.photo
            _a_detail['is_active'] = _user.is_active
            _a_detail['time'] = ChainUserTran.objects.get(
                tx_id=_tran['id']).create_time.strftime('%Y-%m-%d %H:%M:%S')
        except ChainUser.DoesNotExist:
            _a_detail['owner'] = _public_key
            _a_detail['job'] = 'unknown'
            _a_detail['department'] = 'unknown'
            _a_detail['email'] = 'unknown'
            _a_detail['phone'] = 'unknown'
            _a_detail['tx_id'] = 'unknown'
            _a_detail['photo'] = 'unknown'
            _a_detail['time'] = 'unknown'
            _a_detail['is_active'] = 'unknown'
        _asset_details.append(_a_detail)

    return_dic['detail'] = _asset_details
    return_dic['code'] = 200
    return HttpResponse(json.dumps(return_dic))


def down_tran_att(request):
    """
    下载交易附件
    :param request:
    :return:
    """
    return_dic = {}
    asset_id = request.GET.get('asset_id', '')  # 数据库中对应的用户交易记录表的ID
    _ass = ChainUserTran.objects.get(id=asset_id)

    """
     查询出最原始的交易ID, 因为只有最原始的交易ID,才能调用query_by_tx_id查询出资产详情
    """
    if _ass.tran_type == 'TRANSFER':  # 如果这条ID对应的类型为转让
        if _ass.origin_tx_id == '':  # 这个几乎不会出现,不排除有些垃圾数据会出现
            logger.error(_ass.id + ' is a problem transaction')
            return_dic['code'] = 201
            return HttpResponse(json.dumps(return_dic))
        origin_id = _ass.origin_tx_id
    else:  # 交易类型为创建的,资产ID肯定就是原始的了
        origin_id = _ass.tx_id

    if _ass.is_sync == 1:
        origin_id = _ass.sync_tx_id

    _transaction = query_by_tx_id(origin_id,      # 查询交易
                                  CONFIG.bdb_host,
                                  CONFIG.bdb_port)
    if 'file_name' in _transaction and \
                    _transaction['file_name'] is not None:  # 如果包括附件名字段
        filename = _transaction['file_name']
        random_filename = datetime.now().strftime(
            '%Y-%m-%d-%H-%M-%S') + str(uuid.uuid1()) + '-' + filename
        with open('{}{}'.format(CONFIG.chain_attach_mount_dir, random_filename),
                  'wb') as f:
            f.write(_transaction['file'].encode('iso-8859-1'))
        import time
        time.sleep(1)
        return_dic['code'] = 200
        return_dic['url'] = CONFIG.chain_attach_url + random_filename
        return HttpResponse(json.dumps(return_dic))
    else:  # 如果没有附件一般这个else走不到,如果走到这就是异常了
        return_dic['code'] = 201
        return HttpResponse(json.dumps(return_dic))


def query_tran_types(request):
    """
    查询目前的交易类型
    :param request:
    :return:
    """
    return_dic = {'code': '200', 'results': TRANSACTION_TYPE}
    return HttpResponse(json.dumps(return_dic))


def test_alarm(request):
    """
    测试通过篡改mongodb数据之后再查询交易id对应的交易时的告警
    :param request:
    :return:
    """
    tx_id = request.GET.get('tx_id')
    try:
        # 根据交易ID查询交易的资产信息
        re = query_by_tx_id(tx_id, CONFIG.bdb_host, CONFIG.bdb_port)
        return HttpResponse(
            json.dumps({'code': '200', 'results': re}))

    except bigchaindb_driver.exceptions.TransportError as e:
        insert_alarm(1, 5)  # 插入告警信息到告警表
        error_info = ''
        error_info += "出现异常：资产信息被破坏, 资产ID: " + tx_id
        try:
            cu = ChainUserTran.objects.get(tx_id=tx_id)
            error_info += ' 用户ID:' + cu.chain_user_id + '资产类型: ' +\
                          cu.asset_type + ' 交易时间: ' +\
                          cu.create_time.strftime('%Y-%m-%d %H:%M:%S %f')

        except ChainUserTran.DoesNotExist:
            logger.error('the tx_id is error,'
                         ' no transaction in table: chain_user_tran' + tx_id)

        """
            进行数据恢复操作
        """
        logger.info(
            'find error in tx_id' + tx_id + ', and in reverting now:------')
        revert_re = recover_transaction_by_tx_id(CONFIG.bdb_host,
                                                 CONFIG.mongo_port,
                                                 CONFIG.bak_mongo_host,
                                                 CONFIG.bak_mongo_port,
                                                 tx_id)
        if revert_re == 0:
            error_info += ' ,and recover the transaction successfully.'
            logger.info(
                'The tx_id' + tx_id + ' reverted successfully.')
        else:
            logger.error(
                'The tx_id' + tx_id + ' reverted failed.')

        """
            如果报警开关打开,进行报警
        """
        if CONFIG.alarm_enable == 1:
            now = datetime.datetime.now()
            now = now.strftime('%Y-%m-%d %H:%M:%S')
            send_mail(mail_to_list(), "警告信息", "异常信息(" + now + ")：" + error_info)
            send_wechat("区块链异常(" + now + ")：" + error_info)

        return HttpResponse(json.dumps({'code': '200', 'results': 'alarm success'}))

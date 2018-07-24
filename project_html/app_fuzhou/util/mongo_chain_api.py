#!/usr/bin/env python
# encoding: utf-8
from pymongo import MongoClient
# from app_fuzhou.views_utils.logger import logger

CREATE = 'CREATE'
TRANSFER = 'TRANSFER'
GENESIS = 'GENESIS'


def bak_transaction_by_tx_id(bdb_mongo_ip,
                             bdb_mongo_port,
                             bak_mongo_ip,
                             bak_mongo_port,
                             tx_id):
    """
    备份交易信息到备份的MongoDB中
    :param bdb_mongo_ip: 区块链对应的mongo的IP
    :param bdb_mongo_port: 区块链对应的mongo端口
    :param bak_mongo_ip: 备份的Mongo地址
    :param bak_mongo_port: 备份端口
    :param tx_id: 交易ID
    :return:
    """
    try:
        conn = MongoClient(bdb_mongo_ip, bdb_mongo_port)
        bak_conn = MongoClient(bak_mongo_ip, bak_mongo_port)

        tran = get_blocks_from_transaction(conn, tx_id)
        block_id = tran['id']
        print(block_id)
        bak_blocks(bak_conn, tran)

        votes = get_votes_by_block_id(conn, block_id)
        bak_votes(bak_conn, votes, block_id)

        assert_ids = get_asset_ids(tran)
        assets = get_assets(conn, assert_ids)

        bak_assets(bak_conn, assets)
        return 0
    except Exception as e:
        print(e)
        return -1


def recover_transaction_by_tx_id(bdb_mongo_ip,
                                 bdb_mongo_port,
                                 bak_mongo_ip,
                                 bak_mongo_port,
                                 tx_id):
    """
    从备份的MongoDB中恢复数据到区块链对应的Mongo中
    :param bdb_mongo_ip: 区块链对应的mongo的IP
    :param bdb_mongo_port: 区块链对应的mongo端口
    :param bak_mongo_ip: 备份的Mongo地址
    :param bak_mongo_port: 备份端口
    :param tx_id: 交易ID
    :return:
    """
    try:
        conn = MongoClient(bdb_mongo_ip, bdb_mongo_port)
        bak_conn = MongoClient(bak_mongo_ip, bak_mongo_port)

        tran = get_blocks_from_transaction(bak_conn, tx_id)
        block_id = tran['id']
        # logger.debug(block_id)
        print(block_id)
        recover_blocks(conn, tran)

        votes = get_votes_by_block_id(bak_conn, block_id)
        recover_votes(conn, votes, block_id)

        assert_ids = get_asset_ids(tran)
        assets = get_assets(bak_conn, assert_ids)

        recover_assets(conn, assets, assert_ids)
        return 0
    except Exception as e:
        print(e)
        return -1


def get_votes_by_block_id(conn, block_id):
    """
    获取交易(区块)对应的投票
    :param conn: Mongo连接对象
    :param block_id: 区块ID
    :return:投票集合
    """
    db = conn.get_database('bigchain')
    _re = db.get_collection('votes').find({'vote.voting_for_block': block_id},
              projection={'_id': False})
    _list = list(_re)
    return _list


def bak_votes(conn, votes, block_id):
    """
    备份投票数据
    :param conn:
    :param votes:
    :param block_id:
    :return:
    """
    db = conn.get_database('bigchain')
    _list = get_votes_by_block_id(conn, block_id)
    if len(_list) == len(votes):
        print('error: votes had bak')
        return -1
    insert_many_result = db.get_collection('votes').insert_many(votes)
    print('bak votes successfully')
    print(insert_many_result.inserted_ids)
    return insert_many_result


def recover_votes(conn, votes, block_id):
    """
    还原投票
    :param conn:
    :param votes:
    :param block_id:
    :return:
    """
    db = conn.get_database('bigchain')
    collection = db.get_collection('votes')
    collection.delete_many({'vote.voting_for_block': block_id})

    insert_many_result = collection.insert_many(votes)
    print('recover votes successfully')
    return insert_many_result


def get_blocks_from_transaction(conn, tx_id):
    """
    根据交易ID查询区块信息
    :param tx_id:
        交易ID
    :param conn
        Mongo连接
    :return:
        dict:交易的
    """
    db = conn.get_database('bigchain')
    # _re = db.get_collection('bigchain').find({'block.transactions.id': tx_id},
    #       projection=['id', 'block.voters'])
    _re = db.get_collection('bigchain').find({'block.transactions.id': tx_id})
    _list = list(_re)
    if len(_list) == 1:
        return _list.pop()


def bak_blocks(conn, transaction):
    """
    把区块信息备份到备份数据库
    :param conn:
        备份库的Mongo连接
    :param transaction:
        区块信息
    :return:
        insert_one_result
    """
    db = conn.get_database('bigchain')
    insert_one_result = db.get_collection('bigchain').insert_one(transaction)
    print('bak block successfully')
    return insert_one_result


def recover_blocks(conn, transaction):
    """
    从备份数据库中还原区块信息
    :param conn:
        区块链对应的Mongo连接
    :param transaction:
        交易信息,是在备份库中查询而来
    :return:
        insert_one_result
    """
    db = conn.get_database('bigchain')
    collection = db.get_collection('bigchain')
    collection.delete_one({'id': transaction['id']})
    insert_one_result = collection.insert_one(transaction)
    print('recover block successfully')
    return insert_one_result


def get_asset_ids(block_dict):
    """
    从区块中获取对应的交易,交易中获取资产,交易中包括资产的情况是这条交易为创建或者是创世纪块的时候
    :param block_dict:
    :return:
        list: The list of asset_ids in the block.
    """
    asset_ids = []
    for transaction in block_dict['block']['transactions']:
        if transaction['operation'] in [CREATE, GENESIS]:
            asset_ids.append(transaction['id'])
    return asset_ids


def get_assets(conn, asset_ids):
    """
    根据资产ID,查询资产集合
    :param conn:
    :param asset_ids:
    :return:
    """
    db = conn.get_database('bigchain')
    re = db.get_collection('assets').find({'id': {'$in': asset_ids}},
                                          projection={'_id': False})
    _list = list(re)
    return _list


def bak_assets(conn, asserts):
    """
    备份资产
    :param conn:
    :param asserts:
    :return:
    """
    db = conn.get_database('bigchain')
    if len(asserts) > 0:
        db.get_collection('assets').insert_many(asserts)
        print('bak asserts sucessfully')


def recover_assets(conn, asserts, asset_ids):
    """
    还原资产
    :param conn:
    :param asserts:
    :return:
    """
    db = conn.get_database('bigchain')
    collection = db.get_collection('assets')
    collection.delete_many({'id': {'$in': asset_ids}})
    if len(asserts) > 0:
        collection.insert_many(asserts)
        print('recover asserts successfully')


if __name__ == '__main__':

    mongodb_ip = '192.168.1.231'
    mongodb_port = 28000

    bak_mongodb_ip = '192.168.1.232'
    bak_mongodb_port = 27000

    if __name__ == '__main__':
        tx_id = '8340b0450bd6215da45b1d519674f75162003719a49160de0fd50cb2ad4d0d26'

        # bak_transaction_by_tx_id(mongodb_ip,
        #                          mongodb_port,
        #                          bak_mongodb_ip,
        #                          bak_mongodb_port,
        #                          tx_id)

        recover_transaction_by_tx_id(mongodb_ip,
                                     mongodb_port,
                                     bak_mongodb_ip,
                                     bak_mongodb_port,
                                     tx_id)

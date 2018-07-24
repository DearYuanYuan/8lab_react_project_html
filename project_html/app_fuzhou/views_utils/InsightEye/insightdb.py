#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Created on Tue Mar 20 14:20:12 2018
 
@author: long
"""
'''
host: 192.168.1.210
port:3306
user:8lab
password:8lab
db:insightdb
'''
import pymysql
import json
import numpy as np
import contextlib

#import insightvideo
#invideo = insightvideo.insightvideo()
#conf =  invideo.getvideostream(r'insightconfig.ini')
#conf_data = conf.conf_dict
#host,port,user,passwd,db = conf_data['mysql'].values()
#port = int(port)
class insightdb(object):
    def __init__(self,mysql_dict):
        self.host = mysql_dict['host']
        self.port = int(mysql_dict['port'])
        self.user = mysql_dict['user']
        self.passwd = mysql_dict['password']
        self.db = mysql_dict['db']
        
    #定义上下文管理器，连接后自动关闭连接
    @contextlib.contextmanager
    def mysql_connect(self):
        conn = pymysql.connect(host=self.host, port=self.port, user=self.user, passwd=self.passwd, db=self.db)
        cursor = conn.cursor(cursor=pymysql.cursors.DictCursor)
        try:
            yield cursor
        finally:
            conn.commit()
            cursor.close()
            conn.close()

    #return all the name in mysql database  
    # def _name_db(self):
    #     with self.mysql_connect() as cursor:
    #         cursor.execute("SELECT name FROM dbfaces")
    #         name = cursor.fetchall()
    #         name_db = []
    #         for i in name:
    #             name_db.append(i['name'])
    #         return name_db
            
    
        
    #be used for save the ndarray data into mysql
    def _array_to_list(self,encoded_faces):
        return [list(i) for i in encoded_faces]
    def _list_to_array(self,encoded_faces):
        return [np.array(i) for i in encoded_faces]
    
    #given a name and a picture with only one person,save the data of the person into mysql
    # def addtarget(self,encoded_faces_tuple):
    #     with self.mysql_connect() as cursor:
    #         name_db = self._name_db()
    #         encoded_faces = encoded_faces_tuple.encoded_face
    #         name = encoded_faces_tuple.name
    #
    #         if name in name_db:
    #             encoded_faces_indb = self.gettarget(name)
    #             encoded_faces_indb.extend(encoded_faces)
    #             encoded_faces_indb = self._array_to_list(encoded_faces_indb)
    #             encoded_faces_indb = json.dumps(encoded_faces_indb)
    #             cursor.execute("DELETE FROM dbfaces WHERE name = {}".format(name))
    #             cursor.execute("INSERT INTO dbfaces VALUES('{0}','{1}')".format(name,encoded_faces_indb))
    #         else:
    #             encoded_faces = self._array_to_list(encoded_faces)
    #             encoded_faces = json.dumps(encoded_faces)
    #             cursor.execute("INSERT INTO dbfaces VALUES('{0}','{1}')".format(name,encoded_faces))
    
    #save data orgnized by a dict to mysql,结构如下{'people_name':[encode_p_1,encode_p_2,...],...}
    # def add_dict(self,db_dict):
    #     with self.mysql_connect() as cursor:
    #         for person_name in db_dict.keys():
    #             encoded_faces = self._array_to_list(db_dict[person_name])
    #             encoded_faces = json.dumps(encoded_faces)
    #             cursor.execute("INSERT INTO dbfaces VALUES('{0}','{1}')".format(person_name,encoded_faces))
    
    #delete the data of one person in mysql    
    # def deltarget(self,name):
    #     with self.mysql_connect() as cursor:
    #         cursor.execute("DELETE FROM dbfaces WHERE name = '{}'".format(name))
        
    #given a name,return the all encoded_faces data in the db    
    def gettarget(self,name):
        with self.mysql_connect() as cursor:
            cursor.execute("SELECT faces FROM auth_user WHERE username = '{}'".format(name))
            data = cursor.fetchall()
            data = data[0]['faces']
            data = json.loads(data)
            data = self._list_to_array(data)
            return data
        
    # get all data in mysql, 结构如下{'people_name':[encode_p_1,encode_p_2,...],...}  
    def getdbfaces(self):
        with self.mysql_connect() as cursor:
            db_faces = {}
            cursor.execute('SELECT * FROM auth_user')
            res = cursor.fetchall()
            for i in res:
                if not i['faces']:
                    continue
                db_faces[i['username']]=self._list_to_array(json.loads(i['faces']))
            return db_faces

#def _get_list(nums):
#    nums=nums[1:-1]
#    nums = [float(i) for i in nums.split(',')]
#    return nums
#    
    
    
    
    

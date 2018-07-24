#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Created on Fri Mar 16 17:21:45 2018

@author: long
"""
'''
#SDK演示类
#1. 新增人脸到数据库
#2. 基于存档人脸的实时视频流下的人脸识别和标记
'''
import numpy as np
import datetime
import time
import cv2
# from app_fuzhou.views_utils.InsightEye import insightconfig
from app_fuzhou.views_utils.InsightEye import insightdb, insightface, insightvideo
from app_fuzhou.views_utils.localconfig import JsonConfiguration

local_config = JsonConfiguration()
inface = insightface.insightface()
# conf=insightconfig.insighconfig('app_fuzhou/views_utils/InsightEye/insightconfig.ini')
# invideo = insightvideo.insightvideo(conf.conf_dict)
# video_stream =  invideo.getvideostream(video='video',mysql='mysql',
#                                        scale_ratio='scale_ratio_2',
#                                        knn='knn_3',tolerance='tolerance_1',
#                                        model_detection = 'model_detection_1')
# conf_data = video_stream.conf_dict

conf_data = {'video': {'addr': local_config.face['addr'],
                       'type': local_config.face['type'],
                       'size': local_config.face['size']},
             'model_detection': {'model_detection': local_config.face['model_detection']},
             'tolerance': {'tolerance': local_config.face['tolerance']},
             'mysql': {'password': local_config.mysql_pass,
                       'user': local_config.mysql_user,
                       'db': local_config.mysql_database,
                       'host': local_config.mysql_host,
                       'port': local_config.mysql_port},
             'knn': {'knn_bool': local_config.face['knn_bool'], 'k': local_config.face['k']},
             'scale_ratio': {'scale_ratio': local_config.face['scale_ratio']}}

scale_data = conf_data['scale_ratio']['scale_ratio']
scale_ratio = float(scale_data)
scale_ratio2 = int(1/scale_ratio)

indb = insightdb.insightdb(conf_data['mysql'])
# 新增人脸
# person = inface.encodface_name(r'pics/long.jpg','test')
# indb.addtarget(person)
# test = indb.gettarget('test')
# print('the data are: {}'.format(test))
# indb.deltarget('test')

encoded_db_face = indb.getdbfaces()

#the detection_model
model_detection = conf_data['model_detection']['model_detection']

#the tolerance while recognize the  faces
tolerance = conf_data['tolerance']
tolerance = float(tolerance['tolerance'])

#the knn_bool and from videostream
knn = conf_data['knn']['knn_bool']
knn = True is knn == 'True'
k = int(conf_data['knn']['k'])


def find_face(image, name):
    """
    发现图片中的人脸
    :param image:
    :param name:
    :return:
    """
    person = inface.encodface_name(image, name)
    return person


def exe_search(image):
    """
    人脸识别
    :param image:
    :return:
    """
    image = inface.imread(image)
    locations = inface.detectionface(image, model=model_detection)
    encoded_faces = inface.encodface(image, locations)
    print('检测到图像中人脸数量为: %s' % len(encoded_faces))
    predictions = inface.searchface(encoded_faces, encoded_db_face,tolerance=tolerance, knn=knn, k=k)
    return predictions


# 2. 基于存档人脸的实时视频流下的人脸识别和标记
def video_find_face(time_range):

    face_list = []
    begin = datetime.datetime.now()
    invideo = insightvideo.insightvideo(conf_data)
    video_stream = invideo.getvideostream()
    count_time = 1
    fps = video_stream.fps
    times_fps = 0
    start = time.time()
    duration = 0
    face_counts = 0
    while True:
        if (datetime.datetime.now() - begin).seconds > time_range:
            cv2.destroyAllWindows()
            del video_stream
            return face_counts, face_list

        if duration > 1:
            duration = 0
            start = time.time()
        start2 = time.time()
        # Grab a single frame of video
        frame = video_stream.frame()

        # Resize frame of video to 1/4 size for faster face recognition processing
        small_frame = cv2.resize(frame, (0, 0), fx=scale_ratio, fy=scale_ratio)

        # Convert the image from BGR color (which OpenCV uses) to RGB color (which face_recognition uses)
        rgb_small_frame = small_frame[:, :, ::-1]

        # Find all the faces and face encodings in the current frame of video
        locations = inface.detectionface(rgb_small_frame, model=model_detection)
        encoded_faces = inface.encodface(rgb_small_frame, locations)
        # 几张人脸
        if len(encoded_faces) > face_counts:
            face_counts = len(encoded_faces)

        predictions = inface.searchface(encoded_faces, encoded_db_face, tolerance=tolerance, knn=knn, k=k)
        if predictions:
            # print(predictions)
            face_list.extend(predictions)

        # # Display the results
        # for name, (top, right, bottom, left) in zip(predictions, locations):
        #     # Scale back up face locations since the frame we detected in was scaled to 1/4 size
        #     top, right, bottom, left = [i * scale_ratio2 for i in (top, right, bottom, left)]
        #     # Draw a box around the face
        #     cv2.rectangle(frame, (left, top), (right, bottom), (0, 0, 255), 2)
        #     # Draw a label with a name belop the face
        #     cv2.rectangle(frame, (left, bottom - 35), (right, bottom), (0, 0, 255), cv2.FILLED)
        #     font = cv2.FONT_HERSHEY_DUPLEX
        #     cv2.putText(frame, name, (left + 6, bottom - 6), font, 1.0, (255, 255, 255), 1)
        #
        # # Display the resulting image
        # cv2.imshow('Video', frame)
        #
        # # Hit 'q' on the keyboard to quit
        # # if cv2.waitKey(1) & 0xFF == ord('q'):
        # #     break
        # times_fps += 1
        # end = time.time() - start2
        # duration = time.time() - start
        # if duration > 1:
        #     fps = times_fps
        #     times_fps = 0
        #
        # # print('the %0.1ftimes   %0.5fs   fps:%0.1f' % (count_time, end, fps))
        # # print(duration)
        # count_time += 1

    # release the video and close the windows
    # cv2.destroyAllWindows()
    # del video_stream


# inface = insightface.insightface()
# conf=insightconfig.insighconfig('insightconfig.ini')
# #the scale_ratio of each frame,read from videostream
# invideo = insightvideo.insightvideo(conf.conf_dict)
# video_stream =  invideo.getvideostream(video='video',mysql='mysql',
#                                        scale_ratio='scale_ratio_2',
#                                        knn='knn_3',tolerance='tolerance_1',
#                                        model_detection = 'model_detection_1')
# conf_data = video_stream.conf_dict
# scale_data = conf_data['scale_ratio']
# scale_ratio = float(scale_data['scale_ratio'])
# scale_ratio2 = int(1/scale_ratio)
#
# #the knn_bool and from videostream
# knn = conf_data['knn']['knn_bool']
# knn = True is knn == 'True'
# k = int(conf_data['knn']['k'])
#
# #the detection_model
# model_detection = conf_data['model_detection']['model_detection']
#
# #the tolerance while recognize the  faces
# tolerance = conf_data['tolerance']
# tolerance = float(tolerance['tolerance'])
# #1. 新增人脸到数据库,test
# #use the data in config_dict to initialize the mysql database
# indb = insightdb.insightdb(conf_data['mysql'])
# person = inface.encodface_name(r'pics/long.jpg','test')
# indb.addtarget(person)
# test = indb.gettarget('test')
# print('the data are: {}'.format(test))
# indb.deltarget('test')
# #
# #
# # process_this_frame = True
# # video_capture = cv2.VideoCapture(0)
# encoded_db_face = indb.getdbfaces()

# def exe_search(img):
#     count_time = 1
#     now = datetime.datetime.now()
#     while True:
#         if (datetime.datetime.now() - now).seconds > 30:
#             return 'Unknow'
#         start = time.time()
#         # Grab a single frame of video
#         #time.sleep(0.05)
#
#         # ret , frame = video_capture.read()
#         frame = img
#
#         # Resize frame of video to 1/4 size for faster face recognition processing
#         small_frame = cv2.resize(frame, (0, 0), fx=scale_ratio, fy=scale_ratio)
#
#         # Convert the image from BGR color (which OpenCV uses) to RGB color (which face_recognition uses)
#         rgb_small_frame = small_frame[:, :, ::-1]
#
#         # Only process every other frame of video to save time
#         if process_this_frame:
#             # Find all the faces and face encodings in the current frame of video
#             locations = inface.detectionface(rgb_small_frame,model=model_detection)
#             encoded_faces = inface.encodface(rgb_small_frame,locations)
#             predictions = inface.searchface(encoded_faces,encoded_db_face,tolerance=tolerance,knn=knn,k=k)

        # if predictions:
        #     return predictions


        # Display the results
        # for name, (top, right, bottom, left) in zip(predictions,locations):
        #     # Scale back up face locations since the frame we detected in was scaled to 1/4 size
        #     top *= scale_ratio2
        #     right *= scale_ratio2
        #
        #     bottom *= scale_ratio2
        #     left *= scale_ratio2
        #
        #     # Draw a box around the face
        #     cv2.rectangle(frame, (left, top), (right, bottom), (0, 0, 255), 2)
        #
        #     # Draw a label with a name belop the face
        #     cv2.rectangle(frame, (left, bottom - 35), (right, bottom), (0, 0, 255), cv2.FILLED)
        #     font = cv2.FONT_HERSHEY_DUPLEX
        #     cv2.putText(frame, name, (left + 6, bottom - 6), font, 1.0, (255, 255, 255), 1)
        #
        # # Display the resulting image
        # cv2.imshow('Video', frame)
        #
        # # Hit 'q' on the keyboard to quit
        # if cv2.waitKey(1) & 0xFF == ord('q'):
        #     break
        # end = time.time()-start
        # print('the %0.1ftimes   %0.5fs   fps:%0.1f'%(count_time,end,1/end))
        # count_time += 1

    #release the video and close the windows
    # video_capture.release()
    # cv2.destroyAllWindows()

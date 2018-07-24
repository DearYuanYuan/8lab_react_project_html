#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Created on Fri Mar 16 15:01:20 2018

@author: long
"""
import cv2
import time
import threading


class getframe(threading.Thread):
    def __init__(self, cap):
        threading.Thread.__init__(self)
        self.daemon = True
        self.cap = cap
        _,self.frame = self.cap.read()

    def run(self):
        while True:
            ret, self.frame = self.cap.read()
            time.sleep(0.03)

    def __del__(self):
        print('thread')
        self.cap.release()


class insightvideostream(object):
    def __init__(self, conf):
        self.conf_dict = conf
        if self.conf_dict['video']['type'] == 'rstp':
            self.cap = cv2.VideoCapture(self.conf_dict['video']['addr'])
        elif self.conf_dict['video']['type'] == 'usb':
            self.cap = cv2.VideoCapture(0)
        else:
            raise IOError('the camera disconnected in video_stream')
        ret_test, _ = self.cap.read()
        if not ret_test:
            raise IOError('the image is empty!')
        self.t = getframe(self.cap)
        self.t.start()
        self.fps = self.t.cap.get(5)
        self.width = self.t.cap.get(3)
        self.height = self.t.cap.get(4)
        self.resolution = (self.width, self.height)

    def frame(self):
        return self.t.frame

    def get_video(self):
        video_capture = self.t.cap
        while True:
            start = time.time()
            ret, frame = video_capture.read()
            cv2.imshow('Video', frame)
            self.resolution = (frame.shape[0], frame.shape[1])
            # Hit 'q' on the keyboard to quit!
            if cv2.waitKey(1) & 0xFF == ord('q'):
                break
            end = time.time() - start
            self.fps = round(1 / end, 1)
            print('duration:%0.5fs  fps:%0.1f  resolution:%d*%d' % (
                end, self.fps, self.resolution[0], self.resolution[1]))
        cv2.destroyAllWindows()

    # return the video's fps and resolution
    def get_info(self):
        return self.fps, self.resolution, self.conf

    def __del__(self):
        print('delete')
        self.t.cap.release()

# class insightvideostream(object):
#     def __init__(self,conf):
#         self.fps = None
#         self.resolution = None
#         self.conf_dict = conf
#
#
# #return a frame
#     def get_frame(self,time_ = 5,display=False):
#         cap = cv2.VideoCapture(0)
#         start = time.time()
#         while display:
#             ret,frame = cap.read()
#             end = time.time()-start
#             cv2.imshow('Video', frame)
#             if (cv2.waitKey(1) & 0xFF == ord('q')) or end > time_:
#                 cap.release()
#                 cv2.destroyAllWindows()
#                 break
#         ret,frame = cap.read()
#         return frame
#
# #return video and some informatin of the video
#     def get_video(self):
#         video_capture = cv2.VideoCapture(0)
#         while True:
#             start = time.time()
#             ret , frame = video_capture.read()
#             cv2.imshow('Video', frame)
#             self.resolution = (frame.shape[0],frame.shape[1])
#
#             # Hit 'q' on the keyboard to quit!
#             if cv2.waitKey(1) & 0xFF == ord('q'):
#                 break
#             end = time.time()-start
#             self.fps = round(1/end,1)
#             print('duration:%0.5fs   fps:%0.1f   resolution:%d*%d'%(
#                     end,self.fps,self.resolution[0],self.resolution[1]))
#         video_capture.release()
#         cv2.destroyAllWindows()
#
# #return the video's fps and resolution
#     def get_info(self):
#         return self.fps,self.resolution,self.conf
    
    
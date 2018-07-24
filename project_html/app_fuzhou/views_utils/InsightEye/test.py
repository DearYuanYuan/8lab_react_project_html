#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Created on Thu Mar 29 17:03:25 2018

@author: longjiemin
"""

import cv2
import threading
import time

class insightvideostream(object):
    def __init__(self):
        self.cap = cv2.VideoCapture(0)
        self.frame = None
        self.fps = self.cap.get(5)
        self.width = self.cap.get(3)
        self.height = self.cap.get(4)
        self.resolution = (self.width,self.height)
        t = threading.Thread(target= self._get_frame)
        t.setDaemon(True)
        t.start()

    def _get_frame(self):
            # while True:
            for i in range(300):
                ret,self.frame = self.cap.read()
                time.sleep(0.03)
#                if ret == False:
#                   raise IOError('the camera disconnected')
#                    

    def get_video(self):
            video_capture = self.cap
            while True:
                start = time.time() 
                ret , frame = video_capture.read()
                cv2.imshow('Video', frame)
                self.resolution = (frame.shape[0],frame.shape[1])

                # Hit 'q' on the keyboard to quit!
                if cv2.waitKey(1) & 0xFF == ord('q'):
                    break
                end = time.time()-start
                self.fps = round(1/end,1)
                print('duration:%0.5fs   fps:%0.1f   resolution:%d*%d'%(
                        end,self.fps,self.resolution[0],self.resolution[1]))
            cv2.destroyAllWindows()

        #return the video's fps and resolution    
    def get_info(self):
            return self.fps,self.resolution,self.conf

    def __del__(self):
        print('delete')
        self.cap.release()

obj=insightvideostream()
print(obj)
print("OK")
del obj
time.sleep(3)
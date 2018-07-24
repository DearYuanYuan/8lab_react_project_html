#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Created on Wed Mar 21 17:11:59 2018

@author: long
"""
#import insightconfig
from app_fuzhou.views_utils.InsightEye import insightvideostream


class insightvideo(object):
    def __init__(self, conf):
        self.conf_dict = conf  # insightconfig.insighconfig().conf_dict

    def getvideostream(self):
        return insightvideostream.insightvideostream(self.conf_dict)
            
        
        
        
        

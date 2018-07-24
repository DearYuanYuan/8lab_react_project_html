#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Created on Fri Mar 16 14:49:30 2018

@author: long
"""
from configparser import ConfigParser

class insighconfig(object):
    def __init__(self,congfig_file):
        self.conf_dict = self.config_parser(congfig_file)
    
    def config_parser(self,config):
        c = ConfigParser()
        c.read(config)
        conf_sections = c.sections()
        conf = {}
        for section in conf_sections:
            conf_options = {}
            for i in c.options(section):
                conf_options[i] = c.get(section,i)
            conf[section] = conf_options
        return conf
    

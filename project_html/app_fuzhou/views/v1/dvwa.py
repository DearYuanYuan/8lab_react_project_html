#!/usr/bin/env python
# coding: utf-8
"""
此模块的功能主要是获取阿里云dvwa的配置
"""
import json
from django.http import HttpResponse
from octastack_fuzhou_web.settings import STATICFILES_DIRS

SHARE_JSON = STATICFILES_DIRS[0] + "/json/share.json"

def get_dvwa_address(request):
    with open(SHARE_JSON, 'r') as conf:
            rec = conf.read()
            records = json.loads(rec)
    dvwa_address = records['dvwa_address']
    return HttpResponse(json.dumps(dvwa_address))

#!/usr/bin/env python
# encoding: utf-8

"""
获取常量数据
author:Wangjiashuai
"""
import json
from django.http import HttpResponse

from app_fuzhou.views_utils.localconfig import JsonConfiguration

CONFIG = JsonConfiguration()


def get_iframe_url(request):
    """
    获取前台嵌套的iframe的URL地址,比如Kibana地址,Eagle地址
    :param request:
    :return:
    """
    _type = request.POST.get('t', 'k')
    return HttpResponse(json.dumps({'url': CONFIG.ifr_urls[_type]}))

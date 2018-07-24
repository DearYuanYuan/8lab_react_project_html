#!/usr/bin/env python
# -*- coding: utf-8 -*-
from urllib import request, parse
import http.cookiejar
import hashlib


class IgnoreHTTPErrorProcessor(request.HTTPErrorProcessor):
    """重写HTTPErrorProcessor，跳过HTTPError错误处理"""
    handler_order = 1000  # after all other processing

    def http_response(self, request, response):
        return response

    https_response = http_response


class RequestSimulator(object):
    """
    参数：访问的主URL
    """

    def __init__(self, main_url=''):
        """参数：访问的主URL,可为空"""
        if main_url.endswith('/'):
            self.main_url = main_url[:-1]
        else:
            self.main_url = main_url
        self.cookie = http.cookiejar.CookieJar()  # Cookie Obj

    def get(self, url='', params={}, headers={}, show_req=False, ignore_http_error=False):
        """
        发送get请求

        参数1：访问的URL，可以带http，可以带主URL，可以仅为路径但必须前面加'/'，也可以为空，为空是访问主URL
               合法格式：1)http://www.baidu.com/s    2)www.baidu.com/s   如果在初始化类时给了Main_URL：3) /s 4)  空''
        参数2：get附带的参数，格式为dict
        参数3：request HEADERS，格式为dict
        参数4：show_req，默认False，True将打印request的具体信息
        参数5：ignore_http_error，默认为False，True的话如果服务器返回的异常状态码，将不报错，用于打印Django的Debug信息

        返回：get的response对象
        """
        url = self._get_full_url(url)  # 补全url
        params = parse.urlencode(params)  # 参数按照http规则序列化
        req = request.Request(parse.quote(url + '?' + params, safe='/:?=&'), headers=headers)  # 构建初始request
        if ignore_http_error:
            opener = request.build_opener(request.HTTPCookieProcessor(self.cookie),
                                          IgnoreHTTPErrorProcessor)  # Build Opener
        else:
            opener = request.build_opener(request.HTTPCookieProcessor(self.cookie))  # Build Opener
        response = opener.open(req)  # Open url
        if show_req:
            self._request_details(req)
        return response

    def post(self, url='', data={}, headers={}, show_req=False, ignore_http_error=False):
        """
        发送post请求

        参数1：访问的URL，可以带http，可以带主URL，可以仅为路径但必须前面加'/'，也可以为空，为空是访问主URL
               合法格式：1)http://www.baidu.com/s    2)www.baidu.com/s   如果在初始化类时给了Main_URL：3) /s 4)  空''
        参数2：post附带的body，格式为dict
        参数3：request HEADERS，格式为dict
        参数4：show_req，默认False，True将打印request的具体信息
        参数5：ignore_http_error，默认为False，True的话如果服务器返回的异常状态码，将不报错，用于打印Django的Debug信息

        返回：post的response对象
        """
        url = self._get_full_url(url)  # 补全url
        data = parse.urlencode(data)  # 参数按照http规则序列化
        req = request.Request(parse.quote(url, safe='/:?=&'),
                              data=data.encode(encoding="utf-8", errors="ignore"), headers=headers)
        if ignore_http_error:
            opener = request.build_opener(request.HTTPCookieProcessor(self.cookie),
                                          IgnoreHTTPErrorProcessor)  # Build Opener
        else:
            opener = request.build_opener(request.HTTPCookieProcessor(self.cookie))  # Build Opener
        response = opener.open(req)  # Open url
        if show_req:
            self._request_details(req)
        return response

    def _get_full_url(self, url):
        if url.startswith('http://') or url.startswith('https://'):
            return url
        elif url.startswith('/') or url == '':
            if self.main_url.startswith('http://') or self.main_url.startswith('https://'):
                return self.main_url + url
            return 'http://' + self.main_url + url
        else:
            return 'http://' + url

    @staticmethod
    def _request_details(req):
        print('\nFULL_URL:', req.get_full_url(), '\nTYPE:', req.type, '\nHOST:', req.host,
              '\nMETHOD:', req.get_method(), '\nHEADERS:', req.header_items(), '\nBODY:', req.data, '\n')

    def response_details(self, response):
        """
        打印response的详细信息，包括状态码，headers，body

        参数1：response对象
        """
        self.response_headers(response)
        self.response_body(response)

    @staticmethod
    def response_headers(response):
        """
        打印response的状态码，headers

        参数1：response对象
        """
        print('\ncode:', response.getcode(), '\nheaders:', response.getheaders(), '\n')

    @staticmethod
    def response_body(response):
        """
        打印response的body

        参数1：response对象
        """
        print('\nbody:', response.read().decode('utf-8'), '\n')

    def get_cookie_by_name(self, name):
        """
        返回名字为name的cookie的值
        参数：name
        return ：value
        """
        for cookie in self.cookie:
            if cookie.name == name:
                return cookie.value


if __name__ == '__main__':
    HEADERS = {  # HTTP头
        'User-Agent': 'Mozilla/5.0 (Windows; U; Windows NT 5.2) AppleWebKit/525.13'
                      ' (KHTML, like Gecko) Chrome/0.2.149.27 Safari/525.13',
    }
    MAIN_URL = 'localhost:8000'
    # 构建一个请求模拟器
    rs = RequestSimulator(MAIN_URL)
    # 登录信息 # 如果加密：hashlib.sha1('978788'.encode('utf-8')).hexdigest()}
    login_data = {'username': 'root', 'password': hashlib.sha1('123456'.encode('utf-8')).hexdigest()}
    # 登录
    resp = rs.post(url='/api/login/', data=login_data)
    # 此时rs中已经带有登录信息，如Cookie
    rs.response_details(resp)
    # 跨过CSRF防御机制，在data中添加csrftoken
    post_data = {'csrfmiddlewaretoken': rs.get_cookie_by_name('csrftoken'),
             'flag': 2, 'type': 'local', 'source': 'assassin', 'level': 'DEBUG'}
    # 正式请求某页面
    resp = rs.post(url='/api/loginfo/', data=post_data, ignore_http_error=True)
    rs.response_details(resp)

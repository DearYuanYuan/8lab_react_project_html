#!/usr/bin/env python3
# encoding: utf-8
import urllib.request
import json
import datetime


class Token(object):
    # 获取token
    def __init__(self, corpid, corpsecret):
        self.baseurl = 'https://qyapi.weixin.qq.com/cgi-bin/gettoken?corpid={0}&corpsecret={1}'.format(
            corpid, corpsecret)

    def get_token(self):
        request = urllib.request.Request(self.baseurl)
        response = urllib.request.urlopen(request)
        ret = response.read().strip()
        ret = json.loads(ret.decode('utf-8'))
        if ret['errcode'] != 0:
            print(ret['errmsg'])
            return
        access_token = ret['access_token']
        return access_token


def send_wechat(content):
    is_send_successful = False
    try:
        # 发送消息
        corpid = "wxc05a1c692a154ab3"
        corpsecret = "qGpLLVmeAETWy9QRIqgpQ1-yAaLBQyXgwL3-MJJWpMY"

        qs_token = Token(corpid=corpid, corpsecret=corpsecret).get_token()
        url = "https://qyapi.weixin.qq.com/cgi-bin/message/send?access_token=" + qs_token
        header = {'Content-Type': 'application/x-www-form-urlencoded', 'charset': 'utf-8'}

        payload = {
            "touser": "@all",
            "msgtype": "text",
            "agentid": "2",
            "text": {
                       "content": content
            },
            "safe": "0"
        }

        json_data = json.dumps(payload, ensure_ascii=False).encode('utf-8')
        request = urllib.request.Request(url, data=json_data, headers=header)
        request = urllib.request.urlopen(request)
        page_html = request.read().decode('utf-8')
        print(page_html)
        request.close()
        is_send_successful = True
    except Exception as e:
        print(e)
    finally:
        return is_send_successful


if __name__ == '__main__':
    now = datetime.datetime.now()
    now = now.strftime('%Y-%m-%d %H:%M:%S')
    print(now)

    #send_wechat("测试")

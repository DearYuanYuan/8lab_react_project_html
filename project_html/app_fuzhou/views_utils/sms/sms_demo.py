# -*- coding: utf-8 -*-
import sys
from app_fuzhou.views_utils.sms import SendSmsRequest
from aliyunsdkcore.client import AcsClient
import uuid
# import random
from aliyunsdkcore.profile import region_provider
from aliyunsdkcore.http import method_type as MT
from aliyunsdkcore.http import format_type as FT


# ACCESS_KEY_ID/ACCESS_KEY_SECRET 根据实际申请的账号信息进行替换
ACCESS_KEY_ID = "LTAIks99jIwxbsoQ"
ACCESS_KEY_SECRET = "cFjKIFcs987BxrP5yhJFc1Hrg2zXoN"


"""
短信业务调用接口示例，版本号：v20170525

Created on 2017-06-12

"""
try:
    reload(sys)
    sys.setdefaultencoding('utf8')
except NameError:
    pass
except Exception as err:
    raise err

# 注意：不要更改
REGION = "cn-hangzhou"
PRODUCT_NAME = "Dysmsapi"
DOMAIN = "dysmsapi.aliyuncs.com"

acs_client = AcsClient(ACCESS_KEY_ID, ACCESS_KEY_SECRET, REGION)
region_provider.add_endpoint(PRODUCT_NAME, REGION, DOMAIN)


def send_sms(phone_numbers, sign_name="八分量", template_code="SMS_129390146", template_param=None):

    business_id = uuid.uuid1()
    smsRequest = SendSmsRequest.SendSmsRequest()
    # 申请的短信模板编码,必填
    smsRequest.set_TemplateCode(template_code)

    # 短信模板变量参数
    if template_param is not None:
        smsRequest.set_TemplateParam(template_param)

    # 设置业务请求流水号，必填。
    smsRequest.set_OutId(business_id)

    # 短信签名
    smsRequest.set_SignName(sign_name)

    # 数据提交方式
    # smsRequest.set_method(MT.POST)

    # 数据提交格式
    # smsRequest.set_accept_format(FT.JSON)

    # 短信发送的号码列表，必填。
    smsRequest.set_PhoneNumbers(phone_numbers)

    # 调用短信发送接口，返回json
    smsResponse = acs_client.do_action_with_exception(smsRequest)

    # TODO 业务处理

    return smsResponse.decode()



# if __name__ == '__main__':
#
#     # params = "{\"code\":\"12345\",\"product\":\"云通信\"}"
#     params = "{\"code\":\"%s\"}" % random.randint(100000, 1000000)
#     # params = u'{"name":"wqb","code":"12345678","address":"bz","phone":"13000000000"}'
#     print(send_sms("15399903586", template_param=params))
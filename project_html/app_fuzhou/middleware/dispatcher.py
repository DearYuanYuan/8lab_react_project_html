"""
# middleware for dispatch url
"""
import json

import redis
from django.shortcuts import render_to_response
from django.http import HttpResponse

from octastack_fuzhou_web.settings import MEDIA_URL
from app_fuzhou.apps import BIZ_CODE
from app_fuzhou.views.v1.global_settings import get_session_timeout_value
from app_fuzhou.views_utils.localconfig import JsonConfiguration

jc = JsonConfiguration()
COOKIE_NAME = "tamper_proof_cookie"
re = redis.Redis(jc.redis4bigchanidb_host, jc.redis4bigchanidb_port, db=1)


# 判断用户是否登陆的中间件
class QtsAuthentication(object):
    """ class in middleware to dispatch url in different situations """

    _not_filter = [
        '/api/login/', '/api/register/', '/api/globalscore/',
        '/api/monitor_status/',
        '/api/get_user_list/', '/api/get_model/', '/api/get_model_log/',
        '/api/user/query/', '/api/user/update/',
        '/api/get_eagle_blackbox_status/', '/api/user/train/',
        '/api/bigdata/alarm/put_knowledge/', '/api/bigdata/alarm/control_centre/',
        '/api/blackbox/start_protection/', '/api/blackbox/stop_protection/',
        '/api/bigadata/mergemodelsknowledge/', '/api/bigadata/loadmodels2knowledge/',
        '/api/bigadata/updatemodelsknowledge/', '/api/bigadata/getmodelsknowledge/',
        '/api/bigadata/deletemodelsknowledge/', '/api/blackbox/update_op_host/',
        '/api/blackbox/get_op_host/',
        '/api/send_verify_code/',
        '/api/verify_user_info/',
        '/api/face_recognition/',
        '/api/find_face/',
        '/api/new_register/',
        '/api/new_login/',
        '/api/change_verify_config/',
        '/api/check_tamper_proof_login/',
        '/api/set_scan_task_config/',
        '/api/machinelist/scan_start/',
        '/api/machinelist/get_all_group/',
        '/api/machinelist/get_group_detail/',
        '/api/machinelist/update_group/',
        '/api/machinelist/set_scan_task_config/',
        '/api/machinelist/del_task/',
        '/api/machinelist/get_all_task/'
    ]

    def process_request(self, request):
        """
        # url分情况
        # 当url存在api,说明访问后台接口
        """
        if 'api' in request.path:
            # 如果当前用户没有登录,则只能访问登录和注册的接口,api/login/和api/register
            if not request.user.is_authenticated and request.path not in self._not_filter:
                ret = BIZ_CODE['UN_LOGIN']
                return HttpResponse(json.dumps(ret))
        elif 'admin' in request.path:
            pass
        elif MEDIA_URL in request.path:
            pass
        else:
            return render_to_response('index.html')

    def process_view(self, request, view_func, *view_args, **view__kwargs):
        """
        每次url匹配后，调用视图函数前调用此函数，将session的过期时间重置为一个小时，如果是循环请求的不重置
        """

        # 循环请求的 url
        filter_url = ['/api/alarm/status/', '/api/globalscore/', '/api/netinfo/',
                      '/api/loginfo/', '/api/get_attack_map/get_watcher_info/', '/api/get_host_db_details/']

        if request.path not in filter_url:
            request.session.set_expiry(get_session_timeout_value())

    def process_response(self, request, response):
        """
        为防篡改植入的cookie 和session 设置过期时间
        """
        filter_url = ['/api/alarm/status/', '/api/globalscore/', '/api/netinfo/', '/api/loginfo/',
                      '/api/get_attack_map/get_watcher_info/', '/api/get_host_db_details/', '/api/logout/']
        cookie_value = request.COOKIES.get(COOKIE_NAME)
        if request.path not in filter_url and cookie_value:
            response.set_cookie(COOKIE_NAME, cookie_value, path="/", httponly=True, max_age=3600)
            re.expire("tamper_proof_session:" + cookie_value, 3600)
        return response


class CrossDomainAccess(object):
    """
    用于设置允许跨域访问
    """

    def process_response(self, request, response):
        origin = request.META.get('HTTP_ORIGIN')
        if origin:
            response["Access-Control-Allow-Origin"] = origin
        return response



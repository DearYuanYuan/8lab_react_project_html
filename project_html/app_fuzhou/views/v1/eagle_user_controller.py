import json
import datetime

from app_fuzhou.views_utils import eagle_user_service
from app_fuzhou.views_utils.eagle_user_service import User, Status

from django.http import JsonResponse, HttpResponse

CALLBACK = "callback"
JSONP_RETURN_FORMAT = "%s(%s)"
STD_TIME_FORMAT = "%Y-%m-%d %X"


def jsonp(proxy):
    """
    用于支持JSONP访问的注解
    :param proxy: 代理方法
    :return: 装饰器
    """
    def _deco(request):
        callback = request.GET.get(CALLBACK)
        if callback:
            result = proxy(request).content.decode()
            return HttpResponse(JSONP_RETURN_FORMAT % (callback, result))
        return proxy(request)
    return _deco


def timestamp_verify(proxy):
    """
    用于检查请求时间戳
    :param proxy: 代理方法
    :return:  装饰器
    """
    def _deco(request):
        import datetime

        timestamp = request.POST.get("timestamp")
        if timestamp:
            request_time = datetime.datetime.fromtimestamp(float(timestamp) / 1000)
            if request_time > datetime.datetime.now() + datetime.timedelta(minutes=-1):
                return proxy(request)
        return JsonResponse({"status": False, "msg": "Unsafe request."})
    return _deco


class UserInfoEncoder(json.JSONEncoder):
    """
    自定义的datetime类型的JSON转换其
    """
    def default(self, o):
        if isinstance(o, datetime.datetime):
            return o.strftime(STD_TIME_FORMAT)
        else:
            return super(UserInfoEncoder, self).default(o)


@jsonp
def add_user(request):
    """
    添加用户
    :param request:
    :return:
    """
    result = vars(eagle_user_service.add_user(_trans_user(request)))
    return JsonResponse(result)


@timestamp_verify
@jsonp
def update_user(request):
    """
    更新用户
    :param request:
    :return:
    """
    user = _trans_user(request)
    status_a = eagle_user_service.upload_photo(request.FILES, user.user_id)
    status_b = eagle_user_service.update_user(user)
    return JsonResponse(vars(status_a.merge(status_b)))


@jsonp
def delete_user(request):
    """
    删除用户
    :param request:
    :return:
    """
    user_id = request.GET.get("user_id")
    result = vars(eagle_user_service.delete_user(user_id))
    return JsonResponse(result)


@jsonp
def query_user(request):
    """
    获取用户信息
    :param request:
    :return:
    """
    page_num = int(request.GET.get("page_num"))
    page_size = int(request.GET.get("page_size"))
    field = request.GET.get("field")
    condition = request.GET.get("condition")

    result = eagle_user_service.query_user_page(page_num, page_size, field, condition)
    return JsonResponse(result, safe=False)


@jsonp
def get_user_list(request):
    """
    获取用户列表
    :param request:
    :return:
    """
    result = eagle_user_service.get_user_list()
    return HttpResponse(result)


@jsonp
def get_model(request):
    """
    获取用户模型
    :param request:
    :return:
    """
    username = request.GET.get("username")
    result = json.loads(eagle_user_service.get_model(username))
    user_obj = eagle_user_service.query_user_by_user_id(username)
    _t = vars(user_obj)
    if result['data'] is None:
        result['data'] ={}
    result['data']['user_info'] = _t
    result = json.dumps(result)
    return HttpResponse(result)


@jsonp
def get_model_log(request):
    """
    获取模型日志,从ES中取索引为nisalog的日志
    :param request:
    :return:
    """
    username = request.GET.get("username", '')
    if username == '':
        return HttpResponse(
            json.dumps({'code': '201', 'results': 'username is null'}))
    page = int(request.GET.get('page', 1))  # 第几页,默认第一页
    size = int(request.GET.get('pageSize', 50))  # 每页多少条,默认50条

    return eagle_user_service.get_nisalog_from_es(username, page, size)


def manual_train(request):
    """
    手动训练
    :param request:
    :return:
    """
    arg = request.POST.get("data", str({}))
    ttype = request.POST.get("ttype", "normal")
    result = eagle_user_service.manual_train(arg, ttype)
    return HttpResponse(result)


def control_centre(request):
    args = request.POST.get("data")
    result = eagle_user_service.control_centre(args)
    return HttpResponse(result)


def put_knowledge(request):
    """
    用户标记知识接口
    :param request:
    :return:
    """
    knowledges = request.POST.get("knowledge")
    result = eagle_user_service.put_knowledge(knowledges)
    return HttpResponse(result)


def _trans_user(request):
    id = request.POST.get("id", "")
    user_id = request.POST.get("user_id")
    username = request.POST.get("username")
    feature = request.POST.get("feature")
    department = request.POST.get("department")
    position = request.POST.get("position")
    email = request.POST.get("email")
    phone = request.POST.get("phone")
    photo = request.POST.get("photo")
    status = request.POST.get("status")

    return User(user_id, username, feature, department, position, email, phone, photo, status, id)

import json
import re
import redis
import random
import time
import imghdr
import base64
import datetime
from io import BytesIO
from app_fuzhou.views_utils.logger import logger
from django import forms
from django.contrib.auth import authenticate, login as user_login, logout as user_logout
# from django.contrib.auth.models import User  # 使用扩展后的User模型
from app_fuzhou.models import User
from django.contrib.auth.hashers import make_password
from django.db.models import F
from django.core.files.uploadedfile import InMemoryUploadedFile
from django.http import HttpResponse, JsonResponse
# from dwebsocket import accept_websocket, require_websocket
from app_fuzhou.views_utils.localconfig import JsonConfiguration
from app_fuzhou.views_utils.sms.sms_demo import send_sms
from app_fuzhou.apps import Response
from app_fuzhou.views_utils.InsightEye.demo import find_face, exe_search, video_find_face
from app_fuzhou.views_utils.utils_tamper_proof import delete_login_session, check_login, add_login_session

local_config = JsonConfiguration()
red = redis.Redis(local_config.redis4bigchanidb_host, local_config.redis4bigchanidb_port)

COOKIE_NAME = "tamper_proof_cookie"

jc = JsonConfiguration()

class UserForm(forms.Form):
    username = forms.CharField(label='用户名：', max_length=100)
    password = forms.CharField(label='密码：', widget=forms.PasswordInput())


# 注册
def register(request):
    response = Response()
    if local_config.enable_register == 'off':
        response.setcode('LOGIN_CLOSED')
        return HttpResponse(json.dumps(response.__dict__))
    # 注册提交
    if request.method == 'POST':
        form = UserForm(data=request.POST)  # 将数据存储在form类对象中
        if form.is_valid():  # 检验数据是否为空
            username = request.POST.get('username')  # 取出用户名数据
            password = request.POST.get('password')  # 取出密码数据
            # 首先判断用户是否已存在
            filter_result = User.objects.filter(username=username)
            if filter_result.first() == ("" or None):  # 若不存在该用户，则添加用户名密码到数据库的auth_user表中
                # 这里三个参数是固定的，必须是用户名、邮箱、密码，且顺序不能改变
                new_user = User.objects.create_user(username, "", password)
                new_user.save()
                # request.session['username'] = username  # 把用户存储在session中
            else:
                response.setcode('USER_REMAIN')
            return HttpResponse(json.dumps(response.__dict__))
        else:
            response.setcode('PARAM_INVALID')
            return HttpResponse(json.dumps(response.__dict__))
    # 其他非post请求，则访问失败
    else:
        response.setcode('WRONG_CONNECT')
        return HttpResponse(json.dumps(response.__dict__))


def user_status(request):
    """
    请求用户登录数据
    :param request:
    :return:
    """
    response = Response()
    response.setcode('SUCCESS')
    response.adddata("username", request.user.username)
    return HttpResponse(json.dumps(response.__dict__))


# 登录
def login(request):
    response = Response()
    if request.user.is_authenticated():
        # 用户已经登录
        response.setcode('USER_LOGON')
        return HttpResponse(json.dumps(response.__dict__))
    if request.method == 'POST':
        username = ""
        password = ""
        if request.POST.get('source', '') and request.POST.get('source') == "qingyun":
            username = jc.qingyun_user
            password = jc.qingyun_pwd
        else:
            username = request.POST.get('username')
            password = request.POST.get('password')
        logger.debug('username:' + username + ' password: ' + password)
        user = authenticate(username=username, password=password)  # 检验用户名密码是否存在auth_user表中
        logger.debug('auth successfully')
        if user is not None:
            if user.is_active:
                user_login(request, user)  # 登录用户
                # request.session['username'] = username
                logger.info("username login : " + username)
                return HttpResponse(json.dumps(response.__dict__))
            else:
                # 用户已被本系统禁用
                response.setcode('USER_INACTIVE')
                return HttpResponse(json.dumps(response.__dict__))
        else:
            # 用户名或者密码错误
            response.setcode('USER_LOGIN_FAIL')
            return HttpResponse(json.dumps(response.__dict__))
    else:
        # 非post访问
        response.setcode('WRONG_CONNECT')
        return HttpResponse(json.dumps(response.__dict__))


# 修改密码
def modify_password(request):
    response = Response()
    if request.method == 'POST':
        # username = request.session.get('username')
        username = request.user.username
        oldpassword = request.POST.get('password')
        newpassword = request.POST.get('newpassword')
        try:  # 首先要校验用户名是否存在
            u = User.objects.get(username__exact=username)
            res = u.check_password(oldpassword)  # 校验密码是否正确
            if res:
                u.set_password(newpassword)  # 设置新密码
                u.save()  # 保存新密码
            else:
                response.setcode('密码错误')
        except Exception as e:
            logger.error(e)
            # 返回密码错误状态
            response.setcode('密码错误')
        return HttpResponse(json.dumps(response.__dict__))


# 退出登录
def logout(request):
    response = Response()
    user_logout(request)  # 用户退出登录
    delete_login_session(request)
    http_response = HttpResponse(json.dumps(response.__dict__))
    http_response.delete_cookie(COOKIE_NAME)
    return http_response


def send_verify_code(request):
    """
    发端短信验证码
    :param request: 手机号
    :return:
    """

    if request.method == 'POST':
        # 0为注册发短信，1为登录发短信
        flag = request.POST.get('flag', '0')
        phone = request.POST.get('phone', '')

        if (not phone) or (flag not in ['0', '1', '2']):
            return JsonResponse({'code': 201, 'message': '请输入手机号码'})

        # 如果手机号以+86开头, 则删除+86来存储
        if phone.startswith('+86'):
            phone = phone[3:]

        # 对手机号码进行验证
        res = re.match(r'^1(3\d|47|5((?!4)\d)|7(0|1|[6-8])|8\d)\d{8,8}$', phone)
        if not res:
            return JsonResponse({'code': '201', 'message': '请输入合法的手机号'})

        try:
            if flag == '0':
                # 注册和开启短信验证发短信 判断手机号是否已注册
                is_user = User.objects.exclude(username=request.user.username).filter(phone=phone)
                if is_user.exists():
                    return JsonResponse({'code': 201, 'message': '该手机号已被注册'})

            if flag == '1':
                username = request.POST.get('username', '')
                # 登录发短信 手机未注册，不发短信
                is_user = User.objects.filter(username=username, phone=phone)
                if not is_user.exists():
                    return JsonResponse({'code': 201, 'message': '该手机号码未被绑定'})

        except Exception as e:
            logger.error(e)
            return JsonResponse({'code': 201, 'message': '服务器错误, 发送失败'})

        # 发短信 尝试三次
        for i in range(3):
            # params = "{\"code\":\"12345\",\"product\":\"云通信\"}"
            code = random.randint(100000, 1000000)
            params = "{\"code\":\"%s\"}" % code
            # params = u'{"name":"wqb","code":"12345678","address":"bz","phone":"13000000000"}'
            try:
                result = eval(send_sms(phone, template_param=params))
            except Exception as e:
                logger.error(e)
                return JsonResponse({'code': 201, 'message': '发送短信验证码失败'})

            if result.get('Code') == 'isv.BUSINESS_LIMIT_CONTROL':
                return JsonResponse({'code': 201, 'message': '请求过于频繁'})

            if result.get('Code') == 'OK':
                # 对印证码进行缓存5分钟
                key = phone + '_verify_code'
                red.setex(key, code, 60*5)
                return JsonResponse({'code': 200, 'message': '发送成功'})

            continue

        return JsonResponse({'code': 201, 'message': '发送短信验证码失败'})

    else:
        return JsonResponse({'code': 201, 'message': '请求方式错误'})


def verify_user_info(request):
    """
    验证用户信息 用户名是否存在和验证码是否正确
    :param request:
    :return:
    """
    if request.method == 'POST':
        flag = request.POST.get('flag', '0')
        # 检验注册用户名是否存在验证
        if flag == '0':
            # 接收参数
            username = request.POST.get('username')
            password = request.POST.get('password')
            password2 = request.POST.get('password2')
            uuid_var = request.POST.get('uuid_var', '')

            # 检验是否输入了用户名和密码
            if not all([username, password, password2]):
                return JsonResponse({'code': 201, 'message': '请输入用户名和密码'})

            # 检验用户名是否合法 数字字母下划线　必须字母开头的６－１２位
            is_standard = re.match(r'^[a-zA-Z][a-zA-Z0-9_]{5,11}$', username)
            if not is_standard:
                return JsonResponse({'code': 201, 'message': '该用户名不合法'})

            # 检验用户名是否可用
            try:
                is_user = User.objects.filter(username=username)
                if is_user.exists():
                    return JsonResponse({'code': 201, 'message': '用户名已存在'})
            except Exception as e:
                logger.error(e)
                return JsonResponse({'code': 201, 'message': '服务器错误'})

            if password != password2:
                return JsonResponse({'code': 201, 'message': '两次密码不一致'})

            # 对密码进行校验,采取一万个普通密码 因为前段传来的是sha1,所以无法判断长度
            try:
                with open('app_fuzhou/views_utils/10k_most_common_sha1.txt', 'r') as f:
                    common_passwords = f.read()
            except Exception as e:
                logger.error(e)
                common_passwords = ''

            if password in common_passwords:
                return JsonResponse({'code': 201, 'message': '密码强度不够'})

            return JsonResponse({'code': 200, 'message': '用户名可用'})

        # 如果flag为1视为注册短信验证
        if flag == '1':
            phone = request.POST.get('phone', '')
            # uuid_var = request.POST.get('uuid_var', '')
            verify_code = request.POST.get('verify_code', '')
            code, message = verify_phone_code(phone, verify_code)
            return JsonResponse({'code': code, 'message': message})

        # 如果flag为2视为登录用户名验证
        if flag == '2':
            if request.user.is_authenticated():
                # 用户已经登录
                return JsonResponse({'code': 201, 'message': '用户已登录'})
            username = request.POST.get('username')
            password = request.POST.get('password')
            try:
                user = authenticate(username=username, password=password)  # 检验用户名密码是否存在auth_user表中
                if user is not None:
                    return JsonResponse({'code': 200, 'message': '验证成功', 'flag': user.flag})
            except Exception as e:
                logger.error(e)
            return JsonResponse({'code': 201, 'message': '用户名或密码错误'})
    else:
        return JsonResponse({'code': 201, 'message': '请求方式错误'})


def verify_phone_code(phone, verify_code):
    """
    校验短信验证码
    :param phone:
    :param verify_code:
    :return:
    """
    if not all([phone, verify_code]):
        return 201, '信息不全'

    # 如果手机号以+86开头, 则删除+86来存储
    if phone.startswith('+86'):
        phone = phone[3:]

    # 对手机号码进行验证
    res = re.match(r'^1(3\d|47|5((?!4)\d)|7(0|1|[6-8])|8\d)\d{8,8}$', phone)
    if not res:
        return 201, '请输入合法的手机号'

    verify_key = phone + '_verify_code'

    try:
        send_verify = red.get(verify_key).decode()  # 获取发送的验证码
    except Exception as e:
        logger.error(e)
        return 201, '服务器错误, 验证失败'

    if not send_verify:
        return 201, '验证码已过期'

    if send_verify == verify_code:
        # 将验证结果缓存
        try:
            red.setex(phone+'_phone_success', phone, 5*60)
        except Exception as e:
            logger.error(e)
        return 200, '短信验证成功'
    return 201, '验证失败'


def face_recognition(request):

    """
    进行人脸识别注册
    :param request:
    :return:
    """
    import uwsgi
    uwsgi.websocket_handshake()
    # 设置开始时间，如果60秒没有识别，断开socket连接
    begin = datetime.datetime.now()
    count = 0
    while True:
        message = uwsgi.websocket_recv()
        # 判断是否超时
        if (datetime.datetime.now() - begin).seconds > 60:
            print('人脸识别超时......')
            uwsgi.websocket_send('202'.encode())
            break

        # 如果有消息
        if message:
            try:
                # 将字节转为字符串
                params = message.decode()

                # 分割接收到的数据 分割方式和前端商榷好为 :#:
                params_list = params.split(':#:')
                if len(params_list) == 2:
                    img_b64_data = params_list[0][(params_list[0]).find('base64,')+7:]  # 截取图片base64编码
                    uuid_var = params_list[1]

                    # 将img_bin_data base64解码
                    img_bin_data = base64.b64decode(img_b64_data)
                    # 判断是否是图片，如果不是
                    if (not imghdr.what(None, img_bin_data)) or (not uuid_var):
                        continue

                    key = uuid_var + 'person'
                    # 判断是否已经识别成功
                    res = red.get(key)
                    if res:
                        uwsgi.websocket_send('200'.encode())
                        time.sleep(0.1)
                        break

                    # 将图片二进制转为image object
                    f = BytesIO()
                    f.write(img_bin_data)
                    img = InMemoryUploadedFile(f, None, 'username', None, len(img_bin_data), None, None)

                    # 先进行人脸检测　是否已存在 检测１０次
                    if count < 10:

                        name = exe_search(img)
                        print('第%s次人脸检查' % count)

                        # 说明已经存在人脸
                        if name:
                            if name[0] != 'Unknow':
                                print('注册人脸已存在---%s' % count)
                                uwsgi.websocket_send('201'.encode())  # 发送消息到客户端
                                time.sleep(0.1)
                                break
                            else:
                                count += 1
                                continue
                        else:
                            count += 1
                            continue

                    # 进行人脸识别
                    person = find_face(img, 'username')

                    # 识别成功
                    if person.encoded_face:
                        if len(person.encoded_face) == 1:
                            # 对数据person进行缓存
                            encoded_face = [list(person.encoded_face[0])]
                            encoded_face = json.dumps(encoded_face)
                            red.setex(key, encoded_face, 60 * 5)
                            uwsgi.websocket_send('200'.encode())  # 发送消息到客户端
                            time.sleep(0.1)
                            break
                    else:
                        uwsgi.websocket_send('请保持镜头内有一张人脸'.encode())  # 发送消息到客户端
            except Exception as e:
                logger.error(e)


# @accept_websocket
# def face_recognition(request):
#     """
#     进行人脸识别注册
#     :param request:
#     :return:
#     """
#     # 判断是否为websocket连接
#     if request.is_websocket():
#         # 设置开始时间，如果20秒没有识别，断开socket连接
#         begin = datetime.datetime.now()
#         count = 0
#         for message in request.websocket:
#             # 判断是否超时
#             if (datetime.datetime.now() - begin).seconds > 60:
#                 request.websocket.close()
#                 break
#
#             # 如果有消息
#             if message:
#                 try:
#                     # 将字节转为字符串
#                     params = message.decode()
#
#                     # 分割接收到的数据 分割方式和前端商榷好为 :#:
#                     params_list = params.split(':#:')
#                     if len(params_list) == 2:
#                         img_b64_data = params_list[0][(params_list[0]).find('base64,')+7:]  # 截取图片base64编码
#                         uuid_var = params_list[1]
#
#                         # 将img_bin_data base64解码
#                         img_bin_data = base64.b64decode(img_b64_data)
#                         # 判断是否是图片，如果不是
#                         if (not imghdr.what(None, img_bin_data)) or (not uuid_var):
#                             continue
#
#                         key = uuid_var + 'person'
#                         # 判断是否已经识别成功
#                         res = red.get(key)
#                         if res:
#                             request.websocket.send('200'.encode())
#                             time.sleep(0.1)
#                             request.websocket.close()
#                             break
#
#                         # 将图片二进制转为image object
#                         f = BytesIO()
#                         f.write(img_bin_data)
#                         img = InMemoryUploadedFile(f, None, 'username', None, len(img_bin_data), None, None)
#
#                         # 先进行人脸检测　是否已存在 检测１０次
#                         if count < 10:
#
#                             name = exe_search(img)
#                             print('第%s次人脸检查' % count)
#
#                             # 说明已经存在人脸
#                             if name:
#                                 if name[0] != 'Unknow':
#                                     print('注册人脸已存在---%s' % count)
#                                     request.websocket.send('201'.encode())  # 发送消息到客户端
#                                     request.websocket.close()
#                                     break
#                                 else:
#                                     count += 1
#                                     continue
#                             else:
#                                 count += 1
#                                 continue
#
#                         # 进行人脸识别
#                         person = find_face(img, 'username')
#
#                         # 识别成功
#                         if person.encoded_face:
#                             if len(person.encoded_face) == 1:
#                                 # 对数据person进行缓存
#                                 encoded_face = [list(person.encoded_face[0])]
#                                 encoded_face = json.dumps(encoded_face)
#                                 red.setex(key, encoded_face, 60 * 5)
#                                 request.websocket.send('200'.encode())  # 发送消息到客户端
#                                 time.sleep(0.1)
#                                 request.websocket.close()
#                                 break
#                         else:
#                             request.websocket.send('请保持镜头内有一张人脸'.encode())  # 发送消息到客户端
#                 except Exception as e:
#                     logger.error(e)
#
#     else:
#         return JsonResponse({'code': 201, 'message': '请求错误'})


# 新注册
def new_register(request):
    """
    根据用户名 密码 短信验证码 手机号码 人脸识别注册用户 人脸识别的person参数从redis区
    :param request: username password password2 uuid_num
    :return:
    """

    if local_config.enable_register == 'off':
        return JsonResponse({'code': 201, 'message': '注册通道已关闭'})

    # 注册提交
    if request.method == 'POST':

        # 接收参数
        username = request.POST.get('username')
        password = request.POST.get('password')
        password2 = request.POST.get('password2')
        verify_code = request.POST.get('verify_code')
        phone = request.POST.get('phone', '')
        uuid_var = request.POST.get('uuid_var', '')

        # 构建redis中验证码和人脸识别参数的key值
        verify_key = phone + '_verify_code'  # 验证码
        person_key = uuid_var + 'person'  # 人脸识别参数

        # 参数校验
        if not all([username, password, password2, verify_code, phone, uuid_var]):
            return JsonResponse({'code': 201, 'message': '信息不完整'})

        if password != password2:
            return JsonResponse({'code': 201, 'message': '两次密码不一致'})

        try:
            if red.get(verify_key) and red.get(person_key):
                send_verify = red.get(verify_key).decode()  # 获取发送的验证码
                person = eval(red.get(person_key))  # 获取人脸识别参数
            else:
                return JsonResponse({'code': 201, 'message': '验证码或面部识别已失效'})
        except Exception as e:
            logger.error(e)
            return JsonResponse({'code': 201, 'message': '验证码或面部识别已失效'})

        if not all([send_verify, person]):
            return JsonResponse({'code': 201, 'message': '验证信息已过期, 请重新注册'})

        # 暂时在这里验证，以后要改到点击下一步时进行验证
        if verify_code != send_verify:
            return JsonResponse({'code': 201, 'message': '请输入正确的短信验证码'})

        # 检验用户是否已注册
        try:
            is_user = User.objects.filter(username=username)
            if is_user.exists():
                return JsonResponse({'code': 201, 'message': '用户名已存在'})

            # 进行注册 明文转密文
            password = make_password(password)
            User.objects.create(username=username, password=password, phone=phone, faces=person, flag=0)
            # 注册成功后删除数据缓存
            red.delete(verify_key, person_key)
        except Exception as e:
            logger.error(e)
            return JsonResponse({'code': 201, 'message': '服务器错误, 注册失败'})
        return JsonResponse({'code': 200, 'message': '注册成功'})

    # 其他非post请求，则访问失败
    else:
        return JsonResponse({'code': 201, 'message': '请求方式错误'})


# 新登录
def new_login(request):
    if request.user.is_authenticated():
        # 用户已经登录
        return JsonResponse({'code': 201, 'message': '用户已登录'})

    if request.method == 'POST':
        username = ""
        password = ""
        if request.POST.get('source', '') and request.POST.get('source') == "qingyun":
            username = jc.qingyun_user
            password = jc.qingyun_pwd
        else:
            username = request.POST.get('username')
            password = request.POST.get('password')
        logger.debug('username:' + username + ' password: ' + password)
        user = authenticate(username=username, password=password)  # 检验用户名密码是否存在auth_user表中
        logger.debug('auth successfully')
        if user is not None:
            if user.is_active:
                # 验证
                # 如果flag=0，则默认直接登录
                if user.flag == 0:
                    user_login(request, user)  # 登录用户
                    # request.session['username'] = username
                    cookie = add_login_session(user)
                    json_response = JsonResponse({'code': 200, 'message': '登陆成功'})
                    json_response.set_cookie(COOKIE_NAME, cookie, path="/", httponly=True, max_age=3600)

                    logger.info("username login : " + username)
                    return json_response

                # 如果flag=1，则增加短信验证
                elif user.flag == 1:
                    phone = request.POST.get('phone', '')
                    verify_code = request.POST.get('verify', '')
                    try:
                        send_code = red.get(phone+'_verify_code')
                        if send_code:
                            send_code = send_code.decode()
                            if verify_code == send_code:
                                # 验证成功，可登陆
                                user_login(request, user)  # 登录用户
                                # request.session['username'] = username
                                cookie = add_login_session(user)
                                logger.info("username login : " + username)
                                # 登陆成功后删除验证码缓存和验证码成功与否缓存
                                red.delete(phone+'_phone_success', phone+'_verify_code')
                                json_response = JsonResponse({'code': 200, 'message': '登陆成功'})
                                json_response.set_cookie(COOKIE_NAME, cookie, path="/", httponly=True, max_age=3600)
                                return json_response
                        return JsonResponse({'code': 201, 'message': '验证码错误'})
                    except Exception as e:
                        logger.error(e)
                        return JsonResponse({'code': 201, 'message': '登录失败'})

                # 如果flag=2，则增加人脸识别
                elif user.flag == 2:
                    try:
                        face_is_success = red.get(username+'_face_success')
                        if face_is_success:
                            # 验证成功，可登陆
                            user_login(request, user)  # 登录用户
                            # request.session['username'] = username
                            logger.info("username login : " + username)
                            # 登陆成功后删除缓存
                            red.delete(username+'_face_success')
                            cookie = add_login_session(user)
                            json_response = JsonResponse({'code': 200, 'message': '登陆成功'})
                            json_response.set_cookie(COOKIE_NAME, cookie, path="/", httponly=True, max_age=3600)
                            return json_response
                        else:
                            return JsonResponse({'code': 201, 'message': '面部识别已失效'})
                    except Exception as e:
                        logger.error(e)
                        return JsonResponse({'code': 201, 'message': '登录失败'})

                # 如果flag=3，则全认证
                elif user.flag == 3:
                    # 验证短信
                    phone = request.POST.get('phone', '')
                    try:
                        phone_is_success = red.get(phone + '_phone_success')
                        face_is_success = red.get(username + '_face_success')
                        if phone_is_success and face_is_success:
                            # 验证成功，可登陆
                            user_login(request, user)  # 登录用户
                            # request.session['username'] = username
                            logger.info("username login : " + username)
                            # 登陆成功后删除缓存
                            red.delete(username + '_face_success', phone + '_phone_success')

                            cookie = add_login_session(user)
                            json_response = JsonResponse({'code': 200, 'message': '登陆成功'})
                            json_response.set_cookie(COOKIE_NAME, cookie, path="/", httponly=True, max_age=3600)
                            return json_response
                        else:
                            return JsonResponse({'code': 201, 'message': '短信或面部识别已失效'})
                    except Exception as e:
                        logger.error(e)
                        return JsonResponse({'code': 201, 'message': '登录失败'})
            else:
                # 用户已被本系统禁用
                return JsonResponse({'code': 201, 'message': '用户未激活'})
        else:
            # 用户名或者密码错误
            return JsonResponse({'code': 201, 'message': '用户名或密码错误'})
    else:
        # 非post访问
        return JsonResponse({'code': 201, 'message': '请求方式错误'})


def face_search(request):
    """
    进行人脸识别登录
    :param request:
    :return:
    """
    import uwsgi
    uwsgi.websocket_handshake()
    # 设置开始时间，如果60秒没有识别，断开socket连接
    begin = datetime.datetime.now()
    while True:
        message = uwsgi.websocket_recv()
        print('人脸识别登录....................................................')
        # 判断是否超时
        if (datetime.datetime.now() - begin).seconds > 60:
            print('人脸识别超时......')
            uwsgi.websocket_send('202'.encode())
            break

        # 如果有消息
        if message:
            try:
                # 将字节转为字符串
                params = message.decode()

                # 分割接收到的数据 分割方式和前端商榷好为 :#:
                params_list = params.split(':#:')
                if len(params_list) == 2:
                    img_b64_data = params_list[0][(params_list[0]).find('base64,') + 7:]  # 截取图片base64编码
                    request_username = params_list[1]

                    # 将img_bin_data base64解码
                    img_bin_data = base64.b64decode(img_b64_data)
                    # 判断是否是图片，如果不是
                    if not imghdr.what(None, img_bin_data):
                        continue

                    # 将图片二进制转为image object
                    f = BytesIO()
                    f.write(img_bin_data)
                    img = InMemoryUploadedFile(f, None, 'username', None, len(img_bin_data), None, None)
                    # 进行人脸识别
                    name = exe_search(img)
                    print('username: ', name)

                    # 如果有名字
                    if name:
                        if (len(name) != 1) or (name[0] == 'Unknow'):
                            continue

                        # 根据name获取用户user对象
                        username = name[0]
                        user = User.objects.filter(username=username)
                        if user.count() == 1:
                            if user[0].username == request_username:
                                # 将结果缓存到redis
                                red.setex(username+'_face_success', 200, 60*5)
                                uwsgi.websocket_send('200'.encode())  # 发送消息到客户端
                                time.sleep(0.1)
                                break
                            else:
                                uwsgi.websocket_send('203'.encode())  # 发送消息到客户端
                                time.sleep(0.1)
                                break
                    else:
                        # []
                        continue

            except Exception as e:
                logger.error(e)
                continue


# @accept_websocket
# def face_search(request):
#     """
#     进行人脸识别登录
#     :param request:
#     :return:
#     """
#     # 判断是否为websocket连接
#     if request.is_websocket():
#         # 设置开始时间，如果60秒没有识别，断开socket连接
#         begin = datetime.datetime.now()
#         for message in request.websocket:
#             print('人脸识别登录....................................................')
#             # 判断是否超时
#             if (datetime.datetime.now() - begin).seconds > 60:
#                 print('人脸识别超时......')
#                 request.websocket.close()
#                 break
#
#             # 如果有消息
#             if message:
#                 try:
#                     # 将字节转为字符串
#                     params = message.decode()
#
#                     # 分割接收到的数据 分割方式和前端商榷好为 :#:
#                     params_list = params.split(':#:')
#                     if len(params_list) == 2:
#                         img_b64_data = params_list[0][(params_list[0]).find('base64,') + 7:]  # 截取图片base64编码
#                         request_username = params_list[1]
#
#                         # 将img_bin_data base64解码
#                         img_bin_data = base64.b64decode(img_b64_data)
#                         # 判断是否是图片，如果不是
#                         if not imghdr.what(None, img_bin_data):
#                             continue
#
#                         # 将图片二进制转为image object
#                         f = BytesIO()
#                         f.write(img_bin_data)
#                         img = InMemoryUploadedFile(f, None, 'username', None, len(img_bin_data), None, None)
#                         # 进行人脸识别
#                         name = exe_search(img)
#                         print('username: ', name)
#
#                         # 如果有名字
#                         if name:
#                             if (len(name) != 1) or (name[0] == 'Unknow'):
#                                 continue
#
#                             # 根据name获取用户user对象
#                             username = name[0]
#                             user = User.objects.filter(username=username)
#                             if user.count() == 1:
#                                 if user[0].username == request_username:
#                                     # 将结果缓存到redis
#                                     red.setex(username+'_face_success', 200, 60*5)
#                                     request.websocket.send('200'.encode())  # 发送消息到客户端
#                                     time.sleep(0.1)
#                                     request.websocket.close()
#                                     break
#                         else:
#                             # []
#                             continue
#
#                 except Exception as e:
#                     logger.error(e)
#                     continue
#     else:
#         return JsonResponse({'code': 201, 'message': '请求错误'})


def start_stop_verify(request):
    """
    开启或停止验证功能
    :param request:
    :return:
    """
    if request.method == 'POST':
        username = request.POST.get('username', '')
        password = request.POST.get('password', '')
        flag = request.POST.get('flag', '')
        input_user = authenticate(username=username, password=password)
        if request.user == input_user:
            try:
                if 0 <= User.objects.filter(username=username)[0].flag <= 3:

                    if flag == '0':
                        # 停用phone验证
                        if User.objects.filter(username=username)[0].flag in [1, 3]:
                            User.objects.filter(username=username).update(flag=(F('flag') - 1))
                            return JsonResponse({'code': 200, 'message': 'OK'})

                    elif flag == '1':
                        # 停用人脸识别
                        if User.objects.filter(username=username)[0].flag in [2, 3]:
                            User.objects.filter(username=username).update(flag=(F('flag') - 2))
                            return JsonResponse({'code': 200, 'message': 'OK'})

                    elif flag == '2':
                        # 启动手机验证
                        if User.objects.filter(username=username)[0].flag in [0, 2]:
                            # 对验证码进行校验
                            phone = request.POST.get('phone', '')
                            verify_code = request.POST.get('verify_code', '')
                            verify_key = phone + '_verify_code'
                            send_verify = red.get(verify_key).decode()  # 获取发送的验证码
                            if send_verify and (verify_code == send_verify):
                                # 验证码正确　更改数据库
                                User.objects.filter(username=username).update(phone=phone, flag=(F('flag') + 1))
                                red.delete(verify_key)
                                return JsonResponse({'code': 200, 'message': '启动成功'})

                    elif flag == '3':
                        # 启用人脸验证
                        if User.objects.filter(username=username)[0].flag in [0, 1]:
                            # 获取redis里存储的人脸数据
                            uuid = request.POST.get('uuid', '')
                            # 先从redis获取面部信息 再保存到mysql
                            person = red.get(uuid + 'person')
                            if person:
                                person = eval(red.get(uuid + 'person'))  # 获取人脸识别参数
                                if person:
                                    User.objects.filter(username=username).update(faces=person, flag=(F('flag') + 2))
                                    # 注册成功后删除数据缓存
                                    red.delete(uuid + 'person')
                                    return JsonResponse({'code': 200, 'message': 'OK'})
            except Exception as e:
                logger.error(e)
            # 出错或flag参数不合法
            return JsonResponse({'code': 201, 'message': '操作失败'})

        # 不是当前用户的用户名和密码
        else:
            return JsonResponse({'code': 201, 'message': '用户名或密码错误'})

    else:
        # 非post访问
        return JsonResponse({'code': 201, 'message': '请求方式错误'})


def change_face_recognition(request):
    """
    进行人脸识别更改
    :param request:
    :return:
    """
    # 设置开始时间，如果20秒没有识别，断开socket连接
    import uwsgi
    uwsgi.websocket_handshake()
    # 设置开始时间，如果60秒没有识别，断开socket连接
    begin = datetime.datetime.now()
    count = 0
    while True:
        message = uwsgi.websocket_recv()
        # 判断是否超时
        if (datetime.datetime.now() - begin).seconds > 60:
            print('人脸识别超时......')
            uwsgi.websocket_send('202'.encode())
            break

        # 如果有消息
        if message:
            try:
                # 将字节转为字符串
                params = message.decode()

                # 分割接收到的数据 分割方式和前端商榷好为 :#:
                params_list = params.split(':#:')
                if len(params_list) == 2:
                    img_b64_data = params_list[0][(params_list[0]).find('base64,')+7:]  # 截取图片base64编码
                    uuid_var = params_list[1]

                    # 将img_bin_data base64解码
                    img_bin_data = base64.b64decode(img_b64_data)
                    # 判断是否是图片，如果不是
                    if (not imghdr.what(None, img_bin_data)) or (not uuid_var):
                        continue

                    key = uuid_var + 'person'
                    # 判断是否已经识别成功
                    res = red.get(key)
                    if res:
                        uwsgi.websocket_send('200'.encode())
                        time.sleep(0.1)
                        break

                    # 将图片二进制转为image object
                    f = BytesIO()
                    f.write(img_bin_data)
                    img = InMemoryUploadedFile(f, None, 'username', None, len(img_bin_data), None, None)

                    # 先进行人脸检测　是否已存在 检测１０次
                    if count < 10:

                        name = exe_search(img)
                        print('第%s次人脸检查' % count, name)

                        # 说明已经存在人脸
                        if name:
                            if name[0] != 'Unknow':
                                # 判断人脸和现在的是否一样　如果一样可以注册
                                if name[0] == request.user.username:
                                    # 注册：
                                    count = 10
                                    continue
                                # 别的账号已经用了这张脸
                                else:
                                    uwsgi.websocket_send('201'.encode())  # 发送消息到客户端
                                    break
                            else:
                                count += 1
                                continue
                        else:
                            count += 1
                            continue

                    # 进行人脸识别
                    person = find_face(img, 'username')

                    # 识别成功
                    if person.encoded_face:
                        if len(person.encoded_face) == 1:
                            # 对数据person进行缓存
                            encoded_face = [list(person.encoded_face[0])]
                            encoded_face = json.dumps(encoded_face)
                            red.setex(key, encoded_face, 60 * 5)
                            uwsgi.websocket_send('200'.encode())  # 发送消息到客户端
                            time.sleep(0.1)
                            break
                    else:
                        uwsgi.websocket_send('请保持镜头内有一张人脸'.encode())  # 发送消息到客户端
            except Exception as e:
                logger.error(e)



# @accept_websocket
# def change_face_recognition(request):
#     """
#     进行人脸识别更改
#     :param request:
#     :return:
#     """
#     # 判断是否为websocket连接
#     if request.is_websocket():
#         # 设置开始时间，如果20秒没有识别，断开socket连接
#         begin = datetime.datetime.now()
#         count = 0
#         for message in request.websocket:
#             # 判断是否超时
#             if (datetime.datetime.now() - begin).seconds > 60:
#                 request.websocket.close()
#                 break
#
#             # 如果有消息
#             if message:
#                 try:
#                     # 将字节转为字符串
#                     params = message.decode()
#
#                     # 分割接收到的数据 分割方式和前端商榷好为 :#:
#                     params_list = params.split(':#:')
#                     if len(params_list) == 2:
#                         img_b64_data = params_list[0][(params_list[0]).find('base64,')+7:]  # 截取图片base64编码
#                         uuid_var = params_list[1]
#
#                         # 将img_bin_data base64解码
#                         img_bin_data = base64.b64decode(img_b64_data)
#                         # 判断是否是图片，如果不是
#                         if (not imghdr.what(None, img_bin_data)) or (not uuid_var):
#                             continue
#
#                         key = uuid_var + 'person'
#                         # 判断是否已经识别成功
#                         res = red.get(key)
#                         if res:
#                             request.websocket.send('200'.encode())
#                             time.sleep(0.1)
#                             request.websocket.close()
#                             break
#
#                         # 将图片二进制转为image object
#                         f = BytesIO()
#                         f.write(img_bin_data)
#                         img = InMemoryUploadedFile(f, None, 'username', None, len(img_bin_data), None, None)
#
#                         # 先进行人脸检测　是否已存在 检测１０次
#                         if count < 10:
#
#                             name = exe_search(img)
#                             print('第%s次人脸检查' % count, name)
#
#                             # 说明已经存在人脸
#                             if name:
#                                 if name[0] != 'Unknow':
#                                     # 判断人脸和现在的是否一样　如果一样可以注册
#                                     if name[0] == request.user.username:
#                                         # 注册：
#                                         count = 10
#                                         continue
#                                     # 别的账号已经用了这张脸
#                                     else:
#                                         request.websocket.send('201'.encode())  # 发送消息到客户端
#                                         request.websocket.close()
#                                         break
#                                 else:
#                                     count += 1
#                                     continue
#                             else:
#                                 count += 1
#                                 continue
#
#                         # 进行人脸识别
#                         person = find_face(img, 'username')
#
#                         # 识别成功
#                         if person.encoded_face:
#                             if len(person.encoded_face) == 1:
#                                 # 对数据person进行缓存
#                                 encoded_face = [list(person.encoded_face[0])]
#                                 encoded_face = json.dumps(encoded_face)
#                                 red.setex(key, encoded_face, 60 * 5)
#                                 request.websocket.send('200'.encode())  # 发送消息到客户端
#                                 time.sleep(0.1)
#                                 request.websocket.close()
#                                 break
#                         else:
#                             request.websocket.send('请保持镜头内有一张人脸'.encode())  # 发送消息到客户端
#                 except Exception as e:
#                     logger.error(e)
#
#     else:
#         return JsonResponse({'code': 201, 'message': '请求错误'})


def check_tamper_proof_login(request):
    """
    判断用户是否登录
    :param request:
    :return:
    """
    cookie = request.POST.get("cookie", "")
    res = check_login(cookie)
    if res:
        return JsonResponse({'status': 1, 'message': '用户已登录'})
    return JsonResponse({'status': 0, 'message': '用户未登录'})


# def ws_test(request):
#     import uwsgi
#     uwsgi.websocket_handshake()
#     while True:
#         msg = uwsgi.websocket_recv()
#         uwsgi.websocket_send(msg)

# def find_faces(time_range):
#     # 可信计算的接口
#     face_counts = 0  # 一段时间内, 镜头里的最大人数
#     people_list = []  # 一段时间内, 识别出的所有面部数据
#     try:
#         # 不管有几个'Unknow', 'Unknow'作为一个人
#         face_counts, face_list = video_find_face(time_range)
#         people_list = list(set(face_list))
#         # 几个人有图片中最多的面部数来定, 即使两个人,但是轮流出现在镜头上,但是每次镜头前只有一个人,也算一个人
#     except Exception as e:
#         logger.error(e)
#     return face_counts, people_list












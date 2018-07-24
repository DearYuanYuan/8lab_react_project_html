# encoding: utf-8
import json
import os
import uuid
from app_fuzhou.apps import Response
from django.http import HttpResponse, JsonResponse
from app_fuzhou.views_utils.logger import logger
from octastack_fuzhou_web.settings import MEDIA_ROOT

UPLOAD_FILE_PATH = MEDIA_ROOT
if not os.path.exists(UPLOAD_FILE_PATH):
    os.makedirs(UPLOAD_FILE_PATH)


def upload_file(request):
    response = Response()
    length = len(request.FILES)
    if length > 0:
        logger.info(length)
        try:
            reqfile = request.FILES['filename']
            # 生成随机字符串加后缀的文件名
            handle_upload(reqfile)
        except Exception as e:
            logger.error(e)
    else:
        logger.error("no files")
    return HttpResponse(json.dumps(response.__dict__))


def handle_upload(reqfile, dir=""):
    """
    处理文件上传
    :param reqfile: 请求上传的文件
    :param dir: 保存的目录名，作为/8lab/upload/的子目录
    :return: 文件名
    """
    if not os.path.exists(UPLOAD_FILE_PATH):
        os.makedirs(UPLOAD_FILE_PATH)
    dir = os.path.join(UPLOAD_FILE_PATH, dir)
    if not os.path.exists(dir):
        os.makedirs(dir)
    filetype = reqfile.name.split(".")[-1]
    filename = str(uuid.uuid1()) + '.' + filetype
    dest_file_path = os.path.join(dir, filename)
    logger.debug(dest_file_path)
    try:
        with open(dest_file_path, 'wb+') as destination:  # 打开特定的文件进行二进制的写操作
            for chunk in reqfile.chunks():  # 分块写入文件
                destination.write(chunk)
        logger.info(filename)
        return filename
    except Exception as e:
        logger.error(e)

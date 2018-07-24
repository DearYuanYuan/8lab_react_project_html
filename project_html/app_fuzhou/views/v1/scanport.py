import json

from django.http import HttpResponse

from app_fuzhou import Blackbox_ScanPort
from app_fuzhou.views_utils.localconfig import JsonConfiguration

DEFAULT_HOST = "127.0.0.1"
TYPE = "scan_port"
CONFIG = JsonConfiguration()


# 设置端口扫描的配置
def set_scanport_config(request):
    host_ip = request.POST.get("host_ip", DEFAULT_HOST)
    config = request.POST.get("config", "{}")
    flag = Blackbox_ScanPort.set_scanport_config(host_ip, config)
    return HttpResponse(json.dumps({"flag": flag}))


# 获取端口扫描的配置
def get_scanport_config(request):
    host_ip = request.POST.get("host_ip", DEFAULT_HOST)
    return HttpResponse(Blackbox_ScanPort.get_scanport_config(host_ip))


# 扫描所有主机的端口
def scan_port_all(request):
    host_ip = request.POST.get("host_ip", DEFAULT_HOST)
    return Blackbox_ScanPort.scan_port_all(host_ip)

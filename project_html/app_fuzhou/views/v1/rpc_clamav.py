from django.http.response import HttpResponse

from app_fuzhou.views_utils.rpc.clamav.clamav_rpc_client import ClamavRPCClient

SERVER_ADDR_IDX = 'server_addr'


def fresh_clam(request):
    server_addr = request.GET[SERVER_ADDR_IDX]
    client = ClientFactory.get_client(server_addr)
    client.freshClam()
    client.close()
    return HttpResponse("ok")


def clam_scan(request):
    server_addr = request.GET[SERVER_ADDR_IDX]
    #scan_path = ["/home/jingqingyun"]
    client = ClientFactory.get_client(server_addr)
    client.clamScan()
    client.close()
    return HttpResponse("ok")


def stop_scan(request):
    server_addr = request.GET[SERVER_ADDR_IDX]
    client = ClientFactory.get_client(server_addr)
    client.stopScan()
    client.close()
    return HttpResponse("ok")


def suspend_scan(request):
    server_addr = request.GET[SERVER_ADDR_IDX]
    client = ClientFactory.get_client(server_addr)
    client.suspendScan()
    client.close()
    return HttpResponse("ok")


def resume_scan(request):
    server_addr = request.GET[SERVER_ADDR_IDX]
    client = ClientFactory.get_client(server_addr)
    client.resumeScan()
    client.close()
    return HttpResponse("ok")


class ClientFactory(object):
    """
    用于获取RPC Client
    """
    @staticmethod
    def get_client(invoke_addr):
        """
        获取新的Client
        :param invoke_addr: 目的RPC服务器地址
        :return: RPC Client
        """
        return ClamavRPCClient(invoke_addr)

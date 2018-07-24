import pyclamd


class ClamdScanner(object):
    """
    调用Clamav-daemon进行扫描接口
    """
    def __init__(self):
        self.socket = pyclamd.ClamdUnixSocket()

    def contscan_file(self, file):
        """
        扫描单个文件
        :param file: 文件绝对路径
        :return:
            异常文件信息, {filename1: (‘FOUND‘, ‘virusname’), filename2: (‘ERROR‘, ‘reason’)}
            如果没有异常文件就返回None
        """
        return self.socket.contscan_file(file)

    def contscan_files(self, files):
        """
        扫描文件列表
        :param files: 文件列表
        :return: 以字典形式返回异常文件信息
        """
        result = dict()
        for file in files:
            ret = self.contscan_file(file)
            if ret is not None:
                result.update(ret)
        return result

    def multiscan_file(self, file):
        """
        以多线程方式扫描文件
        :param file: 文件绝对路径
        :return: 以字典形式返回异常文件信息
        """
        return self.multiscan_file(file)

    def multiscan_files(self, files):
        """
        以多线程方式扫描文件
        :param files: 文件列表
        :return: 以字典形式返回异常文件信息
        """
        result = dict()
        for file in files:
            ret = self.multiscan_file(file)
            if ret is not None:
                result.update(ret)
        return result

    def shutdown(self):
        """
        终止clamav-daemon
        :return: None
        """
        self.socket.shutdown()

    def stats(self):
        """
        clamav-daemon统计
        :return: 统计信息
        """
        return self.socket.stats()

    def reload(self):
        """
        重新加载病毒数据库
        :return: None
        """
        self.socket.reload()

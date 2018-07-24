from multiprocessing import Process

from app_fuzhou.views_utils.scanner import email
from app_fuzhou.views_utils.logger import logger
from app_fuzhou.views.v1 import scanport
from app_fuzhou.views.v1 import clamav


class Scanner(Process):
    SUBJECT = "八分量可信修复报告"

    def __init__(self, request):
        super(Process, self).__init__()
        self.request = request
        self.name = "Scanner Thread"

    def run(self):
        try:
            text = ""
            text += self.clamav_report(clamav.scan_path(self.request))
            text += self.scan_port_resport(scanport.scan_port_all(self.request))
            email.send_simple_email(self.SUBJECT, text)
        except Exception as e:
            logger.error(e)

    @classmethod
    def notify_user_email(cls, result):
        cls.clamav_report(result)

    @classmethod
    def clamav_report(cls, result):
        html = "<h1>文件扫描报告</h1>"
        for k, v in result.items():
            html += "<p>%s: %s</p>" % (k, v)
        return html

    @classmethod
    def scan_port_resport(cls, result):
        html = ""
        for k, v in result.items():
            html += "<p>%s: %s</p>" % (k, v)  # TODO
        return html

import smtplib

from email.header import Header
from email.mime.text import MIMEText

from app_fuzhou.views_utils.logger import logger
from app_fuzhou.views_utils.EmailConfig import EmailConfiguration

CONFIG = EmailConfiguration()


def send_email(host, port, sender, receiver, password, subject, text):
    email = MIMEText(text, "html", "utf-8")
    email['subject'] = Header(subject, "utf-8")
    email['from'] = Header(sender, "utf-8")
    email['to'] = Header(receiver, "utf-8")

    try:
        with smtplib.SMTP() as smtp_obj:
            smtp_obj.connect(host, port)
            smtp_obj.login(sender, password)
            smtp_obj.sendmail(sender, receiver, email.as_string())
            smtp_obj.quit()
    except Exception as e:
        logger.error(e)


def send_simple_email(subject, text):
    host = CONFIG.get('email_host')
    port = CONFIG.get('email_port')
    sender = CONFIG.get('email_from')
    password = CONFIG.get('from_passwd')
    receiver = CONFIG.get('email_to')

    send_email(host, port, sender, receiver, password, subject, text)

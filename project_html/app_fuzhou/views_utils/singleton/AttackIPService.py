from app_fuzhou.views_utils.service.attack_ip_server import recv_attack_ip


class AttackIPServiceSingleton(object):
    instance = None

    def __new__(cls):
        if cls.instance is None:
            cls.instance = super(AttackIPServiceSingleton, cls).__new__(cls)
            recv_attack_ip()
        return cls.instance

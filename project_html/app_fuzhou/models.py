# Create your models here.
from django.db import models
from django.contrib.auth.models import AbstractUser


class User(AbstractUser):
    # 扩展系统自带的User
    phone = models.CharField(max_length=255, null=True, unique=True)
    faces = models.TextField(null=True)
    # 用户名值为0  短信值为1  人脸识别值为2
    # 所以默认0  加短信0+1  加人脸0+2  全部0+1+2
    flag = models.IntegerField(default=0)

    class Meta:
        db_table = 'auth_user'


class TrustLog(models.Model):
    # 在没有设置主键primary_key=True的情况下，django会默认添加一个id字段，并且这个字段是整数自增性的
    # 即默认一个id字段
    level = models.TextField()
    time = models.CharField(max_length=19)
    content = models.CharField(max_length=3072)
    host = models.CharField(max_length=64)
    ip = models.GenericIPAddressField()
    filename = models.CharField(max_length=128)
    state = models.IntegerField(db_index=True)  # 0 表示未确认, 1 表示已确认
    #hackip = models.CharField(max_length=15)
    #hostusername = models.CharField(max_length=64)

    class Meta:
        db_table = 'app_fuzhou_trustlog'


class Alarm(models.Model):
    # 默认主键:id自增
    create_time = models.DateTimeField(null=True, blank=True, auto_now_add=True)
    alarm_type = models.IntegerField(db_index=True)  # 0 表示未确认, 1 表示已确认
    count = models.IntegerField(default=0)

    class Meta:
        db_table = 'app_fuzhou_alarm'


class MList(models.Model):
    pcr = models.TextField(null=True, blank=True)
    template_hash = models.TextField(blank=True, null=True, db_column="templatehash")
    tmp_type = models.TextField(blank=True, null=True, db_column="tmptype")
    file_data = models.TextField(blank=True, null=True, db_column="filedata")
    file_router = models.TextField(blank=True, null=True, db_column="filerouter")

    class Meta:
        db_table = 'mlist'


class WhiteList(models.Model):
    client_name = models.TextField(db_column="clientname")
    file_data = models.TextField(blank=True, null=True, db_column="filedata")
    file_router = models.TextField(blank=True, null=True, db_column="filerouter")
    ip = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'whitelist'


class Database(models.Model):
    """
    数据库实体映射类 client_info
    """
    db_id = models.IntegerField(primary_key=True)
    db_name = models.CharField(max_length=100)
    db_type = models.CharField(max_length=100)
    db_ip = models.CharField(max_length=100)
    db_port = models.IntegerField()
    sql_uname = models.CharField(max_length=100)
    sql_passwd = models.CharField(max_length=100)
    db_size = models.BigIntegerField()
    db_volume = models.BigIntegerField()

    class Meta:
        db_table = 'client_info'


class ChainUser(models.Model):
    """
    区块链用户表
    """
    id = models.CharField(primary_key=True, null=False, max_length=255)
    private_key = models.CharField(max_length=255)
    public_key = models.CharField(max_length=255)
    username = models.CharField(max_length=255)
    job = models.CharField(max_length=255)
    department = models.CharField(max_length=255)
    email = models.CharField(max_length=255)
    phone = models.CharField(max_length=255)
    photo = models.CharField(max_length=128, null=True)
    create_time = models.DateTimeField(null=True, blank=True)
    is_active = models.IntegerField(default=1)  # 是否启用,1是启用,0是未激活,2是禁用

    class Meta:
        db_table = 'app_fuzhou_chainuser'


class ChainUserTran(models.Model):
    """
    用户交易记录表
    """
    id = models.CharField(primary_key=True, null=False, max_length=255)
    tx_id = models.CharField(max_length=255, null=True, blank=True)
    origin_tx_id = models.CharField(max_length=255, null=True, blank=True)  # 原始交易ID
    pre_chain_user_id = models.CharField(max_length=255, null=True, blank=True)
    chain_user_id = models.CharField(max_length=255, null=True, blank=True)
    # 创建(CREATE)或者转让(TRANSFER)
    tran_type = models.CharField(max_length=255, null=True, blank=True)
    # 资产类型:比如白名单类资产,日志类资产,黄金类资产
    asset_type = models.CharField(max_length=255, null=True, blank=True)
    is_sync = models.BigIntegerField(null=True)  # 0,同步; 1,异步
    sync_tx_id = models.CharField(max_length=255, null=True, blank=True)
    create_time = models.DateTimeField(null=True, blank=True)
    confirm_status = models.IntegerField()  # 证实状态,0:未证实，1，证实成功，2，证实失败

    class Meta:
        db_table = 'app_fuzhou_chainuser_tran'


class UserInfo(models.Model):
    id = models.AutoField(primary_key=True)
    user_id = models.CharField(max_length=32, unique=True)
    username = models.CharField(max_length=32, null=True, db_index=True)
    feature = models.CharField(max_length=64, null=True, db_index=True)
    department = models.CharField(max_length=16, null=True, db_index=True)
    position = models.CharField(max_length=8, null=True)
    email = models.CharField(max_length=32, null=True)
    phone = models.CharField(max_length=16, null=True)
    photo = models.CharField(max_length=128, null=True)
    status = models.IntegerField(default=0)
    create_time = models.DateTimeField(auto_now_add=True)
    update_time = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'app_fuzhou_userinfo'


class Virusbook(models.Model):
    resource = models.CharField(max_length=128, null=True)
    responseCode = models.CharField(max_length=32, null=True)
    fileName = models.CharField(max_length=128, null=True)
    verboseMsg = models.CharField(max_length=128, null=True)
    isWhite = models.IntegerField(default=0)
    scans = models.CharField(max_length=128, null=True)
    sha256 = models.CharField(max_length=64, null=True)
    md5 = models.CharField(max_length=32, null=True)
    scanID = models.CharField(max_length=128, null=True)
    sha1 = models.CharField(max_length=40, null=True)
    whiteDesc = models.CharField(max_length=128, null=True)
    host = models.CharField(max_length=32, null=True)
    ip = models.CharField(max_length=15, null=True)

    class Meta:
        db_table = "virusbook"


class BlackboxHost(models.Model):
    hostip = models.CharField(max_length=15)
    hostname = models.CharField(max_length=32)
    description = models.CharField(max_length=255, null=True)
    status = models.IntegerField(default=1)  # 0: 开启状态; 1: 关闭状态
    connection = models.IntegerField(default=1)  # 0:未连接，1:连接

    class Meta:
        db_table = "app_fuzhou_blackbox_host"


class WarningList(models.Model):
    phone = models.CharField(max_length=11)
    email = models.CharField(max_length=50)
    enabled = models.SmallIntegerField()  # 1: 开启状态; 0: 关闭状态

    class Meta:
        db_table = 'app_fuzhou_warninglist'


class OperationHost(models.Model):
    """
    存储安装可信运维的主机ip
    """
    id = models.AutoField(primary_key=True, null=False, max_length=255)
    mac_address = models.CharField(max_length=50, unique=True)
    exe_path = models.CharField(max_length=255, unique=True)  # windows可信运维路径

    class Meta:
        db_table = 'app_fuzhou_operationhost'


class MachineList(models.Model):
    """杀毒主机列表"""
    hostname = models.CharField(max_length=32, unique=True, null=False)  # 唯一性
    hostip = models.CharField(max_length=15, unique=True, null=False)  # 唯一性
    is_scan = models.BooleanField(default=False, null=False)  # True:查杀中; False:当前未查杀
    remark = models.TextField(blank=True, null=True)  # 备注信息
    scan_log = models.TextField(blank=True, null=True, max_length=65535)  # 查杀日志

    def toDict(self):
        machine_dict = {}
        machine_dict['hostname'] = self.hostname
        machine_dict['hostip'] = self.hostip
        machine_dict['is_scan'] = self.is_scan
        machine_dict['remark'] = self.remark
        machine_dict['scan_log'] = self.scan_log
        return machine_dict

    class Meta:
        db_table = 'app_fuzhou_machinelist'


class WhiteUserAction(models.Model):

    value = models.CharField(max_length=40)
    ip = models.CharField(max_length=15)
    type = models.CharField(max_length=2)
    db_type = models.IntegerField(null=True)
    sid = models.CharField(max_length=40)

    class Meta:
        db_table = 'white_user_action'


class OctaGlobalSetting(models.Model):

    param = models.CharField(max_length=12)
    value = models.CharField(max_length=255, null=True)

    class Meta:
        db_table = 'octa_global_setting'


class OctaWafHostStatus(models.Model):

    ip = models.CharField(max_length=15)
    name = models.CharField(max_length=255, default='on')
    http = models.CharField(max_length=7, default='on')
    web = models.CharField(max_length=7, default='on')
    dataTrack = models.CharField(max_length=7, default='on')
    errorCheck = models.CharField(max_length=7, default='on')
    dos = models.CharField(max_length=7, null=True)
    whole = models.CharField(max_length=7, null=True)

    class Meta:
        db_table = 'octa_waf_host_status'


class SystemConfig(models.Model):

    host_ip = models.CharField(max_length=15)
    type = models.CharField(max_length=16)
    config = models.CharField(max_length=256)
    create_time = models.DateTimeField(auto_now_add=True)
    update_time = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'system_config'
        unique_together = ('host_ip', 'type')  # host_ip, type 联合唯一的约束


class BdbWhiteList(models.Model):

    tx_id = models.CharField(max_length=200)
    create_time = models.DateTimeField(auto_now_add=True)
    private_key = models.CharField(max_length=2000, null=True)
    host = models.CharField(max_length=200)

    class Meta:
        db_table = 'bdb_whitelist'


class AlarmDetail(models.Model):

    # 默认 null=False
    ip = models.GenericIPAddressField()
    hostname = models.CharField(max_length=255)
    alarm_type = models.IntegerField()  # 1,waf,2,audit,3,trustlog,4,eagle,5,杀毒 其他为非异常: 目前为0
    info = models.CharField(max_length=1024, null=True)
    create_time = models.DateTimeField()

    class Meta:
        db_table = 'app_fuzhou_alarm_detail'


class WebTamperUser(models.Model):
    id = models.IntegerField(primary_key=True)
    username = models.CharField(max_length=50, null=False, unique=True)  # 登录账号
    user_alias = models.CharField(max_length=50)  # 用户名 用户的真实姓名
    password = models.CharField(max_length=255, null=False)
    is_super = models.IntegerField(null=False)
    position = models.CharField(max_length=100)
    department = models.CharField(max_length=100)
    email = models.CharField(max_length=100)
    phone = models.CharField(max_length=100)
    status = models.CharField(max_length=50)
    token = models.CharField(max_length=255)  # token 保存用户token
    remark = models.TextField()

    def toDict(self):
        user_dict = dict()
        user_dict['id'] = self.id
        user_dict['username'] = self.username
        user_dict['user_alias'] = self.user_alias
        user_dict['password'] = self.password
        user_dict['is_super'] = self.is_super
        user_dict['position'] = self.position
        user_dict['department'] = self.department
        user_dict['email'] = self.email
        user_dict['phone'] = self.phone
        user_dict['status'] = self.status
        user_dict['token'] = self.token
        user_dict['remark'] = self.remark
        return user_dict

    class Meta:
        app_label = "web"
        db_table = "user"


class SVNTamperUser(models.Model):
    id = models.IntegerField(primary_key=True)
    username = models.CharField(max_length=50, null=False, unique=True)  # 登录账号
    user_alias = models.CharField(max_length=50)  # 用户名 用户的真实姓名
    password = models.CharField(max_length=255, null=False)
    is_super = models.IntegerField(null=False)
    position = models.CharField(max_length=100)
    department = models.CharField(max_length=100)
    email = models.CharField(max_length=100)
    phone = models.CharField(max_length=100)
    status = models.CharField(max_length=50)
    token = models.CharField(max_length=255)  # token 保存用户token
    remark = models.TextField()

    def toDict(self):
        user_dict = dict()
        user_dict['id'] = self.id
        user_dict['username'] = self.username
        user_dict['user_alias'] = self.user_alias
        user_dict['password'] = self.password
        user_dict['is_super'] = self.is_super
        user_dict['position'] = self.position
        user_dict['department'] = self.department
        user_dict['email'] = self.email
        user_dict['phone'] = self.phone
        user_dict['status'] = self.status
        user_dict['token'] = self.token
        user_dict['remark'] = self.remark
        return user_dict

    class Meta:
        app_label = "svn"
        db_table = 'user'


class SVNHostInfo(models.Model):
    id = models.IntegerField(primary_key=True)
    protect_host_name = models.CharField(max_length=50, unique=True, null=False)  # 被保护的机器名称
    protect_host_addr = models.IPAddressField(unique=True, null=False)  # 被保护的机器IP
    status = models.CharField(max_length=50, null=False)  # 被保护的机器状态
    os_name = models.CharField(max_length=50)  # 被保护机器的操作系统  posix(linux)  nt(windows)
    remark = models.TextField()

    def toDict(self):
        host_dict = dict()
        host_dict['id'] = self.id
        host_dict['protect_host_name'] = self.protect_host_name
        host_dict['protect_host_addr'] = self.protect_host_addr
        host_dict['status'] = self.status
        host_dict['os_name'] = self.os_name
        host_dict['remark'] = self.remark
        return host_dict

    class Meta:
        app_label = "svn"
        db_table = 'host_info'


class WebHostInfo(models.Model):
    id = models.IntegerField(primary_key=True)
    protect_host_name = models.CharField(max_length=50, unique=True, null=False)  # 被保护的机器名称
    protect_host_addr = models.IPAddressField(unique=True, null=False)  # 被保护的机器IP
    status = models.CharField(max_length=50, null=False)  # 被保护的机器状态
    os_name = models.CharField(max_length=50)  # 被保护机器的操作系统  posix(linux)  nt(windows)
    remark = models.TextField()

    def toDict(self):
        path_dict = dict()
        path_dict['id'] = self.id
        path_dict['protect_host_name'] = self.protect_host_name
        path_dict['protect_host_addr'] = self.protect_host_addr
        path_dict['protect_root_path'] = self.protect_root_path
        path_dict['protect_path_mark'] = self.protect_path_mark
        path_dict['status'] = self.status
        path_dict['timestamp'] = self.timestamp
        path_dict['remark'] = self.remark
        return path_dict

    def toDict(self):
        host_dict = dict()
        host_dict['id'] = self.id
        host_dict['protect_host_name'] = self.protect_host_name
        host_dict['protect_host_addr'] = self.protect_host_addr
        host_dict['status'] = self.status
        host_dict['os_name'] = self.os_name
        host_dict['remark'] = self.remark
        return host_dict

    class Meta:
        app_label = "web"
        db_table = 'host_info'


class SVNHostPath(models.Model):
    id = models.IntegerField(primary_key=True)
    protect_host_name = models.CharField(max_length=50, null=False)  # 被保护的机器名称
    protect_host_addr = models.IPAddressField(null=False)  # 被保护的机器IP
    protect_root_path = models.CharField(max_length=255, null=False)  # 被保护的路径
    protect_path_mark = models.CharField(max_length=255, null=False)  # 被保护的路径的标签
    status = models.CharField(max_length=50)  # 是否被保护
    timestamp = models.DateField(null=False)  # 分配时间
    remark = models.TextField()

    def toDict(self):
        path_dict = dict()
        path_dict['id'] = self.id
        path_dict['protect_host_name'] = self.protect_host_name
        path_dict['protect_host_addr'] = self.protect_host_addr
        path_dict['protect_root_path'] = self.protect_root_path
        path_dict['protect_path_mark'] = self.protect_path_mark
        path_dict['status'] = self.status
        path_dict['timestamp'] = self.timestamp
        path_dict['remark'] = self.remark
        return path_dict

    class Meta:
        app_label = "svn"
        db_table = "host_path"


class WebHostPath(models.Model):
    id = models.IntegerField(primary_key=True)
    protect_host_name = models.CharField(max_length=50, null=False)  # 被保护的机器名称
    protect_host_addr = models.IPAddressField(null=False)  # 被保护的机器IP
    protect_root_path = models.CharField(max_length=255, null=False)  # 被保护的路径
    protect_path_mark = models.CharField(max_length=255, null=False)  # 被保护的路径的标签
    status = models.CharField(max_length=50)  # 是否被保护
    timestamp = models.DateField(null=False)  # 分配时间
    remark = models.TextField()

    def toDict(self):
        path_dict = dict()
        path_dict['id'] = self.id
        path_dict['protect_host_name'] = self.protect_host_name
        path_dict['protect_host_addr'] = self.protect_host_addr
        path_dict['protect_root_path'] = self.protect_root_path
        path_dict['protect_path_mark'] = self.protect_path_mark
        path_dict['status'] = self.status
        path_dict['timestamp'] = self.timestamp
        path_dict['remark'] = self.remark
        return path_dict

    class Meta:
        app_label = "web"
        db_table = "host_path"


class SVNUserHostPath(models.Model):
    id = models.IntegerField(primary_key=True)
    username = models.CharField(max_length=50, null=False)  # 操作用户
    protect_host_name = models.CharField(max_length=50, null=False)  # 被保护的机器名称
    protect_host_addr = models.IPAddressField(null=False)  # 被保护的机器IP
    protect_root_path = models.CharField(max_length=255, null=False)  # 被保护的路径
    protect_path_mark = models.CharField(max_length=255, null=False)  # 被保护的路径的标签
    status = models.CharField(max_length=50)  # 是否被保护
    timestamp = models.DateField(null=False)  # 分配时间
    remark = models.TextField()

    def toDict(self):
        path_dict = dict()
        path_dict['id'] = self.id
        path_dict['username'] = self.username
        path_dict['protect_host_name'] = self.protect_host_name
        path_dict['protect_host_addr'] = self.protect_host_addr
        path_dict['protect_root_path'] = self.protect_root_path
        path_dict['protect_path_mark'] = self.protect_path_mark
        path_dict['status'] = self.status
        path_dict['timestamp'] = self.timestamp
        path_dict['remark'] = self.remark
        return path_dict

    class Meta:
        app_label = "svn"
        db_table = "user_host_path"


class WebUserHostPath(models.Model):
    id = models.IntegerField(primary_key=True)
    username = models.CharField(max_length=50, null=False)  # 操作用户
    protect_host_name = models.CharField(max_length=50, null=False)  # 被保护的机器名称
    protect_host_addr = models.IPAddressField(null=False)  # 被保护的机器IP
    protect_root_path = models.CharField(max_length=255, null=False)  # 被保护的路径
    protect_path_mark = models.CharField(max_length=255, null=False)  # 被保护的路径的标签
    status = models.CharField(max_length=50)  # 是否被保护
    timestamp = models.DateField(null=False)  # 分配时间
    remark = models.TextField()

    def toDict(self):
        path_dict = dict()
        path_dict['id'] = self.id
        path_dict['username'] = self.username
        path_dict['protect_host_name'] = self.protect_host_name
        path_dict['protect_host_addr'] = self.protect_host_addr
        path_dict['protect_root_path'] = self.protect_root_path
        path_dict['protect_path_mark'] = self.protect_path_mark
        path_dict['status'] = self.status
        path_dict['timestamp'] = self.timestamp
        path_dict['remark'] = self.remark
        return path_dict

    class Meta:
        app_label = "web"
        db_table = "user_host_path"


class SVNTaskInfo(models.Model):
    id = models.IntegerField(primary_key=True)
    operate_username = models.CharField(max_length=50, null=False)  # 操作用户
    timestamp = models.DateField(null=False)  # 版本生成时间
    protect_host_name = models.CharField(max_length=50, null=False)  # 被保护的机器名称
    protect_host_addr = models.IPAddressField(null=False)  # 被保护的机器IP
    protect_root_path = models.CharField(max_length=255, null=False)  # 被保护的路径
    protect_path_mark = models.CharField(max_length=255)  # 根目录标签
    operate_type = models.CharField(max_length=50, null=False)  # 变更类型 包括新增移动和删除
    version_txid = models.CharField(max_length=64)  # bigchaindb中存储的版本信息对应的tx_id
    changed_objects = models.TextField()  # 变更的目录列表
    version_tree = models.TextField()  # 版本目录树型结构
    status = models.CharField(max_length=50)  # 任务状态
    remark = models.TextField()

    class Meta:
        app_label = "svn"
        db_table = "task_info"


class WebTaskInfo(models.Model):
    id = models.IntegerField(primary_key=True)
    operate_username = models.CharField(max_length=50, null=False)  # 操作用户
    timestamp = models.DateField(null=False)  # 版本生成时间
    protect_host_name = models.CharField(max_length=50, null=False)  # 被保护的机器名称
    protect_host_addr = models.IPAddressField(null=False)  # 被保护的机器IP
    protect_root_path = models.CharField(max_length=255, null=False)  # 被保护的路径
    protect_path_mark = models.CharField(max_length=255)  # 根目录标签
    operate_type = models.CharField(max_length=50, null=False)  # 变更类型 包括新增移动和删除
    version_txid = models.CharField(max_length=64)  # bigchaindb中存储的版本信息对应的tx_id
    changed_objects = models.TextField()  # 变更的目录列表
    version_tree = models.TextField()  # 版本目录树型结构
    status = models.CharField(max_length=50)  # 任务状态
    remark = models.TextField()

    class Meta:
        app_label = "web"
        db_table = "task_info"


class SVNVersionHistory(models.Model):
    id = models.IntegerField(primary_key=True)
    operate_username = models.CharField(max_length=50, null=False)  # 操作用户
    timestamp = models.DateField(null=False)  # 版本生成时间
    protect_host_name = models.CharField(max_length=50, null=False)  # 被保护的机器名称
    protect_host_addr = models.IPAddressField(null=False)  # 被保护的机器IP
    protect_root_path = models.CharField(max_length=255, null=False)  # 被保护的路径
    operate_type = models.CharField(max_length=50, null=False)   # 变更类型 包括新增移动和删除
    version_txid = models.CharField(max_length=64, unique=True, null=False)  # bigchaindb中存储的版本信息对应的tx_id
    changed_objects = models.TextField(null=False)  # 变更的目录列表
    version_tree = models.TextField(null=False)  # 版本目录树型结构
    commits_info = models.TextField(null=True)  # svn提交信息
    remark = models.TextField()

    def toDict(self):
        history_dict = dict()
        history_dict['id'] = self.id
        history_dict['operate_username'] = self.operate_username
        history_dict['timestamp'] = self.timestamp
        history_dict['protect_host_name'] = self.protect_host_name
        history_dict['protect_host_addr'] = self.protect_host_addr
        history_dict['protect_root_path'] = self.protect_root_path
        history_dict['operate_type'] = self.operate_type
        history_dict['version_txid'] = self.version_txid
        history_dict['changed_objects'] = self.changed_objects
        history_dict['version_tree'] = self.version_tree
        history_dict['commits_info'] = self.commits_info
        history_dict['remark'] = self.remark
        return history_dict

    class Meta:
        app_label = "svn"
        db_table = "version_history"


class WebVersionHistory(models.Model):
    id = models.IntegerField(primary_key=True)
    operate_username = models.CharField(max_length=50, null=False)  # 操作用户
    timestamp = models.DateField(null=False)  # 版本生成时间
    protect_host_name = models.CharField(max_length=50, null=False)  # 被保护的机器名称
    protect_host_addr = models.IPAddressField(null=False)  # 被保护的机器IP
    protect_root_path = models.CharField(max_length=255, null=False)  # 被保护的路径
    operate_type = models.CharField(max_length=50, null=False)  # 变更类型 包括新增移动和删除
    version_txid = models.CharField(max_length=64, unique=True, null=False)  # bigchaindb中存储的版本信息对应的tx_id
    changed_objects = models.TextField(null=False)  # 变更的目录列表
    version_tree = models.TextField(null=False)  # 版本目录树型结构
    commits_info = models.TextField(null=True)  # svn提交信息
    remark = models.TextField()

    def toDict(self):
        history_dict = dict()
        history_dict['id'] = self.id
        history_dict['operate_username'] = self.operate_username
        history_dict['timestamp'] = self.timestamp
        history_dict['protect_host_name'] = self.protect_host_name
        history_dict['protect_host_addr'] = self.protect_host_addr
        history_dict['protect_root_path'] = self.protect_root_path
        history_dict['operate_type'] = self.operate_type
        history_dict['version_txid'] = self.version_txid
        history_dict['changed_objects'] = self.changed_objects
        history_dict['version_tree'] = self.version_tree
        history_dict['commits_info'] = self.commits_info
        history_dict['remark'] = self.remark
        return history_dict

    class Meta:
        app_label = "web"
        db_table = "version_history"

class AppFuzhouGroup(models.Model):
    # 自增id是组的id
    name = models.CharField(max_length=16, blank=True, null=True)  # 组名
    remark = models.CharField(max_length=128, blank=True, null=True)  # 组简介
    type = models.IntegerField(blank=True, null=True)  # 组类型 １表示可信防护组　２表示杀毒组
    state = models.IntegerField(blank=True, null=True)  # 是否有效　０无效　１有效
    # config = models.CharField(max_length=512, blank=True, null=True)  # 杀毒配置
    # path = models.CharField(max_length=128, blank=True, null=True)  # 杀毒路径
    createtime = models.DateTimeField(blank=True, null=True)
    edittime = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'app_fuzhou_group'


class AppFuzhouGroupIp(models.Model):
    group_id = models.IntegerField(blank=True, null=True)  # 组id
    ip = models.CharField(max_length=16, blank=True, null=True)  # 主机ip
    state = models.IntegerField(blank=True, null=True)  # 是否有效　０无效　１有效

    class Meta:
        managed = False
        db_table = 'app_fuzhou_group_ip'


# class AppFuzhouGroupTimer(models.Model):
#     group_id = models.IntegerField(blank=True, null=True)  # 组id
#     time = models.CharField(max_length=16, blank=True, null=True)  # 杀毒时间
#     state = models.IntegerField(blank=True, null=True)  # 是否有效　０无效　１有效
#     ip = models.CharField(max_length=16, blank=True, null=True)  # 主机ip 和组没关系　是单个主机的杀毒任务
#     type = models.IntegerField(blank=True, null=True, default=1)  # 定时类型 １表示主机组　0表示单个ip
#
#     class Meta:
#         managed = False
#         db_table = 'app_fuzhou_group_timer'


class ClamavTask(models.Model):
    # 自曾id为任务id
    name = models.CharField(max_length=16)  # 任务名称
    remark = models.CharField(max_length=128)  # 任务备注
    state = models.IntegerField(default=1)  # 是否有效　０无效　１有效
    config = models.CharField(max_length=512, blank=True, null=True)  # 杀毒配置
    time = models.CharField(max_length=512, blank=True, null=True)  # 杀毒时间

    class Meta:
        managed = False
        db_table = 'app_fuzhou_clamav_task'


class TaskGroupIp(models.Model):
    # 任务id找到对应的组id或主机id
    task_id = models.IntegerField()  # 任务id
    target_id = models.IntegerField(blank=True, null=True)  # 任务里面主机组的id或主机id
    state = models.IntegerField(default=1)  # 是否有效　０无效　１有效
    # time = models.CharField(max_length=16, blank=True, null=True)  # 杀毒时间
    type = models.IntegerField(blank=True, null=True, default=1)  # 定时类型 0表示单个id  １表示主机组id　与target_id相关


    class Meta:
        managed = False
        db_table = 'app_fuzhou_task_group_ip'


class ClamavTaskID(models.Model):
    host_id = models.CharField(max_length=16)  # 主机id
    task_uuid = models.CharField(max_length=255)
    config = models.CharField(max_length=512, blank=True, null=True)  # 杀毒配置
    # state = models.IntegerField()  # 是否有效　０无效　１有效

    class Meta:
        managed = False
        db_table = 'app_fuzhou_clamav_taskid'
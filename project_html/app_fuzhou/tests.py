"""
# Django TestCase
"""
from django.contrib.auth.models import User
from django.test import TestCase


# 注册
from app_fuzhou.views_utils.global_config import GlobalConf


gc = GlobalConf()


class RegisterTest(TestCase):
    """ class to Test register """
    def test_register(self):
        """ test method """
        print("========== register test begin ===========")
        response = self.client.post('/api/register/', {"username": "1", "password": "1"})
        print(response.content)
        self.assertEqual(response.status_code, 200)
        print("********** register test end **********\n")


# 获取登陆页分数
class GlobalTest(TestCase):
    """ class to Test global score """
    def test_global(self):
        """ test method """
        print("=========== global test begin ===========")
        response = self.client.get('/api/globalscore/')
        print(response.content)
        self.assertEqual(response.status_code, 200)
        print("*********** global test end ***********\n")


# 登陆
class LoginTest(TestCase):
    """ class to Test login """
    def test_login(self):
        """ test method """
        print("============ login test begin ============")
        new_user = User.objects.create_user("admin", "", "admin")
        new_user.save()
        self.client.session['username'] = 'admin'
        response = self.client.post('/api/login/', {'username': "admin", 'password': "admin"})
        print(response.content)
        self.assertEqual(response.status_code, 200)
        print("************ login test end ************\n")


# 修改密码
class ModpassTest(TestCase):
    """ class to Test modpass """
    def test_modpass(self):
        """ test method """
        print("=========== modpass test begin ===========")
        new_user = User.objects.create_user("admin", "", "admin")
        new_user.save()
        response = self.client.post('/api/modpass/',
                                    {
                                        "username": "admin",
                                        "password": "admin",
                                        "newpassword": "123456"
                                    })
        print(response.content)
        self.assertEqual(response.status_code, 200)
        print("********** modepass test end **********\n")


# 注销登陆
class LogoutTest(TestCase):
    """ class to Test logout """
    def test_logout(self):
        """ test method """
        print("=========== logout test begin ===========")
        response = self.client.get('/api/logout/')
        print(response.content)
        self.assertEqual(response.status_code, 200)
        print("********** logout test end **********\n")


# 获取首页分数
class ScoreTest(TestCase):
    """ class to Test score """
    def test_score(self):
        """ test method """
        print("========== score test begin ==========")
        response = self.client.get('/api/globalscore/')
        print(response.content)
        self.assertEqual(response.status_code, 200)
        print("********** score test end **********\n")


# 首页展示当前CPU和磁盘I/O的负载平均值
class VaginfoTest(TestCase):
    """ class to Test vaginfo """
    def test_vaginfo(self):
        """ test method """
        print("========== vaginfo test begin ==========")
        response = self.client.get('/api/vaginfo/')
        print(response.content)
        self.assertEqual(response.status_code, 200)
        print("********** vaginfo test end **********\n")


# 首页展示网络通讯流量信息
class NetinfoTest(TestCase):
    """ class to Test netinfo """
    def test_netinfo(self):
        """ test method """
        print("========== netinfo test begin ==========")
        response = self.client.get('/api/netinfo/')
        print(response.content)
        self.assertEqual(response.status_code, 200)
        print("********** netinfo test end **********\n")


# 首页展示集群内存信息
class MemoinfoTest(TestCase):
    """ class to Test memoinfo """
    def test_memoinfo(self):
        """ test method """
        print("========== menoinfo test begin ==========")
        response = self.client.get('/api/memoinfo/')
        print(response.content)
        self.assertEqual(response.status_code, 200)
        print("********** memoinfo test end **********\n")


# 首页展示服务器数据库数量
class SqlconnTest(TestCase):
    """ class to Test sqlconn """
    def test_sqlconn(self):
        """ test method """
        print("========== sqlconn test begin ==========")
        response = self.client.get('/api/sambashare/')
        print(response.content)
        self.assertEqual(response.status_code, 200)
        print("********** sqlconn test end **********\n")


# 环境页展示
class LogTest(TestCase):
    """ class to Test log """
    def test_log(self):
        """ test method """
        print("========== log test begin ==========")
        response = self.client.post('/api/loginfo/',
                                    {
                                        "flag": 0,
                                        "type": "local",
                                        "source": "assassin",
                                        "level": "DEBUG",
                                        "isFirst": "false",
                                        "page": 1,
                                        "size": 10
                                    })
        print(response.content)
        self.assertEqual(response.status_code, 200)
        print("********** log test end **********\n")


# # 创建数据库
class CreatedbTest(TestCase):
    """ class to Test createdb """
    def test_createdb(self):
        """ test method """
        print("========== createdb test begin ==========")
        response = self.client.post('/api/createDB/',
                                    {
                                        "dbname": "test",
                                        "type": "MySQL",
                                        "ip": gc.TEST_HOST,
                                        "port": 3306,
                                        "username": "root",
                                        "password": "octa"
                                    })
        print(response.content)
        self.assertEqual(response.status_code, 200)
        print("********** createdb test end **********\n")


# # 获取数据库信息
class GetdbTest(TestCase):
    """ class to Test getdb info """
    def test_getdb(self):
        """ test method """
        print("========== getdb test begin ==========")
        response = self.client.get('/api/getDB/')
        print(response.content)
        self.assertEqual(response.status_code, 200)
        print("********** getdb test end **********\n")


# 展示mlfile页面
class MlTest(TestCase):
    """ class to Test show ml """
    def test_ml(self):
        """ test method """
        print("========== ml test begin ==========")
        s = self.client.session
        s['username'] = 'admin'
        s.save()
        response = self.client.post('/api/mlfile/', {"size": 10, "page": 1})
        print(response.content)
        self.assertEqual(response.status_code, 200)
        print("********** ml test end **********\n")


# 展示白名单页面
class WlTest(TestCase):
    """ class to Test show wl """
    def test_wl(self):
        """ test method """
        print("========== wl test begin ==========")
        s = self.client.session
        s['username'] = 'admin'
        s.save()
        response = self.client.post('/api/wlfile/', {"size": 10, "page": 1})
        print(response.content)
        self.assertEqual(response.status_code, 200)
        print("********** wl test end **********\n")


# 白名单搜索+排序
class WlSearchTest(TestCase):
    """ class to Test wl search """
    def test_wlsearch(self):
        """ test method """
        print("========== wlsearch test begin ==========")
        response = self.client.post('/api/whitelistSearch/',
                                    {
                                        'itemKey': 'filerouter',
                                        'searchkeyWord': '/bin/cp',
                                        'sortKey': 'reverse',
                                        'pageIndex': '1'
                                    })
        print(response.content)
        self.assertEqual(response.status_code, 200)
        print("========== wlsearch test end ==========")


# 体检页初始化
class ScanInitTest(TestCase):
    """ class to Test scan init """
    def test_scaninit(self):
        """ test method """
        print("========== scaninit test begin ==========")
        response = self.client.get('/api/scanInit/')
        print(response.content)
        self.assertEqual(response.status_code, 200)
        print("========== scaninit test end ==========")


# 体检-人工确认页面错误日志展示
class RepairlistTest(TestCase):
    """ class to Test repairlist """
    def test_repairlist(self):
        """ test method """
        print("========== repairlist test begin ==========")
        response = self.client.post('/api/repairlist/',
                                    {
                                        "size": 10,
                                        "page": 1,
                                        "level": "ERROR",
                                        "sendTime": 37672377
                                    })
        print(response.content)
        self.assertEqual(response.status_code, 200)
        print("********** repairlist test end **********\n")


# 修复错误日志
class RepairTest(TestCase):
    """ class to Test repair """
    def test_repair(self):
        """ test method """
        print("========== repair test begin ==========")
        response = self.client.post('/api/repair/',
                                    {
                                        'keyword': [''],
                                        'id': ['{"id":["35670","35669"]}'],
                                        'level': ['ERROR']
                                    })
        print(response.content)
        self.assertEqual(response.status_code, 200)
        print("********** repair test end **********\n")


# 日志搜索
class SearchTest(TestCase):
    """ class to Test search log """
    def test_search(self):
        """ test method """
        print("========== search test begin ==========")
        response = self.client.post('/api/search/', {"keyword": "可信", "page": 1, "size": 10})
        print(response.content)
        self.assertEqual(response.status_code, 200)
        print("********** search test end **********\n")


# 常规修复-立即扫描按钮
class ScanTest(TestCase):
    """ class to Test scan """
    def test_scan(self):
        """ test method """
        print("========== scan test begin ==========")
        response = self.client.get('/api/scan/')
        print(response.content)
        # self.assertEqual(response.status_code, 200)
        print("********** scan test end **********\n")


# 常规修复-立即修复按钮
class ScanRepairTest(TestCase):
    """ class to Test scan repair """
    def test_scanrepair(self):
        """ test method """
        print("========== scan test begin ==========")
        response = self.client.get('/api/scanrepair/')
        print(response.content)
        # self.assertEqual(response.status_code, 200)
        print("********** scan test end **********\n")


# 白名单删除一条记录
class DelWhiteOneTest(TestCase):
    """ class to Test delete one of white lists """
    def test_delwhiteone(self):
        """ test method """
        print("========== del_white_one test begin ==========")
        response = self.client.post('/api/deletewl/', {"ids": 1000})
        print(response.content)
        self.assertEqual(response.status_code, 200)
        print("********** del_white_one test end *****************\n")


# 白名单删除多条记录
class DelWhiteTest(TestCase):
    """ class to Test delete many white lists """
    def test_delwhite(self):
        """ test method """
        print("========== del_white test begin ==========")
        response = self.client.post('/api/deletemlall/', {"ids": [1000, 1001]})
        print(response.content)
        self.assertEqual(response.status_code, 200)
        print("********** del_white test end *****************\n")


# 编辑白名单信息
class EditWhiteTest(TestCase):
    """ class to Test edit one white list """
    def test_editwhite(self):
        """ test method """
        print("========== edit_white test begin ==========")
        response = self.client.post('/api/updatewl/',
                                    {
                                        "id": 1000,
                                        "wlName": "aaa",
                                        "wlIP": gc.TEST_IP1,
                                        "wlText": "xxxx",
                                        "wlUrl": "abcd"
                                    })
        print(response.content)
        self.assertEqual(response.status_code, 200)
        print("********** edit_white test end *****************\n")


# 添加白名单
class AddWhiteTest(TestCase):
    """ class to Test add one white list """
    def test_addwhite(self):
        """ test method """
        print("========== add_white test begin ==========")
        response = self.client.post('/api/addwl/',
                                    {
                                        "id": 1001,
                                        "wlName": "bbb",
                                        "wlIP": gc.TEST_IP2,
                                        "wlText": "yyyy",
                                        "wlUrl": "abcdefg"
                                    })
        print(response.content)
        self.assertEqual(response.status_code, 200)
        print("********** add_white test end *****************\n")


# waf防火墙状态
class WafStateTest(TestCase):
    """ class to Test waf state """
    def test_wafstate(self):
        """ test method """
        print("========== waf state test begin ==========")
        response = self.client.get('/api/statefile/')
        print(response.content)
        # self.assertEqual(response.status_code, 200)
        print("********** waf state test end *****************\n")


# waf日志
class WafLogTest(TestCase):
    """ class to Test waf log """
    def test_waflog(self):
        """ test method """
        print("========== waf log test begin ==========")
        response = self.client.get('/api/statefile/')
        print(response.content)
        # self.assertEqual(response.status_code, 200)
        print("********** waf log test end *****************\n")


# 审计日志测试
class ShenjiTest(TestCase):
    """ class to Test shenji """
    def test_shenji(self):
        """ test method """
        print("==========shenji log  test begin==========\n")
        s = self.client.session
        s['username'] = 'admin'
        s.save()
        response = self.client.post('/api/shenji/', {"page": "1", "keyword": ""})
        print(response.content)
        print("********** shenji log test end **********\n")


# 审计用户白名单单条删除，测试
class AuditDeleteUserTest(TestCase):
    """ class to Test delete audit user """
    def test_audit_delete_user(self):
        """ test method """
        print("==========审计单条用户白名单删除 test begin==========\n")
        s = self.client.session
        s['username'] = 'admin'
        s.save()
        response = self.client.post('/api/shenjiDEl/',
                                    {"type": "1", "deleteIds": '{"id":"0","IPcontent":"hello"}'})
        print(response.content)
        print("**********  test end **********\n")


# 审计用户白名单单条删除，测试
class AuditEmptyUserTest(TestCase):
    """ class to Test empty audit user """
    def test_audit_empty(self):
        """ test method """
        print("==========审计用户白名单清空 test begin==========\n")
        s = self.client.session
        s['username'] = 'admin'
        s.save()
        response = self.client.post('/api/shenjiDEl/', {"type": "2"})
        print(response.content)
        # self.assertEqual(response.status_code, 200)
        print("**********  test end **********\n")


# 审计ip地址添加测试
class AuditAddIpTest(TestCase):
    """ class to Test add ip for audit """
    @staticmethod
    def test_audit_ip_add():
        """ test method """
        print("==========审计日志ip添加 test begin==========\n")
        print("**********  test end **********\n")


# 审计用户用户行为单条删除，测试
class AuditDeleteActionTest(TestCase):
    """ class to Test delete action """
    def test_audit_delete_action(self):
        """ test method """
        print("==========审计用户行为，单条删除 test begin==========\n")
        s = self.client.session
        s['username'] = 'admin'
        s.save()
        response = self.client.post('/api/shenjiDEl/',
                                    {
                                        "type": "3",
                                        "deleteIds": '{"id":"0","actionContent":"select"}'
                                    })
        print(response.content)
        print("**********  test end **********\n")


# 审计用户行为清空，测试
class AuditEmptyActionTest(TestCase):
    """ class to Test empty action """
    def test_audit_action(self):
        """ test method """
        print("==========审计用户行为清空 test begin==========\n")
        s = self.client.session
        s['username'] = 'admin'
        s.save()
        response = self.client.post('/api/shenjiDEl/', {"type": "4"})
        print(response.content)
        print("**********  test end **********\n")


# # 审计用户行为白名单，单条，测试
# class Audit_empty_user_Test(TestCase):
#     def test_audit_empty(self):
#         print("==========审计用户白名单清空 test begin==========\n")
#         s = self.client.session
#         s['username'] = 'admin'
#         s.save()
#         response = self.client.post('/api/shenjiDEl/', {"type": "2"})
#         print(response.content)
#         print("**********  test end **********\n")

# 审计用户白名单，添加测试
class AuditAddUserTest(TestCase):
    """ class to Test add user """
    def test_audit_user_add(self):
        """ test method """
        print("==========审计用户白名单，用户名添加 test begin==========\n")
        s = self.client.session
        s['username'] = 'admin'
        s.save()
        response = self.client.post('/api/addsjone/', {"sjwhiteone": "hello"})
        print(response.content)
        print("**********  test end **********\n")


# 审计行为白名单，添加测试
class AuditAddActionTest(TestCase):
    """ class to Test add action """
    def test_audit_action_add(self):
        """ test method """
        print("==========审计行为白名单，白名单行为添加 test begin==========\n")
        s = self.client.session
        s['username'] = 'admin'
        s.save()
        response = self.client.post('/api/addsjtwo/', {"sjwhiteone": "select"})
        print(response.content)
        print("**********  test end **********\n")


# 审计日志备份
class AuditBackupsTest(TestCase):
    """ class to Test backup """
    def test_audit_backups(self):
        """ test method """
        print("========== 审计日志行为备份 test begin ==========\n")
        s = self.client.session
        s['username'] = 'admin'
        s.save()
        response = self.client.post('/api/copyDoubleAjax/', {"type": "1"})
        print(response.content)
        self.assertEqual(response.status_code, 200)
        print("**********  test end **********\n")


# 审计日志导出
class AuditExportTest(TestCase):
    """ class to Test export """
    def test_audit_export(self):
        """ test method """
        print("==========审计日志行为导出 test begin==========\n")
        s = self.client.session
        s['username'] = 'admin'
        s.save()
        response = self.client.post('/api/copyDoubleAjax/', {"type": "2"})
        print(response.content)
        self.assertEqual(response.status_code, 200)
        print("**********  test end **********\n")

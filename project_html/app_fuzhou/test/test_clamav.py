from django.test import TestCase, Client
from django.http import HttpResponse


class TestClamav(TestCase):
    def test_update_online(self):
        response = self.client.post('/api/online_updateajax/')
        # self.assertIn(b"true", response.content)
        self.assertEqual(response.status_code, 200)

    def test_checkfileajax(self):
        response = self.client.post('/api/checkfileajax/')
        # self.assertIn(b"true", response.content)
        self.assertEqual(response.status_code, 200)

    def test_checkallkillajax(self):
        response = self.client.post('/api/checkallkillajax/')
        self.assertEqual(response.status_code, 200)

    def test_checkallkillajax2(self):
        response = self.client.post('/api/checkallkillajax2/')
        self.assertEqual(response.status_code, 200)

    def test_checkallkillajax3(self):
        response = self.client.post('/api/checkallkillajax3/')
        self.assertEqual(response.status_code, 200)

    def test_checkfileajax(self):
        response = self.client.post('/api/checkfileajax/')
        self.assertEqual(response.status_code, 200)

    def test_suspend_scan(self):
        response = self.client.post('/api/suspend_scan/')
        self.assertEqual(response.status_code, 200)

    def test_resume_scan(self):
        response = self.client.post('/api/resume_scan/')
        self.assertEqual(response.status_code, 200)

    def test_stop_scan(self):
        response = self.client.post('/api/stop_scan/')
        self.assertEqual(response.status_code, 200)

    def test_set_scan_config(self):
        response = self.client.post('/api/set_scan_config/', {
            "scan_filter": {"xmldocs": False, "archive": False, "pe": False, "hwp3": False, "elf": False, "pdf": False,
                            "ole2": False, "swf": False, "html": False, "mail": False},
            "online_update": {"setup_update": False, "per_frequency": "1"},
            "basic_setting": {"only_report": True, "scan_subcatalog": True, "infected_file": False, "delete": False}})
        self.assertEqual(response.status_code, 200)

    def test_get_scan_config(self):
        response = self.client.post('/api/get_scan_config/')
        self.assertEqual(response.status_code, 200)

    def test_get_scanport_config(self):
        response = self.client.get('/api/get_scanport_config/')
        print(response.content)
        self.assertEqual(response.status_code, 200)

    def test_scan_port(self):
        response = self.client.post('/api/scan_port/',
                                    {'ip': 2130706433, 'port_start': "0", 'port_end': "65535", 'random': 8888})
        print(response.status_code, response.content)
        self.assertEqual(response.status_code, 200)


class DatabaseTest(TestCase):
    def test_get_host_db_details(self):
        response = self.client.post('/api/get_host_db_details/')
        self.assertEqual(response.status_code, 200)


class AttackIpServer(TestCase):
    def test_get_ip_by_dim(self):
        print("-------------------- test_get_ip_by_dim ----------------------")
        response = self.client.post("/api/get_ip_by_dim/", {"dim_x": "120.1614", "dim_y": "30.2936"})
        print(response.content)

    def test_get_details(self):
        print("---------------------- test_get_details ----------------------")
        response = self.client.post("/api/get_details/", {"limit": 50})
        print(response.content)

    def test_get_details_time(self):
        print("------------------ test_get_details_time -------------------")
        response = self.client.post("/api/get_details/", {"limit": 50, "time": 10})
        print(response.content)

    def test_get_type_count(self):
        print("----------------- test_get_type_count --------------------")
        response = self.client.post("/api/get_type_count/")
        print(response.content)

    def test_get_all_info(self):
        print("----------------- test_get_type_info --------------------")
        response = self.client.post("/api/get_all_info/", {"count": 1})
        print(response.content)

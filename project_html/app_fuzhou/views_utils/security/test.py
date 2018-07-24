import json

from unittest import TestCase
from app_fuzhou.views_utils.security import RSACrypto


class TestCrypto(TestCase):
    def test_encrypt(self):
        text = json.dumps({"flie": "hello", "status": 0})
        print(len(text))
        result = RSACrypto.encrypt(text)
        des = json.loads(RSACrypto.decrypt(result))
        self.assertEqual(text, des)

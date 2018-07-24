import json

from octastack_fuzhou_web.settings import STATICFILES_DIRS


SHARE_JSON = STATICFILES_DIRS[1] + "/email.json"


class EmailConfiguration:
    def __init__(self):
        with open(SHARE_JSON, "r") as reader:
            self.content = json.load(reader)

    def get(self, name):
        return self.content.get(name)

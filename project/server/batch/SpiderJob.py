import time

from .worker import SimpleJob
import requests


class GenerateJob(SimpleJob):
    pass


class SpiderJob(SimpleJob):
    pass


class SoulRegisterJob(SimpleJob):

    URL = 'http://app.soulapp.cn:8080/soul-app-server/api/v1/register'
    password = '96e79218965eb72c92a549dd5a330112'
    pushToken = 'e930544719cf6757a4bab00038f41b2849b49aa1fede91b24e72a774688d8bc4'

    code = '505538'
    area = 86
    number = '18910376250'
    platform = 'IOS'

    def __init__(self, method=None, args=[]):
        super(SoulRegisterJob, self).__init__(method=self.register, args=args)

    def register(self):
        data = {
            'code': self.code,
            'area': self.area,
            'number': self.number,
            'password': self.password,
            #'pushTOken': self.pushToken,
            'platform': self.platform,
        }
        ret = requests.post(self.URL, data=data)
        if ret.status_code == 200:
            from project.server.models import Session
            session = Session.create(site='soul', account=self.number, area=self.area, password=self.password,
                           platform=self.platform)
            print(session)
        print(ret.status_code)
        print(ret.text)


class SoulCommentJob(SimpleJob):
    latest_url = 'http://api.soulapp.cn/post/recent?firstPage=1&pageIndex=1&pageSize=20&platform=IOS&topPostId=1201146&type=%d'
    comment_url = 'http://app.soulapp.cn:8080/soul-app-server/api/v1/posts/%d/comments'
    headers = {'X-Auth-UserId': 338491, 'X-Auth-Token': '73c8d20d-c3f9-4fe4-8e45-c3a427d0b67f'}

    def __init__(self, method=None, args=[]):
        super(SoulCommentJob, self).__init__(method=self.start, args=args)

    def get_articles(self, url):
        ret = requests.get(url, headers=self.headers)
        data = ret.json()
        if data.get('data'):
            return [d['id'] for d in data.get('data')]
        return []

    def post_comment(self, article_id):
        url = self.comment_url % article_id
        data = {
            'content': 'hh',
        }
        headers = self.headers.copy()
        headers.update({'Content-Type': 'application/json'})
        ret = requests.post(url, json=data, headers=headers)
        if ret.status_code == 200:
            pass

    def start(self):
        _type = 10000
        for _ in range(6):
            _type += 1
            url = self.latest_url % _type
            articles = self.get_articles(url)
            for ar in articles:
                self.post_comment(ar)
                time.sleep(1)


if __name__ == '__main__':
    job = SoulCommentJob()
    job.run()

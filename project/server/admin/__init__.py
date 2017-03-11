from datetime import datetime
import json

from jinja2 import Markup
from flask_admin.contrib.sqla import ModelView as SQLABaseModelView
from flask_admin import Admin, BaseView, expose
from flask_admin.model import typefmt

from project.server.models import db
from project.server.models import Comment, Task, Session

def datetime_formatter(view, value):
    return value.strftime('%Y-%m-%d %H:%M')


# formatters
def bool_formatter(view, value):
    return Markup('<input type="checkbox" disabled %s>' % ('checked' if value else ''))


class BaseModelMixin(object):
    column_default_sort = 'created_on', True
    can_delete = False
    page_size = 60

    column_type_formatters = dict(typefmt.BASE_FORMATTERS)
    column_type_formatters.update({
        datetime: datetime_formatter,
        bool: bool_formatter,
        dict: lambda view, value: json.dumps(value, ensure_ascii=False),
        list: lambda view, value: json.dumps(value, ensure_ascii=False),
    })


class ModelView(BaseModelMixin, SQLABaseModelView):
    pass

class MyAdmin(Admin):
    def add_view(self, view, add_to_menu=True):
        self._views.append(view)

        # If app was provided in constructor, register view with Flask app
        if self.app is not None:
            self.app.register_blueprint(view.create_blueprint(self))

        if add_to_menu:
            self._add_view_to_menu(view)


class AdminIndexView(BaseView):

    def __init__(self, name=None, category=None,
                 endpoint=None, url=None,
                 template='admin/index.html',
                 menu_class_name=None,
                 menu_icon_type=None,
                 menu_icon_value=None):
        super(AdminIndexView, self).__init__(name,
                                             category,
                                             endpoint or 'admin',
                                             url or '/admin',
                                             'static',
                                             menu_class_name=menu_class_name,
                                             menu_icon_type=menu_icon_type,
                                             menu_icon_value=menu_icon_value)
        self._template = template

    @expose()
    def index(self):
        return self.render(self._template)


class TaskModelView(ModelView):
    can_create = True
    can_delete = True

    column_list = (
        'task_type', 'status', 'number',
    )

    column_labels = {
    }


    column_formatters = {
        #'tag': (lambda v, c, m, p: tag_name(m)),
    }


class SessionModelView(ModelView):
    can_create = True
    can_delete = True

    column_list = (
        'site', 'session_token', 'headers', 'cookies',
    )

    column_labels = {
    }


    column_formatters = {
        #'tag': (lambda v, c, m, p: tag_name(m)),
    }


class CommentModelView(ModelView):
    can_create = True
    can_delete = True

    column_list = (
        'content', 'n_success',
    )

    column_labels = {
    }


    column_formatters = {
        #'tag': (lambda v, c, m, p: tag_name(m)),
    }


def init(app):
    index_view = AdminIndexView(name='首页', url='/admin', menu_icon_type='fa', menu_icon_value='fa-home')
    admin = MyAdmin(None, name=u'spider', template_mode='bootstrap3', index_view=index_view)

    admin.add_view(CommentModelView(Comment, db.session, endpoint='comment', name='', category=''), add_to_menu=False)
    admin.add_view(TaskModelView(Task, db.session, endpoint='task', name='', category=''), add_to_menu=False)
    admin.add_view(SessionModelView(Session, db.session, endpoint='session', name='', category=''), add_to_menu=False)

    admin.init_app(app)

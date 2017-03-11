# project/server/models.py

from flask_sqlalchemy import SQLAlchemy


db = SQLAlchemy()


def init_db(app):
    db.init_app(app)

class CommonColumn:
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    created_on = db.Column(db.DateTime(timezone=True), nullable=False, server_default=db.text('now()'))
    updated_on = db.Column(db.DateTime(timezone=True), nullable=False, server_default=db.text('now()'))


class Base(CommonColumn, db.Model):
    __abstract__ = True

    def inc(self, column, cnt=1):
        value = getattr(self, column)
        setattr(self, column, value+cnt)
        return self

    def des(self, column, cnt=1):
        value = getattr(self, column)
        setattr(self, column, value-cnt)
        return self

    def save(self):
        db.session.add(self)
        db.session.flush()
        return self


class Session(Base):
    __tablename__ = 'session'

    site = db.Column(db.String, nullable=False, default='')
    session_token = db.Column(db.String)
    headers = db.Column(db.String)
    cookies = db.Column(db.String)


class Comment(Base):
    __tablename__ = 'comment'

    content = db.Column(db.String)
    n_success = db.Column(db.Integer, nullable=False, default=0)


class Task(Base):
    __tablename__ = 'task'

    TASK_STATUS = (
        'init', 'finish', 'running', 'pending',
    )

    task_type = db.Column(db.String, nullable=False, default='')
    status = db.Column(db.Enum(*TASK_STATUS, name='task_status'), nullable=False)
    number = db.Column(db.Integer, nullable=False, default=0)

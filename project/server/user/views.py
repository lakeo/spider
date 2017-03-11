# project/server/user/views.py


#################
#### imports ####
#################

from flask import render_template, Blueprint, url_for
from flask_login import login_user, logout_user, login_required


################
#### config ####
################

user_blueprint = Blueprint('user', __name__,)


################
#### routes ####
################

@user_blueprint.route('/members')
@login_required
def members():
    return render_template('user/members.html')

#!/usr/bin/env python3
'''
The MIT License (MIT)

Copyright (c) 2016 Stefan Lohmaier

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
'''

import os

import flask
from flask import Flask, render_template, request
from flask_socketio import SocketIO
from flask.ext.login import LoginManager, UserMixin
from flask.ext.login import login_required, login_user, logout_user
from easysettings import EasySettings

from flashforge import FlashForge

#some default values
DEFAULT_PASSWORD = 'flamo'

#create the app
app = Flask('flamo')
app.config['SECRET_KEY'] = os.environ.get('FLAMO_SECRET_KEY', 'flamo')

#login manager
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'

#socket io server
socketio = SocketIO(app)

#settings
settings = EasySettings('flamo.conf')

#printer
#ff = FlashForge()

#dummy user class for flask-login
class User(UserMixin):
	def get_id(self):
		return 'user'

@login_manager.user_loader
def load_user(id):
	return User()

@login_manager.request_loader
def load_user_request(request):
	token = request.headers.get('Authorization')
	if token is None:
		token = request.args.get('token')
	
	if token == settings.get('password'):
		return User()
	else:
		return None

#non socketio routes
@app.route('/', methods=['GET'])
@login_required
def index():
	return render_template('index.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
	if request.method == 'POST':
		request.form['password'] == settings.get('password', 'flamo')
		login_user(User())
		return flask.redirect('/')
	
	return render_template('login.html')

@app.route('/logout')
@login_required
def logout():
	logout_user()
	flask.redirect('/login')

if __name__ == '__main__':
	socketio.run(app, debug=True)

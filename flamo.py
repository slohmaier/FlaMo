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
import time

from queue import Queue
from threading import Thread

import flask
from flask import Flask, render_template, request
from flask_socketio import SocketIO
from flask_login import LoginManager, UserMixin
from flask_login import login_required, login_user, logout_user
from flask_reverse_proxy import FlaskReverseProxied
from easysettings import EasySettings

from flashforge import FlashForge

'''
Setup the app and all subsytems
'''
#some default values
DEFAULT_PASSWORD = 'flamo'

#create the app
app = Flask('flamo')
app.config['SECRET_KEY'] = os.environ.get('FLAMO_SECRET_KEY', 'flamo')
proxied = FlaskReverseProxied(app)

#login manager
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'

#socket io server
socketio = SocketIO(app)

#settings
settings = EasySettings('flamo.conf')

'''
Implementation
'''
class FlashForgeIO(Thread):
	def __init__(self, reconnect_timeout=5, vendorid=0x2b71, deviceid=0x0001):
		Thread.__init__(self)
		self.queue = Queue()
	
	def run(self):
		app.logger.info('[FlashforgeIO] started')
		ff = FlashForge()
		while True:
			app.logger.info('[FlashForgeIO] Waiting for next GCode command')
			command = self.queue.get()
			if not command.endswith('\n'):
				command += '\n'
			socketio.emit('terminal', '> ' + command)
			app.logger.info('[FlashForgeIO]  Executing command: {0}'.format(command))
			
			try:
				data = ff.gcodecmd(command)
				if not data.endswith('\n'):
					data += '\n'
				socketio.emit('terminal', '< ' + data)
				self.queue.task_done()
			except FlashForgeError as error:
				socketio.emit('terminal', 'COMERROR: {0}'.format(error.message))

ffio = FlashForgeIO()

#default route index route
@app.route('/', methods=['GET'])
@login_required
def index():
	return render_template('index.html', streamurl=settings.get('streamurl'))

'''00
SocketIO callbacks
'''

@socketio.on('gcodecmd')
def socketio_machine_state(cmd):
	if not ffio.is_alive():
		ffio.start()
	print('LALA {0}'.format(cmd))
	ffio.queue.put(cmd)

'''
Authentication methods
'''
#dummy user class for flask-login
class User(UserMixin):
	def get_id(self):
		return 'user'

#function to load user for login-manager
@login_manager.user_loader
def load_user(id):
	return User()

#load user from request header
@login_manager.request_loader
def load_user_request(request):
	token = request.headers.get('Authorization')
	if token is None:
		token = request.args.get('token')
	
	if token == settings.get('password'):
		return User()
	else:
		return None

#login-view to show when not authenticated
@app.route('/login', methods=['GET', 'POST'])
def login():
	if request.method == 'POST':
		request.form['password'] == settings.get('password', 'flamo')
		login_user(User())
		return flask.redirect(request.form['next'])
	
	return render_template('login.html')

#route to logout
@app.route('/logout')
@login_required
def logout():
	logout_user()
	flask.redirect('/login')

'''
main-function? run devserver
'''
if __name__ == '__main__':
	socketio.run(app, host='0.0.0.0', port=5002, debug=True)

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

import time
import usb1

class FlashForgeError(Exception):
	def __init__(self, message, error):
		super(FlashForgeError, self).__init__(message)
		self.error = error

class FlashForge(object):
	ENDPOINT_CMD_IN   = 0x81
	ENDPOINT_CMD_OUT  = 0x01
	ENDPOINT_DATA_IN  = 0x83
	ENDPOINT_DATA_OUT = 0x03
	BUFFER_SIZE = 128
	
	def __init__(self, vendorid=0x2b71, deviceid=0x0001, autoconnect=True):
		self.vendorid = vendorid
		self.deviceid = deviceid
		
		self._context = usb1.USBContext()
		self._handle = self._context.openByVendorIDAndProductID(self.vendorid, self.deviceid)
		self._handle.claimInterface(0)

	def gcodecmd(self, cmd, timeout=10, retry_counter=5, retry_timeout=1):
		try:			
			self._handle.bulkWrite(self.ENDPOINT_CMD_IN, '~{0}\r\n'.format(cmd).encode())
			
			#read data until ok signals end
			data = ''
			cmd_done = False
			while not cmd_done:
				newdata = self._handle.bulkRead(self.ENDPOINT_CMD_OUT, self.BUFFER_SIZE, int(timeout*1000.0)).decode()

				if newdata.strip() == 'ok':
					cmd_done = True
				elif newdata.strip().endswith('ok'):
					cmd_done = True
				
				data = data + newdata
			
			#decode data
			return data.replace('\r', '')
		except usb1.USBError as usberror:
			#retry if retry_counter set
			if retry_counter > 0:
				#sleep and retry claiming interface
				success = False
				while not success and retry_counter > 0:
					#wait for timeout
					time.sleep(retry_timeout)
					
					#clean everything up
					self._handle.releaseInterface(0)
					self._handle.close()
					self._context.close()
					
					#open device
					self._context = usb1.USBContext()
					self._handle = self._context.openByVendorIDAndProductID(self.vendorid, self.deviceid)
					success = self._handle.claimInterface(0)
					retry_counter = retry_counter - 1
				
				if success:
					#if connection successfull gain control.
					self.gcodecmd('M601 S0')
					return self.gcodecmd(cmd, timeout, retry_counter-1, retry_timeout)
			
			raise FlashForgeError('USB Error', usberror)
	
	def __del__(self):
		try:
			self._handle.releaseInterface(0)
		except:
			pass

if __name__ == '__main__':
	ff = FlashForge()
	print(ff.gcodecmd('M601 S0'))
	print(ff.gcodecmd('M115'))
	try:
		print(ff.gcodecmd('M20'))
	except:
		pass
	print(ff.gcodecmd('M119'))
	print(ff.gcodecmd('M105'))

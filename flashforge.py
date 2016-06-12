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

import re
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
	
	def __init__(self, vendorid=0x2b71, deviceid=0x0001, autoconnect=True):
		self._context = usb1.USBContext()
		self.vendorid = vendorid
		self.deviceid = deviceid
		self._handle = self._context.openByVendorIDAndProductID(self.vendorid, self.deviceid)
		self.connected = False
		self.autoconnect = autoconnect
		
		if self.autoconnect:
			self.connect()
	
	def _gcodecmd(self, cmd):
		try:			
			self._handle.bulkWrite(self.ENDPOINT_CMD_IN, '~{0}\r\n'.format(cmd).encode())
			
			data = ''
			while True:
				newdata = self._handle.bulkRead(self.ENDPOINT_CMD_OUT, 128).decode().strip()
				if newdata == 'ok':
					return data.strip()
				elif newdata.endswith('ok'):
					return data + newdata[:-2]
				else:
					data += '{0}\n' .format(newdata)
		except usb1.USBError as usberror:
			self.connected = False
			raise FlashForgeError('USB Error')
	
	def connect(self):
		if not self.connected:
			self._handle.claimInterface(0)
			
			#request control
			res = self._gcodecmd('M601 S0').strip()
			if res.endswith('Control Success.'):
				self.connected = True
			else:
				raise FlashForgeError('Could not get control: {0}'.format(res))
	
	@staticmethod
	def match_info(identifier, info_raw):
		pattern = '.*' + identifier + ': ([\S ]*)'
		return re.match(pattern, info_raw, re.DOTALL).group(1)
	
	def machine_information(self):
		info_raw = self._gcodecmd('M115') + '\n'
		
		cordmatch = re.match(r'.*X:.*(\d+).*Y:.*(\d+).*Z:.*(\d+)', info_raw, re.DOTALL)
		
		return {
			'type': self.match_info('Machine Type', info_raw),
			'name': self.match_info('Machine Name', info_raw),
			'firmware': self.match_info('Firmware', info_raw),
			'sn': self.match_info('SN', info_raw),
			'position' : {
				'x': float(cordmatch.group(1)),
				'y': float(cordmatch.group(2)),
				'z': float(cordmatch.group(3))
			},
			'tools': self.match_info('Tool Count', info_raw)
		}
	
	def machine_status(self):
		info_raw = self._gcodecmd('M119')
		
		endstopmatch = re.match(r'.*Endstop: (\S+): (\d) (\S+): (\d) (\S+): (\d)', info_raw, re.DOTALL)
		endstopdict = {}
		for i in range(0, int(len(endstopmatch.groups())/2)):
			endstopdict[endstopmatch.groups()[i*2]] = endstopmatch.groups()[i*2+1]
		
		return {
			'status': self.match_info('MachineStatus', info_raw),
			'movemode': self.match_info('MoveMode', info_raw),
			'endstops': endstopdict
		}
	
	def temperatures(self):
		info_raw = self._gcodecmd('M105')
		temps = {}
		for identifier, current, target in re.findall(r'(\w+):(\d+) /(\d+)', info_raw):
			temps[identifier] = (current, target)
		return temps
	
	def set_leds(self, r, g, b):
		self._gcodecmd('M146 r{0} g{1}, b{2}'.format(r, g, b))
	
	def emergency_stop(self):
		self._gcodecmd('M112')

if __name__ == '__main__':
	ff = FlashForge()
	print(ff.machine_information())
	print(ff.temperatures())
	print(ff.machine_status())

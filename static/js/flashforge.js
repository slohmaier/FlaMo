var flashforge = new function() {
	this.machine = {
		name: null,
		type: null,
		firmware: null,
		sn: null,
		dimensions: {x: 0, y: 0, z: 0},
		toolcount: 0,
		endstops: {xmin: null, xmax: null, ymax: null, ymin: null,
			zmin: null, zmax: null},
		status: 'Unknown',
		movemode: 'Unknown'
	};
	
	this.parse_data = function(data) {
		var lines = data.match(/^.*(\n+|$)/gm);
		
		//Command Recevied must be in frist line
		var match = /^CMD ([MG]\d+) Received\.\n$/.exec(lines[0]);
		if (match === null) return; //just quit if not a command message.
		var command = match[1];
		
		switch (command) {
			//Machine information
			case 'M115':
				this.machine.type = lines[1].substr(14);
				this.machine.name = lines[2].substr(14);
				this.machine.firmware = lines[3].substr(4);
				this.machine.sn = lines[4].substr(2);
				match = /^X: (\d+)\s+Y: (\d+)\s+Z: (\d+)\n$/.exec(lines[5]);
				this.machine.dimensions.x = match[1];
				this.machine.dimensions.y = match[2];
				this.machine.dimensions.z = match[3];
				this.machine.toolcount = lines[6].substr(12);
				break;
			//Machine status
			case 'M119':
				match = /^Endstop: (\S+): (\d+) (\S+): (\d+) (\S+): (\d+)\n$/.exec(lines[1]);
				this.machine.endstops[match[1].replace('-', '').toLowerCase()] = match[2] == '1';
				this.machine.endstops[match[2].replace('-', '').toLowerCase()] = match[4] == '1';
				this.machine.endstops[match[3].replace('-', '').toLowerCase()] = match[6] == '1';
				this.machine.status = lines[2].substr(15);
				this.machine.movemode = lines[3].substr(10);
			default:
				break;
		}
		
		return command;
	};
};
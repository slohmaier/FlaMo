var MAX_TEMPCHART_AGE = 60000; //60s

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
		movemode: 'Unknown',
		sdcard: {progress: 0},
		tempdatapoints: {},
		targetdatapoints: {},
		tempdata: {}
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
				this.machine.type = lines[1].substr(14).trim();
				this.machine.name = lines[2].substr(14).trim();
				this.machine.firmware = lines[3].substr(4).trim();
				this.machine.sn = lines[4].substr(2).trim();
				match = /^X: (\d+)\s+Y: (\d+)\s+Z: (\d+)\n$/.exec(lines[5]);
				this.machine.dimensions.x = match[1];
				this.machine.dimensions.y = match[2];
				this.machine.dimensions.z = match[3];
				this.machine.toolcount = lines[6].substr(12).trim();
				break;
			//Machine status
			case 'M119':
				match = /^Endstop: (\S+): (\d+) (\S+): (\d+) (\S+): (\d+)\n$/.exec(lines[1]);
				this.machine.endstops[match[1].replace('-', '').toLowerCase()] = match[2] == '1';
				this.machine.endstops[match[2].replace('-', '').toLowerCase()] = match[4] == '1';
				this.machine.endstops[match[3].replace('-', '').toLowerCase()] = match[6] == '1';
				this.machine.status = lines[2].substr(15).trim();
				this.machine.movemode = lines[3].substr(10).trim();
				break;
			//SD Build Progress
			case 'M27':
				match = /^SD printing byte (\d+)\/(\d+)\n$/.exec(lines[1]);
				this.machine.sdcard.progress = 100 * parseInt(match[1]) / parseInt(match[2]);
				break;
			//Temperatures
			case 'M105':
				var re = /(\S+)\:\s*(\d+)\s*\/(\d+)/g;
				while (match = re.exec(lines[1])) {
					var temp_title = match[1];
					var temp_current = match[2];
					var temp_target = match[3];
					
					//set current temp
					this.machine.tempdata[temp_title] = {
						target: temp_target,
						current: temp_current
					};
					
					//create datapoints list if it does not exist
					if (this.machine.tempdatapoints[temp_title] === undefined) {
						this.machine.tempdatapoints[temp_title] = [];
						this.machine.targetdatapoints[temp_title] = [];
					}
					
					//add datapoint
					var current_date = new Date();
					this.machine.tempdatapoints[temp_title].push({
						x: current_date,
						y: parseInt(temp_current)
					});
					this.machine.targetdatapoints[temp_title].push({
						x: current_date,
						y: parseInt(temp_target)
					});
					if (current_date.now() - this.machine.tempdatapoints[temp_title][0].now() > MAX_TEMPCHART_AGE) {
						this.machine.tempdatapoints[temp_title].shift();
						this.machine.targetdatapoints[temp_title].shift();
					}
				}
			default:
				break;
		}
		
		return command;
	};
};

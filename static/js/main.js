var socket = io.connect();

//refresh machine information
function refresh_machine_information() {
	$('#machine_name').text(flashforge.machine.name);
	$('#machine_type').text(flashforge.machine.type);
}

//refresh machine status
function refresh_machine_status() {
	switch (flashforge.machine.status) {
		case 'READY':
			$('#machine_state').text('Idling');
			break;
		case 'BUILDING_FROM_SD':
			$('#machine_state').text('Printing from SD Card ' + flashforge.machine.sdcard.progress.toString() + '%');
			break;
	}
}
var machine_state_uimap = {
};

//refresh tempchart and text display
var chart = new CanvasJS.Chart('tempchart', {
	title: {text: 'Loading ...'},
	data: [{
		type: 'line',
		dataPoints: []
	}]
});
chart.render();
var chart_colors = [
	'#ff0000',
	'#00ff00',
	'#0000ff'
];
var target_colors = [
	'rgba(255,0,0,0.5)',
	'rgba(0,255,0,0.5)',
	'rgba(0,0,255,0.5)',
];
var temptitles_pretty = {
	'Flashforge Dreamer': {
		'T0': 'Right Extruder',
		'T1': 'Left Extruder',
		'B': 'Heat Bead'
	}
};

function refresh_temps() {
	var temp_titles = Object.keys(flashforge.machine.tempdatapoints);
	
	if (chart.options.data[0].dataPoints.length == 0) {
		//first time update.
		//Construct Ui
		var newdata = [];
		$('#tempforms').empty();
		for (var i=0; i<temp_titles.length; i++) {
			var temp_title = temp_titles[i];
			//create data plot lines
			newdata.push({
				type: 'line',
				showInLegend: true,
				name: temptitles_pretty[flashforge.machine.type][temp_title],
				lineThickness: 2,
				color: chart_colors[i],
				dataPoints: flashforge.machine.tempdatapoints[temp_title]
			});
			
			//create target plotlines
			newdata.push({
				type: 'stepLine',
				showInLegend: false,
				lineThickness: 2,
				color: target_colors[i],
				dataPoints: flashforge.machine.targetdatapoints[temp_title]
			});
			
			//create controls for each tool
			$('#tempforms').append(
				'<div class="row"><form id="tempform_' + temp_title + '" class="form-inline">\n' + 
				'	<div class="col-xs-3"><h3 class="panel-title pull-left">' + temptitles_pretty[flashforge.machine.type][temp_title] + '</h3></div>\n' +
				'	<span>Current: <span id="tempcurrent_' + temp_title + '"></span> / \n' +
				'	<input type="text" class="form-control tempset-input" id="tempset_' + temp_title + '" value="" placeholder="Off">\n' + 
				'	<button type="submit" class="btn">Set</button>\n' +
				'</form></div>\n'
			);
			
			//submit function for temperature setting
			$('#tempform_' + temp_title).submit(function(e) {
				//don't send form to server
				e.preventDefault();
				
				//set tool or bed temperature
				var form = $(this).parents('form:first');
				temp_title = e.target.attributes.id.value.replace('tempform_', '');
				socket.emit(
					'gcodecmd',
					temp_title == 'B' ?
					'M140 S'+ $('#tempset_' + temp_title).val() :
					'M104 S' + $('#tempset_' + temp_title).val() + ' ' + temp_title
				);
				
			});
		}
		
		//set general chart settings
		chart.options.data = newdata;
		chart.options.title.text = '';
	}
	
	//set current temps
	for (var i=0; i<temp_titles.length; i++) {
		var temp_title = temp_titles[i];
		$('#tempcurrent_' + temp_title).text(flashforge.machine.tempdatapoints[temp_title][flashforge.machine.tempdatapoints[temp_title].length-1].y);
		if (!$('#tempset_' + temp_title).is(':focus')) {
			var target_temp = flashforge.machine.targetdatapoints[temp_title][flashforge.machine.targetdatapoints[temp_title].length-1].y;
			$('#tempset_' + temp_title).val(target_temp == 0 ? '' : target_temp.toString());
		}
	}
	
	//render chart and request new temps
	chart.render();
	setTimeout(
		function() {
			socket.emit('gcodecmd', 'M105');
		},
		1000
	);
};

//handle output from printer
socket.on('terminal', function(data) {
	$('#terminal').text($('#terminal').text() + data);
	$('#terminal').scrollTop($('#terminal')[0].scrollHeight);
	
	if (data.startsWith('< ')) {
		//update ui if neccessary
		command = flashforge.parse_data(data.substr(2));
		switch (command) {
			case 'M115': refresh_machine_information(); break;
			case 'M119':
				refresh_machine_status();
				setTimeout(
					function() {
						socket.emit('gcodecmd', 'M119');
					},
					5000
				);
				break;
			case 'M27':
				refresh_machine_status();
				setTimeout(
					function() {
						socket.emit('gcodecmd', 'M27');
					},
					5000
				);
				break;
			case 'M105': refresh_temps(); break;
			default: break;
		}
	}
});

//function to send gcode on form submit
$('#gcode_cmd_form').submit(function(e) {
	//only send command there is something
	var cmd = $('#gcode_cmd').val();
	if (cmd.length > 1) {
		socket.emit('gcodecmd', cmd);
	}
	
	//don't send form to server
	e.preventDefault();
});

//ask for basic information at the start
socket.emit('gcodecmd', 'M115');
socket.emit('gcodecmd', 'M119');
socket.emit('gcodecmd', 'M105');
socket.emit('gcodecmd', 'M27');

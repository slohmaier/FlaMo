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

function refresh_temps() {
	if (chart.options.data[0].dataPoints.length == 0) {
		var newdata = [];
		var temp_titles = Object.keys(flashforge.machine.tempdatapoints);
		for (var i=0; i<temp_titles.length; i++) {
			var temp_title = temp_titles[i];
			newdata.push({
				type: 'line',
				showInLegend: true,
				name: temp_title,
				lineThickness: 2,
				color: chart_colors[i],
				dataPoints: flashforge.machine.tempdatapoints[temp_title]
			});
			newdata.push({
				type: 'stepLine',
				showInLegend: false,
				lineThickness: 2,
				color: target_colors[i],
				dataPoints: flashforge.machine.targetdatapoints[temp_title]
			});
		}
		chart.options.data = newdata;
		chart.options.title.text = '';
	}
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
socket.emit('gcodecmd', 'M105');
socket.emit('gcodecmd', 'M115');
socket.emit('gcodecmd', 'M119');
socket.emit('gcodecmd', 'M27');

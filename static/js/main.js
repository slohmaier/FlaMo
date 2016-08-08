var socket = io.connect(window.URL);

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

function refresh_temps() {
	if (chart.options.data[0].dataPoints.length == 0) {
		var newdata = [];
		var temp_titles = Object.keys(flashforge.machine.tempdatapoints);
		for (var i=0; i<temp_titles.length; i++) {
			var temp_title = temp_titles[i];
			newdata.push({
				type: 'line',
				dataPoints: flashforge.machine.tempdatapoints[temp_title]
			});
		}
		chart.options.data = newdata;
	}
	chart.render();
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
			case 'M119': case 'M27': refresh_machine_status(); break;
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

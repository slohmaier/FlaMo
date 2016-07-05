var socket = io.connect(window.URL);

//refresh machine information
function refresh_machine_information() {
	$('#machine_name').text(flashforge.machine.name);
	$('#machine_type').text(flashforge.machine.type);
}

//refresh machine status
function refresh_machine_status() {
	$('#machine_state').text(flashforge.machine.status);
}

//handle output from printer
socket.on('terminal', function(data) {
	$('#terminal').text($('#terminal').text() + data);
	
	if (data.startsWith('< ')) {
		//update ui if neccessary
		command = flashforge.parse_data(data.substr(2));
		switch (command) {
			case 'M115': refresh_machine_information(); break;
			case 'M119': refresh_machine_status(); break;
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

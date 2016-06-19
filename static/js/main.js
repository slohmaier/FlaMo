var socket = io.connect();

socket.on('terminal', function(data) {
	$('#terminal').text($('#terminal').text() + data);
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

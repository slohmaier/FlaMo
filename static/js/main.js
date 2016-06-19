var socket = io.connect();

socket.on('terminal', function(data) {
	$('#terminal').text($('#terminal').text() + data);
});

$('#gcode_cmd_send').click(function() {
	var cmd = $('#gcode_cmd').val();
	if (cmd.length > 1) {
		socket.emit('gcodecmd', cmd);
	}
});

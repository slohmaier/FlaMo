var socket = io.connect();

socket.on('machine_state', function(state) {
	$('#machine_state').text(state.status);
});

socket.emit('get_machine_state');

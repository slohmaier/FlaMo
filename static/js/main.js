var socket = io.connect();

socket.on('machine_state', function(state) {
	$('#machine_state').text(state.status);
});

socket.on('machine_information', function(info) {
	$('#machine_name').text(info.name);
	$('#machine_name').tooltip({
		content: function() {
			return 'Machine Type: ' + info.type + '\n' +
				'Firmware Version: ' + info.firmware + '\n' +
				'Serial No.: ' + info.sn;
		}
	});
});

socket.emit('hello');

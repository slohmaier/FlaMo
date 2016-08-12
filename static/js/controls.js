//color picker for led lights
$('#ledcolor').spectrum({
	allowEmpty: true,
	change: function(color) {
		var rgbcolor = color.toRgb();
		socket.emit('gcodecmd', 'M146 r' + rgbcolor.r + ' g' + rgbcolor.g + ' b' + rgbcolor.b);
	}
});

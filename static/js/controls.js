//color picker for led lights
$('#ledcolor').spectrum({
	allowEmpty: true,
	change: function(color) {
		var rgbcolor = color.toRgb();
		socket.emit('gcodecmd', 'M146 r' + rgbcolor.r + ' g' + rgbcolor.g + ' b' + rgbcolor.b);
	}
});

$('#move_xy_home').click(function(){
	socket.emit('gcodecmd', 'G28 X Y');
});

$('#move_x_up_100').click(function(){
});
$('#move_x_up_10').click(function(){
});
$('#move_x_up_1').click(function(){
});
$('#move_x_up_01').click(function(){
});
$('#move_x_down_01').click(function(){
});
$('#move_x_down_1').click(function(){
});
$('#move_x_down_10').click(function(){
});
$('#move_x_down_100').click(function(){
});

$('#move_y_up_100').click(function(){
});
$('#move_y_up_10').click(function(){
});
$('#move_y_up_1').click(function(){
});
$('#move_y_up_01').click(function(){
});
$('#move_y_down_01').click(function(){
});
$('#move_y_down_1').click(function(){
});
$('#move_y_down_10').click(function(){
});
$('#move_y_down_100').click(function(){
});

$('#move_xy_home').click(function(){
	socket.emit('gcodecmd', 'G28 Z');
});

$('#move_z_up_100').click(function(){
});
$('#move_z_up_10').click(function(){
});
$('#move_z_up_1').click(function(){
});
$('#move_z_up_01').click(function(){
});
$('#move_z_down_01').click(function(){
});
$('#move_z_down_1').click(function(){
});
$('#move_z_down_10').click(function(){
});
$('#move_z_down_100').click(function(){
});

$('#move_e_up_100').click(function(){
});
$('#move_e_up_10').click(function(){
});
$('#move_e_up_1').click(function(){
});
$('#move_e_up_01').click(function(){
});
$('#move_e_down_01').click(function(){
});
$('#move_e_down_1').click(function(){
});
$('#move_e_down_10').click(function(){
});
$('#move_e_down_100').click(function(){
});

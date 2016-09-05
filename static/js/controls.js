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

function gcode_G1(cmd) {
	socket.emit('gcodecmd', 'G91');
	socket.emit('gcodecmd', 'G1 ' + cmd);
	socket.emit('gcodecmd', 'G90');
}

$('#move_x_up_100').click(function(){
	gcode_G1('X+100');
});
$('#move_x_up_10').click(function(){
	gcode_G1('X+10');
});
$('#move_x_up_1').click(function(){
	gcode_G1('X+1');
});
$('#move_x_up_01').click(function(){
	gcode_G1('X+0.1');
});
$('#move_x_down_01').click(function(){
	gcode_G1('X-0.1');
});
$('#move_x_down_1').click(function(){
	gcode_G1('X-1');
});
$('#move_x_down_10').click(function(){
	gcode_G1('X-10');
});
$('#move_x_down_100').click(function(){
	gcode_G1('X-100');
});

$('#move_y_up_100').click(function(){
	gcode_G1('Y+100');
});
$('#move_y_up_10').click(function(){
	gcode_G1('Y+10');
});
$('#move_y_up_1').click(function(){
	gcode_G1('Y+1');
});
$('#move_y_up_01').click(function(){
	gcode_G1('Y+0.1');
});
$('#move_y_down_01').click(function(){
	gcode_G1('Y-0.1');
});
$('#move_y_down_1').click(function(){
	gcode_G1('Y-1');
});
$('#move_y_down_10').click(function(){
	gcode_G1('Y-10');
});
$('#move_y_down_100').click(function(){
	gcode_G1('Y-100');
});

$('#move_xy_home').click(function(){
	socket.emit('gcodecmd', 'G28 XY');
});

$('#move_z_up_100').click(function(){
	gcode_G1('Z+100');
});
$('#move_z_up_10').click(function(){
	gcode_G1('Z+10');
});
$('#move_z_up_1').click(function(){
	gcode_G1('Z+1');
});
$('#move_z_up_01').click(function(){
	gcode_G1('Z+0.1');
});
$('#move_z_down_01').click(function(){
	gcode_G1('Z-0.1');
});
$('#move_z_down_1').click(function(){
	gcode_G1('Z-1');
});
$('#move_z_down_10').click(function(){
	gcode_G1('Z-10');
});
$('#move_z_down_100').click(function(){
	gcode_G1('Z-100');
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

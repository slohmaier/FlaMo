//initialize temperature chart and display as loading
var chart = new CanvasJS.Chart('tempchart', {
	title: {text: 'Loading ...'},
	data: [{
		type: 'line',
		dataPoints: []
	}]
});
chart.render();

//define colors for charts
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
//pretty titles for temperature shortnames
var temptitles_pretty = {
	'Flashforge Dreamer': {
		'T0': 'Right Extruder',
		'T1': 'Left Extruder',
		'B': 'Heat Bead'
	}
};

//main display function for temperature ui
function refresh_temps() {
	var temp_titles = Object.keys(flashforge.machine.tempdatapoints);
	
	if (chart.options.data[0].dataPoints.length == 0) {
		//first time update.
		//Construct Ui
		var newdata = [];
		$('#tempforms').empty();
		for (var i=0; i<temp_titles.length; i++) {
			var temp_title = temp_titles[i];
			//create data plot lines
			newdata.push({
				type: 'line',
				showInLegend: true,
				name: temptitles_pretty[flashforge.machine.type][temp_title],
				lineThickness: 2,
				color: chart_colors[i],
				dataPoints: flashforge.machine.tempdatapoints[temp_title]
			});
			
			//create target plotlines
			newdata.push({
				type: 'stepLine',
				showInLegend: false,
				lineThickness: 2,
				color: target_colors[i],
				dataPoints: flashforge.machine.targetdatapoints[temp_title]
			});
			
			//create controls for each tool
			$('#tempforms').append(
				'<div class="row"><form id="tempform_' + temp_title + '" class="form-inline">\n' + 
				'	<div class="col-xs-3"><h3 class="panel-title pull-left">' + temptitles_pretty[flashforge.machine.type][temp_title] + '</h3></div>\n' +
				'	<span>Current: <span id="tempcurrent_' + temp_title + '"></span> / \n' +
				'	<input type="text" class="form-control tempset-input" id="tempset_' + temp_title + '" value="" placeholder="Off">\n' + 
				'	<button type="submit" class="btn">Set</button>\n' +
				'</form></div>\n'
			);
			
			//submit function for temperature setting
			$('#tempform_' + temp_title).submit(function(e) {
				//don't send form to server
				e.preventDefault();
				
				//set tool or bed temperature
				var form = $(this).parents('form:first');
				temp_title = e.target.attributes.id.value.replace('tempform_', '');
				socket.emit(
					'gcodecmd',
					temp_title == 'B' ?
					'M140 S'+ $('#tempset_' + temp_title).val() :
					'M104 S' + $('#tempset_' + temp_title).val() + ' ' + temp_title
				);
				
			});
		}
		
		//set general chart settings
		chart.options.data = newdata;
		chart.options.title.text = '';
	}
	
	//set current temps
	for (var i=0; i<temp_titles.length; i++) {
		var temp_title = temp_titles[i];
		$('#tempcurrent_' + temp_title).text(flashforge.machine.tempdatapoints[temp_title][flashforge.machine.tempdatapoints[temp_title].length-1].y);
		if (!$('#tempset_' + temp_title).is(':focus')) {
			var target_temp = flashforge.machine.targetdatapoints[temp_title][flashforge.machine.targetdatapoints[temp_title].length-1].y;
			$('#tempset_' + temp_title).val(target_temp == 0 ? '' : target_temp.toString());
		}
	}
	
	//render chart and request new temps
	chart.render();
	setTimeout(
		function() {
			socket.emit('gcodecmd', 'M105');
		},
		1000
	);
};

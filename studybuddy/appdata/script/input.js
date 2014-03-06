/* input.js
 * Input-related handlers go here (e.g. click listeners, mouse movement listeners, etc)
 */
 
document.getElementById("point_annotation_edit").addEventListener('input', function(event){
	document.getElementById("point_annotation_div").current_point.annotation = document.getElementById("point_annotation_edit").value;
});

image_canvas.addEventListener('mousemove', function(event) {
	if(drag){
		delta++;
		if(delta > 2){
			justdragged = true;
			if(!moving_point){
				var x = event.pageX - image_canvas.offsetLeft;
				var y = event.pageY - image_canvas.offsetTop;
				
				if(current_event < 0){
					return;
				}
				
				for(var i = 0; i < recording.Events[current_event].Points.length; i++){
					var a_point = recording.Events[current_event].Points[i];
					if(x >= a_point.x - 10 && x <= a_point.x + 10){
						if(y >= a_point.y - 10 && y <= a_point.y + 10){
							moving_point = recording.Events[current_event].Points[i];
						}
					}
				}
			}
			if(!moving_point || moving_point.locked){
				return;
			}
			moving_point.x = event.clientX;
			moving_point.y = event.clientY;
		}
	} else {
		var x = event.clientX;
		var y = event.clientY;
		
		if(y > (image_canvas.height - 1/6 * image_canvas.height)){
			seek_display = true;
		} else {
			seek_display = false;
		}
		
		if(seek_canvas.relativeX <= x && x <= seek_canvas.relativeX + seek_canvas.width && seek_canvas.relativeY <= y && y <= seek_canvas.relativeY + seek_canvas.height && recording){
			x = event.clientX - seek_canvas.relativeX;
			y = event.clientY - seek_canvas.relativeY;
			var mo_event = get_event((x / (seek_canvas.width - 15)) * audio.duration);
			seek_draw = true;
			seek_draw_event = mo_event;
			seek_draw_x = event.clientX;
		} else {
			seek_draw = false;
		}
	}
});

image_canvas.addEventListener('mouseup', function(event) {
	delta = 0;
	drag = false;
	moving_point = undefined;
});

image_canvas.addEventListener('mousedown', function(event) {
	drag = true;
});

// Click listener for translating coordinates and passing them to what handles them 
image_canvas.addEventListener('click', function(event) {
	if(editing_point){
		editing_point = false;
		document.getElementById("point_annotation_div").style.display = "none";
		document.getElementById("point_annotation_div").current_point = undefined;
		return;
	}
	// Don't want to register a click if we just dragged (which js will do), so 
	// detect our just having dragged and return from the function. 
	if(justdragged){
		justdragged = false;
		return;
	}

	
	// Hide the point context menu if it's displaying
	point_ctx_display = false;
	point_ctx.style.display ="none";
	
	var x = event.pageX - image_canvas.offsetLeft;
	var y = event.pageY - image_canvas.offsetTop;
	
	if(!recording){
		return;
	}
	
	// Checking if the click is in the seek bar
	if(seek_canvas.relativeX <= x && x <= seek_canvas.relativeX + seek_canvas.width && seek_canvas.relativeY <= y && y <= seek_canvas.relativeY + seek_canvas.height){
		console.log("Clicked the seek bar at (" + x +", " + y + ").");
		audio.currentTime = seek_calculate(x);
	// Else, the click isn't in the bar, so we want to pause/play the video
	}else{
		if(current_event >= 0){
			// Iterate through all active points; if within the 
			// Bounds of a point, flip its active state and return
			// (so as not to pause inadvertently the recording
			for(var i = 0; i < recording.Events[current_event].Points.length; i++){
				var current_point = recording.Events[current_event].Points[i];
				if(x >= current_point.x - 10 && x <= current_point.x + 10){
					if(y >= current_point.y - 10 && y <= current_point.y + 10){
						console.log("Flipping a point's active state...");
						recording.Events[current_event].Points[i].active = !(recording.Events[current_event].Points[i].active);
						return;
					}
				}
				
				lines = current_point.annotation.split(/\r\n|\r|\n/);
				var heightcalc = 12 * lines.length + 12;
				
				var xstart;
				var ystart;
				
				if(current_point.x + current_point.width > image_canvas.width 
					|| current_point.orientation == 2 
					|| current_point.orientation == 3){
					xstart = current_point.x - current_point.width;
				} else {
					xstart = current_point.x;
				}
				
				if(current_point.y + heightcalc > image_canvas.height 
					|| current_point.orientation == 1 
					|| current_point.orientation == 2){
					ystart = current_point.y - heightcalc;
				} else {
					ystart = current_point.y;
				}
				if(current_point.active){
					if(x >= xstart && x <= xstart + current_point.width){
						if(y >= ystart && y <= ystart + heightcalc){
							editing_point = true;
							var elem = document.getElementById("point_annotation_div");
							var elem2 = document.getElementById("point_annotation_edit");
							elem2.value = current_point.annotation;
							//elem.style.width = current_point.width;
							elem.style.display = "block";
							elem.style.left = xstart + "px";
							elem.style.top = ystart + "px";
							elem.current_point = current_point;
							return; 
						}
					}
				}
			}
		}
		console.log("Clicked the main canvas at (" + x +", " + y + ").");
		if(audio.paused){
			audio.play();
			play_pause_time = 3;
		} else {
			audio.pause();
			play_pause_time = 3;
		}
	}
}, false);

// Right click event; for now, adds an annotation at that point from the annotation input box's value	
image_canvas.addEventListener('contextmenu', function(event) {
	// Don't want the browser's context menu to pop up for now
	event.preventDefault();
	point_ctx.style.display = "block";
	point_ctx.style.left = event.clientX + "px";
	point_ctx.style.top = event.clientY + "px";
	
	var x = event.pageX - image_canvas.offsetLeft;
	var y = event.pageY - image_canvas.offsetTop;
	if(!recording || !recording.Events[current_event]){
		return;
	}
	console.log("Adding a point");
	add_point(x, y, "This is a default annotation\nwith multiple lines\n Click to edit");
}, false);

function point_display_options(elem){
	var elemdiv = document.getElementById("point_more_options_div");
	var elemdiv2 = document.getElementById("point_annotation_div");
	if(elemdiv.style.display == "none" || elemdiv.style.display == ""){
		elemdiv2.style.borderBottomWidth = 0 + "px";
		elem.value = "Less Options";
		elemdiv.style.display = "block";
	} else {
		elemdiv2.style.borderBottomWidth = 8 + "px";
		elem.value = "More Options";
		elemdiv.style.display = "none";
	}
}

function delete_point(elem){
	for(var i = 0; i < recording.Events[current_event].Points.length; i++){
		if(recording.Events[current_event].Points[i] === document.getElementById("point_annotation_div").current_point){
			console.log("Deleted a point.");
			recording.Events[current_event].Points.splice(i, 1);
			elemdiv2 = document.getElementById("point_annotation_div").style.display = "none";
		}
	}
}

function point_change_opacity(elem){
	var opacity = elem.value / 100;
	document.getElementById("point_annotation_div").current_point.opacity = opacity;
}

function point_change_color(elem){
	document.getElementById("point_annotation_div").current_point.color = elem.value;
}

function point_set_lock(elem){
	document.getElementById("point_annotation_div").current_point.locked = elem.checked;
}

function point_orientation(elem){
	document.getElementById("point_annotation_div").current_point.orientation = elem.value;
}
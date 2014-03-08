/* events.js
 * Handles event switching and loading, including loading new recordings
 */
 
// -1 is before the first annotation
// -2 is after the last annotation
function update_event(current_event, events, current_time){
	if(events[events.length - 1].time + events[events.length - 1].duration < current_time){
		return -2;
		event_switched = true;
	}
	
	if(events[0].time > current_time){
		return -1;
		event_switched = true;
	}
	
	for(var i = 0; i < events.length; i++){
		if(events[i].time <= current_time && events[i].time + events[i].duration >= current_time){
			if(i != current_event){
				event_switched = true;
			}
			return i;
		}
	}
	return -3;
}

function get_event(time){
	for(var i = 0; i < recording.Events.length; i++){
		if(recording.Events[i].time <= time && recording.Events[i].time + recording.Events[i].duration >= time){
			return i;
		}
	}
}

// Load a recording picked from the browser
function load_recording(elem){
	console.log("LOADING INDEX " + elem.id);
	recording = master.Recordings[elem.id];
	//audio.src = path + "data/" + recording.audio;
	wd.getFile("data/" + recording.audio, function(athing){
		console.log("1...");
		console.log(athing);
	}, function(entry){
		console.log("2...");
		entry.file(function(afile){
			audio.src = webkitURL.createObjectURL(afile);
		});
	});
	
	elem.style.color = "#00ff00";	
	audio.load();
	current_event = -1;

	for(var i = 0; i < recording.Events.length; i++){
		var animg = new Image();
		animg.onload = function(){
			console.log("loaded");
		}
		images.push(animg);
	}
	
	for(var i = 0; i < recording.Events.length; i++){
		//images[i].src = path + "data/" + recording.Events[i].image;
		load_image(i);
	}
	console.log("IMAGES");
	console.log(images);
}

function load_image(index){
	wd.getFile("data/" + recording.Events[index].image, function(athing){
		console.log("1...");
		console.log(athing);
	}, function(entry){
		console.log("2...");
		entry.file(function(afile){
			images[index].src = webkitURL.createObjectURL(afile);
			console.log("WEBKIT URL:");
			console.log(webkitURL.createObjectURL(afile));
			console.log(images[index].src);
		});
	});
}

function add_point(x, y, ptannot){
	var apoint = {
		"x":0,
		"y":0,
		"annotation":"",
		"active":true,
		"orientation":0,
		"color":"#00ff00",
		"opacity":0.75,
		"locked":false,
		"width":200
	};
	apoint.x = x;
	apoint.y = y;
	apoint.annotation = ptannot;
	recording.Events[current_event].Points.push(apoint);
	console.log(JSON.stringify(master));
}


// Calculates time to seek to based on x position of click on the seek bar
function seek_calculate(x){
	var time;
	x -= seek_canvas.relativeX;
	if(x - 5 <= 0){
		return 0;
	}
	x -= 10;
	time = (x / (seek_canvas.width - 15)) * audio.duration;
	return time;
}
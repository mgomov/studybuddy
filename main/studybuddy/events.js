
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

// TODO
function add_annotation(time, duration, text, image, events){
	
}

// TODO
function edit_annotation(time, duration, text, image, event_number){

}

// TODO
function remove_annotation(event_number){

}

function add_point(x, y, ptannot){
	var apoint = {
		"x":0,
		"y":0,
		"annotation":"",
		"active":true
	};
	apoint.x = x;
	apoint.y = y;
	apoint.annotation = ptannot;
	recording.Events[current_event].Points.push(apoint);
}
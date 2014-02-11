
// -1 is before the first annotation
// -2 is after the last annotation
function next_image(current_event, events, current_time){
	if(events[events.length - 1].time < current_time){
		return -2;
	}
	
	if(events[0].time < current_time){
		return -1;
	}
	
	if(current_event == -1 && events[0].time >= current_time){
		return 0;
	}
	
	for(var i = 1; i < events.length; i++){
		if(events[i].time >= current_time && events[i].time + events[i].duration > current_time){
			return i;
		}
	}
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
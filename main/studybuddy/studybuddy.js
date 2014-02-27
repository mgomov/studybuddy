// Width and height, for general use
var w = window.innerWidth;
var h = window.innerHeight;

// The current recording file's parsed JSON
var recording;
// Recording file's name
var recording_file;
// Current event (integer, index for recording.Events)
var current_event;

// Audio player
var audio = document.getElementById("audio_player");

// The main image canvas
var image_canvas = document.getElementById("image_canvas");
var image_context = image_canvas.getContext("2d");

// Image up for display currently
var main_image = document.getElementById("main_image");


// Convenience vars for switching between events... 
// Signals that an event was switched and some things need to happen
var event_switched = false;
// Signals that the image was fully loaded, done to prevent 'flashbacks' of
// previous image
var image_updated = false;

// The seek bar's canvas
var seek_canvas = document.getElementById("seek_canvas");
var seek_context = seek_canvas.getContext("2d");

// The seek bar's overlay canvas
var seek_overlay_canvas = document.getElementById("seek_overlay_canvas");
var seek_overlay_context = seek_overlay_canvas.getContext("2d");

// Annotation stream
var annotation_stream = document.getElementById("annotation_stream");
// Input box
var annotation_input = document.getElementById("annotation_input");

function exif_test(){
	var etest = document.getElementById("image_test");
	console.log(EXIF.getAllTags(etest));
	var timestamp = EXIF.getTag(etest, "DateTimeOriginal");
	console.log(timestamp);
}

// Click listener for translating coordinates and passing them to what handles them 
image_canvas.addEventListener('click', function(event) {
	var x = event.pageX - image_canvas.offsetLeft;
	var y = event.pageY - image_canvas.offsetTop;
	
	// Checking if the click is in the seek bar
	if(seek_canvas.relativeX <= x && x <= seek_canvas.relativeX + seek_canvas.width && seek_canvas.relativeY <= y && y <= seek_canvas.relativeY + seek_canvas.height){
		console.log("Clicked the seek bar at (" + x +", " + y + ").");
		audio.currentTime = seek_calculate(x);
	// Else, the click isn't in the bar, so we want to pause/play the video
	}else{
	
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
		}
		console.log("Clicked the main canvas at (" + x +", " + y + ").");
		if(audio.paused){
			audio.play();
		} else {
			audio.pause();
		}
	}
}, false);

// Right click event; for now, adds an annotation at that point from the annotation input box's value	
image_canvas.addEventListener('contextmenu', function(event) {
	console.log("Adding a point");
	var x = event.pageX - image_canvas.offsetLeft;
	var y = event.pageY - image_canvas.offsetTop;
	
	add_point(x, y, annotation_input.value);
	annotation_input.value = "";
}, false);

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

// The input box's event handler (so far, adds annotations to the text box)
function changed_input(val){
	if(event.charCode == 13) // if enter is pressed
	{	if(val.value.length > 2) // if annotation is longer than 2
		{
			var timeOfAnnotation = "";
			timeOfAnnotation += Math.floor(audio.currentTime / 3600);//hour
			timeOfAnnotation += ":";
			if (Math.floor((audio.currentTime % 3600) / 60) < 10)
				timeOfAnnotation += 0;
			timeOfAnnotation += Math.floor((audio.currentTime % 3600) / 60);//minute
			timeOfAnnotation += ":";
			if (Math.floor((audio.currentTime % 3600) % 60) < 10)
				timeOfAnnotation += 0;
			timeOfAnnotation += Math.floor((audio.currentTime % 3600) % 60);//second
			timeOfAnnotation += " ";
			annotation_stream.value += timeOfAnnotation;
			annotation_stream.value += val.value;
			annotation_stream.value += "\n\n";
			recording.Events[current_event].annotation = annotation_stream.value;
		}
		annotation_input.value = "";
	}
}

// Init function; called when window is resized as well as on startup
function init(){
	w = window.innerWidth;
	h = window.innerHeight;

	image_canvas.width = w;
	image_canvas.height = h;

	seek_canvas.width = image_canvas.width * (4/5);
	seek_canvas.height = 40;

	seek_overlay_canvas.width = seek_canvas.width;
	seek_overlay_canvas.height = seek_canvas.height;

	annotation_stream.style.width = w - (5/6) * w+ "px";
	annotation_stream.style.height = h - 100 + "px";

	annotation_input.style.width = annotation_stream.style.width;
	annotation_input.style.height = "90px";

	seek_canvas.relativeX = image_canvas.width * (1/10);
	seek_canvas.relativeY = image_canvas.height - seek_canvas.height - 50;
}

init();
render_main_screen();

// Adds render of the main canvas to a loop
setInterval(render_main_screen, 20);

// Main render function for the application
function render_main_screen(){
	
	// Do drawing of the seek bar
	// Third layer is the actual progress of the player
	draw_third_layer();
	
	// Second layer is the tracking bar outline/main bar
	draw_second_layer();
	
	// First layer is the image canvas
	draw_first_layer();
	
	// Add seek bar (in layers) on top of the image_context canvas
	image_context.drawImage(seek_canvas, seek_canvas.relativeX, 
		seek_canvas.relativeY);
	image_context.drawImage(seek_overlay_canvas, seek_canvas.relativeX, 
		seek_canvas.relativeY);
}

// Tracker overlay layer
// TODO: Clean up drawing of progress bar, is messy for now
function draw_third_layer(){
	var w = seek_overlay_canvas.width;
	var h = seek_overlay_canvas.height;
	seek_overlay_context.clearRect(0, 0, w, h);
	
	var gradient = seek_overlay_context.createLinearGradient(0, 0, w * (1.5), h * (1.5));
	
	gradient.addColorStop(0, "#B2FFB2");
	gradient.addColorStop(1, "#00ff00");
	
	image_context.fillStyle = gradient;
	
	seek_overlay_context.fillStyle = gradient;
	
	// Tried to clean up the parts of the seek bar when the seek bar is 
	// very small... still needs tuning but low priority
	if((seek_canvas.width - 10) * (audio.currentTime / audio.duration) == 0){
		// do nothing, since no progress
	}else if((seek_canvas.width - 10) * (audio.currentTime / audio.duration) < 25){
		roundRect(seek_overlay_context, 5, 5, (seek_canvas.width - 10) * 
			(audio.currentTime / audio.duration) , seek_canvas.height - 10, 15, true, true);
	}else{
		roundRect(seek_overlay_context, 5, 5, (seek_canvas.width - 10) * 
		(audio.currentTime / audio.duration) , seek_canvas.height - 10, 15, true, true);
	}
}

// Tracker layer
function draw_second_layer(){
	var w = seek_canvas.width;
	var h = seek_canvas.height;
	
	// Clear the context for drawing
	seek_context.clearRect(0, 0, w, h);
	
	// Arbitrary color 
	seek_context.fillStyle ="#7f7f7f";
	
	// Draw the seek bar's border
	roundRect(seek_context, 0, 0, seek_canvas.width, seek_canvas.height, 20, true, true);
	
	// Draw the actual seek bar
	seek_context.fillStyle ="#0f0f0f";
	roundRect(seek_context, 5, 5, seek_canvas.width - 10, seek_canvas.height - 10, 15, true, true);
}

// Image layer
function draw_first_layer(){
	var w = image_canvas.width;
	var h = image_canvas.height;
	image_context.clearRect(0, 0, w, h);
	
	// Some styling for the main image canvas, just a gradient
	var gradient = image_context.createLinearGradient(0, 0, w * (1.5), h * (1.5));
	
	gradient.addColorStop(0, "black");
	gradient.addColorStop(1, "gray");
	
	image_context.fillStyle = gradient;
	image_context.fillRect(0, 0, w, h);
	audio.volume = 0;
	
	
	// Handling drawing of images as well as advancing events
	if(recording != undefined){
	

	
		// Updates the current event if necessary
		current_event = update_event(current_event, recording.Events, audio.currentTime);
		
		// -1 means that we're before the recording, -2 means we're after 
		// the recording and -3 means we're in between events (dead space)
		if(current_event == -1 || current_event == -2 || current_event == -3){ 
			image_updated = false;
			return;
		}		
		// An event was switched, so some things need to happen e.g. loading
		// annotations, images
		if(event_switched){
			annotation_stream.value = recording.Events[current_event].annotation;
			event_switched = false;
			var an_image = new Image();	
			an_image.onload=function(){
				main_image = an_image;
				image_updated = true;
			}
			an_image.src = "sample1/"+ recording.Events[current_event].image;
		}
		
		// Drawing the image... If no boolean check, there's a small
		// (~20ms) flicker of the previous event if any
		if(image_updated == true){
			image_context.drawImage(main_image, 0, 0, image_canvas.width, image_canvas.height);
		}
		
		// "Post-it" feature... render each post-it (referred to as point from here) for the image
		for(var i = 0; i < recording.Events[current_event].Points.length; i++){
			// For drawing discrete circles
			image_context.beginPath();
			
			// convenience
			var current_point = recording.Events[current_event].Points[i];
			
			// If it's an active point, make it green... Else,
			// it should be red (can change spec later)
			if(current_point.active == true){
				image_context.fillStyle = "#00ff00";
			} else { 
				image_context.fillStyle = "#ff0000";
			}
			
			// Draw the circle at the x and y specified 
			image_context.arc(current_point.x, current_point.y, 10, 0, 2 * Math.PI, false);
			image_context.fill();
			image_context.lineWidth = 5;
			
			// Sets color of the little border around the points
			if(current_point.active == true){
				image_context.strokeStyle = "#003300";
			} else { 
				image_context.strokeStyle = "#330000";
			}
			
			// Draw the point and all defined lines
			image_context.stroke();
			
			// If it's an active point, draw its annotation
			// TODO: Text positioning convenient relative to 
			// canvas, specified width (or fit to screen width)
			if(current_point.active == true){
				image_context.fillStyle = "#00ff00";
				image_context.font = '12pt Helvetica sans-serif';
				image_context.fillText(current_point.annotation,current_point.x + 5, current_point.y + 12);
			}
		}
		
	}
}

// On resize, recalculate bounds for everything; render loop takes care
// of the redrawing
window.addEventListener('resize', function(event){
	console.log("Main window was resized");
	seek_overlay_context.fillStyle="#000000";
	seek_overlay_context.fillRect(0, 0, 2000, 2000);
	init();
});
 
// Change annotation mode (doesn't work)
function change_annotation_mode(){
	var check = document.getElementById("annotation_selection");
	var value = check.checked;
	console.log(value);
	if(value){
		image_canvas.width = w;
		image_canvas.height = h;
	
		seek_canvas.width = image_canvas.width * (4/5);
		seek_canvas.height = 40;

		seek_overlay_canvas.width = seek_canvas.width;
		seek_overlay_canvas.height = seek_canvas.height;

		annotation_stream.style.width = w - (5/6) * w+ "px";
		annotation_stream.style.height = h - 100 + "px";
		
		annotation_input.style.width = annotation_stream.style.width;
		annotation_input.style.height = "90px";	
	} else { 
		image_canvas.width = w - 400;
		annotation_stream.style.width = w - image_canvas.width - 4 + "px";
		annotation_stream.style.height = h - 100 + "px";
		annotation_stream.style.width = w - (5/6) * w+ "px";
		annotation_stream.style.height = h - 100 + "px";
		annotation_input.style.width = w - image_canvas.width - 6 + "px";
		annotation_input.style.height = "90px"	
		seek_canvas.width = image_canvas.width * (4/5);
		seek_canvas.height = 40;
		seek_overlay_canvas.width = seek_canvas.width;
		seek_overlay_canvas.height = seek_canvas.height;
		
	}
}

// Volume adjuster
function change_volume(slider_vol){
	audio.volume = slider_vol / 100;
	console.log(audio.volume);
}
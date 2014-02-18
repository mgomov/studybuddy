var w = window.innerWidth;
var h = window.innerHeight;

var recording;
var recording_file;
var current_event;

var audio = document.getElementById("audio_player");

var image_canvas = document.getElementById("image_canvas");
var image_context = image_canvas.getContext("2d");
var main_image = document.getElementById("main_image");

var changed = false;

var seek_canvas = document.getElementById("seek_canvas");
var seek_context = seek_canvas.getContext("2d");

var seek_overlay_canvas = document.getElementById("seek_overlay_canvas");
var seek_overlay_context = seek_overlay_canvas.getContext("2d");

var bottom_menu = document.getElementById("bottom_menu");

var annotation_stream = document.getElementById("annotation_stream");
var annotation_input = document.getElementById("annotation_input");

image_canvas.addEventListener('click', function(event) {
	var x = event.pageX - image_canvas.offsetLeft;
	var y = event.pageY - image_canvas.offsetTop;
	
	// Checking if the click is in the seek bar
	if(seek_canvas.relativeX <= x && x <= seek_canvas.relativeX + seek_canvas.width && seek_canvas.relativeY <= y && y <= seek_canvas.relativeY + seek_canvas.height){
		console.log("Clicked the seek bar at (" + x +", " + y + ").");
		audio.currentTime = seek_calculate(x);
	// Else, the click isn't in the bar, so we want to pause/play the video
	}else{
		console.log("Clicked the main canvas at (" + x +", " + y + ").");
		if(audio.paused){
			audio.play();
		} else {
			audio.pause();
		}
	}
}, false);

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

function changed(val){
	console.log("Changed");
	console.log(val.value);
}

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

setInterval(render_main_screen, 20);

// A few possible things based on selected files:
//		Open a recording file
// 			It's parsed, opened and loaded ready for use
//		Open an audio file
//			Starts a fresh session, generates a recording file
//		Open multiple files
//			Attempt to merge, bring to a screen where the user can tune
//			the merge

function load_file(file){
	var reader = new FileReader();
	var result;
	reader.onload = readSuccess;                                            
    function readSuccess(evt) { 
		result = evt.target.result;
		parse_file(result);
    };
	recording_file = file.files[0];
	reader.readAsText(file.files[0]);
}

// Need to get a folder, I guess
function parse_file(result){
	console.log(recording_file);
	var jsonData = JSON.parse(result);
	recording = jsonData;
	audio.src = "sample1/" + recording.audio;
	current_event = -1;
}

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
	//var gradient = image_context.createRadialGradient(-1000, h / 2, 100, w, h/2, 10000);
	
	gradient.addColorStop(0, "#B2FFB2");
	gradient.addColorStop(1, "#00ff00");
	
	image_context.fillStyle = gradient;
	
	seek_overlay_context.fillStyle =gradient;
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
	seek_context.clearRect(0, 0, w, h);
	
	seek_context.fillStyle ="#7f7f7f";
	roundRect(seek_context, 0, 0, seek_canvas.width, seek_canvas.height, 20, true, true);
	seek_context.fillStyle ="#0f0f0f";
	roundRect(seek_context, 5, 5, seek_canvas.width - 10, seek_canvas.height - 10, 15, true, true);
}

// Image layer
function draw_first_layer(){
	var w = image_canvas.width;
	var h = image_canvas.height;
	image_context.clearRect(0, 0, w, h);
	
	var gradient = image_context.createLinearGradient(0, 0, w * (1.5), h * (1.5));
	//var gradient = image_context.createRadialGradient(-1000, h / 2, 100, w, h/2, 10000);
	
	gradient.addColorStop(0, "black");
	gradient.addColorStop(1, "gray");
	
	image_context.fillStyle = gradient;
	image_context.fillRect(0, 0, w, h);
	audio.volume = 0;
	
	if(recording != undefined){
		current_event = update_event(current_event, recording.Events, audio.currentTime);
		if(current_event == -1 || current_event == -2 || current_event == -3){ 
			return;
		}		
		if(changed){
			annotation_stream.value = recording.Events[current_event].annotation;
			changed = false;
			var an_image = new Image();	
			an_image.onload=function(){
				main_image = an_image;
			}
			an_image.src = "sample1/"+ recording.Events[current_event].image;
		}
		var gap = (image_canvas.width - (image_canvas.width * (main_image.width / image_canvas.width))) / 2;
		image_context.drawImage(main_image, gap, 0, (image_canvas.width * (image_canvas.width / main_image.width)), image_canvas.height);
		console.log(gap);
	}
}

window.addEventListener('resize', function(event){
	console.log("Main window was resized");
	seek_overlay_context.fillStyle="#000000";
	seek_overlay_context.fillRect(0, 0, 2000, 2000);
	init();
});
 
// Change annotation mode
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

function change_volume(slider_vol){
	audio.volume = slider_vol / 100;
	console.log(audio.volume);
}
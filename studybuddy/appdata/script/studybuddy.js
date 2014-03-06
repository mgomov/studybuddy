/* studybuddy.js
 * Ties various things together... Global variables go here
 */

// Width and height, for general use
var w = window.innerWidth;
var h = window.innerHeight;

// Reference to the master file so we can write back to it later
var master_file_reference;

// Main file that holds all the info
var master;
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

var play_pause_time = 0;

var drag = false;
var delta = 0;
var justdragged = false;
var moving_point;

var editing_point = false;

// Block for context menu for points (right click menu)
var point_ctx_display = false;
var point_ctx = document.getElementById("point_context_menu");

// Temp var to pass files to main merge, DO NOT REFERENCE outside of merge process
var _TEMPFILES;

var images = new Array();
var seek_draw = false;
var seek_draw_event;
var seek_draw_x;

var seek_display = false;
var seek_display_opacity = 1.0;

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

	seek_canvas.relativeX = image_canvas.width * (1/10);
	seek_canvas.relativeY = image_canvas.height - seek_canvas.height - 50;
}

init();
render_main_screen();

// Adds render of the main canvas to a loop
setInterval(render_main_screen, 20);

// On resize, recalculate bounds for everything; render loop takes care
// of the redrawing
window.addEventListener('resize', function(event){
	console.log("Main window was resized");
	seek_overlay_context.fillStyle="#000000";
	seek_overlay_context.fillRect(0, 0, 2000, 2000);
	init();
});

// Volume adjuster
function change_volume(slider_vol){
	audio.volume = slider_vol / 100;
}
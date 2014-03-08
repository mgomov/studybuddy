/* studybuddy.js
 * Ties various things together... Global variables go here
 */

var w = window.innerWidth;	///< The height of the window that we can work with
var h = window.innerHeight; ///< The width of the window we can work with

var master; ///< Reference to the master file(main.sb) for accessing the recordings

var recording; ///< Reference to the current recording that's loaded up

var current_event; ///< The current event from the recording that is being displayed now (with annotations, etc)

var audio = document.getElementById("audio_player");  ///< The audio player which handles our audio

var image_canvas = document.getElementById("image_canvas");  ///< Image canvas that takes up the whole screen
var image_context = image_canvas.getContext("2d"); ///< Image cavnas' context, for drawing to

var event_switched = false; ///< Boolean which tells if the event was switched and things need to be changed

var image_updated = false;  ///< Irrelevant now, needs to be removed from our current scheme

var seek_canvas = document.getElementById("seek_canvas");  ///< The seek bar's discrete canvas that we draw all of the seek bar things to
var seek_context = seek_canvas.getContext("2d"); ///< Seek bar's context

var seek_overlay_canvas = document.getElementById("seek_overlay_canvas");  ///< Seek bar's overlay, where we draw things like the current time we're at and where images are
var seek_overlay_context = seek_overlay_canvas.getContext("2d");  ///< Seek overlay's context

var play_pause_time = 0;  ///< Var for controlling transparency for fading of the play/pause indicators

var drag = false;  ///< Tells us if we're currently dragging a window... For input
var delta = 0;  ///< Delta of the current drag
var justdragged = false;  ///< Used for preventing click event after a drag
var moving_point;  ///< The point we're dragging around the screen

var editing_point = false;  ///< Boolean that tells us if a variable is being edited

var point_ctx_display = false;  ///< Boolean telling us if we're displaying an editing menu for points
var point_ctx = document.getElementById("point_context_menu"); ///< The editing menu for all points

var _TEMPFILES;  ///< Temp var to pass files to main merge, DO NOT REFERENCE outside of merge process

var images = new Array();  ///< Array of images for the current recording
var seek_draw = false;  ///< Boolean telling us if we should be drawing the mouseover preview
var seek_draw_event;  ///< The number of the event that we're previewing (in context of Recording[seek_draw_event])
var seek_draw_x;  ///< What we're mousing over in terms of x coordinates

var seek_display = false; ///< Boolean that tells us if we're moused over the seek bar or not

var seek_display_opacity = 1.0; ///< Var for controlling transparency for fading of the seek bar

var path = ""; ///< Var for the path of the main.sb's data

var wd; ///< Working directory object; we have permissions to read & write here
/*! \fn 	init
 * 	\brief 	Initializes the window width and heights properly.
 *  \brief  Called on startup and window resize.
 */
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


/*! \fn 	change_volume
 * 	\brief 	Changes the volume
 *  \brief  Called from the DOM element "vol_slider"
 * 	\var
 */

$("vol_slider").addEventListener("change", function(){
	audio.volume = $("vol_slider").value / 100;
});
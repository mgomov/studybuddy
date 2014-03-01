/* render.js
 * Rendering the main canvases and all of the drawing that goes on in the
 * canvases goes here. 
 */

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
		roundRect(seek_overlay_context, 5, 5, 100, seek_canvas.height - 10, 15, true, true);
		seek_overlay_context.clearRect((seek_canvas.width - 10) * 
			(audio.currentTime / audio.duration) , 0, w, h);
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
	if(recording){
		for(var i = 0; i < recording.Events.length; i++){
			var an_event = recording.Events[i];
			var ix = (an_event.time / audio.duration) * seek_canvas.width;
			var iy = seek_canvas.relativeY;
			var w = ((an_event.time + an_event.duration) / audio.duration) * seek_canvas.width;
			var h = seek_canvas.height;
			
			seek_context.fillStyle = '#'+Math.floor(Math.random()*16777215).toString(16);
			seek_context.fillRect(ix, 4, w - ix, h - 8);
			//seek_context.stroke();
		}
	}
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
	//audio.volume = 0;
	
	// Handling drawing of images as well as advancing events
	if(recording != undefined){
		// Updates the current event if necessary
		current_event = update_event(current_event, recording.Events, audio.currentTime);
		
		// -1 means that we're before the recording, -2 means we're after 
		// the recording and -3 means we're in between events (dead space)
		if(current_event == -1 || current_event == -2 || current_event == -3){ 
			image_updated = false;
			if(play_pause_time <= 0 && !seek_draw){
				return;
			}
		} else { 	
			// An event was switched, so some things need to happen e.g. loading
			// annotations, images
			if(event_switched){
				event_switched = false;
				var an_image = new Image();	
				an_image.onload=function(){
					main_image = images[current_event];
					image_updated = true;
				}
				an_image.src = "data/"+ recording.Events[current_event].image;
			}
			
			// Drawing the image... If no boolean check, there's a small
			// (~20ms) flicker of the previous event if any
			if(image_updated == true){
				image_context.drawImage(main_image, 0, 0, image_canvas.width, image_canvas.height);
			}
			
			// "Post-it" feature... render each post-it (referred to as point from here) for the image
			first_layer_render_points();
		}
	}
	
	first_layer_render_preview();
	
	first_layer_render_playing();
	
}

function first_layer_render_points(){
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
				if(current_point.active){
					if(current_point == document.getElementById("point_annotation_edit").current_point){
						continue;
					}
					lines = current_point.annotation.split(/\r\n|\r|\n/);
					var heightcalc = 12 * lines.length + 12;
					image_context.fillStyle = "rgba(0, 0, 0, 0.75)";
					image_context.strokeStyle = "rgba(0, 0, 0, 1.0)";
					
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
					
					roundRect(image_context, xstart, ystart, current_point.width, heightcalc, 5, true, true);
					image_context.fillStyle = "#ffffff";
					image_context.font = '12pt Helvetica sans-serif';
					for(var lc = 0; lc < lines.length; lc++){
						image_context.fillText(lines[lc],xstart + 5, (ystart + 18) + 14 * lc);
					}
				}
			}
}

function first_layer_render_preview(){
	if(seek_draw){
		if(seek_draw_event >= 0){
			image_context.drawImage(images[seek_draw_event], seek_draw_x, (image_canvas.height - seek_canvas.height - 250), 250, 200 );
		}
	}
}

function first_layer_render_playing(){
	if(play_pause_time > 0){
		play_pause_time -= 0.05;
		var xoff = image_canvas.width / 2;
		var yoff = image_canvas.height / 2;
		if(audio.paused){
			var opacity = play_pause_time / 3;
			if(opacity < 0.01) opacity = 0.01;
			image_context.fillStyle="rgba(0, 255, 0, " + opacity + ")";
			image_context.beginPath();
			image_context.moveTo(xoff + 0,yoff + 0);
			image_context.lineTo(xoff + 35,yoff + 0);
			image_context.lineTo(xoff + 35,yoff + 100);
			image_context.lineTo(xoff + 0,yoff + 100);
			image_context.lineTo(xoff + 0,yoff + 0);
			image_context.closePath();
			var dist = 75;
			image_context.moveTo(xoff + 0 + dist,yoff + 0);
			image_context.lineTo(xoff + 35 + dist,yoff + 0);
			image_context.lineTo(xoff + 35 + dist,yoff + 100);
			image_context.lineTo(xoff + 0 + dist,yoff + 100);
			image_context.lineTo(xoff + 0 + dist,yoff + 0);
			image_context.closePath();
			image_context.fill();		
		} else {
			var opacity = play_pause_time / 3;
			if(opacity < 0.01) opacity = 0.01;
			image_context.fillStyle="rgba(0, 255, 0, " + opacity + ")";
			image_context.beginPath();
			image_context.moveTo(xoff + 0,yoff + 0);
			image_context.lineTo(xoff + 0,yoff + 100);
			image_context.lineTo(xoff + 90,yoff + 50);
			image_context.lineTo(xoff + 0,yoff + 0);
			image_context.closePath();
			image_context.fill();
		}
	}
}

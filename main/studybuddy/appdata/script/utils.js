function roundRect(ctx, x, y, width, height, radius, fill, stroke) {
	if (typeof stroke == "undefined" ) {
	stroke = true;
	}
	if (typeof radius === "undefined") {
		radius = 5;
	}
	
	if(width < radius){
		radius = width;
	}
	
	ctx.beginPath();
	
	// Top right corner
	ctx.moveTo(x + radius, y);
	ctx.lineTo(x + width - radius, y);
	ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
	
	ctx.lineTo(x + width, y + height - radius);
	ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
	
	ctx.lineTo(x + radius, y + height);
	ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
	ctx.lineTo(x, y + radius);
	ctx.quadraticCurveTo(x, y, x + radius, y);
	ctx.closePath();
	if (stroke) {
		ctx.stroke();
	}
	if (fill) {
		ctx.fill();
	}				
}

function roundedRect(ctx, x, y, width, height, radius, fill, stroke, tl, tr, bl, br) {
	if (typeof stroke == "undefined" ) {
	stroke = true;
	}
	if (typeof radius === "undefined") {
		radius = 5;
	}
	ctx.beginPath();
	
	// Top right corner
	ctx.moveTo(x + radius, y);
	ctx.lineTo(x + width - radius, y);
	if(tr != false){
		ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
	} else {
		ctx.lineTo(x + width, y);
		ctx.lineTo(x + width, y + radius);
	}
	
	ctx.lineTo(x + width, y + height - radius);
	
	if(br != false){
		ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
	} else {
		ctx.lineTo(x + width, y + height);
		ctx.lineTo(x + width - radius, y + height);
	}
	
	ctx.lineTo(x + radius, y + height);
	if(bl != false){
		ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
	} else {
		ctx.lineTo(x, y + height);
	}
	ctx.lineTo(x, y + radius);
	
	if(tl != false){
		ctx.quadraticCurveTo(x, y, x + radius, y);
	} else { 
		ctx.lineTo(x, y);
	}
	
	ctx.closePath();
	if (stroke) {
		ctx.stroke();
	}
	if (fill) {
		ctx.fill();
	}				
}

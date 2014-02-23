function load_merge_files(file){
	console.log("Merging files...");
	
	var constr_array = 
	{
		"audio":"",
		"category":"",
		"notes":"",
		"Events": []
	}
	
	console.log(file.files.length + " files: \n");
	var timestamp = "";	
	var previousImageTime = "";
	var endPart = "";
	var count = 0;
	for(var i = 0; i < file.files.length; i++){
		console.log("\t" + file.files[i].name);
			
		var result;
		var sum = 0;
		var timeBeforePhoto = 0;
		var audioStart = new Date('2014/02/13 11:11:00'); // hard coded for now should be easy to get info from user
		var audioLength = 7200; // 2 hour
		var reader = new FileReader();
		reader.onload = readSuccess;

		function readSuccess(evt){
			//get previous image time
			var constr_event = 
			{
				"time":0,
				"duration":0,
				"image":"",
				"annotation":""
			}
			constr_event.image = file.files[count].name;
			constr_event.time = sum;  // length of all durations
			// get previous time stamp if their is one otherwise get audio time
			if (timestamp == "")
			{
				previousImageTime = audioStart
			}
			else
			{
				previousImageTime = timestamp;
			}
			result = evt.target.result;
			timestamp = parse_image(result);

			//format for Date object splits timestamp changes date section semicolons to slash
			endPart = timestamp.slice(11);
			timestamp = timestamp.slice(0,11);
			timestamp = timestamp.replace(/:/g,'/');
			timestamp = timestamp + endPart;

			timestamp = new Date(timestamp); // make timestamp a Date object for easy time difference
			
			console.log("previous ", previousImageTime);
			console.log("current ", timestamp);
			
			
			sum+=Math.abs(timestamp - previousImageTime)/1000; // add duration to sum
			
		

			constr_event.duration = Math.abs(timestamp - previousImageTime)/1000; // get difference in time into seconds.
			console.log("pushing ", constr_event);	
			constr_array.Events.push(constr_event);
								
			if (count == file.files.length-1)
				console.log(constr_array.Events); // just to make sure it worked correctly

			count+=1; // keep track of the image we are working with 
			
			// This is where I stopped; need to parse the
			// timestamp into a duration, etc and pay 
			// attention to the previous event's timestamp
			// then put all this info into constr_event fields
		}
		reader.readAsArrayBuffer(file.files[i]);	
		//console.log("pushing ", constr_event);   // runs to early
		//constr_array.Events.push(constr_event);  // runs before readSuccess
	}
		console.log(constr_array.Events);   // this code runs before readSuccess is finished.....
}

function load_parse_image(file){
	console.log("Parsing an image...");
	console.log(file.files[0].name);
	var result;
	var reader = new FileReader();
	if(!reader)
		console.log("No Reader...");
	reader.onload = readSuccess;
	function readSuccess(evt){
		result = evt.target.result;
		console.log(result);
		debug_parse_image(result);
		parse_image(result);
	}
	
	reader.readAsArrayBuffer(file.files[0]);
}

function debug_parse_image(arrbuf){
	var arrvw = new Uint8Array(arrbuf);
	var test = "";
	var test2 = "";
	var count = 0;
	console.log("Debug hex dump of image header: ");
	start = true;
	for(var i = 0; i < 3168 / 12; i++){
		for(var j = 0; j < 12; j++){
			if(start){
				test += "["  +("0" + arrvw[i * 12 + j].toString(16)).slice(-2)  + "] ";
			}
		}
		
		for(var k = 0; k < 12;k++){
			if(start){
				test += " " + String.fromCharCode(arrvw[i * 12 + k])+ " ";
			}
		}
		
		test += "\n";
	}
	console.log(test);
}

function parse_image(arrbuf){
	var offset = 0;
	var length = 0;
	var headerindex = 0;
	var result = "";
	var arrvw = new Uint8Array(arrbuf);
	
	if(!arrvw)
		console.log("No Uint8Array...");
		
	for(var i = 0; i < 4096; i++){	
		if(arrvw[i] == 0x4d && arrvw[i + 1] == 0x4d){
			headerindex = i;
			console.log("Motorola align");
		}
		
		if(arrvw[i] == 0x49 && arrvw[i + 1] == 0x49){
			headerindex = i;
			console.log("Intel align");
		}
		
		if(arrvw[i] == 0x90 && arrvw[i + 1] == 0x04){
			console.log("0x9004 tag found...");
		}
		
		if(arrvw[i] == 0x01 && arrvw[i + 1] == 0x32){
			console.log("0x0132 tag found...");
		}
		
		if(arrvw[i] == 0x90 && arrvw[i + 1] == 0x03){
			var temp = 
			  ((arrvw[i + 8]).toString(16).slice(-2)) + ""
			+ ((arrvw[i + 9]).toString(16).slice(-2)) + "" 
			+ ((arrvw[i + 10]).toString(16).slice(-2)) + "" 
			+ ((arrvw[i + 11]).toString(16).slice(-2));
			console.log(temp);
			offset = parseInt(temp, 16);
			console.log("Offset: " + offset);
			
			length = 20;
			break;
		}
	}
	for(var j = offset + headerindex; j < offset + 31; j++){
		result += String.fromCharCode(arrvw[j]);
	}
	
	if(result.indexOf(":") == -1){
		console.log("Result is wrong, defaulting to backup method...");
		var temp = "";
		var tempres = "";
		for(var i = 0; i < 4096; i++){
			temp += String.fromCharCode(arrvw[i]);
		}
		
		// Valid for the remainder of this millennium
		for(var j = 0; j < temp.length; j++){
			if(temp[j] == "2" && temp[j + 4] == ":"){
				for(var k = j; k < j + 20; k++){
					tempres += temp[k];
				}
				break;
			}
		}
		console.log(tempres + "\n");
		return tempres;
	}
	console.log(result + "\n");
	return result;
}
//[00] [02] [00] [00] [00] [14] [00] [00] [01] [49]
// Loads a file and parses its JSON into recording

function load_file(file){
	// This is a pretty arbitrary process for loading a file in 
	var reader = new FileReader();
	var result;
	
	// Onload for asynchronous functions (e.g. loading a file)
	reader.onload = readSuccess;   
    function readSuccess(evt) { 
		result = evt.target.result;
		parse_file(result);
    };
	recording_file = file.files[0];
	reader.readAsText(file.files[0]);
}

// Does the JSON parsing and puts it into the recording
function parse_file(result){
	console.log(recording_file);
	var jsonData = JSON.parse(result);
	recording = jsonData;
	audio.src = "sample1/" + recording.audio;
	current_event = -1;
}
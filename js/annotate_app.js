/*
================================================================================
    Video Annotation Platform App JS
    
    Class: ECE 435, 419 and 420
	
	Collaboration between Software Engineering and Senior Design
================================================================================
*/

/*
================================================================================
    Variables.
================================================================================
*/
var annotationList = [];
var videoPlayer = null;
var user = "";
var videoURL = "";
var canvas = null;
var currentAnnotation = null;
var canHeight;
var canWidth, 
	  ctx = null,
      drag = false,
	  editting = false,
	  list = [],
      mouseX,
      mouseY,
      closeEnough = 5,
      dragTL = dragBL = dragTR = dragBR = false, time = 0, reloaded=false, playingSeg=false;

/*
================================================================================
    Hooks.
================================================================================
*/

document.addEventListener("DOMContentLoaded", init, false);
window.setInterval(redraw, 250); // Call redraw every second.
window.onbeforeunload = function(){
	sessionStorage.time = videoPlayer.currentTime;
	return null;
}
window.onload = function() {
    var time = sessionStorage.getItem(time);
	}

/*
    Initialize the app.
*/
function init() {
    videoPlayer = document.getElementById("video-player");
	videoPlayer.currentTime = sessionStorage.time;
    // Create drawing canvas.
    canvas = document.createElement("canvas");
    canvas.className = "canvases";
    canvas.style.zIndex = videoPlayer.zIndex + 1;
    var videoDiv = document.getElementById("video-div");
    videoDiv.appendChild(canvas);
    videoPlayer.addEventListener("play", redraw);
    //canvas.addEventListener("click", actOnClick, false);
	
	canWidth = canvas.width;
	canHeight = canvas.height;
    canvas.addEventListener('mousedown', mouseDown, false);
    canvas.addEventListener('mouseup', mouseUp, false);
    canvas.addEventListener('mousemove', mouseMove, false);
	ctx = canvas.getContext('2d');
	
}

/*
================================================================================
    General.
================================================================================
*/
/*
    Called on mouse click.
*/
function mouseDown(e) {
    // Calculate relative mouse coordinates.
    var pos = getPosition(canvas);
	
      mouseX = e.pageX - pos.x;
      mouseY = e.pageY - pos.y;
	  
    /*var xPos = event.pageX - pos.x;
    var yPos = event.pageY - pos.y;
	*/
	mouseX *= canvas.width/canvas.offsetWidth;
 	mouseY *= canvas.height/canvas.offsetHeight;

	
    if (currentAnnotation == null) {
        startAnnotation(mouseX, mouseY);
    }
	else if (checkCloseEnough(mouseX, currentAnnotation.x) && checkCloseEnough(mouseY, currentAnnotation.y)) {
        dragTL = true;
      }
      // 2. top right
      else if (checkCloseEnough(mouseX, currentAnnotation.x + currentAnnotation.w) && checkCloseEnough(mouseY, currentAnnotation.y)) {
        dragTR = true;

      }
      // 3. bottom left
      else if (checkCloseEnough(mouseX, currentAnnotation.x) && checkCloseEnough(mouseY, currentAnnotation.y + currentAnnotation.h)) {
        dragBL = true;

      }
      // 4. bottom right
      else if (checkCloseEnough(mouseX, currentAnnotation.x + currentAnnotation.w) && checkCloseEnough(mouseY, currentAnnotation.y + currentAnnotation.h)) {
        dragBR = true;

      }
      // (5.) none of them
      else {
        // handle not resizing
      }
}

/*
    Get element position.

    Source: http://www.kirupa.com/html5/get_element_position_using_javascript.htm
	Adapted from ECE435
*/
function getPosition(element) {
    var xPosition = 0;
    var yPosition = 0;

    while(element) {
        xPosition += (element.offsetLeft - element.scrollLeft + element.clientLeft);
        yPosition += (element.offsetTop - element.scrollTop + element.clientTop);
        element = element.offsetParent;
    }
	
    return { x: xPosition, y: yPosition };
}



/*
    Start a new annotation.
*/
function startAnnotation(x, y) {
    videoPlayer.pause();
    currentAnnotation =  new Annotation();
    currentAnnotation.start = videoPlayer.currentTime;
	document.getElementById("start-time").value = currentAnnotation.start;
    currentAnnotation.x = x;
    currentAnnotation.y = y;
    //redraw();
          // if there isn't a rect yet
      if (currentAnnotation.w === undefined) {
        currentAnnotation.x = mouseX;
        currentAnnotation.y = mouseY;
		currentAnnotation.w = 1;
		currentAnnotation.h = 1;
        dragBR = true;
      }

    redraw();  
	showInputField();
}

/*
    Finalize current annotation.
*/
function finalizeAnnotation() {
    if (!currentAnnotation) {
        return;
    }
    var contentField = document.getElementById("content-text");
    if(currentAnnotation.dbID == null){
	currentAnnotation.content = contentField.value;
    currentAnnotation.end = videoPlayer.currentTime;
	currentAnnotation.dbID= -1;
	currentAnnotation.username=user;
    if (currentAnnotation.content == ""
        || currentAnnotation.end - currentAnnotation.start <= 0) {
        return;
    }
	
    annotationList.push(currentAnnotation);
	}
	else {//find in the list and update
		if (editting = true){
		currentAnnotation.content = contentField.value;
		for (var i = 0; i<annotationList.length; i++){
			if (annotationList[i].dbID == currentAnnotation.dbID){
					//update its stuff instead
					annotationList[i] = currentAnnotation;
				//make sure we mark it somehow so we know it changed in the db
					annotationList[i].changed = true;
				}
				
			}
		
	}}
	editting = false;
    annotationList.sort(compareAnnotations);
    currentAnnotation = null;
    hideInputField();
}

/*
    Discard current annotation.
*/
function discardAnnotation() {
    currentAnnotation = null;
    hideInputField();
	editting = false;
    redraw();
}

/*
    Draw annotation box.
*/
function drawAnnotation(ann, ctx) {
	  ctx.strokeStyle = "#FF0000";
      ctx.lineWidth = 1;
	  ctx.fillStyle = "#FF0000";
      ctx.beginPath();
      ctx.rect(ann.x, ann.y, ann.w, ann.h);
	  ctx.fillText(ann.content, (ann.x-5),(ann.y-5));
      ctx.stroke();
		if (currentAnnotation!=null){
		drawHandles();  }	
}

/*
    Redraw the canvas. Called automatically every second and on certain events.
*/
function redraw() {

    var currentTime = videoPlayer.currentTime;if (editting == false){
	document.getElementById("end-time").value = currentTime; //change this if editting so it doesn't get weird.
	
		
	}
	
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (currentAnnotation) {
        drawAnnotation(currentAnnotation, ctx);
    }

    for (var i = 0; i < annotationList.length; i++) {
        var ann = annotationList[i];
        if (currentTime >= ann.start && currentTime <= ann.end) {
            drawAnnotation(ann, ctx);
        }
    }
    updateList();
}

function drawSquare(x, y, radius) {
      ctx.fillStyle = "#FF0000";
      ctx.fillRect(x - radius / 2, y - radius / 2, radius, radius);
    }

    function drawHandles() {
	  drawSquare(currentAnnotation.x, currentAnnotation.y, closeEnough);
      drawSquare(currentAnnotation.x + currentAnnotation.w, currentAnnotation.y, closeEnough);
      drawSquare(currentAnnotation.x + currentAnnotation.w, currentAnnotation.y + currentAnnotation.h, closeEnough);
      drawSquare(currentAnnotation.x, currentAnnotation.y + currentAnnotation.h, closeEnough);
    }
	
    function checkCloseEnough(p1, p2) {
      return Math.abs(p1 - p2) < closeEnough;
    }

    function mouseUp() {
      dragTL = dragTR = dragBL = dragBR = false;
    }

    function mouseMove(e) {
		if (currentAnnotation!=null){
			pos = getPosition(canvas);
			mouseX = e.pageX - pos.x;
			mouseY = e.pageY - pos.y;
			  
			mouseX *= canvas.width/canvas.offsetWidth;
			mouseY *= canvas.height/canvas.offsetHeight;
		  if (dragTL) {
			currentAnnotation.w += currentAnnotation.x - mouseX;
			currentAnnotation.h += currentAnnotation.y - mouseY;
			currentAnnotation.x = mouseX;
			currentAnnotation.y = mouseY;
		  } else if (dragTR) {
			currentAnnotation.w = Math.abs(currentAnnotation.x - mouseX);
			currentAnnotation.h += currentAnnotation.y - mouseY;
			currentAnnotation.y = mouseY;
		  } else if (dragBL) {
			currentAnnotation.w += currentAnnotation.x - mouseX;
			currentAnnotation.h = Math.abs(currentAnnotation.y - mouseY);
			currentAnnotation.x = mouseX;
		  } else if (dragBR) {
			currentAnnotation.w = Math.abs(currentAnnotation.x - mouseX);
			currentAnnotation.h = Math.abs(currentAnnotation.y - mouseY);
		  }
		  ctx.clearRect(0, 0, canvas.width, canvas.height);
		  redraw();
		}
    }

/*
    Update the annotation list.
*/
function updateList() {
    var currentTime = videoPlayer.currentTime;
    var contentList = document.getElementById("annotation-list");
    contentList.innerHTML = "";
    
    var list = document.createElement('ul');
	while (list.firstChild) {
		list.removeChild(list.firstChild);
	}
    for (var i = 0; i < annotationList.length; i++) {
        var item = document.createElement('li');
        var current = annotationList[i];
		var a = document.createElement('a');
		var linkText = document.createTextNode(current.content);
		a.appendChild(linkText);
		a.title = "anno";
		a.href = "javascript:playSegment("+current.start+","+current.end+")";
        var contentString = "   [" + current.start + "-" + current.end + "] ";
                            var userString= " (" + current.username + ")";
		var btn = document.createElement("BUTTON");        // Create a <button> element
		var t = document.createTextNode("X");       // Create a text node
		btn.setAttribute("onClick", 'removeAnno('+i+')');
		btn.appendChild(t);                                // Append the text to <button>
		item.appendChild(btn);      
		var ebtn = document.createElement("BUTTON");        // Create a <button> element
		var et = document.createTextNode("Edit");       // Create a text node
		ebtn.setAttribute("onClick", 'editAnno('+i+')');
		ebtn.appendChild(et);                                // Append the text to <button>
		item.appendChild(ebtn);      
		item.appendChild(document.createTextNode(contentString));
		item.appendChild(a);
		item.appendChild(document.createTextNode(userString));
		
        if (currentTime >= current.start && currentTime <= current.end) {
			if(current.dbID == -1){
				item.style.color = "#FF0000";
				item.style.fontWeight  = 'bold';
			}
			else{
				item.style.color="#0000FF";
				item.style.fontWeight  = 'bold';
			}
        }
        
        list.appendChild(item);
    }

    contentList.appendChild(list);
}

/*
	Removes an annotation from the list 
*/
function removeAnno(index){
	var sure = window.confirm("Remove this annotation? (This will remove the database entry)");
	if (sure == true){
		if (annotationList[index].dbID == -1){
		annotationList.splice(index,1);
		updateList();
		}
	else //this requires some mysqli
		{     
		var page = "deleteanno.php?q="+annotationList[index].dbID;
		if (window.XMLHttpRequest) {
            // code for IE7+, Firefox, Chrome, Opera, Safari
           var xmlhttp = new XMLHttpRequest();
        } 
		else {
            // code for IE6, IE5
          var  xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
        }
		xmlhttp.onreadystatechange = function() {
			if(xmlhttp.readyState == 4 && xmlhttp.status == 200){
				// Request completed
				annotationList.splice(index,1);
				updateList();	
			}
		}
        xmlhttp.open("POST", page, true);
        xmlhttp.send();
			
		}
	}
}

/*
	Edit an existing annotation
*/
function editAnno(index){ //this needs some adjustments still
	currentAnnotation = annotationList[index];
	videoPlayer.currentTime = currentAnnotation.start;
	document.getElementById("content-text").value = currentAnnotation.content;
	document.getElementById("start-time").value = currentAnnotation.start;
	document.getElementById("end-time").value = currentAnnotation.end;
	showInputField();
	editting=true;
}

/*
    Display input field.
*/
function showInputField() {
    var inputArea = document.getElementById("input-area");
	document.getElementById("input-area").value = "";
    inputArea.style.display = "block";
}

function startbut() {
	document.getElementById("start-time").value = videoPlayer.currentTime;
	currentAnnotation.start = videoPlayer.currentTime;
}

function endbut() {
	document.getElementById("end-time").value =videoPlayer.currentTime;
	currentAnnotation.end = videoPlayer.currentTime;
}

function playSegment(start, end){	
	videoPlayer.pause();
	var source = videoPlayer.src;
	videoPlayer.src = videoURL+"#t="+start+","+end;
	console.log(videoURL);
	videoPlayer.play();
	playingSeg = true;
}

/*
    Hide input field.
*/
function hideInputField() {
    var inputArea = document.getElementById("input-area");
	document.getElementById("start-time").value = "";
	document.getElementById("end-time").value = "";
	document.getElementById("content-text").value = "";
    inputArea.style.display = "none";
}

/*
    Comparator for sorting the annotation array.
*/
function compareAnnotations(a, b) {
    return a.start - b.start;
}

/*
================================================================================
    Cookie handling.
================================================================================
*/

/*
    Create a cookie.
    
    Params:
        key     Cookie key.
        value   Cookie value.
        exdays  Days until expiration.
*/
/*
function setCookie(key, value, exdays) {
    var d = new Date();
    d.setTime(d.getTime() + (exdays*24*60*60*1000));
    var expires = "expires="+d.toUTCString();
    document.cookie = key + "=" + value + "; " + expires;
}

/*
    Retrieve a cookie value by key.
    
    Params:
        key     Cookie key.
    
    Return:
        Value for the specified cookie key.
*/
/*fsdunction getCookie(key) {
    var name = key + "=";
    var tokens = document.cookie.split(";");
    for(var i = 0; i < tokens.length; i++) {
        var c = tokens[i];
        while (c.charAt(0)==" ") {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length,c.length);
        }
    }
    return "";
}

/*
    Clear a cookie.
    
    Params:
        key     Cookie key to clear.
*/
/*function clearCookie(key) {
    setCookie(key, "", 0);
}
*/

/*
================================================================================
    Annotation class.
================================================================================
*/
function Annotation() {
    var username = "";
	var dbID = -1;
    var start = 0;
    var end = 0;
    var x = 0;
    var y = 0;
    var w = 0;
    var h = 0;
    var content = "";
	var changed = false;
}

/*
================================================================================
	Saving and Loading Annotation Content Function List.
================================================================================
*/
function LoadAnnotations(list){
	/*sqli function to pull annotations for this video ID*/
	temp = new Annotation();
	temp.username= list.user_name;
	temp.dbID=parseInt(list.annotation_id);
	temp.start=list.annotation_start_time;
	temp.end=list.annotation_end_time;
	temp.x= parseInt(list.annotation_x);
	temp.y= parseInt(list.annotation_y);
	temp.w = parseInt(list.annotation_box_width);
	temp.h= parseInt(list.annotation_box_height);
	temp.content=list.annotation_text;
	annotationList.push(temp);
}

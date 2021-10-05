
    // Ensure drawing layer is at root
    document.body.appendChild(document.getElementById('drawing-layer'));

    // Manage Main UI
    // Add a pointerdown event for each color and tool.
    // When a user clicks a color or tool, then we set it to our current config.color or config.tool respectively, and highlight it on the UI
    [ 'data-rColor', 'data-tool' ].forEach(function(i) {
        document.querySelectorAll(`[${i}]`).forEach(function(item) {
            item.addEventListener('pointerdown', function(e) {
                document.querySelectorAll(`[${i}]`).forEach(function(i) {
                    i.setAttribute('data-current', false);
                });
                item.setAttribute('data-current', true);
                if(i == 'data-rColor') {
                    config.color = item.getAttribute(i);
                } else if(i == 'data-tool') {
                    config.tool = item.getAttribute(i);
                }
            });
        });
    });

    let config = {
        drawing: false,         // Set to true if we are drawing, false if we aren't
        tool: 'freeHand',       // The currently selected tool
		color : 'white',        // The currently selected colour
        strokeWidth: 4,         // The width of the lines we draw
        configNormalisation: 12,// The average normalisation for pencil drawing
    }

    let arrow = {
        // topX, Y, and bottomX, Y store information on the arrows top and bottom ends
		topX: 0,
		topY: 0,
		bottomX: 0,      
		bottomY: 0,          
		activeDirection: 'se',                    // This is the current direction of the arrow, i.e. south-east
	    arrowClasses: [ 'nw', 'ne', 'sw', 'se' ], // These are possible arrow directions
		lineAngle: 0,                             // This is the angle the arrow point at about the starting point
	}
    let freeHand = {
		currentPathText: 'M0 0 ',      // This is the current path of the pencil line, in text
		topX: 0,                       // The starting X coordinate
		topY: 0,                       // The starting Y coordinate
        lastMousePoints: [ [0, 0] ],   // This is the current path of the pencil line, in array
    }

    let svgEl = {
		arrowPath: (start, dimensions, path, dummy, direction, end, angle, hyp, id) => 
		`<div class="arrow drawing-el static current-item" data-id="${id}" data-direction="${direction}" 
			style="left: ${start[0]}px; top: ${start[1]}px; height: ${dimensions[1]}px; width: ${dimensions[0]}px;">
			<div class="arrow-point arrow-point-one"></div>
			<div class="arrow-point arrow-point-two" style="
				transform-origin: 0 0; left: ${hyp[1]}px; top: ${hyp[2]}px; transform: rotateZ(${angle}deg) translateY(-${hyp[0]}px) translateX(-15px);
			"></div>
			<svg viewbox="0 0 ${dimensions[0]} ${dimensions[1]}">
				<defs>
					<marker id="arrow-head-${id}" class="arrow-resizer" markerWidth="10" markerHeight="10" refX="0" refY="3" 
					orient="auto" markerUnits="strokeWidth" viewBox="0 0 20 20">
						<path d="M0 0 L0 6 L9 3 z" fill="${config.color}" />
					</marker>
				</defs>
				<path marker-start="url(#bottom-marker)" style="stroke: ${config.color}; stroke-width: ${config.strokeWidth}" marker-end="url(#arrow-head-${id})" class="arrow-line" d="${path}"></path>
			</svg>
		</div>`,
		drawPath: (start, dimensions, path, id) => 
		`<div class="free-hand drawing-el static current-item" data-id="${id}" style="left: ${start[0]}px; top: ${start[1]}px; height: ${dimensions[1]}px; width: ${dimensions[0]}px;">
			<svg viewbox="0 0 ${dimensions[0]} ${dimensions[1]}">			
				<path d="${path}" style="stroke: ${config.color}; stroke-width: ${config.strokeWidth}"></path>
			</svg>
		</div>`
	}

    // Set the body attribute 'data-drawing' to true or false, based on if the user clicks the 'Start Drawing' button
    // Also sets config.drawing to true or false.
    document.getElementById('start-drawing').addEventListener('click', function(e) {
        if(config.drawing === true) {
            config.drawing = false;
            document.body.setAttribute('data-drawing', false)
        } else {   
            let drawingCover = document.getElementById('drawing-cover');
            document.body.setAttribute('data-drawing', true)
            config.drawing = true;
        }
    });

    // Closes the drawing box and sets 'data-drawing' on the body element to false
    // Along with cofig.drawing to false.
    document.querySelector('#drawing-box .close').addEventListener('click', function(e) {
        document.body.setAttribute('data-drawing', false);
        config.drawing = false;
    })

    document.body.addEventListener('pointerdown', function(e) {
        
        if(helper.parent(e.target, '#drawing-box', 1) !== null && helper.parent(e.target, '#drawing-box', 1).matches('#drawing-box')) {
            return false;
        }

        // Generate id for each element
        let id = helper.generateId();
    
        if(config.tool == 'arrow' && config.drawing == true) {
            // Set arrow start point
            arrow.topX = e.clientX;
            arrow.topY = e.clientY;

            // Add element to drawing layer
			document.getElementById('drawing-layer').innerHTML = document.getElementById('drawing-layer').innerHTML + 
            svgEl.arrowPath(  [ arrow.topX + window.scrollX, arrow.topY + window.scrollY ], [  e.clientX, e.clientX ], `M0 0 L0 0`, 'arrow-item', arrow.arrowClasses[3], [ 0, 0 ], 0, [ 0, 0, 0 ], id );
        }
        else if(config.tool == 'freeHand' && config.drawing == true) {

            // Set the drawing starting point
            freeHand.topX = e.clientX;
            freeHand.topY = e.clientY;

            // Set the current path and most recent mouse points to whereever we are scrolled on the page
            freeHand.currentPathText = `M${window.scrollX} ${window.scrollY} `;
            freeHand.lastMousePoints = [[ window.scrollX, window.scrollY ]];
            
            // Add element to the drawing layer
            document.getElementById('drawing-layer').innerHTML = document.getElementById('drawing-layer').innerHTML + 
            svgEl.drawPath( [ e.clientX, e.clientY ], [ e.clientX, e.clientY ], ``, id);
        } 
        else if(config.tool == 'eraser' && config.drawing == true) {
            // Check if user has clicked on an svg
            if(helper.parent(e.target, '.drawing-el', 1) !== null && helper.parent(e.target, '.drawing-el', 1).matches('.drawing-el')) {
                // If they have, delete it
                helper.parent(e.target, '.drawing-el', 1).remove();
            }
        }
    })

    document.body.addEventListener('pointermove', function(e) {

        // Assuming there is a current item to in the drawing layer
        if(document.querySelector('#drawing-layer .current-item') !== null) {
            // If we are using the arrow tool
            if(config.drawing == true && config.tool == 'arrow') {
                // Then get the original start position
                let startX = arrow.topX;
                let startY = arrow.topY;
                // Set a default angle of 90
                let angleStart = 90;
                
                // And a default direction of 'south east'
                let arrowClass = arrow.arrowClasses[3];
                // Calculate how far the user has moved their mouse from the original position
                let endX = e.pageX - startX - window.scrollX;
                let endY = e.pageY - startY - window.scrollY;

                // And using that info, calculate the arrow's angle
                helper.calculateArrowLineAngle(endX, endY);
                // Then update the config to this new end position
                arrow.bottomX = endX;
                arrow.bottomY = endY;
                
                // And update the HTML to show the new arrow to the user
                document.querySelector('#drawing-layer .arrow.current-item').classList.remove('static');
                document.querySelector('#drawing-layer .arrow.current-item').setAttribute('data-direction', arrow.activeDirection);
                document.querySelector('#drawing-layer .arrow.current-item svg').setAttribute('viewbox', `0 ${endX} 0 ${endY}`);
                document.querySelector('#drawing-layer .arrow.current-item path.arrow-line').setAttribute('d', `M0 0 L${endX} ${endY}`);
            }
            
            else if(config.drawing == true && config.tool == 'freeHand') {
                // Similar to arrows, calculate the user's end position
                let endX = e.pageX - freeHand.topX;
                let endY = e.pageY - freeHand.topY;
                
                // And push these new coordinates to our config
                let newCoordinates = [ endX, endY ];
                freeHand.lastMousePoints.push([endX, endY]);
                if(freeHand.lastMousePoints.length >= config.configNormalisation) {
                    freeHand.lastMousePoints.shift();
                }
                
                // Then calculate the average points to display a line to the user
                let avgPoint = helper.getAveragePoint(0);
                if (avgPoint) {
                    freeHand.currentPathText += " L" + avgPoint.x + " " + avgPoint.y;

                    let tmpPath = '';
                    for (let offset = 2; offset < freeHand.lastMousePoints.length; offset += 2) {
                        avgPoint = helper.getAveragePoint(offset);
                        tmpPath += " L" + avgPoint.x + " " + avgPoint.y;
                    }

                    // Set the complete current path coordinates
                    document.querySelector('#drawing-layer .free-hand.current-item').classList.remove('static');
                    document.querySelector('#drawing-layer .free-hand.current-item svg path').setAttribute('d', freeHand.currentPathText + tmpPath);
                }

            }
        }
			
    });

    // Whenever the user leaves the page with their mouse or lifts up their cursor
    [ 'mouseleave', 'pointerup' ].forEach(function(item) {
        document.body.addEventListener(item, function(e) {
            // Remove current-item class from all elements, and give all SVG elements pointer-events
            document.querySelectorAll('#drawing-layer > div').forEach(function(item) {
                item.style.pointerEvent = 'all';
                item.classList.remove('current-item');
                // Delete any 'static' elements
                if(item.classList.contains('static')) {
                    item.remove();
                }
            });
            // Reset freeHand variables where needed
            freeHand.currentPathText = 'M0 0 ';
            freeHand.lastMousePoints = [ [0, 0] ];
        });
    });


    let helper = {
        // This averages out a certain number of mouse movements for free hand drawing
        // To give our lines a smoother effect
        getAveragePoint: function(offset) {
            let len = freeHand.lastMousePoints.length;
            if (len % 2 === 1 || len >= 8) {
                let totalX = 0;
                let totalY = 0;
                let pt, i;
                let count = 0;
                for (i = offset; i < len; i++) {
                    count++;
                    pt = freeHand.lastMousePoints[i];
                    totalX += pt[0];
                    totalY += pt[1];
                }

                return {
                    x: totalX / count,
                    y: totalY / count
                }
            }
            return null;
        },
        // This calculates the angle and direction of a moving arrow
        calculateArrowLineAngle: function(lineEndX, lineEndY) {
			
			var calcLineEndX = lineEndX;
			var calcLineEndY = lineEndY;
			var angleStart = 90;
			var angle = 0;
			var a = calcLineEndX;
			var b = calcLineEndY;
			var c = Math.sqrt(Math.pow(lineEndX, 2) + Math.pow(lineEndY, 2));
			
			if(calcLineEndX <= 0 && calcLineEndY >= 0) {
				// quadrant 3
				angleStart = 180;
				angle = Math.asin(a/c) * -1 * (180/Math.PI);
				arrow.activeDirection = arrow.arrowClasses[2];
			} else if(calcLineEndY <= 0 && calcLineEndX >= 0) {
				// quadrant 1
				angleStart = 0;
				angle = Math.asin(a/c) * (180/Math.PI);
				arrow.activeDirection = arrow.arrowClasses[1];
			} else if(calcLineEndY <= 0 && calcLineEndX <= 0) {
				// quadrant 4
				angleStart = 270;
				angle = Math.asin(b/c) * -1 * (180/Math.PI);
				arrow.activeDirection = arrow.arrowClasses[0];
			}
			else {
				// quadrant 2
				angleStart = 90;
				angle = Math.asin(b/c) * (180/Math.PI);
				arrow.activeDirection = arrow.arrowClasses[3];
			}
			
			arrow.lineAngle = angle + angleStart;
		},
        // This generates a UUID for our drawn elements
        generateId: function() {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
        },
        // This function matches parent elements allowing us to select a parent element
        parent: function(el, match, last) {
            var result = [];
            for (var p = el && el.parentElement; p; p = p.parentElement) {
                result.push(p);
                if(p.matches(match)) {
                    break;
                }
            }
            if(last == 1) {
                return result[result.length - 1];
            } else {
                return result;
            }
        }
    }

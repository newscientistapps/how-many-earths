/////////////////////////////////////
// Defining some global variables //
////////////////////////////////////

var width = window.innerWidth,
	height = window.innerHeight;

// Note that these are negative -- that has to do with how rotation works on the stereographic projection.
// Really, the initial dec (and RA, I believe) is positive.
var initial_ra = -105,  // in degrees
	initial_dec = -45;
	
// Brighter stars have lower magnitudes, so max_magnitude determines the dimmest stars displayed.
// There's also a maximum magnitude in the GeoJSON file itself, 
// so making this bigger won't do anything after a certain point.
var max_magnitude = 5,
	magnitude_scaling = .75;

// Determine how far the map zooms in and out during the zoom transition.
var zoom_min = 1000,
    zoom_max = 2000;

/////////////////////////
// Setting up the map. //
/////////////////////////

// Defining the projection.
var projection = d3.geo.stereographic()
    .clipAngle(140)
    .scale(zoom_max)
	.translate([width/2, height/2])
    .precision(10)              // We don't care much about precision at small scales -- it's a star map!
 	.rotate([initial_ra, initial_dec]);

// The path for the stars -- it needs a pointRadius-setting function based on magnitude.
var star_path = d3.geo.path()
    .projection(projection)
	.pointRadius(function(d){
		return Math.max(0, magnitude_scaling*(max_magnitude - d.properties.brightness));
	});
	
// The path for the lines, however, doesn't need anything fancy.
var line_path = d3.geo.path()
    .projection(projection);

////////////
// Scales //
////////////

// Color.
// The color of the stars is encoded in their B-V value, which roughly corresponds to surface temperature.
// The lower the B-V for a star, the hotter it is -- and the bluer it is.
// I eyeballed the values below off of a Hertzsprung-Russell diagram. Feel free to alter them, but not too much.
var color = d3.scale.linear()
				.domain([-2.0, 0.2, 5.5])
				.range(["blue", "white", "red"]);

// Longitude (RA)
var λ = d3.scale.linear()
    .domain([0, width])
    .range([-180, 180]);

// Latitude (Dec)
var φ = d3.scale.linear()
    .domain([0, height])
    .range([90, -90]);

////////////////////////////////
// Setting up the drag object //
////////////////////////////////

// Initializing the global x and y variables.
var mapx = width/2, 
	mapy = height/2;

// The function that will fire during drag events.
var dragmove = function() {
    
    // First, add the change in mouse position to the global x and y variables.
  	mapx += d3.event.dx;
	mapy += d3.event.dy;
	
	// Then, rotate the map projection by the appropriate amount.
  	projection.rotate([λ(mapx) + initial_ra, φ(mapy) + initial_dec]);
  	
  	// Finally, redraw the stars, the Kepler field, and the constellations in the newly-rotated projection.
  	svg.selectAll(".star").attr("d", star_path);
  	svg.selectAll(".kepler").attr("d", line_path);
	svg.selectAll(".constellation").attr("d", line_path);
};

// Create the drag object and add the drag event function to it.
var dragobj = d3.behavior.drag().on("drag", dragmove);

//////////////////////////
// Actually draw stuff! //
//////////////////////////

// Add an svg canvas to the appropriate place on the page.
var svg = d3.select("#main_event_interactive").append("svg")
    .attr("width", width)
    .attr("height", height);

// Load the GeoJSON files.
d3.json("new_stars.geojson", function(error_stars, stars) {
	d3.json("keplerFOV.geojson", function(error_kepler, keplerfov){
		d3.json("constellations_collection.geojson", function(error_constellation, constellations){
	    
	    // Once the GeoJSON files have loaded, do the following:
	    
		// Draw in a black background.	
		svg.append("rect")
			.attr("width", width)
			.attr("height", height)
			.attr("fill", "black");

        // Add in the stars, using the star_path, which assigns sizes for the stars based on their brightness.
	 	svg.selectAll("path")
	 		  		.data(stars)
	 		  		.enter()
	 		  		.append("path")
	 				.attr("class", "star")
	 		      	.attr("d", star_path)
	 		  		.attr("fill", function(d){return color(d.properties.color)}); // assigning colors to each star.
	 		  		
		// Add in the Kepler FOV.
		// For whatever reason, there's a giant damn circle that's also loaded in this GeoJSON,
		// but it doesn't show up unless you zoom *WAY* out, so it's not a problem for now.
		svg.append("path")
			.datum(keplerfov)
			.attr("class", "kepler")
			.attr("d", line_path)
			.attr("fill", "none")
			.attr("stroke", "white");
		
		// Add in the constellation lines.
		svg.append("path")
			.datum(constellations)
			.attr("class", "constellation")
			.attr("d", line_path)
			.attr("fill", "none")
			.attr("stroke", "white");
		
		// Finally, attach the drag event object to the SVG canvas.
		svg.call(dragobj);

		});		
	});
});

////////////////////////
// Scroll transitions //
////////////////////////

var rescale_translation = function(r){
    if (r > 1){
        return -1/(2*r);
    }
    else{
        return 1/2 * (1/r - 1);
    };
};

// A redrawing-with-transition function, to be used after the projection has changed.
var map_redraw = function(zoom_ratio){
    
    rt = rescale_translation(zoom_ratio);
    
    // Redraw the stars to the new projection.
    svg.selectAll(".star")
     .transition()
     .duration(2000)
     .attr("d", star_path);
    
    // Redraw the Kepler field to the new projection.
    // Simply altering the path leads to some really wonky behavior in the transition, and I'm not sure why.
    // Probably something to do with the math behind the stereographic projection.
    // So we'll fudge it: transition to a direct rescaling of the Kepler field by 1/2, and recenter accordingly.
    // Then, when that transition ends, immediately restore the scale and alter the path, to allow for proper dragging.
    svg.selectAll(".kepler")
     .transition()
     .duration(2000)
     .each("end", function(){
         d3.select(this).attr("transform", "scale(1)");
         d3.select(this).attr("d", line_path);
         })
     .attr("transform", "scale(" + zoom_ratio + ")translate(" + width*rt + "," + height*rt + ")");
     
    // Do the same thing for the constellation lines that you did for the Kepler field.
    svg.selectAll(".constellation")
     .transition()
     .duration(2000)
     .each("end", function(){
         d3.select(this).attr("transform", "scale(1)");
         d3.select(this).attr("d", line_path);
         })
     .attr("transform", "scale(" + zoom_ratio + ")translate(" + width*rt + "," + height*rt + ")");
}

// A zooming-out function.
var zoom = function(new_zoom){
    
    var old_zoom = projection.scale();
    var zoom_ratio = new_zoom/old_zoom;
    
    // Rescale the projection.
    projection.scale(new_zoom);
    
    // Redraw the map!
    map_redraw(zoom_ratio);  
};

// Define the render-listening function.
var render_func = function(obj){
    // console.log(obj.lastTop, obj.curTop)
    if (obj.direction === "down"){
        if (obj.lastTop < 6100 && obj.curTop >= 6100){
            zoom(zoom_min);
        };
    }
    else {
        if (obj.lastTop >= 6100 && obj.curTop < 6100){
            zoom(zoom_max);
        };
    };
    
};

// // Initialize Skrollr, setting the previously-defined render-listening function.
// skrollr.init();














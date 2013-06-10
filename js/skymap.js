/////////////////////////////////////
// Defining some global variables //
////////////////////////////////////

var width = window.innerWidth,
	height = window.innerHeight;

// Note that these are negative -- that has to do with how rotation works on the stereographic projection.
// Really, the initial dec (and RA, I believe) is positive.
var initial_ra = -95,  // in degrees
	initial_dec = -45;
	
// Brighter stars have lower magnitudes, so max_magnitude determines the dimmest stars displayed.
// There's also a maximum magnitude in the GeoJSON file itself, 
// so making this bigger won't do anything after a certain point.
var max_magnitude = 5,
	magnitude_scaling = .75;

// Determine how far the map zooms in and out during the zoom transition.
var zoom_min = 1000,
    zoom_max = 2500;

// Does what it says on the tin, in milliseconds.
var zoom_transition_time = 2000;

// Again, does what it says. 
// Note that it's the radius, not the diameter.
var exoplanet_radius = 1.5;

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

// Finally, the path for the exoplanet-hosting stars -- it needs a smaller pointRadius.
var exoplanet_path = d3.geo.path()
    .projection(projection)
	.pointRadius(exoplanet_radius);

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
  	svg.selectAll(".lines").attr("d", line_path);
  	svg.selectAll(".exoplanet").attr("d", exoplanet_path);
};

// Create the drag object and add the drag event function to it.
var dragobj = d3.behavior.drag();

//////////////////////////
// Actually draw stuff! //
//////////////////////////

// Add an svg canvas to the appropriate place on the page.
var svg = d3.select("#main_event_interactive").append("svg")
    .attr("width", width)
    .attr("height", height);

// Load the GeoJSON files.
d3.json("json/new_stars.geojson", function(error_stars, stars) {
	d3.json("json/keplerFOV.geojson", function(error_kepler, keplerfov){
		d3.json("json/constellations_collection.geojson", function(error_constellation, constellations){
	    
	    // Once the GeoJSON files have loaded, do the following:
	    
		// Draw in a black background.	
		svg.append("rect")
			.attr("width", width)
			.attr("height", height)
			.attr("fill", "black");
		
		// Create a group that will contain the stars and lines.
		g = svg.append("g");

        // Add in the stars, using the star_path, which assigns sizes for the stars based on their brightness.
	 	g.selectAll("path")
	 		  		.data(stars)
	 		  		.enter()
	 		  		.append("path")
	 				.attr("class", "star")
	 		      	.attr("d", star_path)
	 		  		.attr("fill", function(d){return color(d.properties.color)}); // assigning colors to each star.
	 		  		
		// Add in the Kepler FOV.
		// For whatever reason, there's a giant damn circle that's also loaded in this GeoJSON,
		// but it doesn't show up unless you zoom *WAY* out, so it's not a problem for now.
		g.append("path")
			.datum(keplerfov)
            .attr("class", "lines")
            .attr("id", "kepler")
			.attr("d", line_path)
			.attr("fill", "none")
			.attr("stroke", "white");
		
		// Add in the constellation lines.
		g.append("path")
			.datum(constellations)
            .attr("class", "lines")
            .attr("id", "constellations")
			.attr("d", line_path)
			.attr("fill", "none")
			.attr("stroke", "white");
			
		// Attach the drag event object to the SVG canvas.
		// Note that we have not yet actually attached any listeners to the drag object!
		// That comes later.
		svg.call(dragobj);
    	
		
		});		
	});
});

////////////////////////
// Scroll transitions //
////////////////////////

// Given a scale factor, 
// this function returns the translation factor needed to keep an image centered when scaled by that factor.
var rescale_translation = function(r){
        return 1/2 * (1/r - 1);
};

// A zooming function.
var zoom = function(new_zoom){
    
    // Find out what the old projection scale was.
    var old_zoom = projection.scale();
        
    // Rescale the projection.
    projection.scale(new_zoom);
    
    var zoom_ratio = new_zoom/old_zoom;
    
    // This try-catch clause handles the case where the user is scrolling up and down really fast around a single location.
    // Under those circumstances, the transforms can break.
    // Specifically, if a previous rescaling was in progress, and now the "old" scale is being requested again,
    // we need to make sure that we serve up a scale of 1 and not a scale of 1/2 or 2 or something weird like that.
    try{
        var old_transform = g.attr("transform");
        var scale_start = old_transform.lastIndexOf("(") + 1;
        var scale_end = g.attr("transform").lastIndexOf(",");
        var old_scale = old_transform.slice(scale_start, scale_end);
    
        if ((1 - zoom_ratio)*(1 - old_scale) < 0){
            zoom_ratio = 1;
        };
    }
    catch (error){};
    
    var rt = rescale_translation(zoom_ratio);
    
    g.transition()
     .duration(zoom_transition_time)
     .each("end", function(){
         g.attr("transform", "scale(1)");
         g.selectAll(".star").attr("d", star_path);
         g.selectAll(".lines").attr("d", line_path);
         g.selectAll(".exoplanet").attr("d", exoplanet_path);
         })
     .attr("transform", "scale(" + zoom_ratio + ")translate(" + width*rt + "," + height*rt + ")");
};


// A map rotation function.
var d_ra = 0;
var map_rotate = function(){
        d_ra += 0.5
      	projection.rotate([d_ra + initial_ra, initial_dec]);
  	
      	// Finally, redraw the stars, the Kepler field, and the constellations in the newly-rotated projection.
      	svg.selectAll(".star").attr("d", star_path);
      	svg.selectAll(".lines").attr("d", line_path);
      	svg.selectAll(".exoplanet").attr("d", exoplanet_path);
};


var starload = function(filename, id, color){
    d3.json(filename, function(error, newstars) {
		g.append("path")
			.datum(newstars)
			.attr("class", "exoplanet")
            .attr("id", id)
			.attr("d", exoplanet_path)
			.attr("fill", color);
            // .attr("opacity", 0.5);
    });
};


// Define a few scrolling variables, to control the transitions.
var planets_position = 2300,
    geometry_position = 3300,
    size_position = 4300,
    habitable_position = 5300,
    all_sky_position = 6000,
    zoom_position = 6100,
    rotate_position = 6500,
    interactive_position = 8000;

// Define the render-listening function.
var render_func = function(obj){

    // Placing Kepler candidates.
    if (obj.lastTop < planets_position && obj.curTop >= planets_position){
        starload("json/kepler_fakes.geojson", "candidates", "red");
    };
    if (obj.lastTop >= planets_position && obj.curTop < planets_position){
        g.selectAll("#candidates").remove();
    };
    
    // Correcting for geometric bias.
    if (obj.lastTop < geometry_position && obj.curTop >= geometry_position){
        starload("json/kepler_geometry.geojson", "geometric", "green");
    };
    if (obj.lastTop >= geometry_position && obj.curTop < geometry_position){
        g.selectAll("#geometric").remove();
    };
    
    // Removing planets of the wrong size.
    if (obj.lastTop < size_position && obj.curTop >= size_position){
        g.selectAll("#candidates").remove();
        g.selectAll("#geometric").remove();
        starload("json/kepler_fakes_size.geojson", "candidates_size", "red");
        starload("json/kepler_size.geojson", "size", "green");
    };
    if (obj.lastTop >= size_position && obj.curTop < size_position){
        starload("json/kepler_fakes.geojson", "candidates", "red");
        starload("json/kepler_geometry.geojson", "geometric", "green");
        g.selectAll("#candidates_size").remove();
        g.selectAll("#size").remove();
    };
    
    // Removing planets outside the habitable zone.
    if (obj.lastTop < habitable_position && obj.curTop >= habitable_position){
        g.selectAll("#candidates_size").remove();
        g.selectAll("#size").remove();
        starload("json/kepler_fakes_habitable.geojson", "candidates_habitable", "red");
        starload("json/kepler_habitable.geojson", "habitable", "green");
    };
    if (obj.lastTop >= habitable_position && obj.curTop < habitable_position){
        starload("json/kepler_fakes_size.geojson", "candidates_size", "red");
        starload("json/kepler_size.geojson", "size", "green");
        g.selectAll("#candidates_habitable").remove();
        g.selectAll("#habitable").remove();
    };
    
    // Filling in the whole sky.
    if (obj.lastTop < all_sky_position && obj.curTop >= all_sky_position){
        starload("json/all_sky_habitable.geojson", "all_sky", "green");
    };
    if (obj.lastTop >= all_sky_position && obj.curTop < all_sky_position){
        g.selectAll("#all_sky").remove();
    };
    
    // Zooming in and out.
    if (obj.lastTop < zoom_position && obj.curTop >= zoom_position){
        zoom(zoom_min);
    };
    if (obj.lastTop >= zoom_position && obj.curTop < zoom_position){
        zoom(zoom_max);
    };  
    
    // // Rotating.
    // if (obj.lastTop < rotate_position && obj.curTop >= rotate_position){
    //     rotation = setInterval(map_rotate, 50);
    // };
    // if (obj.lastTop >= rotate_position && obj.curTop < rotate_position){
    //     clearInterval(rotation);
    //     projection.rotate([initial_ra, initial_dec]);
    //     svg.selectAll(".star").attr("d", star_path);
    //     svg.selectAll(".lines").attr("d", line_path);
    // };
    
    // Turning interactivity on and off.
    if (obj.lastTop < interactive_position && obj.curTop >= interactive_position){
		
		// Attach a listener to the drag event object.
		dragobj.on("drag", dragmove);
    };
    if (obj.lastTop >= interactive_position && obj.curTop < interactive_position){
		dragobj.on("drag", null);
        projection.rotate([initial_ra, initial_dec]);
        svg.selectAll(".star").attr("d", star_path);
        svg.selectAll(".lines").attr("d", line_path);
    };
      
};

// // Initialize Skrollr, setting the previously-defined render-listening function.
// skrollr.init();














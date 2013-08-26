/////////////////////////////////////
// Defining some global variables //
////////////////////////////////////

var width = window.innerWidth,
	height = window.innerHeight;

// Note that these are negative -- that has to do with how rotation works on the stereographic projection.
// Really, the initial dec (and RA, I believe) is positive.
var initial_ra = -55,  // in degrees
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
var exoplanet_radius = 1;

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
	

var new_star_path = d3.geo.path()
    .projection(projection)
	.pointRadius(function(d){
		return Math.max(0, magnitude_scaling*(max_magnitude - d.properties.brightness))/(zoom_max/zoom_min);
	});

var new_exoplanet_path = d3.geo.path()
    .projection(projection)
	.pointRadius(exoplanet_radius/(zoom_max/zoom_min));
	
var new_line_path = d3.geo.path()
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
	
	console.log(projection.invert(String(d3.event.x), String(d3.event.y)));
	
	// Then, rotate the map projection by the appropriate amount.
  	projection.rotate([λ(mapx) + initial_ra, φ(mapy) + initial_dec]);
  	
  	// Finally, redraw the stars, the Kepler field, and the constellations in the newly-rotated projection.
    // svg.selectAll(".star").attr("d", star_path);
    // svg.selectAll(".lines").attr("d", line_path);
    // svg.selectAll(".exoplanet").attr("d", exoplanet_path);
  	svg.selectAll(".star").attr("d", new_star_path);
  	svg.selectAll(".lines").attr("d", new_line_path);
  	svg.selectAll(".exoplanet").attr("d", new_exoplanet_path);
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
    // .attr("width", 2160)
    // .attr("height", 1149)
    // .style("position", "absolute")
    // .style("top", (height-1149)/2)
    // .style("left", (width-2160)/2);

// Load the GeoJSON files.
d3.json("json/new_stars.geojson", function(error_stars, stars) {
	d3.json("json/keplerFOV.geojson", function(error_kepler, keplerfov){
		d3.json("json/constellations_collection.geojson", function(error_constellation, constellations){
	    
	    // Once the GeoJSON files have loaded, do the following:
	    
        // // Draw in a black background. 
        // svg.append("rect")
        //  .attr("width", width)
        //  .attr("height", height)
        //  .attr("fill", "black");
        // 
        // Create a group that will contain the stars and lines.
        g = svg.append("g");
        // 
        //         // Add in the stars, using the star_path, which assigns sizes for the stars based on their brightness.
        //      g.selectAll("path")
        //                  .data(stars)
        //                  .enter()
        //                  .append("path")
        //                  .attr("class", "star")
        //                  .attr("d", star_path)
        //                  .attr("fill", function(d){return color(d.properties.color)}); // assigning colors to each star.
        //                  
        // // Add in the Kepler FOV.
        // // For whatever reason, there's a giant damn circle that's also loaded in this GeoJSON,
        // // but it doesn't show up unless you zoom *WAY* out, so it's not a problem for now.
        // g.append("path")
        //  .datum(keplerfov)
        //             .attr("class", "lines")
        //             .attr("id", "kepler")
        //  .attr("d", line_path)
        //  .attr("fill", "none")
        //  .attr("stroke", "white");
        // 
        // // Add in the constellation lines.
        // g.append("path")
        //  .datum(constellations)
        //             .attr("class", "lines")
        //             .attr("id", "constellations")
        //  .attr("d", line_path)
        //  .attr("fill", "none")
        //  .attr("stroke", "white");
		
        // // Pre-loading some SVGs for later on.
        // p1 = projection([62, 49]);
        // p2 = projection([77, 49]);
        // p3 = projection([77, 40]);
        // p4 = projection([62, 40]);
        //         // console.log(p1, p2, p3, p4);
        // origin = [p1[0], p2[1]];
        // pic_height = p4[1] - p2[1];
        // pic_width = p3[0] - p1[0];
        // console.log(origin, pic_width, pic_height);
        // g.append("image")
        //             .attr("xlink:href", "img/kepler_geometry.png")
        //             .attr("id", "geometric")
        //             .attr("x", origin[0])
        //             .attr("y", origin[1])
        //             .attr("width", pic_width)
        //             .attr("height", pic_height)
        //             .attr("opacity", 0);
		
        // svg.append("g").attr("id", "all_sky").attr("opacity", 0);
        // // svg.select("#all_sky").append("svg").attr("width", 2160).attr("height", 1149);
        //      
        // // g.append("image")
        // svg.select("#all_sky").append("image")
        //             .attr("xlink:href", "img/exoplanets_giant_stereo.svg")
        //             .attr("id", "all_sky")
        //             .attr("x", (width - 2160)/2)
        //             .attr("y", (height - 1149)/2)
        //             .attr("width", 2160)
        //             .attr("height", 1149);
        //             // .attr("opacity", 0);
        
        // d3.json("json/all_sky_habitable.geojson", function(error, newstars) {
        //     g.append("path")
        //      .datum(newstars)
        //      .attr("class", "exoplanet")
        //     .attr("id", "all_sky")
        //      .attr("d", exoplanet_path)
        //      .attr("fill", "#55FF00")
        //     .attr("opacity", 0);
        // });
			
		// Attach the drag event object to the SVG canvas.
		// Note that we have not yet actually attached any listeners to the drag object!
		// That comes later.
        // svg.call(dragobj);
        
        svg.append("image")
            .attr("xlink:href", "img/test0.png")
            .attr("id", "background")
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", 1280)
            .attr("height", 895)
            .attr("opacity", 1);
    	
		
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
var zoom = function(new_zoom, new_paths){
    
    // // Find out what the old projection scale was.
    // var old_zoom = projection.scale();
    //     
    // // Rescale the projection.
    // projection.scale(new_zoom);
    // 
    // var zoom_ratio = new_zoom/old_zoom;
    
    zoom_ratio = new_zoom;
    
    // // This try-catch clause handles the case where the user is scrolling up and down really fast around a single location.
    // // Under those circumstances, the transforms can break.
    // // Specifically, if a previous rescaling was in progress, and now the "old" scale is being requested again,
    // // we need to make sure that we serve up a scale of 1 and not a scale of 1/2 or 2 or something weird like that.
    // try{
    //     var old_transform = g.attr("transform");
    //     var scale_start = old_transform.lastIndexOf("(") + 1;
    //     var scale_end = g.attr("transform").lastIndexOf(",");
    //     var old_scale = old_transform.slice(scale_start, scale_end);
    // 
    //     if ((1 - zoom_ratio)*(1 - old_scale) < 0){
    //         zoom_ratio = 1;
    //     };
    // }
    // catch (error){};
    
    var rt = rescale_translation(zoom_ratio);
    
    g.transition()
     .duration(zoom_transition_time)
     // .each("end", function(){
     //     g.attr("transform", "scale(1)");
     //     if (new_paths){
     //         g.selectAll(".star").attr("d", new_star_path);
     //         g.selectAll(".lines").attr("d", line_path).attr("stroke-width", zoom_ratio);
     //         g.selectAll(".exoplanet").attr("d", new_exoplanet_path);
     //     }
     //     else {
     //         g.selectAll(".star").attr("d", star_path);
     //         g.selectAll(".lines").attr("d", line_path).attr("stroke-width", 1);
     //         g.selectAll(".exoplanet").attr("d", exoplanet_path);
     //     };
     //     })
     .attr("transform", "scale(" + zoom_ratio + ")translate(" + width*rt + "," + height*rt + ")");
     
     // svg.select("#all_sky").transition()
     //  .duration(zoom_transition_time)
     //  .attr("transform", "scale(" + zoom_ratio + ")translate(" + width*rt + "," + height*rt + ")");
};


// A map rotation function.
var d_ra = 0;
var map_rotate = function(){
        d_ra += 0.5
      	projection.rotate([d_ra + initial_ra, initial_dec]);
  	
      	// Finally, redraw the stars, the Kepler field, and the constellations in the newly-rotated projection.
        // svg.selectAll(".star").attr("d", star_path);
        // svg.selectAll(".lines").attr("d", line_path);
        // svg.selectAll(".exoplanet").attr("d", exoplanet_path);
        svg.selectAll(".star").attr("d", new_star_path);
      	svg.selectAll(".lines").attr("d", new_line_path);
      	svg.selectAll(".exoplanet").attr("d", new_exoplanet_path);
};


var starload = function(filename, id, color, storage_var){
    if (storage_var === 0){
        d3.json(filename, function(error, newstars) {
    		g.append("path")
    			.datum(newstars)
    			.attr("class", "exoplanet")
                .attr("id", id)
    			.attr("d", exoplanet_path)
    			.attr("fill", color);
                // .attr("opacity", 0.5);
                
            // console.log(filename);
        });
    }
    else {
            g.append("path")
                .datum(storage_var)
                .attr("class", "exoplanet")
                .attr("id", id)
                .attr("d", exoplanet_path)
                .attr("fill", color);
        };
};


// Define a few scrolling variables, to control the transitions.
var planets_position = 2300,
    size_position = 3300,
    habitable_position = 4300,
    geometry_position = 5300,
    all_sky_position = 6000,
    zoom_position = 6100,
    rotate_position = 6500,
    interactive_position = 8000;

// And define a few variables that will be filled in by files that are loaded in.
var e1 = 0,
    e2 = 0,
    e3 = 0,
    e4 = 0,
    e5 = 0,
    e6 = 0,
    e7 = 0;

// Define the render-listening function.
var render_func = function(obj){

    // Placing Kepler candidates.
    if (obj.lastTop < planets_position && obj.curTop >= planets_position){
        // starload("json/kepler_fakes.geojson", "candidates", "red", e1);
        // starload("json/kepler_data.geojson", "candidates", "#55FF00", e1);
        svg.append("image")
            .attr("xlink:href", "img/test1.png")
            .attr("id", "candidates")
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", 1280)
            .attr("height", 895)
            .attr("opacity", 1);
    };
    if (obj.lastTop >= planets_position && obj.curTop < planets_position){
        svg.selectAll("#candidates").remove();
    };
    
    
    // Removing planets larger than 2 Earth radii.
    if (obj.lastTop < size_position && obj.curTop >= size_position){
        // starload("json/kepler_data_size.geojson", "size", "#55FF00", e2);
        svg.append("image")
            .attr("xlink:href", "img/test2.png")
            .attr("id", "size")
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", 1280)
            .attr("height", 895)
            .attr("opacity", 1);
        svg.selectAll("#candidates").remove();
    };
    if (obj.lastTop >= size_position && obj.curTop < size_position){
        // starload("json/kepler_data.geojson", "candidates", "#55FF00", e1);
        svg.append("image")
            .attr("xlink:href", "img/test1.png")
            .attr("id", "candidates")
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", pic_width)
            .attr("height", pic_height)
            .attr("opacity", 0);
        svg.selectAll("#size").remove();
    };
    
    // // Correcting for geometric bias.
    // if (obj.lastTop < geometry_position && obj.curTop >= geometry_position){
    //     // starload("json/kepler_geometry.geojson", "geometric", "green", e2);
    //     g.select("#geometric")
    //         .attr("opacity", 1);
    //     g.selectAll("#candidates").remove();
    //     starload("json/kepler_data.geojson", "candidates", "#55FF00", e1);
    // };
    // if (obj.lastTop >= geometry_position && obj.curTop < geometry_position){
    //     g.select("#geometric")
    //         .attr("opacity", 0);
    // };
    
    // Removing planets outside the habitable zone.
    if (obj.lastTop < habitable_position && obj.curTop >= habitable_position){
        // g.selectAll("#candidates").remove();
        // starload("json/kepler_data_habitable.geojson", "habitable", "#55FF00", e3);
        // starload("json/kepler_size.geojson", "size", "#55FF00", e4);
        svg.append("image")
            .attr("xlink:href", "img/test3.png")
            .attr("id", "habitable")
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", 1280)
            .attr("height", 895)
            .attr("opacity", 1);
        svg.select("#size").remove();
    };
    if (obj.lastTop >= habitable_position && obj.curTop < habitable_position){
        // starload("json/kepler_data_size.geojson", "candidates", "#55FF00", e2);
        // starload("json/kepler_geometry.geojson", "geometric", "green", e2);
        svg.append("image")
            .attr("xlink:href", "img/test2.png")
            .attr("id", "size")
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", 1280)
            .attr("height", 895)
            .attr("opacity", 1);
        svg.select("#habitable").remove();
        // g.selectAll("#candidates_size").remove();
        // g.selectAll("#size").remove();
    };
    
    // Adding in the planets that we can't see because of the geometry of their orbits
    if (obj.lastTop < geometry_position && obj.curTop >= geometry_position){
        // g.selectAll("#candidates_size").remove();
        // g.selectAll("#size").remove();
        // starload("json/kepler_fakes.geojson", "geometry", "#55FF00", e5);
        svg.append("image")
            .attr("xlink:href", "img/test4.png")
            .attr("id", "geometry")
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", 1280)
            .attr("height", 895)
            .attr("opacity", 1);
        svg.select("#habitable").remove();
        // starload("json/kepler_habitable.geojson", "habitable", "#55FF00", e6);
    };
    if (obj.lastTop >= geometry_position && obj.curTop < geometry_position){
        // starload("json/kepler_data_habitable.geojson", "habitable", "#55FF00", e3);
        // starload("json/kepler_size.geojson", "size", "#55FF00", e4);
        svg.append("image")
            .attr("xlink:href", "img/test3.png")
            .attr("id", "habitable")
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", 1280)
            .attr("height", 895)
            .attr("opacity", 1);
        svg.selectAll("#geometry").remove();
        // g.selectAll("#habitable").remove();
    };
    
    // Filling in the whole sky.
    if (obj.lastTop < all_sky_position && obj.curTop >= all_sky_position){
        // svg.select("#all_sky").attr("opacity", 1);
        // starload("json/all_sky_habitable.geojson", "all_sky", "green", e7);
        // g.append("image")
        //     .attr("xlink:href", "img/exoplanets_giant_stereo.svg")
        //     .attr("id", "all_sky")
        //     .attr("x", (width - 2160)/2)
        //     .attr("y", (height - 1149)/2)
        //     .attr("width", 2160)
        //     .attr("height", 1149);
        //     // .attr("preserveAspectRatio", "xMinYMin");
        
        svg.append("image")
            .attr("xlink:href", "img/test5.png")
            .attr("id", "all_sky")
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", 1280)
            .attr("height", 895)
            .attr("opacity", 1);
        
        svg.selectAll("#geometry").remove();
        
        g.append("image")
            .attr("xlink:href", "img/test6.png")
            .attr("id", "zoom_sky")
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", 1280)
            .attr("height", 895)
            .attr("opacity", 1);
        
        // zoom(zoom_max*zoom_max/zoom_min, false);
        zoom(zoom_max/zoom_min, false);
        
        // zoom(zoom_max, false);
        
    };
    if (obj.lastTop >= all_sky_position && obj.curTop < all_sky_position){
        svg.append("image")
            .attr("xlink:href", "img/test4.png")
            .attr("id", "geometry")
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", 1280)
            .attr("height", 895)
            .attr("opacity", 1);
        
        svg.selectAll("#all_sky").remove();
        g.selectAll("#zoom_sky").remove();
        // svg.select("#all_sky").attr("opacity", 0);
    };
    
    // Zooming in and out.
    if (obj.lastTop < zoom_position && obj.curTop >= zoom_position){
        svg.selectAll("#all_sky").remove();
        // zoom(zoom_min/(zoom_max*zoom_max), false);
        // zoom(zoom_min/zoom_max, false);
        zoom(1, false)

        // zoom(zoom_min, true);
    };
    if (obj.lastTop >= zoom_position && obj.curTop < zoom_position){
        // svg.append("image")
        //     .attr("xlink:href", "img/test5.png")
        //     .attr("id", "all_sky")
        //     .attr("x", 0)
        //     .attr("y", 0)
        //     .attr("width", 1280)
        //     .attr("height", 895)
        //     .attr("opacity", 1);
        
        // g.selectAll("#zoom_sky").remove();
        // zoom(zoom_max, true);
        // zoom(zoom_min, true);
        zoom(zoom_max/zoom_min, false);
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
    
        //     // Turning interactivity on and off.
        //     if (obj.lastTop < interactive_position && obj.curTop >= interactive_position){
        // 
        // // Attach a listener to the drag event object.
        // dragobj.on("drag", dragmove);
        //     };
        //     if (obj.lastTop >= interactive_position && obj.curTop < interactive_position){
        // dragobj.on("drag", null);
        //         projection.rotate([initial_ra, initial_dec]);
        //         svg.selectAll(".star").attr("d", star_path);
        //         svg.selectAll(".lines").attr("d", line_path);
        //     };
      
};

// // Initialize Skrollr, setting the previously-defined render-listening function.
// skrollr.init();














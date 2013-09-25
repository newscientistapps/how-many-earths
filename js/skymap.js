/////////////////////////////////////
// Defining some global variables //
////////////////////////////////////

var width = $("body").innerWidth(),
	height = window.innerHeight;

// How many planet candidates are there in the Kepler field meeting various requirements?
var num_candidates = 3588,
    num_rocky_planets = 1696,
    num_habitable_planets = 51;

// Determine how far the map zooms in and out during the zoom transition.
var zoom_min = 1000,
    zoom_max = 2500;

// Picture width and height depend on what browser we're in.
if (navigator.userAgent.match(/ipad|iphone/i) === null){
    var pic_width = 3000,
        pic_height = 2000,
        rotating_pic_width = 3500;  
}
else {
    // Test for iOS <= 6
    if (navigator.userAgent.match(/OS [0-5]/)){
        $("body").append("div")
            .css({"z-index": 2000, "opacity": 0.6,"width":"100%","height":"100%","position":"fixed","top":0,"background":"#000"});
        
        $("body").append("div")
            .css({"z-index": 2000,"width":"100%","height":"10%","position":"fixed","top":"30%","background":"#000"})
            .attr("id", "textbox");
        
        $("#textbox").append("p")
            .css({'opacity':1.0,'color':'#fff','text-align':'center','font-size':'70px'})
            .text("Your version of iOS can't display this content. Try updating your operating system, or use a different device.");
    };
    var pic_scale = 1.0;
    var zoom_scale = 1.3;
    zoom_min *= zoom_scale;
    var pic_width = pic_scale*2160,
        pic_height = pic_scale*1440,
        rotating_pic_width = zoom_scale*pic_scale*1750;
    // var pic_width = 3000,
    //     pic_height = 2000,
    //     rotating_pic_width = 3500,
    //     pic_scale = 1;
}

// Define image anchors.
// We need to make sure the center of the screen always lines up with the center of the images.
// The default anchor, (0, 0), is the upper-left corner of the screen.
// So define a displacement from that location as appropriate to the size of the screen.
var pic_x = (width - pic_width)/2,
    pic_y = (height - pic_height)/2;

// Define the sizes of the number box in the upper-right corner
var rect_width = 350,
    rect_height = rect_width/3.2,
    number_size = 25;

// Defining some projections we need to find the location of the North Star, so we can rotate around it.

// Note that these are negative -- that has to do with how rotation works on the stereographic projection.
// Really, the initial dec (and RA, I believe) is positive.
var initial_ra = -55,  // in degrees
	initial_dec = -45;

// This is the same projection used in creating the static images in the first place.
var old_projection = d3.geo.stereographic()
    .clipAngle(140)
    .scale(zoom_min)
    .translate([width/2, height/2])
    .precision(10)              // We don't care much about precision at small scales -- it's a star map!
 	.rotate([initial_ra, initial_dec]);

var old_polaris_location = old_projection([0, 90]);

var dx = width/2 - old_polaris_location[0];
var dy = height/2 - old_polaris_location[1];

// Controlling the timing of the various animations.
var scroll_time = 2000,
    number_time = 1500;

var pretty_number_string = function(number){
    // Given an integer, returns a string which formats that integer in the New Scientist style:
    // no commas if it's less than 5 digits, commas separating every set of thousands thereafter.
    
    // var log_base_ten = Math.log(number)/Math.log(10);
    // var digits = Math.floor(log_base_ten);           // number of digits
    
    var num_string = String(number);
    var digits = num_string.length;
    
    if (digits < 5){
        return num_string;
    }
    else{
        // number_of_commas = Math.floor(digits/3);
        var result_array = [];
        // Read through the number backwards, putting every triplet of numbers into the array, followed by a comma, until we run out of digits.
        for (var i = 0; i < digits; i += 3){
            var next_digits = num_string.slice(-1*(i + 3),digits - i); // the next set of digits to put after a comma
            result_array.unshift(next_digits);
            result_array.unshift(",")
        };
        
        result_array = result_array.slice(1); // the first entry will be a superfluous comma.
        var result = result_array.join("");
        return result;
    };
};

var toCharCode = function(string){
    // Given a string, returns the string's character code numbers in an array.
    
    // Get an array of the characters in the string.
    var char_array = string.split("");
    // Make a place for the character codes to live.
    var code_array = [];
    // Get the character code for each character and put it into the code array.
    char_array.forEach(function(i){
        code_array.push(i.charCodeAt(0));
    });
    
    return code_array;
};

var backFromCharCode = function(array){
    // Goes from an array of character codes back to a string.
    return String.fromCharCode.apply(null, array);
};

var newInterpolateString = function(a, b){
    // Returns an interpolator between two strings of the same length.
    var array_interpolator = d3.interpolateArray(toCharCode(a), toCharCode(b));
    var string_interpolator = function(t){
        return backFromCharCode(array_interpolator(t));
    };
    return string_interpolator;
};

//////////////////////////////////////////////////////////////////
// Prevent the page from remembering scroll position on reload. //
//////////////////////////////////////////////////////////////////
$(window).scrollTop(0);

//////////////////////////
// Actually draw stuff! //
//////////////////////////

// Add an svg canvas to the appropriate place on the page.
var svg = d3.select("#main_event_interactive").append("svg")
    .attr("width", width)
    .attr("height", height);

// Load the images.
    svg.append("image")
        .attr("xlink:href", "img/kepler_background.png")
        .attr("class", "skyimage")
        .attr("id", "background")
        .attr("x", pic_x)
        .attr("y", pic_y)
        .attr("width", pic_width)
        .attr("height", pic_height)
        .attr("opacity", 0);
    
    g = svg.append("g");
    
    svg.append("image")
        .attr("xlink:href", "img/kepler_candidates.png")
        .attr("class", "skyimage")
        .attr("id", "candidates")
        .attr("x", pic_x)
        .attr("y", pic_y)
        .attr("width", pic_width)
        .attr("height", pic_height)
        .style("opacity", 0);
	
    svg.append("image")
        .attr("xlink:href", "img/kepler_size.png")
        .attr("class", "skyimage")
        .attr("id", "size")
        .attr("x", pic_x)
        .attr("y", pic_y)
        .attr("width", pic_width)
        .attr("height", pic_height)
        .style("opacity", 0);
    
    svg.append("image")
        .attr("xlink:href", "img/kepler_habitable.png")
        .attr("class", "skyimage")
        .attr("id", "habitable")
        .attr("x", pic_x)
        .attr("y", pic_y)
        .attr("width", pic_width)
        .attr("height", pic_height)
        .style("opacity", 0);
    
    svg.append("image")
        .attr("xlink:href", "img/kepler_geometry.png")
        .attr("class", "skyimage")
        .attr("id", "geometry")
        .attr("x", pic_x)
        .attr("y", pic_y)
        .attr("width", pic_width)
        .attr("height", pic_height)
        .style("opacity", 0);
    
    g.append("image")
        .attr("xlink:href", "img/kepler_geometry_allsky.png")
        .attr("class", "skyimage")
        .attr("id", "all_sky")
        .attr("x", pic_x)
        .attr("y", pic_y)
        .attr("width", pic_width)
        .attr("height", pic_height)
        .style("opacity", 0);

    g.append("image")
        .attr("xlink:href", "img/kepler_zoomedsky.png")
        .attr("class", "skyimage")
        .attr("id", "zoom_sky")
        .attr("x", pic_x)
        .attr("y", pic_y)
        .attr("width", pic_width)
        .attr("height", pic_height)
        .style("opacity", 0);
    
    // g.append("image")
    //         .attr("xlink:href", "img/kepler_north_star.png")
    //         .attr("class", "skyimage")
    //         .attr("id", "zoom_sky")
    //         .attr("x", (width - rotating_pic_width)/2 - dx)
    //         .attr("y", (height - rotating_pic_width)/2 - dy)
    //         .attr("width", rotating_pic_width)
    //         .attr("height", rotating_pic_width)
    //         .attr("transform", "rotate(" + -1*initial_ra + " " + old_projection([0, 90])[0] + " " + old_projection([0, 90])[1] + ")")
    //         .style("opacity", 0);
    
    // Setting up the rotation image.
    g_rotate = svg.append("g");
    
    g_rotate.append("image")
            .attr("xlink:href", "img/kepler_north_star.png")
            .attr("class", "skyimage")
            .attr("id", "rotating")
            .attr("x", (width - rotating_pic_width)/2 - dx)
            .attr("y", (height - rotating_pic_width)/2 - dy)
            .attr("width", rotating_pic_width)
            .attr("height", rotating_pic_width)
            .style("opacity", 0);
    
    g_rotate.attr("transform", "translate(100,0)rotate(" + -1*initial_ra + " " + old_projection([0, 90])[0] + " " + old_projection([0, 90])[1] + ")");
    
    // Setting up the horizon image.
    svg.append("image")
        .attr("xlink:href", "img/HORIZON.png")
        .attr("class", "skyimage")
        .attr("id", "horizon")
        .attr("x", 0)
        .attr("y", height - width*(pic_height/pic_width))
        // .attr("y", height/2)
        // .attr("preserveAspectRatio", "none")
        .attr("width", width)
        .attr("height", width*(pic_height/pic_width))
        // .attr("height", height/2)
        .style("opacity", 0);
    
    if (navigator.userAgent.match(/ipad|iphone/i) !== null){
                
        svg.select("#background")
            .attr("xlink:href", "img/kepler_background_small.png");
            
        svg.select("#candidates")
            .attr("xlink:href", "img/kepler_candidates_small.png");
            
        svg.select("#size")
            .attr("xlink:href", "img/kepler_size_small.png");

        svg.select("#habitable")
            .attr("xlink:href", "img/kepler_habitable_small.png");
            
        svg.select("#geometry")
            .attr("xlink:href", "img/kepler_geometry_small.png");
            
        g.select("#all_sky")
            .attr("xlink:href", "img/kepler_geometry_allsky_small.png");

        g.select("#zoom_sky")
            .attr("xlink:href", "img/kepler_zoomedsky_small.png");
        
        g_rotate.select("#rotating")
            .attr("xlink:href", "img/kepler_north_star_small.png");
        
        svg.select("#horizon")
            .attr("xlink:href", "img/HORIZON_small.png");
    };
    
    // Setting up the number box, which is the only dynamically-rendered true SVG component in this whole thing.
    svg.append("rect")
        .attr("id", "number-box")
        .attr("x", width - rect_width)
        .attr("y", 0)
        .attr("width", rect_width)
        .attr("height", rect_height)
        .attr("fill", "black")
        .attr("opacity", 0);
    
   svg.append("text")
        .attr("id", "number-planets")
        .attr("text-anchor", "middle")
        .attr("x", width - rect_width/2)
        .attr("y", rect_height/2) 
        .attr("dy", number_size/3)   // because friggin IE doesn't support dominant-baseline!
        // .attr("font-family", "sans-serif")
        // .attr("font-size", number_size)
        .attr("font-style", "bold");

////////////////////////
// Scroll transitions //
////////////////////////

// Given a scale factor, 
// this function returns the translation factor needed to keep an image centered when scaled by that factor.
var rescale_translation = function(r){
        return 1/2 * (1/r - 1);
};

// Define a few scrolling variables, to control the transitions.
// var planets_position = 2300,
//     size_position = 3300,
//     habitable_position = 4300,
//     geometry_position = 5300,
//     all_sky_position = 6501,
//     zoom_position = 6501,
//     rotate_position = 6500,
//     interactive_position = 8000;
var all_sky_position = 6000,
    zoom_position = 6000, 
    zoom_scroll_length = 500;

// Define a scroll-listening object and function.
var scrollobj = {
    lastTop: -1,
    curTop: 0
};

$(window).scroll(function(){
    
    // Updating the scroll object.
    scrollobj.lastTop = scrollobj.curTop;
    scrollobj.curTop = $(window).scrollTop();
    
    // Debugging.
    console.log(scrollobj.lastTop);
    console.log($(window).scrollTop());

    // Handling divs and images.
    if (scrollobj.curTop <= 250){
       $("#intro").css({"opacity": (250 - scrollobj.curTop)/250, "top": "100px"});
       $("#how_to_spot_a_planet").css({"opacity": 0, "top": "100%"});      
    };
    if (scrollobj.curTop > 250){
       $("#intro").css({"opacity": 0, "top": "-100%"});
    };
    if (scrollobj.curTop >= 300 && scrollobj.curTop <= 900){
       $("#how_to_spot_a_planet").css({"opacity": (scrollobj.curTop - 300)/600, "top": 100 - (scrollobj.curTop - 300)/6 + "%"});
    }
    if (scrollobj.curTop <= 1200 && scrollobj.curTop > 900){
       $("#how_to_spot_a_planet").css({"opacity": 1, "top": "0%"});      
    };   
    if (scrollobj.curTop < 1200){
       $("#intro_planet").css("opacity", 1);
       $("#background").css("opacity", 0);
       $("#in_the_frame").css({"opacity":0, "top":"100%"});    
    };
    if (scrollobj.curTop > 1200 && scrollobj.curTop <= 1500){
       $("#intro_planet").css("opacity", (300 - (scrollobj.curTop - 1200))/300);
       $("#how_to_spot_a_planet").css({"opacity": (300 - (scrollobj.curTop - 1200))/300, "top": -(scrollobj.curTop - 1200)/3 + "%"});
       $("#background").css("opacity", (scrollobj.curTop - 1200)/300);
       $("#in_the_frame").css({"opacity":(scrollobj.curTop - 1200)/300, "top": 100 - (scrollobj.curTop - 1200)/3 +"%"});
    };
    if (scrollobj.curTop > 1500){
       $("#intro_planet").css("opacity", 0);
       $("#how_to_spot_a_planet").css({"opacity": 0, "top": "-100%"}); 
       $("#background").css("opacity", 1);
    };


    if (scrollobj.curTop > 1500 && scrollobj.curTop <= 2000){
       $("#in_the_frame").css({"opacity":1, "top":"0%"});
    };
    if (scrollobj.curTop <= 2000){
       d3.select("#number-box").attr("opacity", 0);
       d3.select("#number-planets").attr("opacity", 0);
       d3.select("#number-planets").text("");
       $("#Keplers_haul").css({"opacity": 0, "top":"100%"});
       $("#candidates").css("opacity", 0);
    };
    if (scrollobj.curTop > 2000 && scrollobj.curTop <= 2500){
       d3.select("#number-box").attr("opacity", (scrollobj.curTop - 2000)/500);
       d3.select("#number-planets").text(num_candidates + " planets");
       d3.select("#number-planets").attr("opacity", (scrollobj.curTop - 2000)/500);
       $("#in_the_frame").css({"opacity":1 - (scrollobj.curTop - 2000)/500, "top": -(scrollobj.curTop - 2000)/5 +"%"});
       $("#Keplers_haul").css({"opacity": (scrollobj.curTop - 2000)/500, "top": 100 - (scrollobj.curTop - 2000)/5 +"%"});
       $("#candidates").css("opacity", (scrollobj.curTop - 2000)/500);
    };
    if (scrollobj.curTop > 2500){
       $("#in_the_frame").css({"opacity":0, "top":"-100%"});
    };
    if (scrollobj.curTop > 2500 && scrollobj.curTop <= 8000){
        d3.select("#number-box").attr("opacity", 1);
        d3.select("#number-planets").attr("opacity", 1);
    }

    if (scrollobj.curTop > 2500 && scrollobj.curTop <= 3000){
       d3.select("#number-planets").text(num_candidates + " planets");
       $("#Keplers_haul").css({"opacity":1, "top":"0%"});
       $("#candidates").css("opacity", 1);
    };
    if (scrollobj.curTop <= 3000){
       $("#ripe_for_life").css({"opacity": 0, "top":"100%"});
       $("#size").css("opacity", 0);
    };
    if (scrollobj.curTop > 3000 && scrollobj.curTop <= 3500){
       // d3.select("#number-planets").text("1690 planets");
       $("#Keplers_haul").css({"opacity":1 - (scrollobj.curTop - 3000)/500, "top": -(scrollobj.curTop - 3000)/5 +"%"});
       // $("#candidates").css("opacity", 1 - (scrollobj.curTop - 3000)/500);
       $("#candidates").css("opacity", 1);
   
       $("#ripe_for_life").css({"opacity": (scrollobj.curTop - 3000)/500, "top": 100 - (scrollobj.curTop - 3000)/5 +"%"});
       $("#size").css("opacity", (scrollobj.curTop - 3000)/500);   
    };
    if (scrollobj.curTop > 3500){
       $("#Keplers_haul").css({"opacity":0, "top":"-100%"});
       $("#candidates").css("opacity", 0);
    };


    if (scrollobj.curTop > 3500 && scrollobj.curTop <= 4000){
       // d3.select("#number-planets").text("1690 planets");
       $("#ripe_for_life").css({"opacity":1, "top":"0%"});
       $("#size").css("opacity", 1);
    };
    if (scrollobj.curTop <= 4000){
       $("#these_might_be_like_home").css({"opacity": 0, "top":"100%"});
       $("#habitable").css("opacity", 0);
    };
    if (scrollobj.curTop > 4000 && scrollobj.curTop <= 4500){
       // d3.select("#number-planets").text("~50 planets");
       $("#ripe_for_life").css({"opacity":1 - (scrollobj.curTop - 4000)/500, "top": -(scrollobj.curTop - 4000)/5 +"%"});
       // $("#size").css("opacity", 1 - (scrollobj.curTop - 4000)/500);
       $("#size").css("opacity", 1);
   
       $("#these_might_be_like_home").css({"opacity": (scrollobj.curTop - 4000)/500, "top": 100 - (scrollobj.curTop - 4000)/5 +"%"});
       $("#habitable").css("opacity", (scrollobj.curTop - 4000)/500);
    };
    if (scrollobj.curTop > 4500){
       $("#ripe_for_life").css({"opacity":0, "top":"-100%"});
       $("#size").css("opacity", 0);
    };

    //
    if (scrollobj.curTop > 4500 && scrollobj.curTop <= 5000){
       // d3.select("#number-planets").text("~50 planets");
       $("#these_might_be_like_home").css({"opacity":1, "top":"0%"});
       $("#habitable").css("opacity", 1);
    };
    if (scrollobj.curTop <= 5000){
       $("#Earths_galore").css({"opacity": 0, "top":"100%"});
       $("#geometry").css("opacity", 0);
    };
    if (scrollobj.curTop > 5000 && scrollobj.curTop <= 5500){
       // d3.select("#number-planets").text("~22,500 planets");
       $("#these_might_be_like_home").css({"opacity":1 - (scrollobj.curTop - 5000)/500, "top": -(scrollobj.curTop - 5000)/5 +"%"});
       // $("#habitable").css("opacity", 1 - (scrollobj.curTop - 5000)/500);
       $("#habitable").css("opacity", 1);
   
       $("#Earths_galore").css({"opacity": (scrollobj.curTop - 5000)/500, "top": 100 - (scrollobj.curTop - 5000)/5 +"%"});
       $("#geometry").css("opacity", (scrollobj.curTop - 5000)/500);
    };
    if (scrollobj.curTop > 5500){
       $("#these_might_be_like_home").css({"opacity":0, "top":"-100%"});
       $("#habitable").css("opacity", 0);
    };

    //
    if (scrollobj.curTop > 5500 && scrollobj.curTop <= 6000){
       // d3.select("#number-planets").text("~22,500 planets");
       $("#Earths_galore").css({"opacity":1, "top":"0%"});
       $("#geometry").css("opacity", 1);
    };
    if (scrollobj.curTop <= 6000){
       $("#the_bigger_picture").css({"opacity": 0, "top":"100%"});
       $("#all_sky").css("opacity", 0);
       $("#zoom_sky").css("opacity", 0);
       // $("#rotating").css("opacity", 0);  
    };
    if (scrollobj.curTop > 6000 && scrollobj.curTop <= 6500){
       // d3.select("#number-planets").text("15-30 billion planets");
       $("#Earths_galore").css({"opacity":1 - (scrollobj.curTop - 6000)/500, "top": -(scrollobj.curTop - 6000)/5 +"%"});
       // $("#geometry").css("opacity", 1);
       $("#geometry").css("opacity", 0);
       $("#all_sky").css("opacity", 1);
   
       $("#the_bigger_picture").css({"opacity": (scrollobj.curTop - 6000)/500, "top": 100 - (scrollobj.curTop - 6000)/5 +"%"});
       // $("#all_sky").css("opacity", (scrollobj.curTop - 6000)/500);  
       $("#zoom_sky").css("opacity", (scrollobj.curTop - 6000)/500);
       // $("#rotating").css("opacity", (scrollobj.curTop - 6000)/500);  
    };
    if (scrollobj.curTop > 6500){
       // d3.select("#number-planets").text("15-30 billion planets");
       $("#Earths_galore").css({"opacity":0, "top":"-100%"});
       $("#geometry").css("opacity", 0);
       $("#all_sky").css("opacity", 0);
       $("#zoom_sky").css("opacity", 1);  
       // $("#rotating").css("opacity", 1);  
    };

    //
    if (scrollobj.curTop > 6500 && scrollobj.curTop <= 7000){
       $("#the_bigger_picture").css({"opacity":1, "top":"0%"});
    };
    if (scrollobj.curTop <= 7000){
       $("#the_search_continues").css({"opacity": 0, "top":"100%"});
       // $("#movie").css("opacity", 0);
       // g.select("#zoom_sky")
       //     .attr("xlink:href", "img/kepler_zoomedsky.png");
    };
    if (scrollobj.curTop > 7000 && scrollobj.curTop < 7500){
       $("#the_bigger_picture").css({"opacity":1 - (scrollobj.curTop - 7000)/500, "top": -(scrollobj.curTop - 7000)/5 +"%"});
       $("#the_search_continues").css({"opacity": (scrollobj.curTop - 7000)/500, "top": 100 - (scrollobj.curTop - 7000)/5 +"%"});
       // $("#movie").css("opacity", 0);
       // g.select("#zoom_sky")
       //     .attr("xlink:href", "img/kepler_zoomedsky.png");
    };
    if (scrollobj.curTop >= 7500){
       $("#the_bigger_picture").css({"opacity":0, "top":"-100%"});
       // $("#movie").css("opacity", 1);
       // $("#zoom_sky").css("opacity", 0);
    };

    //
    if (scrollobj.curTop > 7500 && scrollobj.curTop <= 8000){
       $("#the_search_continues").css({"opacity":1, "top":"0%"});
    };
    if (scrollobj.curTop <= 8000){
       $("#credits").css({"opacity": 0, "top":"100%"});
       $("#horizon").css({"opacity": 0, "top":"100%"});
    };
    if (scrollobj.curTop > 8000 && scrollobj.curTop <= 8500){
       $("#the_search_continues").css({"opacity":1 - (scrollobj.curTop - 8000)/500, "top": -(scrollobj.curTop - 8000)/5 +"%"});
       $("#credits").css({"opacity": (scrollobj.curTop - 8000)/500, "top": 100 - (scrollobj.curTop - 8000)/5 +"%"});
       $("#horizon").css({"opacity": (scrollobj.curTop - 8000)/500, "top": 100 - (scrollobj.curTop - 8000)/5 +"%"});
       $("#number-planets").attr("opacity", 1 - (scrollobj.curTop - 8000)/500);
       $("#number-box").attr("opacity", 1 - (scrollobj.curTop - 8000)/500);
    };
    if (scrollobj.curTop > 8500){
       $("#the_search_continues").css({"opacity":0, "top":"-100%"});
       $("#horizon").css({"opacity": 1, "top":"0%"});
       $("#number-planets").attr("opacity", 0);
       $("#number-box").attr("opacity", 0);
    };
    
    //
    if (scrollobj.curTop > 8500 && scrollobj.curTop <= 9000){
       $("#credits").css({"opacity":1, "top":"0%"});
    };
    if (scrollobj.curTop > 9000 && scrollobj.curTop <= 9500){
       $("#credits").css({"opacity":1 - (scrollobj.curTop - 9000)/500, "top": -(scrollobj.curTop - 9000)/5 +"%"});
    };
    if (scrollobj.curTop > 9500){
       $("#credits").css({"opacity":0, "top":"-100%"});
    };
    
    // Handling the text animation.
    if (scrollobj.curTop > 3250 && scrollobj.lastTop <= 3250 && scrollobj.curTop < 4250){
        d3.select("#number-planets")
            .transition()
            .duration(number_time)
            .tween("text", function(){
                var string = this.textContent.split(",").join("") // removes all commas from the string.
                var f = d3.interpolate(parseInt(string), num_rocky_planets);
                return function(t){
                    var number = Math.round(f(t));
                    num_string = pretty_number_string(number);
                    this.textContent = num_string + " planets";
                }
            });
    };
    
    if (scrollobj.curTop <= 3250 && scrollobj.lastTop > 3250){
        d3.select("#number-planets")
            .transition()
            .duration(number_time)
            .tween("text", function(){
                var string = this.textContent.split(",").join("") // removes all commas from the string.
                var f = d3.interpolate(parseInt(string), num_candidates);
                return function(t){
                    var number = Math.round(f(t));
                    num_string = pretty_number_string(number);
                    this.textContent = num_string + " planets";
                }
            });
    };
    
    if (scrollobj.curTop > 4250 && scrollobj.lastTop <= 4250 && scrollobj.curTop < 5250){
        d3.select("#number-planets")
            .transition()
            .duration(number_time)
            .tween("text", function(){
                var string = this.textContent.split(",").join("") // removes all commas from the string.
                var f = d3.interpolate(parseInt(string), num_habitable_planets);
                return function(t){
                    var number = Math.round(f(t));
                    num_string = pretty_number_string(number);
                    // planet_string = newInterpolateString(" planets", " Earths ")(t);
                    planet_string = " Earths "
                    this.textContent = num_string + planet_string; 
               }
            });
    };
    
    if (scrollobj.curTop <= 4250 && scrollobj.lastTop > 4250 && scrollobj.curTop > 3250){
        d3.select("#number-planets")
            .transition()
            .duration(number_time)
            .tween("text", function(){
                var string = this.textContent.split(",").join("") // removes all commas from the string.
                var f = d3.interpolate(parseInt(string), num_rocky_planets);
                return function(t){
                    var number = Math.round(f(t));
                    num_string = pretty_number_string(number);
                    // planet_string = newInterpolateString(" Earths ", " planets")(t);
                    planet_string = " planets"
                    this.textContent = num_string + planet_string; 
               }
            });
    };
    
    if (scrollobj.curTop > 5250 && scrollobj.lastTop <= 5250 && scrollobj.curTop < 6250){
        d3.select("#number-planets")
            .transition()
            .duration(number_time)
            .tween("text", function(){
                var string = this.textContent.split(",").join("") // removes all commas from the string.
                var f = d3.interpolate(parseInt(string), 22500);
                return function(t){
                    var number = Math.round(f(t));
                    num_string = pretty_number_string(number);
                    this.textContent = num_string + " Earths ";
                }
            });
    };
    
    if (scrollobj.curTop <= 5250 && scrollobj.lastTop > 5250 && scrollobj.curTop > 4250){
        d3.select("#number-planets")
            .transition()
            .duration(number_time)
            .tween("text", function(){
                var string = this.textContent.split(",").join("") // removes all commas from the string.
                var f = d3.interpolate(parseInt(string), num_habitable_planets);
                return function(t){
                    var number = Math.round(f(t));
                    num_string = pretty_number_string(number);
                    this.textContent = num_string + " Earths ";
                }
            });
    };
    
    if (scrollobj.curTop > 6250 && scrollobj.lastTop <= 6250){
        d3.select("#number-planets")
            .transition()
            .duration(number_time)
            .ease("exp")
            .tween("text", function(){
                var string = this.textContent.split(",").join("") // removes all commas from the string.
                var f = d3.interpolate(parseInt(string), 1000000000);
                return function(t){
                    var number = Math.round(f(t));
                    num_string = pretty_number_string(number);
                    this.textContent = num_string + " Earths ";
                };
            })
            .each("end", function(){this.textContent = "15-30 billion Earths "});
    };
    
    if (scrollobj.curTop <= 6250 && scrollobj.lastTop > 6250 && scrollobj.curTop > 5250){
        d3.select("#number-planets")
            .transition()
            .duration(number_time)
            .ease("exp-out")
            .tween("text", function(){
                var string = this.textContent.split(",").join("") // removes all commas from the string.
                var f = d3.interpolate(parseInt(string), 22500);
                return function(t){
                    var number = Math.round(f(t));
                    num_string = pretty_number_string(number);
                    this.textContent = num_string + " Earths ";
                };
            })
            .each("start", function(){this.textContent = "1,000,000,000 Earths "});
    };
    
    // Handling the zoom.
    if (scrollobj.curTop <= zoom_position){
        var new_zoom = zoom_max/zoom_min;
        var rt = rescale_translation(new_zoom);
        g.attr("transform", "scale(" + new_zoom + ")translate(" + width*rt + "," + height*rt + ")");
    };
    if (scrollobj.curTop >= zoom_position && scrollobj.curTop <= (zoom_position + zoom_scroll_length)){
        var scroll_ratio = (scrollobj.curTop - zoom_position)/zoom_scroll_length; // varies from 0 to 1 over the relevant scroll range
        var new_zoom = zoom_max/zoom_min * (1 + (zoom_min/zoom_max - 1) * scroll_ratio); // varies from zoom_max/zoom_min to 1 over the relevant scroll range
        var rt = rescale_translation(new_zoom);
        g.attr("transform", "scale(" + new_zoom + ")translate(" + (width*rt + scroll_ratio*100) + "," + height*rt + ")");
    };
    if (scrollobj.curTop >= (zoom_position + zoom_scroll_length) && scrollobj.curTop < 7500){
        g.attr("transform", "scale(1)translate(100,0)");
    };
    
    // Handling the rotation.
    if (scrollobj.curTop >= 7500 && scrollobj.lastTop < 7500){
        // g.select("#zoom_sky")
        //     .attr("xlink:href", "img/kepler_movie.gif");
        
        // // Get rid of the redundant movie.
        // svg.select("#movie").remove();
        
        // g.attr("transform", "scale(1)translate(100,0)rotate(15 " + projection([0, 0])[1] + " " + projection([0, 0])[0] + ")");
        // console.log(g.attr("transform"));
        // console.log("yo, over here");
        var velocity = .0025;
        svg.select("#rotating").style("opacity", 1);
        var then = Date.now();
        d3.timer(function() {
            var angle = velocity * (then - Date.now()) - initial_ra;
            // console.log(angle);
            // g_rotate.attr("transform", "scale(1)translate(100,0)rotate(" + angle + " " + new_projection([0, 90])[0] + " " + new_projection([0, 90])[1] + ")");
            g_rotate.attr("transform", "translate(100,0)rotate(" + angle + " " + old_projection([0, 90])[0] + " " + old_projection([0, 90])[1] + ")");
            if (scrollobj.curTop < 7500){
                g_rotate.attr("transform", "translate(100,0)rotate(" + -1*initial_ra + " " + old_projection([0, 90])[0] + " " + old_projection([0, 90])[1] + ")");
                return true;
            };
        });
    };
    if (scrollobj.curTop < 7500 && scrollobj.lastTop >= 7500){
        svg.select("#rotating").style("opacity", 0);
        // g_rotate.attr("transform", "translate(100,0)rotate(" + -1*initial_ra + " " + old_projection([0, 90])[0] + " " + old_projection([0, 90])[1] + ")");
    };

});

// Handling window resizing behavior.
$(window).resize(function(){
        
    // Reset the width and height variables.
    width = $("body").innerWidth();
    height = window.innerHeight;
    
    // Reset image offset locations.
    pic_x = (width - pic_width)/2;
    pic_y = (height - pic_height)/2;

    // Resize the SVG canvas.
    svg.attr("width", width)
        .attr("height", height);
    
    // Reset the image offsets.
    svg.selectAll(".skyimage")
            .attr("x", pic_x)
            .attr("y", pic_y);
    
    // Reset rotating-image location.
    
    // This is the same projection used in creating the static images in the first place.
    old_projection = d3.geo.stereographic()
        .clipAngle(140)
        .scale(zoom_min)
        .translate([width/2, height/2])
        .precision(10)              // We don't care much about precision at small scales -- it's a star map!
     	.rotate([initial_ra, initial_dec]);

    old_polaris_location = old_projection([0, 90]);

    dx = width/2 - old_polaris_location[0];
    dy = height/2 - old_polaris_location[1];
    
    svg.select("#rotating")
        .attr("x", (width - rotating_pic_width)/2 - dx)
        .attr("y", (height - rotating_pic_width)/2 - dy);
    
    // Reset number box and text location.
     svg.select("#number-box")
         .attr("x", width - rect_width);

    svg.select("#number-planets")
         .attr("x", width - rect_width/2);
    
    // Handle horizon image size.
    svg.select("#horizon")
        .attr("x", 0)
        .attr("y", height - width*(pic_height/pic_width))
        .attr("width", width)
        .attr("height", width*(pic_height/pic_width));
                     
    // Make sure the scroll location isn't lost on iOS devices when the screen is rotated.
    if (navigator.userAgent.match(/ipad|iphone/i) !== null){
        $(window).scrollTop(Math.round(scrollobj.curTop/1000)*1000);
    };
        
});


// Making the page scroll down when the down-flashers are clicked.
$(".flasher").click(function(){
    
    // First, test to see if we're on an iOS device -- the animation of the scroll doesn't work well there.
    if (navigator.userAgent.match(/ipad|iphone/i) === null){
        
        // Find the new location -- scroll down to the next multiple of 1000, plus 500.
        // Can't use ceil here, since we need this to work when we're already at a multiple of 1000 and want to jump to the next one.
        // var new_location = (Math.floor(scrollobj.curTop/1000) + 1) * 1000;
        if (scrollobj.curTop <= 500){
            var new_location = 1000;
        }
        else{
            var new_location = Math.round(scrollobj.curTop/1000) * 1000 + 500;
        }
        
        // Animating the scroll transition through judicious use of jQuery, 
        // along with CSS properties on the top-level HTML tag.
        // For whatever reason, "body" works in Webkit (Chrome and Safari), while "html" works in Firefox.
        // $(window).scrollTop(new_location - 500);
        $("body,html").animate({
            scrollTop: new_location
        }, scroll_time);
    }
    else { 
        // The iPad has a weird bug where it will sometimes scroll to 5999 if you ask it to go to 6000.
        // Luckily, we've disabled manual scrolling, so it will always be very close to a multiple of 1000 anyhow.
        // Therefore, we can just tell it to round to the nearest 1000 when calculating the next position, 
        // rather than messing with the whole floor/ceil business.
        var new_location = (Math.round(scrollobj.curTop/1000) + 1) * 1000;
        $(window).scrollTop(new_location); // this just jumps the page to the appropriate location, rather than animating it.
        }; 
    
});

// Making the page scroll up when the up-flashers are clicked.
$(".flasher-up").click(function(){
    
    // First, test to see if we're on an iOS device -- the animation of the scroll doesn't work well there.
    if (navigator.userAgent.match(/ipad|iphone/i) === null){
        
        // Find the new location -- scroll up to the previous multiple of 1000.
        // Can't use floor here, since we need this to work when we're already at a multiple of 1000 and want to jump to the next one.
        var new_location = (Math.ceil(scrollobj.curTop/1000) - 1) * 1000; // can't use floor, since we need this to work for multiples of 1000.
        
        // Animating the scroll transition through judicious use of jQuery, 
        // along with CSS properties on the top-level HTML tag.
        // For whatever reason, "body" works in Webkit (Chrome and Safari), while "html" works in Firefox.
        // $(window).scrollTop(new_location + 500);
        $("body,html").animate({
            scrollTop: new_location
        }, scroll_time);
    }
    else { 
        var new_location = (Math.round(scrollobj.curTop/1000) - 1) * 1000;
        $(window).scrollTop(new_location); // this just jumps the page to the appropriate location.
        };
});

// Making the page scroll back to the top when the back-to-top button is pressed.
$("#back-to-top").click(function(){
    
    // First, test to see if we're on an iOS device -- the animation of the scroll doesn't work well there.
    if (navigator.userAgent.match(/ipad|iphone/i) === null){
        
        // Animating the scroll transition through judicious use of jQuery, 
        // along with CSS properties on the top-level HTML tag.
        // For whatever reason, "body" works in Webkit (Chrome and Safari), while "html" works in Firefox.
        $("body,html").animate({
            scrollTop: 0
        }, scroll_time);
    }
    else { 
        $(window).scrollTop(0); // this just jumps the page to the appropriate location.
        }; 
});
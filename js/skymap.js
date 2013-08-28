/////////////////////////////////////
// Defining some global variables //
////////////////////////////////////

var width = window.innerWidth,
	height = window.innerHeight;

// Note that these are negative -- that has to do with how rotation works on the stereographic projection.
// Really, the initial dec (and RA, I believe) is positive.
var initial_ra = -55,  // in degrees
	initial_dec = -45;

// Determine how far the map zooms in and out during the zoom transition.
var zoom_min = 1000,
    zoom_max = 2500;

// Does what it says on the tin, in milliseconds.
var zoom_transition_time = 2000;

var pic_width = 1440,
    pic_height = 771;

//////////////////////////
// Actually draw stuff! //
//////////////////////////

// Add an svg canvas to the appropriate place on the page.
var svg = d3.select("#main_event_interactive").append("svg")
    .attr("width", width)
    .attr("height", height);

// Define image anchors.
// We need to make sure the center of the screen always lines up with the center of the images.
// The default anchor, (0, 0), is the upper-left corner of the screen.
// So define a displacement from that location as appropriate to the size of the screen.
var pic_x = (width - pic_width)/2,
    pic_y = (height - pic_height)/2;


// Load the images.
    svg.append("image")
        .attr("xlink:href", "img/test0.png")
        .attr("id", "background")
        .attr("x", pic_x)
        .attr("y", pic_y)
        .attr("width", pic_width)
        .attr("height", pic_height)
        .attr("opacity", 1);
    
    g = svg.append("g");
    
    svg.append("image")
        .attr("xlink:href", "img/test1.png")
        .attr("id", "candidates")
        .attr("x", pic_x)
        .attr("y", pic_y)
        .attr("width", pic_width)
        .attr("height", pic_height)
        .style("opacity", 0);
	
    svg.append("image")
        .attr("xlink:href", "img/test2.png")
        .attr("id", "size")
        .attr("x", pic_x)
        .attr("y", pic_y)
        .attr("width", pic_width)
        .attr("height", pic_height)
        .style("opacity", 0);
    
    svg.append("image")
        .attr("xlink:href", "img/test3.png")
        .attr("id", "habitable")
        .attr("x", pic_x)
        .attr("y", pic_y)
        .attr("width", pic_width)
        .attr("height", pic_height)
        .style("opacity", 0);
    
    svg.append("image")
        .attr("xlink:href", "img/test4.png")
        .attr("id", "geometry")
        .attr("x", pic_x)
        .attr("y", pic_y)
        .attr("width", pic_width)
        .attr("height", pic_height)
        .style("opacity", 0);
    
    svg.append("image")
        .attr("xlink:href", "img/test5.png")
        .attr("id", "all_sky")
        .attr("x", pic_x)
        .attr("y", pic_y)
        .attr("width", pic_width)
        .attr("height", pic_height)
        .style("opacity", 0);

    g.append("image")
        .attr("xlink:href", "img/test6.png")
        .attr("id", "zoom_sky")
        .attr("x", pic_x)
        .attr("y", pic_y)
        .attr("width", pic_width)
        .attr("height", pic_height)
        .style("opacity", 0);

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
    
    zoom_ratio = new_zoom;
    
    var rt = rescale_translation(zoom_ratio);
    
    g.transition()
     .duration(zoom_transition_time)
     .attr("transform", "scale(" + zoom_ratio + ")translate(" + width*rt + "," + height*rt + ")");
};


// Define a few scrolling variables, to control the transitions.
var planets_position = 2300,
    size_position = 3300,
    habitable_position = 4300,
    geometry_position = 5300,
    all_sky_position = 6500,
    zoom_position = 6800,
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
// var render_func = function(obj){
var scrollobj = {
    lastTop: -1,
    curTop: 0
};
$(window).scroll(function(){
   scrollobj.lastTop = scrollobj.curTop;
   scrollobj.curTop = $(window).scrollTop();
   console.log("lastTop is " + scrollobj.lastTop);
   console.log("curTop is " + scrollobj.curTop); 

   
   // Handling divs.
   if (scrollobj.curTop <= 250){
       $("#intro").css("opacity", (250 - scrollobj.curTop)/250);
       $("#how_to_spot_a_planet").css({"opacity": 0, "top": "100%"});      
   };
   if (scrollobj.curTop > 250){
       $("#intro").css("opacity", 0);
   };
   if (scrollobj.curTop >= 300 && scrollobj.curTop <= 900){
       $("#how_to_spot_a_planet").css({"opacity": (scrollobj.curTop - 300)/600, "top": 100 - (scrollobj.curTop - 300)/6 + "%"});
   }
   if (scrollobj.curTop <= 1200 && scrollobj.curTop > 900){
       $("#how_to_spot_a_planet").css({"opacity": 1, "top": "0%"});      
   };   
   if (scrollobj.curTop < 1200){
       $("#intro_planet").css("opacity", 1);
       $("#main_event_interactive").css("opacity", 0);
       $("#in_the_frame").css({"opacity":0, "top":"100%"});    
   };
   if (scrollobj.curTop > 1200 && scrollobj.curTop <= 1500){
       $("#intro_planet").css("opacity", (300 - (scrollobj.curTop - 1200))/300);
       $("#how_to_spot_a_planet").css({"opacity": (300 - (scrollobj.curTop - 1200))/300, "top": -(scrollobj.curTop - 1200)/3 + "%"});
       $("#main_event_interactive").css("opacity", (scrollobj.curTop - 1200)/300);
       $("#in_the_frame").css({"opacity":(scrollobj.curTop - 1200)/300, "top": 100 - (scrollobj.curTop - 1200)/3 +"%"});
   };
   if (scrollobj.curTop > 1500){
       $("#intro_planet").css("opacity", 0);
       $("#how_to_spot_a_planet").css({"opacity": 0, "top": "-100%"}); 
       $("#main_event_interactive").css("opacity", 1);
   };
   
   
   if (scrollobj.curTop > 1500 && scrollobj.curTop <= 2000){
       $("#in_the_frame").css({"opacity":1, "top":"0%"});
   };
   if (scrollobj.curTop <= 2000){
       $("#Keplers_haul").css({"opacity": 0, "top":"100%"});
       $("#candidates").css("opacity", 0);
   };
   if (scrollobj.curTop > 2000 && scrollobj.curTop <= 2500){
       $("#in_the_frame").css({"opacity":1 - (scrollobj.curTop - 2000)/500, "top": -(scrollobj.curTop - 2000)/5 +"%"});
       $("#Keplers_haul").css({"opacity": (scrollobj.curTop - 2000)/500, "top": 100 - (scrollobj.curTop - 2000)/5 +"%"});
       $("#candidates").css("opacity", (scrollobj.curTop - 2000)/500);
   };
   if (scrollobj.curTop > 2500){
       $("#in_the_frame").css({"opacity":0, "top":"-100%"});
   };
   
   
   if (scrollobj.curTop > 2500 && scrollobj.curTop <= 3000){
       $("#Keplers_haul").css({"opacity":1, "top":"0%"});
       $("#candidates").css("opacity", 1);
   };
   if (scrollobj.curTop <= 3000){
       $("#ripe_for_life").css({"opacity": 0, "top":"100%"});
       $("#size").css("opacity", 0);
   };
   if (scrollobj.curTop > 3000 && scrollobj.curTop <= 3500){
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
       $("#ripe_for_life").css({"opacity":1, "top":"0%"});
       $("#size").css("opacity", 1);
   };
   if (scrollobj.curTop <= 4000){
       $("#these_might_be_like_home").css({"opacity": 0, "top":"100%"});
       $("#habitable").css("opacity", 0);
   };
   if (scrollobj.curTop > 4000 && scrollobj.curTop <= 4500){
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
       $("#these_might_be_like_home").css({"opacity":1, "top":"0%"});
       $("#habitable").css("opacity", 1);
   };
   if (scrollobj.curTop <= 5000){
       $("#Earths_galore").css({"opacity": 0, "top":"100%"});
       $("#geometry").css("opacity", 0);
   };
   if (scrollobj.curTop > 5000 && scrollobj.curTop <= 5500){
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
       $("#Earths_galore").css({"opacity":1, "top":"0%"});
       $("#geometry").css("opacity", 1);
   };
   if (scrollobj.curTop <= 6000){
       $("#the_bigger_picture").css({"opacity": 0, "top":"100%"});
       $("#all_sky").css("opacity", 0);
   };
   if (scrollobj.curTop > 6000 && scrollobj.curTop <= 6500){
       $("#Earths_galore").css({"opacity":1 - (scrollobj.curTop - 6000)/500, "top": -(scrollobj.curTop - 6000)/5 +"%"});
       // $("#geometry").css("opacity", 1 - (scrollobj.curTop - 6000)/500);
       $("#geometry").css("opacity", 1);
       
       $("#the_bigger_picture").css({"opacity": (scrollobj.curTop - 6000)/500, "top": 100 - (scrollobj.curTop - 6000)/5 +"%"});
       $("#all_sky").css("opacity", (scrollobj.curTop - 6000)/500);  
   };
   if (scrollobj.curTop > 6500){
       $("#Earths_galore").css({"opacity":0, "top":"-100%"});
       $("#geometry").css("opacity", 0);
   };
   
   //
   if (scrollobj.curTop > 6500 && scrollobj.curTop <= 7000){
       $("#the_bigger_picture").css({"opacity":1, "top":"0%"});
   };
   if (scrollobj.curTop <= 7000){
       $("#the_search_continues").css({"opacity": 0, "top":"100%"});
   };
   if (scrollobj.curTop > 7000 && scrollobj.curTop <= 7500){
       $("#the_bigger_picture").css({"opacity":1 - (scrollobj.curTop - 7000)/500, "top": -(scrollobj.curTop - 7000)/5 +"%"});
       $("#the_search_continues").css({"opacity": (scrollobj.curTop - 7000)/500, "top": 100 - (scrollobj.curTop - 7000)/5 +"%"});
   };
   if (scrollobj.curTop > 7500){
       $("#the_bigger_picture").css({"opacity":0, "top":"-100%"});
   };
   
   //
   if (scrollobj.curTop > 7500 && scrollobj.curTop <= 8000){
       $("#the_search_continues").css({"opacity":1, "top":"0%"});
   };
   if (scrollobj.curTop > 8000 && scrollobj.curTop <= 8500){
       $("#the_search_continues").css({"opacity":1 - (scrollobj.curTop - 8000)/500, "top": -(scrollobj.curTop - 8000)/5 +"%"});
   };
   if (scrollobj.curTop > 8500){
       $("#the_search_continues").css({"opacity":0, "top":"-100%"});
   };
   
    
    // Filling in the whole sky.
    if (scrollobj.lastTop < all_sky_position && scrollobj.curTop >= all_sky_position){
        zoom(zoom_max/zoom_min, false);        
    };
    if (scrollobj.lastTop >= all_sky_position && scrollobj.curTop < all_sky_position){
        g.select("#zoom_sky").style("opacity", 0);
    };
    
    // Zooming in and out.
    if (scrollobj.lastTop < zoom_position && scrollobj.curTop >= zoom_position){
        svg.select("#all_sky").style("opacity", 0);
        g.select("#zoom_sky").style("opacity", 1);
        zoom(1, false)
    };
    if (scrollobj.lastTop >= zoom_position && scrollobj.curTop < zoom_position){
        zoom(zoom_max/zoom_min, false);
    };

});

// $("p.flasher").click(function(){
//     console.log("click!")
//     $("window").scrollTo(scrollobj.curTop + 500);
// });

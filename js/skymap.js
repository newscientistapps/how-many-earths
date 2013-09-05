/////////////////////////////////////
// Defining some global variables //
////////////////////////////////////

var width = $("body").innerWidth(),
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

// var pic_width = 1440,
//     pic_height = 771;
var pic_width = 3000,
    pic_height = 2000;

var rect_width = 300,
    rect_height = rect_width/3.2,
    number_size = 25;

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
        .attr("xlink:href", "img/kepler_background.png")
        .attr("class", "skyimage")
        .attr("id", "background")
        .attr("x", pic_x)
        .attr("y", pic_y)
        .attr("width", pic_width)
        .attr("height", pic_height)
        .attr("opacity", 1);
    
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
        .attr("xlink:href", "img/test_big_4.png")
        .attr("class", "skyimage")
        .attr("id", "geometry")
        .attr("x", pic_x)
        .attr("y", pic_y)
        .attr("width", pic_width)
        .attr("height", pic_height)
        .style("opacity", 0);
    
    svg.append("image")
        .attr("xlink:href", "img/test_newstars_5_1px.png")
        .attr("class", "skyimage")
        .attr("id", "all_sky")
        .attr("x", pic_x)
        .attr("y", pic_y)
        .attr("width", pic_width)
        .attr("height", pic_height)
        .style("opacity", 0);

    g.append("image")
        .attr("xlink:href", "img/test_newstars_6_2px.png")
        .attr("class", "skyimage")
        .attr("id", "zoom_sky")
        .attr("x", pic_x)
        .attr("y", pic_y)
        .attr("width", pic_width)
        .attr("height", pic_height)
        .style("opacity", 0);
    
    
    // Setting up the number box, which is the only dynamically-rendered true SVG components in this whole thing.
    svg.append("rect")
        .attr("id", "number-box")
        .attr("x", width - rect_width - 10)
        .attr("y", 10)
        .attr("width", rect_width)
        .attr("height", rect_height)
        .attr("fill", "black")
        .attr("opacity", 0.85);
    
   svg.append("text")
        .attr("id", "number-planets")
        .attr("text-anchor", "middle")
        .attr("x", width - 10 - rect_width/2)
        .attr("y", 10 + rect_height/2) 
        .attr("dy", number_size/3)   // because friggin IE doesn't support dominant-baseline!
        .attr("font-family", "sans-serif")
        .attr("fill", "white")
        .attr("font-size", number_size)
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
var planets_position = 2300,
    size_position = 3300,
    habitable_position = 4300,
    geometry_position = 5300,
    all_sky_position = 6501,
    zoom_position = 6501,
    rotate_position = 6500,
    interactive_position = 8000;

// Define a scroll-listening object and function.
var scrollobj = {
    lastTop: -1,
    curTop: 0
};

$(window).scroll(function(){
   scrollobj.lastTop = scrollobj.curTop;
   scrollobj.curTop = $(window).scrollTop();
   // console.log("lastTop is " + scrollobj.lastTop);
   // console.log("curTop is " + scrollobj.curTop); 

   
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
       d3.select("#number-planets").text("");
       $("#Keplers_haul").css({"opacity": 0, "top":"100%"});
       $("#candidates").css("opacity", 0);
   };
   if (scrollobj.curTop > 2000 && scrollobj.curTop <= 2500){
       d3.select("#number-planets").text("3,458 planets");
       $("#in_the_frame").css({"opacity":1 - (scrollobj.curTop - 2000)/500, "top": -(scrollobj.curTop - 2000)/5 +"%"});
       $("#Keplers_haul").css({"opacity": (scrollobj.curTop - 2000)/500, "top": 100 - (scrollobj.curTop - 2000)/5 +"%"});
       $("#candidates").css("opacity", (scrollobj.curTop - 2000)/500);
   };
   if (scrollobj.curTop > 2500){
       $("#in_the_frame").css({"opacity":0, "top":"-100%"});
   };
   
   
   if (scrollobj.curTop > 2500 && scrollobj.curTop <= 3000){
       d3.select("#number-planets").text("3,458 planets");
       $("#Keplers_haul").css({"opacity":1, "top":"0%"});
       $("#candidates").css("opacity", 1);
   };
   if (scrollobj.curTop <= 3000){
       $("#ripe_for_life").css({"opacity": 0, "top":"100%"});
       $("#size").css("opacity", 0);
   };
   if (scrollobj.curTop > 3000 && scrollobj.curTop <= 3500){
       d3.select("#number-planets").text("1,725 planets");
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
       d3.select("#number-planets").text("1,725 planets");
       $("#ripe_for_life").css({"opacity":1, "top":"0%"});
       $("#size").css("opacity", 1);
   };
   if (scrollobj.curTop <= 4000){
       $("#these_might_be_like_home").css({"opacity": 0, "top":"100%"});
       $("#habitable").css("opacity", 0);
   };
   if (scrollobj.curTop > 4000 && scrollobj.curTop <= 4500){
       d3.select("#number-planets").text("~50 planets");
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
       d3.select("#number-planets").text("~50 planets");
       $("#these_might_be_like_home").css({"opacity":1, "top":"0%"});
       $("#habitable").css("opacity", 1);
   };
   if (scrollobj.curTop <= 5000){
       $("#Earths_galore").css({"opacity": 0, "top":"100%"});
       $("#geometry").css("opacity", 0);
   };
   if (scrollobj.curTop > 5000 && scrollobj.curTop <= 5500){
       d3.select("#number-planets").text("~22,500 planets");
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
       d3.select("#number-planets").text("~22,500 planets");
       $("#Earths_galore").css({"opacity":1, "top":"0%"});
       $("#geometry").css("opacity", 1);
   };
   if (scrollobj.curTop <= 6000){
       $("#the_bigger_picture").css({"opacity": 0, "top":"100%"});
       $("#all_sky").css("opacity", 0);
   };
   if (scrollobj.curTop > 6000 && scrollobj.curTop <= 6500){
       d3.select("#number-planets").text("~10,000,000,000 planets");
       $("#Earths_galore").css({"opacity":1 - (scrollobj.curTop - 6000)/500, "top": -(scrollobj.curTop - 6000)/5 +"%"});
       // $("#geometry").css("opacity", 1 - (scrollobj.curTop - 6000)/500);
       $("#geometry").css("opacity", 1);
       
       $("#the_bigger_picture").css({"opacity": (scrollobj.curTop - 6000)/500, "top": 100 - (scrollobj.curTop - 6000)/5 +"%"});
       $("#all_sky").css("opacity", (scrollobj.curTop - 6000)/500);  
   };
   if (scrollobj.curTop > 6500){
       d3.select("#number-planets").text("~10,000,000,000 planets");
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
   
    
    // Prepping for zoom.
    // if (scrollobj.lastTop < all_sky_position && scrollobj.curTop >= all_sky_position){
    //     zoom(zoom_max/zoom_min);        
    // };
    if (scrollobj.lastTop >= all_sky_position && scrollobj.curTop < all_sky_position){
        g.select("#zoom_sky").style("opacity", 0);
    };
    
    // Zooming in and out.
    // if (scrollobj.lastTop < zoom_position && scrollobj.curTop >= zoom_position){
    //     svg.select("#all_sky").style("opacity", 0);
    //     g.select("#zoom_sky").style("opacity", 1);
    //     zoom(1)
    // };
    // if (scrollobj.lastTop >= zoom_position && scrollobj.curTop < zoom_position){
    //     zoom(zoom_max/zoom_min);
    // };
    if (scrollobj.lastTop < zoom_position && scrollobj.curTop >= zoom_position){
        svg.select("#all_sky").style("opacity", 0);
        g.select("#zoom_sky").style("opacity", 1);
    };
    if (scrollobj.lastTop >= zoom_position && scrollobj.curTop < zoom_position){
        svg.select("#all_sky").style("opacity", 1);
        g.select("#zoom_sky").style("opacity", 0);
    };
    if (scrollobj.curTop <= zoom_position){
        var new_zoom = zoom_max/zoom_min;
        var rt = rescale_translation(new_zoom);
        g.attr("transform", "scale(" + new_zoom + ")translate(" + width*rt + "," + height*rt + ")");
    };
    if (scrollobj.curTop >= zoom_position && scrollobj.curTop <= (zoom_position + 800)){
        var scroll_ratio = (scrollobj.curTop - zoom_position)/800; // varies from 0 to 1 over the relevant scroll range
        var new_zoom = zoom_max/zoom_min * (1 + (zoom_min/zoom_max - 1) * scroll_ratio); // varies from zoom_max/zoom_min to 1 over the relevant scroll range
        var rt = rescale_translation(new_zoom);
        g.attr("transform", "scale(" + new_zoom + ")translate(" + (width*rt + scroll_ratio*100) + "," + height*rt + ")");
    };
    if (scrollobj.curTop >= (zoom_position + 800)){
        g.attr("transform", "scale(1)translate(100,0)");
    };

});

// Handling window resizing behavior.
$(window).resize(function(){
    
    // Reset the width and height variables.
    width = window.innerWidth;
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
    
    // Reset number box and text location.
     svg.select("#number-box")
         .attr("x", width - rect_width - 10);

    svg.select("#number-planets")
         .attr("x", width - 10 - rect_width/2);
    
});


// Making the page scroll down when the down-flashers are clicked.
$(".flasher").click(function(){
    console.log("click!"); // for debugging purposes.

    // $(window).scrollTop(scrollobj.curTop + 1000); // this just jumps the page to the appropriate location.
    
    // Animating the scroll transition through judicious use of jQuery, 
    // along with CSS properties on the top-level HTML tag.
    // For whatever reason, "body" works in Webkit (Chrome and Safari), while "html" works in Firefox.
    var new_location = (Math.floor(scrollobj.curTop/1000) + 1) * 1000; // can't use ceil, since we need this to work for multiples of 1000.
    $("body,html").animate({
        // scrollTop: scrollobj.curTop + 1000
        scrollTop: new_location
    }, "slow"); // slow is 600ms.
});

// Making the page scroll up when the up-flashers are clicked.
$(".flasher-up").click(function(){
    console.log("click!"); // for debugging purposes.

    // $(window).scrollTop(scrollobj.curTop + 1000); // this just jumps the page to the appropriate location.
    
    // Animating the scroll transition through judicious use of jQuery, 
    // along with CSS properties on the top-level HTML tag.
    // For whatever reason, "body" works in Webkit (Chrome and Safari), while "html" works in Firefox.
    var new_location = (Math.ceil(scrollobj.curTop/1000) - 1) * 1000; // can't use floor, since we need this to work for multiples of 1000.
    console.log(scrollobj.curTop);
    console.log(new_location);
    $("body,html").animate({
        // scrollTop: scrollobj.curTop - 1000
        scrollTop: new_location
    }, "slow"); // slow is 600ms.
});

// Making the page scroll back to the top when the back-to-top button is pressed.
$("#back-to-top").click(function(){
    console.log("click!"); // for debugging purposes.

    // $(window).scrollTop(scrollobj.curTop + 1000); // this just jumps the page to the appropriate location.
    
    // Animating the scroll transition through judicious use of jQuery, 
    // along with CSS properties on the top-level HTML tag.
    // For whatever reason, "body" works in Webkit (Chrome and Safari), while "html" works in Firefox.
    $("body,html").animate({
        scrollTop: 0
    }, 1200); // Made this a little longer than the other transitions, since it has to scroll farther.
});
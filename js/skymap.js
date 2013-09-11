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

// Picture width and height depend on what browser we're in.
if (navigator.userAgent.match(/ipad|iphone/i) === null){
    var pic_width = 3000,
        pic_height = 2000;
}
else {
    var pic_width = 1500,
        pic_height = 1000;
}

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
        
    g.append("image")
        .attr("xlink:href", "img/kepler_movie_16.gif")
        .attr("class", "skyimage")
        .attr("id", "movie")
        // .attr("x", (width - pic_width/2)/2)
        // .attr("y", (height - pic_height/2)/2)
        // .attr("width", pic_width/2)
        // .attr("height", pic_height/2)
        .attr("x", (width - pic_width)/2)
        .attr("y", (height - pic_height)/2)
        .attr("width", pic_width)
        .attr("height", pic_height)
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
    };
    
    
    
    // Setting up the number box, which is the only dynamically-rendered true SVG components in this whole thing.
    svg.append("rect")
        .attr("id", "number-box")
        .attr("x", width - rect_width - 10)
        .attr("y", 0)
        .attr("width", rect_width)
        .attr("height", rect_height)
        .attr("fill", "black")
        .attr("opacity", 0);
    
   svg.append("text")
        .attr("id", "number-planets")
        .attr("text-anchor", "middle")
        .attr("x", width - 10 - rect_width/2)
        .attr("y", rect_height/2) 
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
       d3.select("#number-planets").text("");
       $("#Keplers_haul").css({"opacity": 0, "top":"100%"});
       $("#candidates").css("opacity", 0);
    };
    if (scrollobj.curTop > 2000 && scrollobj.curTop <= 2500){
       d3.select("#number-box").attr("opacity", 1);
       d3.select("#number-planets").text("3,458 planets");
       $("#in_the_frame").css({"opacity":1 - (scrollobj.curTop - 2000)/500, "top": -(scrollobj.curTop - 2000)/5 +"%"});
       $("#Keplers_haul").css({"opacity": (scrollobj.curTop - 2000)/500, "top": 100 - (scrollobj.curTop - 2000)/5 +"%"});
       $("#candidates").css("opacity", (scrollobj.curTop - 2000)/500);
    };
    if (scrollobj.curTop > 2500){
       d3.select("#number-box").attr("opacity", 1);
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
       $("#zoom_sky").css("opacity", 0);
    };
    if (scrollobj.curTop > 6000 && scrollobj.curTop <= 6500){
       d3.select("#number-planets").text("15-30 billion planets");
       $("#Earths_galore").css({"opacity":1 - (scrollobj.curTop - 6000)/500, "top": -(scrollobj.curTop - 6000)/5 +"%"});
       // $("#geometry").css("opacity", 1);
       $("#geometry").css("opacity", 0);
       $("#all_sky").css("opacity", 1);
   
       $("#the_bigger_picture").css({"opacity": (scrollobj.curTop - 6000)/500, "top": 100 - (scrollobj.curTop - 6000)/5 +"%"});
       // $("#all_sky").css("opacity", (scrollobj.curTop - 6000)/500);  
       $("#zoom_sky").css("opacity", (scrollobj.curTop - 6000)/500);  
    };
    if (scrollobj.curTop > 6500){
       d3.select("#number-planets").text("15-30 billion planets");
       $("#Earths_galore").css({"opacity":0, "top":"-100%"});
       $("#geometry").css("opacity", 0);
       $("#all_sky").css("opacity", 0);
       $("#zoom_sky").css("opacity", 1);  
    };

    //
    if (scrollobj.curTop > 6500 && scrollobj.curTop <= 7000){
       $("#the_bigger_picture").css({"opacity":1, "top":"0%"});
    };
    if (scrollobj.curTop <= 7000){
       $("#the_search_continues").css({"opacity": 0, "top":"100%"});
       $("#movie").css("opacity", 0);
    };
    if (scrollobj.curTop > 7000 && scrollobj.curTop <= 7500){
       $("#the_bigger_picture").css({"opacity":1 - (scrollobj.curTop - 7000)/500, "top": -(scrollobj.curTop - 7000)/5 +"%"});
       $("#the_search_continues").css({"opacity": (scrollobj.curTop - 7000)/500, "top": 100 - (scrollobj.curTop - 7000)/5 +"%"});
    };
    if (scrollobj.curTop > 7500){
       $("#the_bigger_picture").css({"opacity":0, "top":"-100%"});
       $("#movie").css("opacity", 1);
       $("#zoom_sky").css("opacity", 0);
    };

    //
    if (scrollobj.curTop > 7500 && scrollobj.curTop <= 8000){
       $("#the_search_continues").css({"opacity":1, "top":"0%"});
    };
    if (scrollobj.curTop <= 8000){
       $("#credits").css({"opacity": 0, "top":"100%"});
    };
    if (scrollobj.curTop > 8000 && scrollobj.curTop <= 8500){
       $("#the_search_continues").css({"opacity":1 - (scrollobj.curTop - 8000)/500, "top": -(scrollobj.curTop - 8000)/5 +"%"});
       $("#credits").css({"opacity": (scrollobj.curTop - 8000)/500, "top": 100 - (scrollobj.curTop - 8000)/5 +"%"});
    };
    if (scrollobj.curTop > 8500){
       $("#the_search_continues").css({"opacity":0, "top":"-100%"});
    };
    
    //
    if (scrollobj.curTop > 8500 && scrollobj.curTop <= 9000){
       $("#credits").css({"opacity":1, "top":"0%"});
    };
    // if (scrollobj.curTop <= 9000){
    //    $("#horizon").css({"opacity": 0, "top":"100%"});
    // };
    if (scrollobj.curTop > 9000 && scrollobj.curTop <= 9500){
       $("#credits").css({"opacity":1 - (scrollobj.curTop - 9000)/500, "top": -(scrollobj.curTop - 9000)/5 +"%"});
       // $("#horizon").css({"opacity": (scrollobj.curTop - 9000)/500, "top": 100 - (scrollobj.curTop - 9000)/5 +"%"});
    };
    if (scrollobj.curTop > 9500){
       $("#credits").css({"opacity":0, "top":"-100%"});
       // $("#horizon").css({"opacity": 1, "top":"0%"});
       console.log("over here!")
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
    if (scrollobj.curTop >= (zoom_position + zoom_scroll_length)){
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
             
    // Make sure the scroll location isn't lost on iOS devices when the screen is rotated.
    if (navigator.userAgent.match(/ipad|iphone/i) !== null){
        $(window).scrollTop(Math.round(scrollobj.curTop/1000)*1000);
    };
    
});


// Making the page scroll down when the down-flashers are clicked.
$(".flasher").click(function(){
    
    // First, test to see if we're on an iOS device -- the animation of the scroll doesn't work well there.
    if (navigator.userAgent.match(/ipad|iphone/i) === null){
        
        // Find the new location -- scroll down to the next multiple of 1000.
        // Can't use ceil here, since we need this to work when we're already at a multiple of 1000 and want to jump to the next one.
        var new_location = (Math.floor(scrollobj.curTop/1000) + 1) * 1000;
        
        // Animating the scroll transition through judicious use of jQuery, 
        // along with CSS properties on the top-level HTML tag.
        // For whatever reason, "body" works in Webkit (Chrome and Safari), while "html" works in Firefox.
        $("body,html").animate({
            scrollTop: new_location
        }, 2000);
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
        $("body,html").animate({
            scrollTop: new_location
        }, 2000);
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
        }, 2000);
    }
    else { 
        $(window).scrollTop(0); // this just jumps the page to the appropriate location.
        }; 
});
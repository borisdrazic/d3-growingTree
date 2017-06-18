function ColorPicker(selector, id, initialColor, colorChanged) {
	"use strict";

    var svCanvasWidth = 200, // width of canveas rectangle for saturation and value
        svCanvasHeight = 100, // height of canveas rectangle for saturation and value
        hCanvasWidth = 200, // width of canveas line for hue
        hCanvasHeight = 8, // height of canveas line for hue
        channels = { // HSV channel maps from HSV properties to postion on canvas (x is currently selected value)
            h: {scale: d3.scaleLinear().domain([0, 360]).range([0, hCanvasWidth]), x: 0},
            s: {scale: d3.scaleLinear().domain([0, 1]).range([0, svCanvasWidth]), x : svCanvasWidth / 2}, 
            v: {scale: d3.scaleLinear().domain([0, 1]).range([0, svCanvasHeight]), x : svCanvasHeight / 2}
        },
        svCanvas, // canvas for SV picker
        hCanvas, // canvas for H picker
        svSvg, // SVG for SV picker
        hSvg, // SVG for H picker
        padding = 15; // padding around canvas (to allow picker circle to overflow canvas)



    /**
     * Return currently selected color (in HSV format).
     */
    function getCurrnetColor() {
        return d3.hsv(
            channels.h.scale.invert(channels.h.x),
            channels.s.scale.invert(channels.s.x),
            channels.v.scale.invert(channels.v.x)
        );
    }

    /**
     * Handle drag on SV picker.
     * Moves and limits to canvas area circle picker.
     * Updates the color in picker circle.
     * Fires colorChanged event function.
     */
    function svDragged(d) {
        var x = Math.min(Math.max(0, d3.event.x), svCanvasWidth),
            y = Math.min(Math.max(0, d3.event.y), svCanvasHeight);
        
        channels.s.x  = x;
        channels.v.x  = svCanvasHeight - y;

        svSvg.select("circle.picker")
            .attr("cx", x)
            .attr("cy", y)
            .attr("fill", d3.rgb(getCurrnetColor()));

        colorChanged({
            id : id,
            value : d3.rgb(getCurrnetColor())
        });
    }

    /**
     * Handle drag on H picker.
     * Moves and limits to canvas area circle picker.
     * Updates the SV color picker canvas and the color in picker circle.
     * Fires colorChanged event function.
     */
    function hDragged(d) {
        var x = Math.min(Math.max(0, d3.event.x), hCanvasWidth);
        
        channels.h.x  = x;

        hSvg.select("circle.picker")
            .attr("cx", x)
            .attr("fill", d3.rgb(d3.hsv(channels.h.scale.invert(channels.h.x), 1, 1)));

        svSvg.select("circle.picker")
            .attr("fill", d3.rgb(getCurrnetColor()));

        svCanvas.each(svRender);

        colorChanged({
            id : id,
            value : d3.rgb(getCurrnetColor())
        });
    }

    /**
     * Render SV picker canvas.
     * Render all saturation and value for selected hue.
     */
    function svRender() {
        var width = this.width,
            heigth = this.height,
            context = this.getContext("2d"),
            image = context.createImageData(width, heigth),
            i = -1,
            c, x, y;

        var current = d3.hsv(
            channels.h.scale.invert(channels.h.x),
            channels.s.scale.invert(channels.s.x),
            channels.v.scale.invert(channels.v.x)
        );

        for (y = heigth - 1; y >= 0; --y) {
            current.v = channels.v.scale.invert(y);
            for (x = 0; x < width; ++x) {
                current.s = channels.s.scale.invert(x);
                
                c = d3.rgb(current);
                image.data[++i] = c.r;
                image.data[++i] = c.g;
                image.data[++i] = c.b;
                image.data[++i] = 255;    
            }
        }
        context.putImageData(image, 0, 0);
    }

    /**
     * Render H picker canvas.
     * Render all hue values with saturation and value set to one.
     */
    function hRender() {
        var width = this.width,
            context = this.getContext("2d"),
            image = context.createImageData(width, 1),
            i = -1,
            c, x,
            current = d3.hsv(channels.h.scale.invert(channels.h.x), 1, 1);

        for (x = 0; x < width; ++x) {
            current.h = channels.h.scale.invert(x);            
            c = d3.rgb(current);
            image.data[++i] = c.r;
            image.data[++i] = c.g;
            image.data[++i] = c.b;
            image.data[++i] = 255;    
        }
        context.putImageData(image, 0, 0);
    }
    
    /**
     * Create color picker.
     */
    function create() {
        var svDiv, // div holding saturation and value picker
            hDiv; // div holding hue picker

        // set initial picker position
        channels.h.x = channels.h.scale(d3.hsv(initialColor).h);
        // when converting grays from RGB to HSV, hue will be NaN, so set it to middle of scale
        // NB: grays have saturation = 0, so hue is irrelevant for color
        if (isNaN(channels.h.x)) {
            channels.h.x = hCanvasWidth / 2;
        }
        channels.s.x = channels.s.scale(d3.hsv(initialColor).s);
        channels.v.x = channels.v.scale(d3.hsv(initialColor).v);

        // create divs for SV and H pickers
        svDiv = d3.select(selector)
            .append("div")
            .classed("svDiv", true);
        hDiv= d3.select(selector)
            .append("div")
            .classed("hDiv", true);

        // create canvases for SV and H pickers
        svCanvas = svDiv.append("canvas")
            .classed("sv", true)
            .attr("width", svCanvasWidth)
            .attr("height", svCanvasHeight)
            .each(svRender);
        hCanvas= hDiv.append("canvas")
            .classed("h", true)
            .attr("width", hCanvasWidth)
            .attr("height", 1)
            .each(hRender);

        // create SVGs for SV and H pickers (to hold picker circles)
        svSvg = svDiv.append("svg")
            .attr("width", svCanvasWidth + 2 * padding)
            .attr("height", svCanvasHeight + 2 * padding);
        hSvg = hDiv.append("svg")
            .attr("width", hCanvasWidth + 2 * padding)
            .attr("height", hCanvasHeight + 2 * padding);
        
        // create circle pickers for SV and H pickers, and add drag events
        svSvg.append("g")
            .attr("transform", "translate(" + padding + ", " + padding + ")")
            .append("circle")
            .classed("picker", true)
            .attr("cx", channels.s.x)
            .attr("cy", svCanvasHeight - channels.v.x)
            .attr("r", padding * 2 / 3)
            .attr("fill", d3.rgb(getCurrnetColor()))
            .call(d3.drag()
                .on("start drag", svDragged)
            );
        hSvg.append("g")
            .attr("transform", "translate(" + padding + ", " + (padding + hCanvasHeight / 2) + ")")
            .append("circle")
            .classed("picker", true)
            .attr("cx", channels.h.x)
            .attr("cy", 0)
            .attr("r", padding * 2 / 3)
            .attr("fill", d3.rgb(d3.hsv(channels.h.scale.invert(channels.h.x), 1, 1)))
            .call(d3.drag()
                .on("start drag", hDragged)
            );
    }

    // create the color picker
    create();
}
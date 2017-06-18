function ArcSizer(svgSelector, id, initialAngle, angleChanged, angleChangeEnded) {
	"use strict";
    
    var that = this;
    that.id = id;
    that.initialAngle = initialAngle;
    that.angleChanged = angleChanged; // Callled during drag for angle. Returns id, side (0-left, 1-right) and angle size in radians.
    that.angleChangeEnded = angleChangeEnded; // Callled when drag ended for angle. Returns id, side (0-left, 1-right) and angle size in radians.
    that.innerRadius = 80; // inner radius of the arc
    that.outerRadius = 110; // outer radius of the arc
    that.smallRadius = 50; // outer radius of small arc
    that.maxLeftAngle = -Math.PI / 2; // maximum available angle to select on the left
    that.minLeftAngle = -Math.PI / 8; // minimum available angle to select on the left
    that.minRightAngle = Math.PI / 8; // minimum available angle to select on the right
    that.maxRightAngle = Math.PI / 2; // maximum available angle to select on the right
    
    that.svg = d3.select(svgSelector); // SVG element
    that.width = +that.svg.attr("width"); // width of the SVG
    that.height = +that.svg.attr("height"); // height of the SVG
    that.midRadius = that.innerRadius + (that.outerRadius - that.innerRadius) / 2; // radius at the middle of the arc

    /**
     * Returns Cartesian x coordinate from polar angle (in radians) and radius.
     */
    function getXfromPolar(angle, radius) {
        return radius * Math.cos(-Math.PI / 2 + angle);
    }

    /**
     * Returns Cartesian y coordinate from polar angle (in radians) and radius.
     */
    function getYfromPolar(angle, radius) {
        return radius * Math.sin(-Math.PI / 2 + angle);
    }

    /**
     * Returns polar angle (in radians) coordinate from Cartesian x and y coordinates.
     */
    function getAnglefromCartesian(x, y) {
        return Math.atan2(y, x) + Math.PI / 2;
    }

    /**
     * Returns angle on the left side between min and max.
     * If angle is outside [min, max] this function will return the bound (min or max) closes to angle.
     */
    function getBoundAngleLeft(angle, min, max) {
        if (angle > min || angle < max) {
            if (angle > Math.PI) {
                return max;
            } else {
                return min;
            }
        } else {
            return angle;
        }
    }

    /**
     * Returns angle on the right side between min and max.
     * If angle is outside [min, max] this function will return the bound (min or max) closes to angle.
     */
    function getBoundAngleRight(angle, min, max) {
        if (angle < min) {
            return min;
        } else if (angle > max) {
            return max;
        } else {
            return angle;
        }
    }

    /**
     * Create ArcSizer in SVG element defined by selector.
     */
    this.create = function (selector) {
        var leftSliderG,
            leftAngle =  that.initialAngle[0],
            leftHandle,
            leftLine,
            leftSliderGTriangles,
            leftScale,
            leftArrowG,
            leftText,
            rightSliderG,
            rightAngle = that.initialAngle[1],
            rightHandle,
            rightLine,
            rightScale,
            rightSliderGTriangles,
            rightArrowG,
            rightText;

        // SVG g element centered in SVG
        that.arcG = that.svg.append("g") 
            .attr("transform", "translate(" + that.width / 2 + "," + (that.height - 20) + ")");
        
        // D3 generator for arc
        that.arcGenerator = d3.arc() 
            .innerRadius(that.innerRadius)
            .outerRadius(that.outerRadius);
        
        // D3 generator for small arc
        that.smallArcGenerator = d3.arc() 
            .innerRadius(0)
            .outerRadius(that.smallRadius);
        
        // big arc on top
        that.arc = that.arcG.append("path") 
            .datum({startAngle: leftAngle, endAngle: rightAngle})
            .classed("arc", true)
            .attr("d", that.arcGenerator);
        
        // small arc below
        that.smallArc = that.arcG.append("path") 
            .datum({startAngle: leftAngle, endAngle: rightAngle})
            .attr("id", "smallArc-" + that.id)
            .classed("smallArc", true)
            .style("stroke-dasharray", (-0.5 + that.smallRadius * (rightAngle - leftAngle)) + " " + (2 * that.smallRadius + 0.5))
            .style("stroke-linejoin", "round")
            .attr("d", that.smallArcGenerator);
        
        // scale for the angle on the left (full angle is PI/2, but is bound by minLeftAngle and maxLeftAngle)
        leftScale = d3.scaleLinear()
            .domain([-Math.PI / 2, 0])
            .range([0, 90]);

        // scale for the angle on the right (full angle is PI/2, but is bound by minRightAngle and maxRightAngle)
        rightScale = d3.scaleLinear()
            .domain([0, Math.PI / 2])
            .range([90, 180]);

        // SCG g element for left slider handle
        leftSliderG = that.arcG.append("g")
            .attr("class", "leftSlider")
            .attr("transform", "translate(" + getXfromPolar(leftAngle, that.midRadius) + ", " + getYfromPolar(leftAngle, that.midRadius) + ")");

        // SCG g element for right slider handle
        rightSliderG = that.arcG.append("g")
            .attr("class", "rightSlider")
            .attr("transform", "translate(" + getXfromPolar(rightAngle, that.midRadius) + ", " + getYfromPolar(rightAngle, that.midRadius) + ")");

        // thick part of middle vertical line
        that.arcG.append("line")
            .classed("line", true)
            .attr("x1", getXfromPolar(0, that.smallRadius - 5))
            .attr("y1", getYfromPolar(0, that.smallRadius - 5))
            .attr("x2", getXfromPolar(0, that.smallRadius + 5))
            .attr("y2", getYfromPolar(0, that.smallRadius + 5))
            .style("stroke-width", 3);

        // middle vertical line
        that.arcG.append("line")
            .classed("line", true)
            .attr("x1", 0)
            .attr("y1", 0)
            .attr("x2", getXfromPolar(0, that.innerRadius))
            .attr("y2", getYfromPolar(0, that.innerRadius));

        // left line connecting center to arc
        leftLine = that.arcG.append("line")
            .classed("line", true)
            .attr("x1", 0)
            .attr("y1", 0)
            .attr("x2", getXfromPolar(leftAngle, that.innerRadius))
            .attr("y2", getYfromPolar(leftAngle, that.innerRadius));

        // right line connecting center to arc
        rightLine = that.arcG.append("line")
            .classed("line", true)
            .attr("x1", 0)
            .attr("y1", 0)
            .attr("x2", getXfromPolar(rightAngle, that.innerRadius))
            .attr("y2", getYfromPolar(rightAngle, that.innerRadius));
        
        // left slider handle and drag handling
        leftHandle = leftSliderG.append("circle")
            .classed("handle", true)
            .attr("cx", 0)
            .attr("cy", 0)
            .attr("r", 9)
            .call(d3.drag()
                .on("start.interrupt", function() { leftSliderG.interrupt(); })
                .on("start drag", function() { 
                    // get current pointer position in arc coordinate system
                    var xPos = d3.event.x + getXfromPolar(leftAngle, that.midRadius),
                        yPos = d3.event.y + getYfromPolar(leftAngle, that.midRadius),
                        angle = getBoundAngleLeft(getAnglefromCartesian(xPos, yPos), that.minLeftAngle, that.maxLeftAngle);
                    
                    // store current left angle
                    leftAngle = angle;

                    // move left slider to current pointer position
                    leftSliderG.attr("transform", "translate(" + getXfromPolar(angle, that.midRadius) + ", " + getYfromPolar(angle, that.midRadius) + ")");
                    // rotate triangles in left slider so they are orthogonal to arc edge
                    leftSliderGTriangles.attr("transform", "rotate(" + (leftScale(angle)) + ")");
                    // move line connecting center to left arc edge to new arc left edge position
                    leftLine
                        .attr("x2", getXfromPolar(angle, that.innerRadius))
                        .attr("y2", getYfromPolar(angle, that.innerRadius));
                    // update big arc with new left angle position
                    that.arc.datum({startAngle: angle, endAngle: rightAngle})
                        .attr("d", that.arcGenerator);
                    // update small arc with new left angle position
                    that.smallArc.datum({startAngle: angle, endAngle: rightAngle})
                        .attr("d", that.smallArcGenerator)
                        .style("stroke-dasharray", (-0.5 + that.smallRadius * (rightAngle - angle)) + " " + (2 * that.smallRadius + 0.5));
                    // update position of arrow on the left (in small circle) and rotate arrow head so it is orthogonal to left line
                    leftArrowG.attr("transform", "translate(" + getXfromPolar(angle, that.smallRadius) + ", " + getYfromPolar(angle, that.smallRadius) + ") " + "rotate(" + (leftScale(angle + 0.05)) + ")");
                    // update angle size display and center it on selected left angle
                    leftText
                        .attr("startOffset", that.smallRadius * -angle / 2.2)
                        .text(Math.round(angle * -180/Math.PI) + String.fromCharCode(176));
                    // center right angle size display on right angle (this needs updating as text position depends on selected left angle size)
                    rightText
                        .attr("startOffset", that.smallRadius * (rightAngle / 1.8 - leftAngle));

                    that.angleChanged({
                            id : that.id,
                            value : leftAngle,
                            side : 0
                        });
                })
                .on("end", function() {
                    that.angleChangeEnded({
                            id : that.id,
                            value : leftAngle,
                            side : 0
                        });
                }));

        // right slider handle and drag handling
        rightHandle = rightSliderG.append("circle")
            .classed("handle", true)
            .attr("cx", 0)
            .attr("cy", 0)
            .attr("r", 9)
            .call(d3.drag()
                .on("start.interrupt", function() { rightSliderG.interrupt(); })
                .on("start drag", function() { 
                    // get current pointer position in arc coordinate system
                    var xPos = d3.event.x + getXfromPolar(rightAngle, that.midRadius),
                        yPos = d3.event.y + getYfromPolar(rightAngle, that.midRadius),
                        angle = getBoundAngleRight(getAnglefromCartesian(xPos, yPos), that.minRightAngle, that.maxRightAngle);

                    // store current right angle
                    rightAngle = angle;

                    // move right slider to current pointer position
                    rightSliderG.attr("transform", "translate(" + getXfromPolar(angle, that.midRadius) + ", " + getYfromPolar(angle, that.midRadius) + ")");
                    // rotate triangles in right slider so they are orthogonal to arc edge
                    rightSliderGTriangles.attr("transform", "rotate(" + (rightScale(angle)) + ")");
                    // move line connecting center to right arc edge to new arc right edge position
                    rightLine
                        .attr("x2", getXfromPolar(angle, that.innerRadius))
                        .attr("y2", getYfromPolar(angle, that.innerRadius));
                    // update big arc with new right angle position
                    that.arc.datum({startAngle: leftAngle, endAngle: angle})
                        .attr("d", that.arcGenerator);
                    // update small arc with new right angle position
                    that.smallArc.datum({startAngle: leftAngle, endAngle: angle})
                        .attr("d", that.smallArcGenerator)
                        .style("stroke-dasharray", (-0.5 + that.smallRadius * (angle - leftAngle)) + " " + (2 * that.smallRadius + 0.5));
                    // update position of arrow on the right (in small circle) and rotate arrow head so it is orthogonal to right line
                    rightArrowG.attr("transform", "translate(" + getXfromPolar(angle, that.smallRadius) + ", " + getYfromPolar(angle, that.smallRadius) + ") " + "rotate(" + (rightScale(angle - 0.05)) + ")");
                    // update angle size display and center it on selected right angle
                    rightText
                        .attr("startOffset", that.smallRadius * (rightAngle / 1.8 - leftAngle))
                        .text(Math.round(angle * 180/Math.PI) + String.fromCharCode(176));

                    that.angleChanged({
                        id : that.id,
                        value : rightAngle,
                        side : 1

                    });
                })
                .on("end", function() {
                    that.angleChangeEnded({
                        id : that.id,
                        value : rightAngle,
                        side : 1

                    });
                }));

        // add triangles to left slider hand
        leftSliderGTriangles = leftSliderG.append("g")
            .attr("transform", "rotate(" + (leftScale(leftAngle)) + ")");
        leftSliderGTriangles.append("polygon")
            .style("pointer-events", "none")
            .attr("points", "-5,1 5,1 0,6");
        leftSliderGTriangles.append("polygon")
            .style("pointer-events", "none")
            .attr("points", "-5,-1 5,-1 0,-6");
        // add triangles to right slider hand
        rightSliderGTriangles = rightSliderG.append("g")
            .attr("transform", "rotate(" + (rightScale(rightAngle)) + ")");
        rightSliderGTriangles.append("polygon")
            .style("pointer-events", "none")
            .attr("points", "-5,1 5,1 0,6");
        rightSliderGTriangles.append("polygon")
            .style("pointer-events", "none")
            .attr("points", "-5,-1 5,-1 0,-6");

        // add left arrow to small arc
        leftArrowG = that.arcG.append("g")
            .attr("class", "leftArrow")
            .attr("transform", "translate(" + getXfromPolar(leftAngle, that.smallRadius) + ", " + getYfromPolar(leftAngle, that.smallRadius) + ") " + "rotate(" + (leftScale(leftAngle + 0.05)) + ")");
        leftArrowG.append("polygon")
            .style("pointer-events", "none")
            .attr("points", "-4,-10 4,-10 0,0.5");
        // add right arrow to small arc
        rightArrowG = that.arcG.append("g")
            .attr("class", "rightArrow")
            .attr("transform", "translate(" + getXfromPolar(rightAngle, that.smallRadius) + ", " + getYfromPolar(rightAngle, that.smallRadius) + ") " + "rotate(" + (leftScale(rightAngle - 0.05)) + ")");
        rightArrowG.append("polygon")
            .style("pointer-events", "none")
            .attr("points", "-4,10 4,10 0,-0.5");
        // add left angle size display
        leftText = that.arcG.append("text")
            .attr("dy", -10)
            .append("textPath")
                .attr("href", " #smallArc-" + that.id)
                .attr("startOffset", that.smallRadius * -leftAngle / 2.2)
                .text(Math.round(leftAngle * -180/Math.PI) + String.fromCharCode(176));
        // add right angle size display
        rightText = that.arcG.append("text")
            .attr("dy", -10)
            .append("textPath")
                .attr("href", "#smallArc-" + that.id)
                .attr("startOffset", that.smallRadius * (rightAngle / 1.8 - leftAngle))
                .text(Math.round(rightAngle * 180/Math.PI) + String.fromCharCode(176));

    };
    
    this.create(svgSelector);
}
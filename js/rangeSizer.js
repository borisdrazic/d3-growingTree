function RangeSizer(svgSelector, id, initialRange, rangeChanged) {
	"use strict";

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

    
    var that = this;
    that.id = id;
    that.range = initialRange;
    that.rangeChanged = rangeChanged;
    that.maxNumberBranches = 8;
    that.minRadius = 50;
    that.maxRadius = 75;
    that.coverRadius = 30;
    
    
    that.svg = d3.select(svgSelector); // SVG element
    that.width = +that.svg.attr("width"); // width of the SVG
    that.height = +that.svg.attr("height"); // height of the SVG

    function onClick(d) {
        if (d3.select(this).classed("min")) {
            that.range[0] = d;
            if (that.range[0] > that.range[1]) {
                that.range[0] = that.range[1];
            }
            that.rangeChanged({
                id : that.id,
                value : that.range[0],
                side : 0
            });
        } else {
            that.range[1] = d;
            if (that.range[1] < that.range[0]) {
                that.range[1] = that.range[0];
            }
            that.rangeChanged({
                id : that.id,
                value : that.range[1],
                side : 1
            });
        }
        updateSelected();
        
    }

    function updateSelected() {
        that.mainG.selectAll("line.branch")
            .classed("selected", function(d) {
                return d >= that.range[0] && d <= that.range[1];
            });
    }

    this.create = function (selector) {
        var i,
            arc,
            sliceAngle = Math.PI / that.maxNumberBranches;

        that.mainG = that.svg.append("g")
           .attr("transform", "translate(" + (that.width / 2) + ", " + (that.height / 2) + ")");

        
        // add branches
        for(i = 0; i < that.maxNumberBranches; ++i) {
            

            that.mainG.append("line")
                .datum(i + 1)
                .classed("branch", true)
                .classed("max", true)
                .attr("x1", getXfromPolar(sliceAngle / 2 - Math.PI / 2 + sliceAngle * i, that.minRadius))
                .attr("y1", getYfromPolar(sliceAngle / 2 - Math.PI / 2 + sliceAngle * i, that.minRadius))
                .attr("x2", getXfromPolar(sliceAngle / 2 - Math.PI / 2 + sliceAngle * i, that.maxRadius))
                .attr("y2", getYfromPolar(sliceAngle / 2 - Math.PI / 2 + sliceAngle * i, that.maxRadius))
                .on("click", onClick);

            that.mainG.append("line")
                .datum(i + 1)
                .classed("branch", true)
                .classed("min", true)
                .attr("x1", 0)
                .attr("y1", 0)
                .attr("x2", getXfromPolar(sliceAngle / 2 - Math.PI / 2 + sliceAngle * i, that.minRadius))
                .attr("y2", getYfromPolar(sliceAngle / 2 - Math.PI / 2 + sliceAngle * i, that.minRadius))
                .on("click", onClick);
        }

        updateSelected();


        

        // add trunk
        that.mainG.append("line")
            .classed("trunk", true)
            .attr("x1", 0)
            .attr("y1", 0)
            .attr("x2", 0)
            .attr("y2", 50);

        // add cover arc at top of trunk
        arc = d3.arc()
            .innerRadius(0)
            .outerRadius(that.coverRadius)
            .startAngle(-Math.PI / 2 + sliceAngle / 2)
            .endAngle(Math.PI / 2 - sliceAngle / 2);

        that.mainG
            .append("g")
            .attr("transform", "translate(0, 5.1)")
            .append("path")
            .attr("d", arc);
    };
    
    // create range picker
    this.create(svgSelector);
}
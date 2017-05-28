(function() {
	"use strict"
	
	var lines = [{ x1: 500, x2: 500, y1: 1000, y2: 700, level : 0, angle : 0, length : 50}],
		levelThicknessScale = d3.scaleOrdinal().domain([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]).range([8, 7, 6, 5, 4, 3, 2, 1.5, 1.25, 1, 0.5]),
		levelAngleRangeScale = d3.scaleOrdinal().domain([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]).range([0.15 *  2 * Math.PI, 0.15 *  2 * Math.PI, 0.3 *  2 * Math.PI, 0.3 *  2 * Math.PI, 0.3 *  2 * Math.PI, 0.3 *  2 * Math.PI, 0.2 *  2 * Math.PI, 0.2 *  2 * Math.PI, 0.75 *  2 * Math.PI, 0.9 *  2 * Math.PI]),
		levelLengthRangeScale = d3.scaleOrdinal().domain([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]).range([100, 90, 80, 70, 60, 50, 40, 33, 25, 15, 50]),
		levelColorScale = d3.scaleOrdinal().domain([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]).range(["#777", "#777", "#777", "#777", "#777", "#777", "#777", "#777", "green", "green", "lightgreen"]),
		maxLevels = 10,
		animationDuration = 300;

	function getRandomInt(min, max) {
  		return Math.floor(Math.random() * (max - min + 1)) + min;
	}

	function branchLine(line) {
		var newLine,
			newLevel = line.level + 1,
			newAngle,
			newLength = levelLengthRangeScale(newLevel),
			i;

		if (newLevel > maxLevels) {
			return;
		}

		for (i = 0; i < getRandomInt(2, 3); ++i) {
			newAngle = line.angle + levelAngleRangeScale(newLevel) * (-0.5 + Math.random());
			newLine = {
				x1 : line.x2, 
				x2 : line.x2 + newLength * Math.sin(newAngle),
				y1 : line.y2, 
				y2 : line.y2 - newLength * Math.cos(newAngle),
				level : newLevel,
				angle : newAngle,
				length : newLength
			};
			lines.push(newLine);
			branchLine(newLine);
		}
	}

	function create() {
		d3.select("svg")
			.selectAll("line")
			.data(lines)
			.enter()
			.append("line")
				.attr("x1", function(d, i) {
					return d.x1;
				})
				.attr("y1", function(d, i) {
					return d.y1;
				})
				.attr("x2", function(d, i) {
					return d.x1;
				})
				.attr("y2", function(d, i) {
					return d.y1;
				})
				.style("stroke-width", function(d) {
					return levelThicknessScale(d.level);
				})
				.style("stroke", function(d) {
					return levelColorScale(d.level);
				})
				.transition()
					.duration(animationDuration)
					.delay(function(d) {
						return d.level * 0.7 * animationDuration;
					})
					.attr("x2", function(d, i) {
						return d.x2;
					})
					.attr("y2", function(d, i) {
						return d.y2;
					});
	}
	branchLine(lines[0]);
	create();
})();

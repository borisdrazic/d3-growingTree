function Tree(svgSelector) {
	"use strict";

	/**
	 * Returns a random integer between d[0] and d[1] (inclusive).
	 */
	function getRandomInt(d) {
  		return Math.floor(Math.random() * (d[1]- d[0] + 1)) + d[0];
	}
	var maxLevels = 11, // maximum supported number of levels
		maxLevelsToAnimateLength = 7, // if tree has less than this number of levels animate length as user dragges, otherwise animate on drag end
		maxLevelsToAnimateAngle = 7, // if tree has less than this number of levels animate angle as user dragges, otherwise animate on drag end
		animationDuration = { // duration of different animations
			wholeTree : 300,
			thickness : 100,
			length : 100,
			level : 200
		},
		levelsDomain = d3.range(0, maxLevels), //array of level numbers
		levelThicknessRange = [11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1], // thickness of branches per level
		levelLengthRange = [100, 95, 90, 85, 80, 70, 60, 50, 40, 30, 20], // length of branches per level
		levelAngleRange = levelsDomain.map(function(d) { return [-0.15 * Math.PI, 0.15 * Math.PI]; }), // angle range for child branches per level
		levelNumberBranchesRange = levelsDomain.map(function(d) { return [2, 3]; }), // range for number of child branches per level
		levelColorRange = ["#6D7993", "#6D7993", "#6D7993", "#6D7993", "#6D7993", "#6D7993", "#6D7993", "#6D7993", "#96858F", "#96858F", "#96858F"], // colors for bransches per level
		svg = d3.select(svgSelector), // svg element
		lines = [], // lines/branches of the tree
		firstLine = { x1: +svg.attr("width") / 2, x2: +svg.attr("width") / 2, y1: +svg.attr("height"), y2: +svg.attr("height") - levelLengthRange[0], level : 0, angle : 0, length : levelLengthRange[0], children :  []},
		noLevels = 0, // current number of levels in the tree
		levelThicknessScale = d3.scaleOrdinal().domain(levelsDomain).range(levelThicknessRange), // mapping from level to thickness
		levelLengthRangeScale = d3.scaleOrdinal().domain(levelsDomain).range(levelLengthRange), // mapping from level to length
		levelAngleRangeScale = d3.scaleOrdinal().domain(levelsDomain).range(levelAngleRange), // mapping from level to angle range
		levelNumberBranchesRangeScale = d3.scaleOrdinal().domain(levelsDomain).range(levelNumberBranchesRange), // mapping from level to number of branches range
		levelColorScale = d3.scaleOrdinal().domain(levelsDomain).range(levelColorRange); // mapping from level to color
		
	
	/**
	 * Update x1, x2, y1, and y2 of drawn lines based on new values in data.
	 */
	function redrawTree(data) {
		var line;

		// redraw tree
		line = svg.selectAll("line")
			.data(data, function(d, i) {
				return i;
			});

		line
			.transition()
			.duration(animationDuration.length)
			.attr("x1", function(d, i) {
				return d.x1;
			})
			.attr("y1", function(d, i) {
				return d.y1;
			})
			.attr("x2", function(d, i) {
				return d.x2;
			})
			.attr("y2", function(d, i) {
				return d.y2;
			});
	}
	
	/** 
	 * Recompute the lines of the tree, keeping all properties the same apart from line length.
	 * levelLengthRangeScale() will be called on all lines and descendants position will be updated to
	 * reflect change in ancestor line length.
	 */
	function updateLineWithLength(lines, line) {
		var i,
			childNewLength = levelLengthRangeScale(line.level + 1),
			childLine;

		for(i = 0; i < line.children.length; ++i) {
			childLine = lines[line.children[i]];
			childLine.x1 = line.x2;
			childLine.x2 = line.x2 + childNewLength * Math.sin(childLine.angle);
			childLine.y1 = line.y2;
			childLine.y2 = line.y2 - childNewLength * Math.cos(childLine.angle);
			childLine.length = childNewLength;
			updateLineWithLength(lines, childLine);
		}
	}

	/** 
	 * Recompute the lines of the tree, keeping all properties the same apart from angle.
	 * levelAngleRangeScale() will be called for lines on levelToUpdate and descendants position will be updated to
	 * reflect change in ancestor line angle.
	 */
	function updateLineWithAngle(lines, line, levelToUpdate) {
		var i,
			newAngle,
			childLine;

		for(i = 0; i < line.children.length; ++i) {
			childLine = lines[line.children[i]];
			if (line.level === levelToUpdate) {
				newAngle = line.angle + levelAngleRangeScale(line.level)[0] + (levelAngleRangeScale(line.level)[1] - levelAngleRangeScale(line.level)[0]) * Math.random();
			} else {
				newAngle = childLine.angle;
			}

			childLine.x1 = line.x2;
			childLine.x2 = line.x2 + childLine.length * Math.sin(newAngle);
			childLine.y1 = line.y2;
			childLine.y2 = line.y2 - childLine.length * Math.cos(newAngle);
			childLine.angle = newAngle;
			updateLineWithAngle(lines, childLine, levelToUpdate);
		}	
	}

	/**
	 * Update line thickness, redraw tree.
	 * d.id is level
	 * d.value is length
	 */
	function updateThickness(data, d) {
		var line;

		levelThicknessRange[d.id] = d.value;
		levelThicknessScale.range(levelThicknessRange);

		line = svg.selectAll("line")
			.data(data, function(d, i) {
				return i;
			});

		line
			.transition()
			.duration(animationDuration.thickness)
			.style("stroke-width", function(d) {
				return levelThicknessScale(d.level);
			});
	}

	/** 
	 * Update length range, recompute and redraw tree.
	 * d.id is level
	 * d.value is length
	 */
	function updateLength(data, d) {
		// update length range
		levelLengthRange[d.id] = d.value;
		levelLengthRangeScale.range(levelLengthRange);

		// recompute all lines of the tree (all descendants of lines that changed length change x1, x2, y1, and y2 positions)
		data[0].x2 = data[0].x1 + levelLengthRangeScale(0) * Math.sin(data[0].angle);
		data[0].y2 = data[0].y1 - levelLengthRangeScale(0) * Math.cos(data[0].angle);
		data[0].length =  levelLengthRangeScale(0);
		updateLineWithLength(data, data[0]);

		// redraw tree
		redrawTree(lines);
	}

	/** 
	 * Update angle range, recompute and redraw tree.
	 * d.id is level
	 * d.side is 0 for left and 1 for right size
	 * d.value is angle in radians
	 */
	function updateAngle(data, d) {
		// update angle range
		levelAngleRange[d.id][d.side] = d.value;
		levelAngleRangeScale.range(levelAngleRange);

		// recompute all lines of the tree (all descendants of lines that changed angle range change x1, x2, y1, and y2 positions)
		updateLineWithAngle(data, data[0], d.id);

		// redraw tree
		redrawTree(lines);
	}

	/** 
	 * Update number of branches range, recompute and redraw whole tree.
	 * d.id is level
	 * d.side is 0 for min and 1 for max
	 * d.value is number
	 */
	function updateNumberBranches(data, d) {
		// update angle range
		levelNumberBranchesRange[d.id][d.side] = d.value;
		levelNumberBranchesRangeScale.range(levelNumberBranchesRange);

		// recompute and redraw tree
		firstLine.children = [];
		lines = [firstLine];
		branchLine(lines[0]);
		update(lines);
	}
	
	/**
	 * Update line color, redraw tree.
	 * d.id is level
	 * d.value is color
	 */
	function updateColor(data, d) {
		var line;

		levelColorRange[d.id] = d.value;
		levelColorScale.range(levelColorRange);

		line = svg.selectAll("line")
			.data(data, function(d, i) {
				return i;
			});

		line.style("stroke", function(d) {
				return levelColorScale(d.level);
			});
	}

	/** 
	 * Add a level to the tree and draw new branches.
	 */
	function updateLinesAddLevel() {
		var i,
			noExistingLines = lines.length,
			line;

		noLevels++;
		for (i = 0; i < noExistingLines; ++i) {
			if (lines[i].children.length === 0) {
				branchLine(lines[i]);
			}
		}
		
		line = svg.selectAll("line")
			.data(lines, function(d, i) {
				return i;
			});

		line.enter()
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
				.duration(animationDuration.level)
				.attr("x2", function(d, i) {
					return d.x2;
				})
				.attr("y2", function(d, i) {
					return d.y2;
				});
	}

	/** 
	 * Remove a level form the tree and delete branches from removed level.
	 */
	function updateLinesRemoveLevel() {
		var i,
			line;

		noLevels--;
		for (i = 0; i < lines.length; ++i) {
			var stop = lines[i].children.length === 0;
			if (lines[i].level === noLevels - 1) {
				lines[i].children = [];
			}

			if (stop) {
				lines.splice(i);
				break;
			}
		}

		line = svg.selectAll("line")
			.data(lines, function(d, i) {
				return i;
			});

		line.exit()
			.transition()
				.duration(animationDuration.level)
				.attr("x2", function(d, i) {
					return d.x1;
				})
				.attr("y2", function(d, i) {
					return d.y1;
				})
				.remove();
	}

	/** 
	 * Create descendants of line until noLevels is reached.
	 * Created lines are added to the end of lines array.
	 */
	function branchLine(line) {
		var newLine,
			newLevel = line.level + 1,
			newAngle,
			newLength = levelLengthRangeScale(newLevel),
			i,
			noBranches = getRandomInt(levelNumberBranchesRangeScale(line.level));

		if (newLevel >= noLevels) {
			return;
		}

		for (i = 0; i < noBranches; ++i) {
			newAngle = line.angle + levelAngleRangeScale(line.level)[0] + (levelAngleRangeScale(line.level)[1] - levelAngleRangeScale(line.level)[0]) * Math.random();
			newLine = {
				x1 : line.x2, 
				x2 : line.x2 + newLength * Math.sin(newAngle),
				y1 : line.y2, 
				y2 : line.y2 - newLength * Math.cos(newAngle),
				level : newLevel,
				angle : newAngle,
				length : newLength,
				children :  []
			};
			line.children.push(lines.length);
			lines.push(newLine);
			branchLine(newLine);
		}
	}

	/** 
	 * Update the tree display.
	 */
	function update(data) {
		var line;	
		
		line = svg.selectAll("line")
			.data(data, function(d, i) {
				return i;
			});

		line.exit()	
			.transition()
				.duration(animationDuration.wholeTree)
				.attr("x1", function(d, i) {
					return firstLine.x1;
				})
				.attr("y1", function(d, i) {
					return firstLine.y1;
				})
				.attr("x2", function(d, i) {
					return firstLine.x1;
				})
				.attr("y2", function(d, i) {
					return firstLine.y1;
				})
				.remove();

		line.enter()
			.append("line")
			.merge(line)
				.attr("x1", function(d, i) {
					return firstLine.x1;
				})
				.attr("y1", function(d, i) {
					return firstLine.y1;
				})
				.attr("x2", function(d, i) {
					return firstLine.x1;
				})
				.attr("y2", function(d, i) {
					return firstLine.y1;
				})
				.style("stroke-width", function(d) {
					return levelThicknessScale(d.level);
				})
				.style("stroke", function(d) {
					return levelColorScale(d.level);
				})
				.transition()
					.duration(animationDuration.wholeTree)
					.attr("x1", function(d, i) {
						return d.x1;
					})
					.attr("y1", function(d, i) {
						return d.y1;
					})
					.attr("x2", function(d, i) {
						return d.x2;
					})
					.attr("y2", function(d, i) {
						return d.y2;
					});
	}

	// create the tree
	firstLine.children = [];
	lines = [firstLine];
	update(lines);



	// Functions to get propertis per level
	this.getLevelThickness = function(level) {
		return levelThicknessScale(level);
	};

	this.getLevelLength = function(level) {
		return levelLengthRangeScale(level);
	};

	this.getLevelAngle = function(level) {
		return levelAngleRangeScale(level);
	};

	this.getLevelNumberBranches = function(level) {
		return levelNumberBranchesRangeScale(level);
	};
	this.getLevelcolor = function(level) {
		return levelColorScale(level);
	};

	// Return max number of levels supported
	this.getMaxLevelNo = function() {
		return maxLevels;
	};

	// Handles for changes of tree properties
	this.thicknessChanged = function(d) {
		updateThickness(lines, d);
	};
	this.lengthChanged = function(d) {
		if (noLevels <= maxLevelsToAnimateLength) {
			updateLength(lines, d);
		}
	};
	this.lengthChangeEnded = function(d) {
		if (noLevels > maxLevelsToAnimateLength) {
			updateLength(lines, d);
		}
	};
	this.angleChanged = function(d) {
		if (noLevels <= maxLevelsToAnimateAngle) {
			updateAngle(lines, d);
		}
	};
	this.angleChangeEnded = function(d) {
		if (noLevels > maxLevelsToAnimateAngle) {
			updateAngle(lines, d);
		}
	};
	this.numberBranchesChanged = function(d) {
		updateNumberBranches(lines, d);
	};
	this.colorChanged = function(d) {
		updateColor(lines, d);
	};

	// Add/remove level
	this.addLevel = function() {
		updateLinesAddLevel();
	};
	this.removeLevel = function() {
		updateLinesRemoveLevel();
	};
}

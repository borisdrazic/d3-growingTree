(function() {
	"use strict";

	var tree,
		noLevels = 0;

	/**
	 * Enable and disable add/remove buttons so that user can select
	 * between 1 and tree.getMaxLevelNo() levels.
	 */
	function enableDisableAddRemove() {
		d3.select("#removeLevelButton")
			.classed("disabled", noLevels === 1);

		d3.select("#addLevelButton")
			.classed("disabled", noLevels === tree.getMaxLevelNo());
	}

	/**
	 * Adds controls for a level of the tree to side box.
	 * Adds level to tree.
	 */
	function addLevel(addToTree) {
		var panel,
			i;

		i = noLevels++;
		enableDisableAddRemove();
		

		panel = d3.select(".box.side div")
			.append("div")
			.classed("panel", true);

		panel.append("div")
			.classed("level", true)
			.text("Level " + i);

		panel.append("svg")
			.classed("rectSizer", true)
			.attr("id", "rectSizer-" + i)
			.attr("width", 240)
			.attr("height", 240);
		new RectSizer("svg#rectSizer-" + i, i, tree.getLevelThickness(i), tree.getLevelLength(i), tree.thicknessChanged, tree.lengthChanged, tree.lengthChangeEnded);

		panel.append("div")
			.classed("colorPicker", true)
			.attr("id", "colorPicker-" + i);
		new ColorPicker("div#colorPicker-" + i, i, tree.getLevelcolor(i), tree.colorChanged);
		
		panel.append("svg")
			.classed("arcSizer", true)
			.attr("id", "arcSizer-" + i)
			.attr("width", 240)
			.attr("height", 140);
		new ArcSizer("svg#arcSizer-" + i, i, tree.getLevelAngle(i), tree.angleChanged, tree.angleChangeEnded);

		panel.append("svg")
			.classed("rangeSizer", true)
			.attr("id", "rangeSizer-" + i)
			.attr("width", 200)
			.attr("height", 180);
		new RangeSizer("svg#rangeSizer-" + i, i, tree.getLevelNumberBranches(i), tree.numberBranchesChanged);

		if (addToTree) {
			tree.addLevel();
		}
		
	}

	/** 
	 * Remove top level from tree and delete branches.
	 */
	function removeLevel() {
		noLevels--;
		enableDisableAddRemove();

		d3.select(".box.side div.panel:last-of-type")
			.remove();
		
		tree.removeLevel();
	}

	// hook up handlers for add/remove level buttons
	d3.select("#addLevelButton")
		.on("click", function() {
			addLevel(true);
		});

	d3.select("#removeLevelButton")
		.on("click", function() {
			removeLevel();
		});

	// create the tree with just level 0 (trunk)
	tree = new Tree("svg#tree");	
	addLevel(true);



	var fileUpload = document.getElementById("fileUpload");
	fileUpload.addEventListener("change", function(e) {
		var reader = new FileReader(),
			configuration;

		if (this.files && fileUpload.files.length > 0) {
			d3.select("#fileUpload + label div.fileName")
				.text(e.target.value.split( '\\' ).pop());
			reader.onload = (function(theFile) {
		        return function(e) {
		        	configuration = JSON.parse(e.target.result);
		        	while(noLevels > 0) {
		        		removeLevel();
		        	}
		        	tree = new Tree("svg#tree");
		        	
		        	tree.setConfiguration(configuration);
		        	while(noLevels < configuration.noLevels) {
		        		addLevel(false);
		        	}
		        };
		    })(fileUpload.files[0]);
  			reader.readAsText(fileUpload.files[0]);
		}			
	});

	d3.select("#fileSaveButton").on("click", function() {
		var fileName = document.getElementById("fileNameTextInput").value;
		if (fileName.length === 0) {
			fileName = "tree.json";
		} else {
			var parts = fileName.split(".");
			if (parts[parts.length - 1] !== "json") {
				fileName += ".json";
			}
		}

		//saveAS is from fileSaver.min.js
	  	saveAs(new Blob([JSON.stringify(tree.getConfiguration())], {type: "text/plain;charset=utf-8"}), fileName);
	});

	var inputEl = document.getElementById("fileNameTextInput");
	inputEl.addEventListener( 'focus', onInputFocus );
	inputEl.addEventListener( 'blur', onInputBlur );
	function onInputFocus( ev ) {
		d3.select(ev.target.parentNode).classed("input--filled", true);
	}

	function onInputBlur( ev ) {
		d3.select(ev.target.parentNode).classed("input--filled", ev.target.value.trim() !== '');
	}
})();

var Heroic = Heroic || {};

Heroic.Constants = {
	tileSize:		5
}

// consider removing
Heroic.TileX = function(x, y) {
	this.size = 5;
	this.x = x;
	this.y = y;
}

/*
 * 
 * 
 * @param	{Object}	args	Contains parameters for defining a shape (origin, terminus, radius)
 */
Heroic.RegionX = function(args, parent) {
	if( typeof(args) != 'object' ) {
		return false;
	}
	if( typeof(parent) == 'undefined' ) {
		var parent = false;
	}

	this.origin		= args.origin;	// keep reference to one of parent's points
	this.terminus	= {};
	this.points		= [];
	this.edge		= [];
	this.interior	= [];
	this.children	= [];		// child regions
	this.offset		= {x: 0, y: 0};	// keeps track of offset from parent. gets updated whenever region moves or changes size
	this.parent		= parent;

	this.calcShape(args);
}

/*
 * 
 */
Heroic.RegionX.prototype.master = function() {
	// create tiles and store references to them
	// intended for use only once in the master Region
	this.key = []; // link between points and tiles

	this.each(function() {
		//var tile = new Heroic.TileX(x, y);
	});

	// foreach this.points: set link between this.key and new Tile()
}

Heroic.RegionX.prototype.calcShape = function(args) {
	var shapes = ['circle', 'rectangle', 'grid', 'line', 'blob'];
	// cross: tiles n,s,e,w of point
	// ring: tiles surrounding point

	if( shapes.indexOf(args.shape) != -1 ) {
		this[args.shape].apply(this, [args]);

		// recalibrate to eliminate "negative" points. how do we temporarily deal with negative points?
		// idea: temporarily increase the size of the region and recalibrate it if a negative point would be added.
		// but also have to consider that the running script might be thrown off if the points shift
		// Every time the grid shifts, keep track of it in a Shift variable? Like a temporary offset
		// maybe we can utilize translate()?

		// this.minimize();   // winnow out empty rows and columns
		this.calcTerminus();
		this.calcEdge();

		if( !this.parent ) {
			this.master(); // create/store tiles
		} else {
			this.calcOffset();
		}
	}
}

Heroic.RegionX.prototype.rectangle = function(args) {
	var width	= args.terminus.x - args.origin.x;
	var height	= args.terminus.y - args.origin.y;

	var start	= {x: false, y: false};
	var end		= {x: false, y: false};

	if( height < 0 ) {
		start.y	= args.terminus.y;
		end.y	= args.origin.y;
		height	= Math.abs(height);
	} else {
		start.y	= args.origin.y;
		end.y	= args.terminus.y;
	}

	if( width < 0 ) {
		start.x	= args.terminus.x;
		end.x	= args.origin.x;
		width	= Math.abs(width);
	} else {
		start.x	= args.origin.x;
		end.x	= args.terminus.x;
	}

	width++;
	height++;

	for(var y = 0; y < height; y++) {
		for(var x = 0; x < width; x++) {
			this.addPoint(x, y);
		}
	}
}

// clean this up
Heroic.RegionX.prototype.line = function(args) {
	var slope = (args.terminus.y - args.origin.y) / (args.terminus.x - args.origin.x);
	
	if( Math.abs(slope) > 1 ) {
		slope = (args.terminus.x - args.origin.x) / (args.terminus.y - args.origin.y);

		if( args.origin.y < args.terminus.y ) {
			var start	= args.origin;
			var end		= args.terminus;
		} else {
			var start	= args.terminus;
			var end		= args.origin;
		}

		var offset = start.x - slope * start.y;

		for(var y = start.y; y <= end.y; y++) {
			var x = slope * y + offset;
			x = Math.round(x);

			this.addPoint(x, y);
		}
	} else {
		if( args.origin.x < args.terminus.x ) {
			var start	= args.origin;
			var end		= args.terminus;
		} else {
			var start	= args.terminus;
			var end		= args.origin;
		}

		var offset = start.y - slope * start.x;

		for(var x = start.x; x <= end.x; x++) {
			var y = slope * x + offset;
			y = Math.round(y);

			this.addPoint(x, y);
		}
	}
}

// any cleanup needed?
Heroic.RegionX.prototype.circle = function(args) {
	if( isNaN(args.radius) ) {
		return;
	}
	
	var radius = args.radius;
	var origin = {x: radius, y: radius};
	var points = [];

	// get edge points on one 45 deg arc
	for(var x = 0; x < radius; x++) {
		var y = Math.sqrt( (radius * radius) - (x * x) );
		y = Math.round(y);

		var offsetPoint = {};
		offsetPoint.x = x + origin.x;
		offsetPoint.y = y + origin.y;

		this.addPoint(offsetPoint.x, offsetPoint.y);
		points.push(offsetPoint);
	}
	
	// mirror the points into a 90 degree arc
	for(var index in points) {
		var point = points[index];
		var mirrorPoint = {};

		mirrorPoint.x = point.y;
		mirrorPoint.y = point.x;

		this.addPoint(mirrorPoint.x, mirrorPoint.y);
		points.push(mirrorPoint);
	}

	// add all points inside the arc
	for(var index in points) {
		var point = points[index];

		for(var insideY = point.y - 1; insideY > radius - 1; insideY--) {
			var insidePoint = {};

			insidePoint.x = point.x;
			insidePoint.y = insideY;

			this.addPoint(insidePoint.x, insidePoint.y);
			points.push(insidePoint);
		}
	}
	
	// mirror points about Y-axis
	for(var index in points) {
		var point = points[index];
		var mirrorPoint = {};

		mirrorPoint.x = point.x;
		mirrorPoint.y = (-1 * (point.y - radius) ) + radius;
		
		this.addPoint(mirrorPoint.x, mirrorPoint.y);
		points.push(mirrorPoint);
	}

	// mirror points about X-axis
	for(var index in points) {
		var point = points[index];
		var mirrorPoint = {};

		
		mirrorPoint.x = (-1 * (point.x - radius) ) + radius;
		mirrorPoint.y = point.y;
		
		this.addPoint(mirrorPoint.x, mirrorPoint.y);
	}
}

Heroic.RegionX.prototype.blob = function(args) { /* might need to expand region somehow since it will exceed its initial size */ }
Heroic.RegionX.prototype.grid = function(args) {}

Heroic.RegionX.prototype.calcTerminus = function() {
	var height = this.points.length;
	var maxWidth = 0;

	for(var index in this.points) {
		var row = this.points[index];
		
		if( row.length > maxWidth ) {
			maxWidth = row.length
		}
	}

	this.terminus = {x: maxWidth - 1, y: height - 1};
}

Heroic.RegionX.prototype.calcOffset = function() {
	this.offset = this.sumPoints( this.origin, this.getCompositeOffset() );
}

// recursively sum all offsets up through to master region
Heroic.RegionX.prototype.getCompositeOffset = function() {
	var parentOffset;

	if( this.parent ) {
		parentOffset = this.parent.getCompositeOffset();
	} else {
		parentOffset = {x: 0, y: 0};
	}

	return this.sumPoints(this.offset, parentOffset);
}

/*
 * Determine which tiles lie on the edge of the region's shape and which lie on the interior.
 */
Heroic.RegionX.prototype.calcEdge = function() {
	var self = this;

	this.each(function(x, y) {
		if(x == 0 || y == 0 || x == self.terminus.x || y == self.terminus.y) {
			self.edge.push({x: x, y: y});
			return;
		} else {
			// check the eight surrounding points for empties
			for(var j = -1; j < 2; j++) {
				for(var i = -1; i < 2; i++) {
					if( j != 0 && i != 0 ) {
						var testX = x + j;
						var testY = y + i;

						if(testX > -1 && testY > -1) {
							if( !self.hasPoint(testX, testY) ) {
								self.edge.push({x: x, y: y});
								return;
							}
						}
					}
				}
			}
		}

		// everything which is not an edge point makes up the interior
		self.interior.push({x: x, y: y});
	});
}

Heroic.RegionX.prototype.hasPoint = function(x, y) {
	if( this.points[y] ) {
		if( this.points[y][x] ) {
			return true;
		}
	}

	return false;
}

Heroic.RegionX.prototype.addPoint = function(x, y) {
	if( !this.hasPoint(x, y) ) {
		if( !this.points[y] ) {
			this.points[y] = [];
		}
		this.points[y][x] = true;
	}
}

Heroic.RegionX.prototype.sumPoints = function(pointOne, pointTwo) {
	return {x: pointOne.x + pointTwo.x, y: pointOne.y + pointTwo.y};
}

Heroic.RegionX.prototype.overlaps = function() {
	// check sub regions or no?
}

Heroic.RegionX.prototype.merge = function(region) {
	// need to merge sub regions? maybe not
}

Heroic.RegionX.prototype.getTile = function(x, y) {
	// first check if hasPoint?
	// apply offset when getting tile (first calculate combined offset)
	// get Tile from master Region (how is this referenced? recursively up through parents?)
}

Heroic.RegionX.prototype.removePoint = function(tile) {
	// check if [y] exists
	this.points[y][x] = false;
	// recalculate edge and interior?
}

/*
 * Shift the region by a given amount
 * 
 * @param	{integer}	x	Amount to shift on the X-axis
 * @param	{integer}	y	Amount to shift on the Y-axis
 */
Heroic.RegionX.prototype.translate = function(x, y) {
	if( this.parent ) {
		this.origin.x += x;
		this.origin.y += y;

		this.offset.x += x;
		this.offset.y += y;
	}
}

// rotate about origin?
Heroic.RegionX.prototype.rotate = function(degrees) {}

Heroic.RegionX.prototype.addChild = function(args) {
	var child = new this.constructor(args, this);
	this.children.push(child);
}

/*
 * Applies a function to each point in the region.
 * 
 * @param	{Object}	callback
 */
Heroic.RegionX.prototype.each = function(callback) {
	for(var y in this.points) {
		var row = this.points[y];

		for(var x in row) {
			callback(parseInt(x), parseInt(y));
		}
	}
}

Heroic.RegionX.prototype.eachEdge = function(callback) {
	for(var index in this.edge) {
		var point = this.edge[index];
		var x = parseInt(point.x);
		var y = parseInt(point.y);

		callback(x, y);
	}
}

Heroic.RegionX.prototype.eachInterior = function(callback) {
	for(var index in this.interior) {
		var point = this.interior[index];
		var x = parseInt(point.x);
		var y = parseInt(point.y);

		callback(x, y);
	}
}

Heroic.RegionX.prototype.draw = function(styles, layer) {
	var self = this;

	this.each(function(x, y) {
		styles.x = x + self.offset.x;
		styles.y = y + self.offset.y;
		styles.size = Heroic.Constants.tileSize;
		layer.draw(styles);
	});
}

Heroic.RegionX.prototype.drawEdge = function(styles, layer) {
	var self = this;

	this.eachEdge(function(x, y) {
		styles.x = x + self.offset.x;
		styles.y = y + self.offset.y;
		styles.size = Heroic.Constants.tileSize;
		layer.draw(styles);
	});
}

Heroic.RegionX.prototype.drawInterior = function(styles, layer) {
	var self = this;

	this.eachInterior(function(x, y) {
		styles.x = x + self.offset.x;
		styles.y = y + self.offset.y;
		styles.size = Heroic.Constants.tileSize;
		layer.draw(styles);
	});
}

//Heroic.RegionX.prototype.findEdges = function() { // can look at [y] arrays for lowest/highest set index }
//Heroic.RegionX.prototype.findInteriors = function() {}

/*
Heroic.RegionX.prototype.getOffset = function() {
	// recursive function that gets parents' offsets
	if( this.parent ) {
		return this.addPoints( this.origin, this.parent.getOffset() );
	}

	return this.origin;
}
*/


function initializeEngine() {
	Heroic.Entities	= {};
	Heroic.Layers	= {};

	Heroic.Layers.terrain			= new Heroic.Layer();
	Heroic.Layers.terrain.init('canvas1');
	Heroic.Layers.characters		= new Heroic.Layer();
	Heroic.Layers.characters.init('canvas2');

	Heroic.Entities.characters	= new Heroic.Inventory();
	Heroic.Entities.items		= new Heroic.Inventory();
	Heroic.Entities.terrain		= new Heroic.Inventory();
	Heroic.Entities.terrain.init();

	//Heroic.Entities.map			= new Heroic.TestMap();
	Heroic.Entities.map			= new Heroic.TestStructures();
	Heroic.Entities.map.init();

	Heroic.Entities.regions = new Heroic.Inventory();
	Heroic.Entities.regions.init();

	var test = new Heroic.RegionX({shape: 'circle', origin: {x: 0, y: 0}, radius: 45});
	Heroic.Entities.regions.load(test);
	//var test = new Heroic.RegionX({shape: 'rectangle', origin: {x: 2, y: 2}, terminus: {x: 55, y: 15}});

	for(var index in test.edge) {
		var point = test.edge[index];

		var args = {};
		//args.tile = {x: point.x, y: point.y, size: 5};
		args.x = point.x;
		args.y = point.y;
		args.size = Heroic.Constants.tileSize;
		args.color = 'black';
		args.background = 'white';
		args.character = '';
		Heroic.Layers.terrain.draw(args);		
	}

	for(var index in test.interior) {
		var point = test.interior[index];

		var args = {};
		//args.tile = {x: point.x, y: point.y, size: 5};
		args.x = point.x;
		args.y = point.y;
		args.size = Heroic.Constants.tileSize;
		args.color = 'black';
		args.background = 'green';
		args.character = '';
		Heroic.Layers.terrain.draw(args);
	}
	console.log(test);

	var args = {shape: 'rectangle', origin: {x: 2, y: 2}, terminus: {x: 30, y: 35}};
	test.addChild(args);


	for(var index1 in test.children) {
		var childRegion = test.children[index1];

		var layer = Heroic.Layers.terrain;
		var styles = {color: 'black', background: 'lightblue', character: ''};

		childRegion.drawEdge(styles, layer);

		styles = {color: 'black', background: 'darkblue', character: ''};
		childRegion.drawInterior(styles, layer);
	}

	var args = {shape: 'circle', origin: {x: 6, y: 6}, radius: 7};
	var child = test.children[0];
	child.addChild(args);
	var grandChild = child.children[0];
	console.log(grandChild);

	var layer = Heroic.Layers.terrain;
	var styles = {color: 'black', background: 'white', character: ''};

	grandChild.drawEdge(styles, layer);

	styles = {color: 'black', background: 'darkblue', character: ''};
	grandChild.drawInterior(styles, layer);

	grandChild.eachEdge(function(x, y) {
		var args = {shape: 'circle', origin: {x: x - 3, y: y - 3}, radius: 2};
		grandChild.addChild(args);
	});

	for( var index in grandChild.children ) {
		var gg = grandChild.children[index];

		styles.color = 'white';
		styles.background = 'black';
		gg.drawEdge(styles, layer);
	}

	//Heroic.Entities.terrain.toEach('draw');
}

/*
jQuery(window).load(function() {
	jQuery(window).on('keyup', function(e) {
		switch(e.keyCode) {
			case 37:
				Player.move('left');
				break;
			case 38:
				Player.move('up');
				break;
			case 39:
				Player.move('right');
				break;
			case 40:
				Player.move('down');
				break;
			default:
				break;
		}
	});
});
*/
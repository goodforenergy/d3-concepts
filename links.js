/* global d3 */
/*
1. Render the nodes at their maximum capcity, with labels
2. Insert the lines that connect the nodes
3. For each chunk of time in the selected time period
	a. For each line
		* Render the line width based on the volume of that line
		* Assign the line a colour based on it's wait time
	b. For each node
		* Render the percentages of in treatment, low wait, med wait, high wait, unused
*/
(function() {
	'use strict';
	var MAX_WIDTH,
		adjustedRadius,
		adjustXCoord,
		adjustYCoord,
		calculateXCoordinate,
		calculateYCoordinate,
		circular,
		circularLayout,
		computeDegree,
		data,
		getWaitClass,
		height,
		innerCircle,
		labels,
		lineConfiguration,
		linkThickness,
		links,
		linksLayer,
		listLinks,
		max,
		network,
		nodes,
		nodesLayer,
		objectify,
		outerCircle,
		radius,
		sankey,
		selected,
		svg,
		tension,
		waitRange,
		width;

	waitRange = {
		low: [0, 3],
		med: [4, 6],
		high: [6, 100]
	};

	nodes = [
		{
			id: 'ED',
			name: 'Emergency Department',
			type: 'notAdmitted'
		},
		{
			id: 'FLOOR',
			name: 'Floor Unit',
			type: 'admitted'
		},
		{
			id: 'ICU',
			name: 'Intensive Care Unit',
			type: 'admitted'
		},
		{
			id: 'DIS',
			name: 'Discharge',
			type: 'notAdmitted'
		},
		{
			id: 'PACU',
			name: 'Post-Anesthesia Care Unit',
			type: 'admitted'
		},
		{
			id: 'OR',
			name: 'Operating Room',
			type: 'admitted'
		},
		{
			id: 'EA',
			name: 'Elective Admissions',
			type: 'notAdmitted'
		},
		{
			id: 'OBS',
			name: 'Observation',
			type: 'notAdmitted'
		},
		{
			id: 'NON_EA',
			name: 'Non-Elective Admissions',
			type: 'notAdmitted'
		}
	];

	data = {
		capacity: {
			EA: 9,			// elective admissions
			NON_EA: 8,		// non-Elective admissions
			ED: 10,			// emergency department
			OBS: 15,		// observation (not admitted)
			ICU: 7,			// intensive care unit
			OR: 11,			// operating room
			PACU: 10,		// post-anesthesia care unit
			FLOOR: 6,		// floor Unit
			DIS: 6			// discharge
		},

		census: {
			ED: [[2, 1, 1, 5], [2, 2, 3, 1]],
			FLOOR: [[1, 2, 1, 0], [0, 2, 1, 1]],
			ICU: [[1, 2, 1, 1], [2, 3, 1, 1]],
			OR: [[1, 5, 3, 1], [4, 3, 5, 6]],
			PACU: [[4, 3, 5, 6], [1, 3, 3, 4]]
		},

		outflow: {
			// Inner array is [volumeExiting, avgWait, stdDevWait]
			overall: [[20, 0.5, 0.2], [15, 1.1, 0.3]],
			'NON_EA|ED': [[10, 0, 0.5], [5, 0, 0.5]],
			'ED|OR': [[20, 1, 0.5], [25, 1, 0.5]],
			'ED|FLOOR': [[18, 5, 0.5], [9, 5, 0.5]],
			'ED|ICU': [[34, 2, 0.5], [30, 2, 0.5]],
			'ED|DIS': [[12, 3, 0.5], [20, 3, 0.5]],
			'FLOOR|ED': [[15, 6, 0.5], [5, 6, 0.5]],
			'FLOOR|DIS': [[15, 5, 0.5], [25, 5, 0.5]],
			'ICU|OR': [[5, 7, 0.5], [10, 7, 0.5]],
			'ICU|DIS': [[10, 3, 0.5], [12, 3, 0.5]],
			'PACU|ICU': [[19, 2, 0.5], [22, 2, 0.5]],
			'PACU|FLOOR': [[15, 3, 0.5], [10, 3, 0.5]],
			'OR|PACU': [[18, 4, 0.5], [19, 4, 0.5]],
			'EA|OR': [[20, 5, 0.5], [23, 5, 0.5]],
			'EA|FLOOR': [[30, 3, 0.5], [25, 3, 0.5]]
		}
	};

	selected = 0;

	innerCircle = 160;
	outerCircle = 250;

	network = {
		nodes: nodes.map(function(node) {
			node.capacity = data.capacity[node.id];
			return node;
		}),

		links: Object.keys(data.outflow).filter(function(key) {
			return key !== 'overall';
		}).map(function(key) {
			var nodes = key.split('|');
			return {
				source: nodes[0],
				target: nodes[1]
			};
		})
	};

	objectify = function(graph) {
		return graph.links.forEach(function(l) {
			l.id = l.source + '|' + l.target;
			graph.nodes.forEach(function(n) {
				if (l.source === n.id) {
					l.source = n;
				}
				if (l.target === n.id) {
					l.target = n;
				}
			});
		});
	};

	// Replaces link to source with actual source
	objectify(network);

	listLinks = function(graph) {
		return graph.nodes.forEach(function(n) {
			n.links = graph.links.filter(function(link) {
				return link.source === n || link.target === n;
			});
		});
	};

	// Adds a list of links to each node
	listLinks(network);

	sankey = function(graph) {
		return graph.nodes.forEach(function(n) {
			var acc;

			acc = 0;
			return n.links.forEach(function(link) {
				var weight = data.outflow[link.id][selected][0];
				if (link.source === n) {
					link.sankey_source = {
						start: acc,
						middle: acc + weight / 2,
						end: acc += weight
					};
				} else if (link.target === n) {
					link.sankey_target = {
						start: acc,
						middle: acc + weight / 2,
						end: acc += weight
					};
				}
			});
		});
	};

	// For each node, for each link set the sankey source and target properties that have a start, middle and end
	sankey(network);

	computeDegree = function(graph) {
		return graph.nodes.forEach(function(n) {
			n.degree = d3.sum(n.links, function(link) {
				return data.outflow[link.id][selected][0];
			});
		});
	};

	// For each node, allocate it a 'degree' based on the sum of the weight of the node's links. This is used to
	// determine how wide the set of node's links should be
	computeDegree(network);

	// Set up the svg
	svg = d3.select('svg');
	width = svg.node().getBoundingClientRect().width;
	height = svg.node().getBoundingClientRect().height;
	svg.attr({
		viewBox: (-width / 2) + ' ' + (-height / 2) + ' ' + width + ' ' + height
	});

	// Draw the two node circles
	svg.append('circle')
		.attr('r', innerCircle + 40)
		.attr('class', 'circle');

	svg.append('circle')
		.attr('r', outerCircle + 40)
		.attr('class', 'circle');

	circularLayout = function() {
		var deltaTheta,
			rho,
			self,
			theta,
			theta0;

		rho = function(/*d, i, data*/) {
			return 100;
		};

		theta0 = function(/*d, i, data*/) {
			return -Math.PI / 2;
		};

		deltaTheta = function(d, i, data) {
			return 2 * Math.PI / data.length;
		};

		theta = function(d, i, data) {
			return theta0(d, i, data) + i * deltaTheta(d, i, data);
		};

		self = function(data) {
			data.forEach(function(d, i) {
				d.rho = rho(d, i, data);
				d.theta = theta(d, i, data);
				d.x = d.rho * Math.cos(d.theta);
				d.y = d.rho * Math.sin(d.theta);
			});
			return data;
		};

		self.rho = function(x) {
			if (x != null) {
				if (typeof x === 'function') {
					rho = x;
				} else {
					rho = function() {
						return x;
					};
				}
				return self;
			}
			return rho;
		};

		self.theta0 = function(x) {
			if (x != null) {
				if (typeof x === 'function') {
					theta0 = x;
				} else {
					theta0 = function() {
						return x;
					};
				}
				return self;
			}
			return theta0;
		};

		self.deltaTheta = function(x) {
			if (x != null) {
				if (typeof x === 'function') {
					deltaTheta = x;
				} else {
					deltaTheta = function() {
						return x;
					};
				}
				return self;
			}
			return deltaTheta;
		};

		self.theta = function(x) {
			if (x != null) {
				if (typeof x === 'function') {
					theta = x;
				} else {
					theta = function() {
						return x;
					};
				}
				return self;
			}
			return theta;
		};
		return self;
	};

	circular = circularLayout().rho(innerCircle);

	circular(network.nodes);

	MAX_WIDTH = 100;

	linksLayer = svg.append('g');

	nodesLayer = svg.append('g');

	radius = d3.scale.sqrt().domain([
		0, d3.max(network.nodes, function(n) {
			return n.capacity;
		})
	]).range([0, MAX_WIDTH / 2]);

	adjustedRadius = function(node) {
		var rad = radius(node.capacity);
		if (node.type === 'notAdmitted') {
			rad += (outerCircle - innerCircle);
		}
		return rad;
	};

	adjustXCoord = function(node) {
		return (4 + adjustedRadius(node)) * Math.cos(node.theta);
	};

	adjustYCoord = function(node) {
		return (4 + adjustedRadius(node)) * Math.sin(node.theta);
	};

	calculateXCoordinate = function(node) {
		return node.x + adjustXCoord(node);
	};

	calculateYCoordinate = function(node) {
		return node.y + adjustYCoord(node);
	};

	nodes = nodesLayer.selectAll('.node').data(network.nodes);

	nodes.enter().append('circle').attr({
		class: function(node) {
			return 'node ' + node.type;
		},
		r: function(node) {
			return radius(node.capacity);
		},
		cx: calculateXCoordinate,
		cy: calculateYCoordinate
	});

	labels = nodesLayer.selectAll('.label').data(network.nodes);

	labels.enter().append('text').text(function(node) {
		return node.name;
	}).attr({
		class: 'label',
		dy: '0.35em',
		x: calculateXCoordinate,
		y: calculateYCoordinate
	});

	max = d3.max(network.nodes, function(n) {
		return n.degree;
	});

	linkThickness = d3.scale.linear().domain([0, max]).range([0, MAX_WIDTH * 0.8]);

	links = linksLayer.selectAll('.link').data(network.links);

	tension = 0.5;

	getWaitClass = function(waitTime) {
		if (waitTime >= waitRange.low[0] && waitTime <= waitRange.low[1]) {
			return 'lowWait';
		}

		if (waitTime >= waitRange.med[0] && waitTime <= waitRange.med[1]) {
			return 'medWait';
		}

		if (waitTime >= waitRange.high[0] && waitTime <= waitRange.high[1]) {
			return 'highWait';
		}
	};

	lineConfiguration = {
		class: function(link) {
			return getWaitClass(data.outflow[link.id][selected][1]) + ' link flowline';
		},
		'stroke-width': function(link) {
			return linkThickness(data.outflow[link.id][selected][0]);
		}
	};

	links.enter().append('path').attr(lineConfiguration);

	links.attr({
		d: function(link) {
			var cxs,
				cxt,
				cys,
				cyt,
				sankeyDs,
				sankeyDt,
				sankeyDxs,
				sankeyDxt,
				sankeyDys,
				sankeyDyt,
				xs,
				xsi,
				xt,
				xti,
				ys,
				ysi,
				yt,
				yti;

			sankeyDs = linkThickness(link.source.degree) / 2 - linkThickness(link.sankey_source.middle);
			sankeyDt = linkThickness(link.target.degree) / 2 - linkThickness(link.sankey_target.middle);
			sankeyDxs = sankeyDs * Math.cos(link.source.theta + Math.PI / 2);
			sankeyDys = sankeyDs * Math.sin(link.source.theta + Math.PI / 2);
			sankeyDxt = sankeyDt * Math.cos(link.target.theta + Math.PI / 2);
			sankeyDyt = sankeyDt * Math.sin(link.target.theta + Math.PI / 2);
			xs = link.source.x + sankeyDxs;
			ys = link.source.y + sankeyDys;
			xt = link.target.x + sankeyDxt;
			yt = link.target.y + sankeyDyt;

			xsi = xs + adjustXCoord(link.source);
			ysi = ys + adjustYCoord(link.source);
			xti = xt + adjustXCoord(link.target);
			yti = yt + adjustYCoord(link.target);
			cxs = xs - link.source.x * tension;
			cys = ys - link.source.y * tension;
			cxt = xt - link.target.x * tension;
			cyt = yt - link.target.y * tension;

			return 'M' + xsi + ' ' + ysi + ' L' + xs + ' ' + ys + ' C' + cxs + ' ' + cys + ' ' +
				cxt + ' ' + cyt + ' ' + xt + ' ' + yt + ' L' + xti + ' ' + yti;
		}
	});

	nodes.on('mouseover', function(n) {
		var blurredNodes,
			focussedLinks,
			overLinks,
			nodesToShow = [n.id];

		focussedLinks = svg.selectAll('.link').filter(function(link) {
			if (link.source === n && nodesToShow.indexOf(link.target.id) === -1) {
				nodesToShow.push(link.target.id);
				return true;
			}

			if (link.target === n && nodesToShow.indexOf(link.source.id) === -1) {
				nodesToShow.push(link.source.id);
				return true;
			}

			return false;
		});

		overLinks = svg.selectAll('.link').filter(function(link) {
			return link.source !== n && link.target !== n;
		});

		blurredNodes = svg.selectAll('.node').filter(function(node) {
			return nodesToShow.indexOf(node.id) === -1;
		});

		focussedLinks.classed('focussed', true);
		overLinks.classed('blurred', true);
		blurredNodes.classed('blurred', true);
	});

	nodes.on('mouseout', function() {
		svg.selectAll('.link').classed('blurred', false);
		svg.selectAll('.link').classed('focussed', false);
		svg.selectAll('.node').classed('blurred', false);
	});

	links.on('mouseover', function(l) {
		var blurredNodes,
			blurredLinks;

		d3.select(this).classed('focussed', true);

		blurredNodes = svg.selectAll('.node').filter(function(node) {
			return node !== l.source && node !== l.target;
		});

		blurredLinks = svg.selectAll('.link').filter(function(link) {
			return link !== l;
		});

		blurredNodes.classed('blurred', true);
		blurredLinks.classed('blurred', true);
	});

	links.on('mouseout', function() {
		svg.selectAll('.node').classed('blurred', false);
		svg.selectAll('.link').classed('blurred', false);
		svg.selectAll('.link').classed('focussed', false);
	});

	// On change, update the data
	d3.selectAll('input')
		.on('change', function() {
			selected = selected === 0 ? 1 : 0;
			var path = svg.selectAll('path');

			path.classed('lowWait medWait highWait', false);

			path.transition()
			.duration(500)
			.attr(lineConfiguration);
		});

}).call(this);

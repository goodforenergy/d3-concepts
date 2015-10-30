/* global d3 */
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
		graphData,
		height,
		innerCircle,
		labels,
		linkData,
		linkThickness,
		links,
		linksLayer,
		listLinks,
		max,
		nodes,
		nodesLayer,
		objectify,
		outerCircle,
		radius,
		sankey,
		selected,
		svg,
		tension,
		width;

	graphData = {
		nodes: [
			{
				id: 'ER',
				size: 45,
				type: 'admitted'
			}, {
				id: 'FLOOR',
				size: 30,
				type: 'admitted'
			}, {
				id: 'ICU',
				size: 26,
				type: 'admitted'
			}, {
				id: 'dis',
				size: 18,
				type: 'notAdmitted'
			}, {
				id: 'PACU',
				size: 20,
				type: 'admitted'
			}, {
				id: 'OR',
				size: 35,
				type: 'admitted'
			}, {
				id: 'elec',
				size: 18,
				type: 'notAdmitted'
			}, {
				id: 'em',
				size: 18,
				type: 'notAdmitted'
			}
		],
		links: [
			{
				source: 'em',
				target: 'ER'
			},

			{
				source: 'ER',
				target: 'OR'
			},

			{
				source: 'ER',
				target: 'FLOOR'
			},

			{
				source: 'ER',
				target: 'ICU'
			},

			{
				source: 'ER',
				target: 'dis'
			},
			{
				source: 'FLOOR',
				target: 'ER'
			},
			{
				source: 'FLOOR',
				target: 'dis'
			},

			{
				source: 'ICU',
				target: 'OR'
			},

			{
				source: 'ICU',
				target: 'dis'
			},

			{
				source: 'PACU',
				target: 'ICU'
			},

			{
				source: 'PACU',
				target: 'FLOOR'
			},
			{
				source: 'OR',
				target: 'PACU'
			},
			{
				source: 'elec',
				target: 'OR'
			},
			{
				source: 'elec',
				target: 'FLOOR'
			}
		]
	};

	linkData = [{
		'em|ER': 10,
		'ER|OR': 20,
		'ER|FLOOR': 18,
		'ER|ICU': 34,
		'ER|dis': 12,
		'FLOOR|ER': 15,
		'FLOOR|dis': 15,
		'ICU|OR': 5,
		'ICU|dis': 10,
		'PACU|ICU': 19,
		'PACU|FLOOR': 15,
		'OR|PACU': 18,
		'elec|OR': 20,
		'elec|FLOOR': 35
	}, {
		'em|ER': 25,
		'ER|OR': 5,
		'ER|FLOOR': 30,
		'ER|ICU': 20,
		'ER|dis': 25,
		'FLOOR|ER': 25,
		'FLOOR|dis': 13,
		'ICU|OR': 8,
		'ICU|dis': 15,
		'PACU|ICU': 15,
		'PACU|FLOOR': 25,
		'OR|PACU': 19,
		'elec|OR': 25,
		'elec|FLOOR': 30
	}];

	selected = 0;

	innerCircle = 160;
	outerCircle = 250;

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
	objectify(graphData);

	listLinks = function(graph) {
		return graph.nodes.forEach(function(n) {
			n.links = graph.links.filter(function(link) {
				return link.source === n || link.target === n;
			});
		});
	};

	// Adds a list of links to each node
	listLinks(graphData);

	sankey = function(graph) {
		return graph.nodes.forEach(function(n) {
			var acc;

			acc = 0;
			return n.links.forEach(function(link) {
				var weight = linkData[selected][link.id];
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
	sankey(graphData);

	computeDegree = function(graph) {
		return graph.nodes.forEach(function(n) {
			n.degree = d3.sum(n.links, function(link) {
				return linkData[selected][link.id];
			});
		});
	};

	// For each node, allocate it a 'degree' based on the sum of the weight of the node's links. This is used to
	// determine how wide the set of node's links should be
	computeDegree(graphData);

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

	circular(graphData.nodes);

	MAX_WIDTH = 60;

	linksLayer = svg.append('g');

	nodesLayer = svg.append('g');

	radius = d3.scale.sqrt().domain([
		0, d3.min(graphData.nodes, function(n) {
			return n.size;
		})
	]).range([0, MAX_WIDTH / 2]);

	adjustedRadius = function(node) {
		var rad = radius(node.size);
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

	nodes = nodesLayer.selectAll('.node').data(graphData.nodes);

	nodes.enter().append('circle').attr({
		class: function(node) {
			return 'node ' + node.type;
		},
		r: function(node) {
			return radius(node.size);
		},
		cx: calculateXCoordinate,
		cy: calculateYCoordinate
	});

	labels = nodesLayer.selectAll('.label').data(graphData.nodes);

	labels.enter().append('text').text(function(node) {
		return node.id;
	}).attr({
		class: 'label',
		dy: '0.35em',
		x: calculateXCoordinate,
		y: calculateYCoordinate
	});

	max = d3.max(graphData.nodes, function(n) {
		return n.degree;
	});

	linkThickness = d3.scale.linear().domain([0, max]).range([0, MAX_WIDTH * 0.8]);

	links = linksLayer.selectAll('.link').data(graphData.links);

	tension = 0.5;

	links.enter().append('path').attr({
		class: 'link flowline',
		'stroke-width': function(link) {
			return linkThickness(linkData[selected][link.id]);
		}
	});

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
		var overLinks;

		overLinks = svg.selectAll('.link').filter(function(link) {
			return link.source !== n && link.target !== n;
		});
		return overLinks.classed('blurred', true);
	});

	nodes.on('mouseout', function() {
		return svg.selectAll('.link').classed('blurred', false);
	});

	// On change, update the data
	d3.selectAll('input')
		.on('change', function() {
			selected = selected === 0 ? 1 : 0;
			var path = svg.selectAll('path');
			path.transition()
			.duration(500)
			.attr('stroke-width', function(link) {
				return linkThickness(linkData[selected][link.id]);
			});
		});

}).call(this);

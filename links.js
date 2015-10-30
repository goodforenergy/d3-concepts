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
		labels,
		linkThickness,
		links,
		linksLayer,
		listLinks,
		max,
		nodes,
		nodesLayer,
		objectify,
		radius,
		sankey,
		svg,
		tension,
		updatedLinks,
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
				type: 'nonAdmitted'
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
				type: 'nonAdmitted'
			}, {
				id: 'em',
				size: 18,
				type: 'nonAdmitted'
			}
		],
		links: [

			{
				source: 'em',
				target: 'ER',
				weight: 12
			},

			{
				source: 'ER',
				target: 'OR',
				weight: 24
			},

			{
				source: 'ER',
				target: 'FLOOR',
				weight: 20
			},

			{
				source: 'ER',
				target: 'ICU',
				weight: 30
			},

			{
				source: 'ER',
				target: 'dis',
				weight: 10
			},
			{
				source: 'FLOOR',
				target: 'ER',
				weight: 10
			},
			{
				source: 'FLOOR',
				target: 'dis',
				weight: 25
			},

			{
				source: 'ICU',
				target: 'OR',
				weight: 25
			},

			{
				source: 'ICU',
				target: 'dis',
				weight: 15
			},

			{
				source: 'PACU',
				target: 'ICU',
				weight: 5
			},

			{
				source: 'PACU',
				target: 'FLOOR',
				weight: 8
			},
			{
				source: 'OR',
				target: 'PACU',
				weight: 22
			},
			{
				source: 'elec',
				target: 'OR',
				weight: 25
			},
			{
				source: 'elec',
				target: 'FLOOR',
				weight: 10
			}
		]
	};

	updatedLinks = [

			{
				source: 'em',
				target: 'ER',
				weight: 10
			},

			{
				source: 'ER',
				target: 'OR',
				weight: 20
			},

			{
				source: 'ER',
				target: 'FLOOR',
				weight: 18
			},

			{
				source: 'ER',
				target: 'ICU',
				weight: 34
			},

			{
				source: 'ER',
				target: 'dis',
				weight: 12
			},
			{
				source: 'FLOOR',
				target: 'ER',
				weight: 15
			},
			{
				source: 'FLOOR',
				target: 'dis',
				weight: 15
			},

			{
				source: 'ICU',
				target: 'OR',
				weight: 5
			},

			{
				source: 'ICU',
				target: 'dis',
				weight: 10
			},

			{
				source: 'PACU',
				target: 'ICU',
				weight: 19
			},

			{
				source: 'PACU',
				target: 'FLOOR',
				weight: 15
			},
			{
				source: 'OR',
				target: 'PACU',
				weight: 18
			},
			{
				source: 'elec',
				target: 'OR',
				weight: 20
			},
			{
				source: 'elec',
				target: 'FLOOR',
				weight: 15
			}
		];

	objectify = function(graph) {
		return graph.links.forEach(function(l) {
			return graph.nodes.forEach(function(n) {
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
				if (link.source === n) {
					link.sankey_source = {
						start: acc,
						middle: acc + link.weight / 2,
						end: acc += link.weight
					};
				} else if (link.target === n) {
					link.sankey_target = {
						start: acc,
						middle: acc + link.weight / 2,
						end: acc += link.weight
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
				return link.weight;
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

	circular = circularLayout().rho(160);

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
		if (node.type === 'nonAdmitted') {
			rad += 100;
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
		class: 'node',
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
			return linkThickness(link.weight);
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

}).call(this);

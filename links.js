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
		getWaitClass,
		graphData,
		height,
		innerCircle,
		labels,
		lineConfiguration,
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
				name: 'ER',
				capacity: 45,
				type: 'admitted'
			}, {
				id: 'FL',
				name: 'Floor',
				capacity: 30,
				type: 'admitted'
			}, {
				id: 'IC',
				name: 'ICU',
				capacity: 26,
				type: 'admitted'
			}, {
				id: 'DI',
				name: 'Discharged',
				capacity: 18,
				type: 'notAdmitted'
			}, {
				id: 'PA',
				name: 'PACU',
				capacity: 20,
				type: 'admitted'
			}, {
				id: 'OR',
				name: 'OR',
				capacity: 35,
				type: 'admitted'
			}, {
				id: 'EL',
				name: 'Elective Admissions',
				capacity: 18,
				type: 'notAdmitted'
			}, {
				id: 'NE',
				name: 'Non-Elective Admissions',
				capacity: 18,
				type: 'notAdmitted'
			}
		],

		links: [
			{
				source: 'NE',
				target: 'ER'
			},
			{
				source: 'ER',
				target: 'OR'
			},
			{
				source: 'ER',
				target: 'FL'
			},
			{
				source: 'ER',
				target: 'IC'
			},
			{
				source: 'ER',
				target: 'DI'
			},
			{
				source: 'FL',
				target: 'ER'
			},
			{
				source: 'FL',
				target: 'DI'
			},
			{
				source: 'IC',
				target: 'OR'
			},
			{
				source: 'IC',
				target: 'DI'
			},
			{
				source: 'PA',
				target: 'IC'
			},
			{
				source: 'PA',
				target: 'FL'
			},
			{
				source: 'OR',
				target: 'PA'
			},
			{
				source: 'EL',
				target: 'OR'
			},
			{
				source: 'EL',
				target: 'FL'
			}
		],

		waitRange: {
			low: [0, 3],
			med: [4, 6],
			high: [6, 100]
		}
	};

	linkData = [
		{
			nodes: {
				ER: [1, 2, 4, 1, 5],
				FL: [2, 4, 3, 5, 6],
				IC: [2, 4, 3, 4, 2],
				DI: [3, 1, 3, 4, 1],
				PA: [2, 4, 3, 5, 6],
				OR: [3, 1, 5, 3, 1],
				EL: [5, 4, 3, 5, 6],
				NE: [1, 2, 4, 6, 2]
			},

			links: {
				'NE|ER': {
					vol: 10,
					wait: 0
				},
				'ER|OR': {
					vol: 20,
					wait: 1
				},
				'ER|FL': {
					vol: 18,
					wait: 0.5
				},
				'ER|IC': {
					vol: 34,
					wait: 2
				},
				'ER|DI': {
					vol: 12,
					wait: 3
				},
				'FL|ER': {
					vol: 15,
					wait: 6
				},
				'FL|DI': {
					vol: 15,
					wait: 5
				},
				'IC|OR': {
					vol: 5,
					wait: 7
				},
				'IC|DI': {
					vol: 10,
					wait: 3
				},
				'PA|IC': {
					vol: 19,
					wait: 2
				},
				'PA|FL': {
					vol: 15,
					wait: 3
				},
				'OR|PA': {
					vol: 18,
					wait: 4
				},
				'EL|OR': {
					vol: 20,
					wait: 2.5
				},
				'EL|FL': {
					vol: 30,
					wait: 3
				}
			}
		},
		{
			nodes: {
				ER: [5, 2, 4, 3, 5],
				FL: [1, 2, 2, 5, 6],
				IC: [2, 7, 3, 4, 3],
				DI: [3, 3, 3, 4, 1],
				PA: [1, 4, 4, 6, 5],
				OR: [3, 8, 5, 3, 4],
				EL: [5, 4, 3, 5, 6],
				NE: [3, 1, 3, 3, 4]
			},

			links: {
				'NE|ER': {
					vol: 15,
					wait: 1
				},
				'ER|OR': {
					vol: 30,
					wait: 1
				},
				'ER|FL': {
					vol: 9,
					wait: 2.5
				},
				'ER|IC': {
					vol: 25,
					wait: 0
				},
				'ER|DI': {
					vol: 20,
					wait: 4
				},
				'FL|ER': {
					vol: 8,
					wait: 3
				},
				'FL|DI': {
					vol: 20,
					wait: 0
				},
				'IC|OR': {
					vol: 10,
					wait: 5
				},
				'IC|DI': {
					vol: 8,
					wait: 0
				},
				'PA|IC': {
					vol: 28,
					wait: 3
				},
				'PA|FL': {
					vol: 20,
					wait: 2
				},
				'OR|PA': {
					vol: 22,
					wait: 1
				},
				'EL|OR': {
					vol: 22,
					wait: 0.5
				},
				'EL|FL': {
					vol: 7,
					wait: 2.5
				}
			}
		}
	];

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
				var weight = linkData[selected].links[link.id].vol;
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
				return linkData[selected].links[link.id].vol;
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

	MAX_WIDTH = 100;

	linksLayer = svg.append('g');

	nodesLayer = svg.append('g');

	radius = d3.scale.sqrt().domain([
		0, d3.max(graphData.nodes, function(n) {
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

	nodes = nodesLayer.selectAll('.node').data(graphData.nodes);

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

	labels = nodesLayer.selectAll('.label').data(graphData.nodes);

	labels.enter().append('text').text(function(node) {
		return node.name;
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

	getWaitClass = function(waitTime) {
		if (waitTime >= graphData.waitRange.low[0] && waitTime <= graphData.waitRange.low[1]) {
			return 'lowWait';
		}

		if (waitTime >= graphData.waitRange.med[0] && waitTime <= graphData.waitRange.med[1]) {
			return 'medWait';
		}

		if (waitTime >= graphData.waitRange.high[0] && waitTime <= graphData.waitRange.high[1]) {
			return 'highWait';
		}
	};

	lineConfiguration = {
		class: function(link) {
			return getWaitClass(linkData[selected].links[link.id].wait) + ' link flowline';
		},
		'stroke-width': function(link) {
			return linkThickness(linkData[selected].links[link.id].vol);
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

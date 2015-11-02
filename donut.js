/* global d3 */
(function() {
	'use strict';

	var colors = {
			vacant: '#fff',
			treatment: '#21313e',
			lowWait: '#7d44ba',
			medWait: '#cd69bf',
			highWait: '#ef3da7'
		},

		mapping = ['treatment', 'lowWait', 'medWait', 'highWait', 'vacant'],

		data = [[1, 2, 3, 4, 5], [5, 4, 3, 2, 1]],

		selected = 0;

	// Define size & radius of donut pie chart
	var width = 450,
		height = 450,
		radius = Math.min(width, height) / 2;

	// Determine size of arcs
	var arc = d3.svg.arc()
		.innerRadius(radius - 130)
		.outerRadius(radius - 10);

	// Create the donut pie chart layout
	var pie = d3.layout.pie()
		.sort(null);

	// Append SVG attributes and append g to the SVG
	var svg = d3.select('#donut-chart')
		.attr('width', width)
		.attr('height', height)
		.append('g')
		.attr('transform', 'translate(' + radius + ',' + radius + ')');

	// Define inner circle
	svg.append('circle')
		.attr('cx', 0)
		.attr('cy', 0)
		.attr('r', 100)
		.attr('fill', '#fff') ;

	// Calculate SVG paths and fill in the colours
	var g = svg.selectAll('.arc')
		.data(pie(data[selected]))
		.enter().append('g')
		.attr('class', 'arc');

	// Append the path to each g
	var path = g.append('path')
		.attr('d', arc)
		.each(function(d) { this._current = d; }) // store the initial angles
		.attr('fill', function(d, i) {
			return colors[mapping[i]];
		});

	// Append text to the inner circle
	svg.append('text')
		.style('text-anchor', 'middle')
		.attr('class', 'label')
		.attr('fill', '#36454f')
		.text(function() { return 'ED'; });

	// On change, update the data
	d3.selectAll('input')
		.on('change', function() {
			selected = selected === 0 ? 1 : 0;

			path = path.data(pie(data[selected])); // compute the new angles
			path.transition().duration(750).attrTween('d', function(a) {
				// Store the displayed angles in _current.
				// Then, interpolate from _current to the new angles.
				// During the transition, _current is updated in-place by d3.interpolate.
				var i = d3.interpolate(this._current, a);
				this._current = i(0);
				return function(t) {
					return arc(i(t));
				};
			}); // redraw the arcs
		});

}());

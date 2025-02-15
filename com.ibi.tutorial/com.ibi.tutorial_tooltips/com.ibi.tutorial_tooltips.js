/*global tdgchart: false, d3: false */
/* Copyright (c) 1996-2021 TIBCO Software Inc. All Rights Reserved. */

(function() {

	function renderCallback(renderConfig) {

		var chart = renderConfig.moonbeamInstance;
		var data = renderConfig.data;
		var w = renderConfig.width;
		var h = renderConfig.height;
		var pad = 10;

		var labels = data.map(function(el) {return el.labels;});
		var x = d3.scale.ordinal().domain(labels).rangeRoundBands([pad, w - pad], 0.2);
		var ymax = d3.max(data, function(d) {return d.value;});
		var y = d3.scale.linear().domain([0, ymax]).range([h - pad, pad]);

		var container = d3.select(renderConfig.container).attr('class', 'extension_container').append('g');

		// Draw axis divider line
		container.append('path')
			.attr('d', 'M' + pad + ',' + (y(0) + 1) + 'l' + (w - pad - pad) + ',0');

		// Draw risers
		container.selectAll('rect')
			.data(data)
			.enter().append('rect')
			.attr('x', function(d) {return x(d.labels);})
			.attr('y', function(d) {return y(d.value);})
			.attr('width', x.rangeBand())
			.attr('height', function(d) {return Math.abs(y(d.value) - y(0));})
			.attr('fill', chart.getSeriesAndGroupProperty(0, null, 'color'))
			.attr('class', function(d, g) {

				// To support data selection, events and tooltips, each riser must include a class name with the appropriate seriesID and groupID
				// Use chart.buildClassName to create an appropriate class name.
				// 1st argument must be 'riser', 2nd is seriesID, 3rd is groupID, 4th is an optional extra string which can be used to identify the risers in your extension.
				return chart.buildClassName('riser', 0, g, 'bar');
			})
			.each(function(d, g) {

				// addDefaultToolTipContent will add the same tooltip to this riser as the built in chart types would.
				// Assumes that 'this' node includes a fully qualified series & group class string.
				// addDefaultToolTipContent can also accept optional arguments:
				// addDefaultToolTipContent(target, s, g, d, data), useful if this node does not have a class
				// or if you want to override the default series / group / datum lookup logic.
				renderConfig.modules.tooltip.addDefaultToolTipContent(this, 0, g, d);
			});

		renderConfig.renderComplete();
	}

	var config = {
		id: 'com.ibi.tutorial_tooltips',
		containerType: 'svg',
		renderCallback: renderCallback,
		resources: {
			script: ['../lib/d3.js'],
			css: ['../lib/style.css']
		},
		modules: {
			tooltip: {
				supported: true,  // Set this true if your extension wants to enable HTML tooltips
				// This callback is called when no default tooltip content is passed into the chart.
				// Use this to define 'nice' default tooltips for the given target, ids & data.
				// Return value can be a string (including HTML), or HTML nodes, or any Moonbeam tooltip API object.
				autoContent: function(target, s, g, d) {
					if (d.hasOwnProperty('color')) {
						return 'Bar Size: ' + d.value + '<br />Bar Color: ' + d.color;
					}
					return 'Bar Size: ' + d.value;
				}
			}
		}
	};

	tdgchart.extensionManager.register(config);
})();

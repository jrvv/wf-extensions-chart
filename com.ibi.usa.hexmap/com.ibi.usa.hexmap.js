/* Copyright 1996-2015 Information Builders, Inc. All rights reserved. */
/* $Revision: 1.8 $ */

(function () {

	// All extension callback functions are passed a standard 'renderConfig' argument:
	//
	// Properties that are always available:
	//   moonbeamInstance: the chart instance currently being rendered
	//   data: the data set being rendered
	//   properties: the block of your extension's properties, as they've been set by the user
	//   modules: the 'modules' object from your extension's config, along with additional API methods
	//   
	// Properties available during render callback:
	//   width: width of the container your extension renders into, in px
	//   height: height of the container your extension renders into, in px
	//   containerIDPrefix:  the ID of the DOM container your extension renders into.  Prepend this to *all* IDs your extension generates, to ensure multiple copies of your extension work on one page.
	//   container: DOM node for your extension to render into;
	//   rootContainer: DOM node containing the specific chart engine instance being rendered.

	var tooltip;

	var tooltip_x = 0;
	var tooltip_y = 0;

	// Optional: if defined, is called exactly *once* during chart engine initialization
	// Arguments:
	//  - successCallback: a function that you must call when your extension is fully
	//     initialized - pass in true if init is successful, false otherwise.
	// - initConfig: the standard callback argument object (moonbeamInstance, data, properties, etc)
	function initCallback(successCallback, initConfig) {
		successCallback(true);
	}

	// Optional: if defined, is invoked once at the very beginning of each chart engine draw cycle
	// Use this to configure a specific chart engine instance before rendering.
	// Arguments: 
	//  - preRenderConfig: the standard callback argument object
	function preRenderCallback(preRenderConfig) {
		var chart = preRenderConfig.moonbeamInstance;

	}

	function noDataPreRenderCallback(preRenderConfig) {
		var chart = preRenderConfig.moonbeamInstance;
	}

	// Required: Invoked during each chart engine draw cycle
	// This is where your extension should be rendered
	// Arguments:
	//  - renderConfig: the standard callback argument object, including additional properties width, height, etc
	function renderCallback(renderConfig) {

		var props = renderConfig.properties;
		var margin = { left: 10, right: 10, top: 10, bottom: 10 };
		// var tooltip_style = {
		// 	background: "black",
		// 	borderWidth: "5px",
		// 	borderStyle: "solid",
		// 	borderColor: "grey",
		// 	borderRadius: "5px",
		// };

		var tooltip_properties = {
			// background: "black !important",
			// fill: "black",
			// border: {},
			// cascadeMenuStyle: {
			// 	hover: { labelColor: "#FF0000", fill: "#FF0000" },
			// },
		};

		if ($("#HexMapTooltipId").length == 0) {
			//re-sizing of window calls renderCallback; so only create tooltip once
			tooltip = tdgchart.createExternalToolTip(
				"divHexMapToolTip",
				"HexMapTooltipId"
			);
			tooltip
				//.style(tooltip_style)
				.properties(tooltip_properties)
				.autoHide(false);
			$("#HexMapTooltipId").on('mouseleave', function (e) {
				tooltip.hide();
			});
		} // if ($("#spkTooltipId").length == 0)


		var fn_showTooltip = showTooltip;

		// The color scale module includes a 'getColorScale()' method, which returns a d3 style scale function;
		// Pass it a value and it returns an RGB color object for the value's color along the color scale.
		var colorScale = renderConfig.modules.colorScale.getColorScale();

		$('#' + renderConfig.rootContainer.id).ibi_hex_map({
			a_data: renderConfig.data,
			a_metadata: renderConfig.dataBuckets.buckets,
			// s_start_color: props.start_color,
			// s_end_color: props.end_color,
			o_color_scale: colorScale,
			s_font_color:  props.font_color,
			f_tooltip_callback: function (dataIndex, x, y, showTooltip) {
				if (showTooltip) {
					fn_showTooltip(renderConfig, tooltip, x, y, dataIndex);
				}

			},
			i_height: renderConfig.height,
			i_width: renderConfig.width,
			o_chartContainer: renderConfig.container
		});

		renderConfig.renderComplete();
	}

	function showTooltip(
		renderConfig,
		tooltip,
		x,
		y,
		dataPoint_index) {
		var chart = renderConfig.moonbeamInstance;

		var dataPoint = renderConfig.data[dataPoint_index];

		//contains the link url generated by WF chart api
		var dispatcher = chart.eventDispatcher.events.find(function (obj) {
			return obj.series == 0;
		});

		//specifies the chart riser / group selected
		var ids = { series: 0, group: dataPoint_index };

		//base markup/content created by moonbeam to be rendered by the main tooltip
		var base_tooltip = renderConfig.moonbeamInstance.getSeries(0).tooltip;

		//tooltip to show
		var single_tooltip = [];
		//shallow copy of the base_tooltip
		for (var itemsIndex = 0; itemsIndex < base_tooltip.length; itemsIndex++) {
			single_tooltip.push(base_tooltip[itemsIndex]);
		}
		if (dispatcher != undefined) {
			//generate the drill URL
			var localURL = chart.parseTemplate(
				dispatcher.url,
				dataPoint,
				renderConfig.data,
				ids
			);

			//create the link object required to be added to the tooltip
			var link = {
				entry: "Link",
				url: localURL,
				target: dispatcher.target,
			};

			single_tooltip.push(link);
			var separator = { type: "separator" };
			single_tooltip.push(separator);
		}





		//show the tooltip
		tooltip
			.content(single_tooltip, dataPoint, renderConfig.data, ids)
			.position(x - 1, y - 1)
			.show();
	}

	function noDataRenderCallback(renderConfig) {
		var grey = renderConfig.baseColor;

		var default_dataset = [
			{ state: "AL", color: 25.6 },
			{ state: "AK", color: 28.78 },
			{ state: "AZ", color: 30.93 },
			{ state: "AR", color: 28.27 },
			{ state: "CA", color: 38.23 },
			{ state: "CO", color: 29.71 },
			{ state: "CT", color: 33.03 },
			{ state: "DE", color: 39.15 },
			{ state: "DC", color: 37.84 },
			{ state: "FL", color: 29.19 },
			{ state: "GA", color: 35.96 },
			{ state: "HI", color: 35.46 },
			{ state: "ID", color: 24.18 },
			{ state: "IL", color: 31.33 },
			{ state: "IN", color: 25.96 },
			{ state: "IA", color: 29.43 },
			{ state: "KS", color: 27.83 },
			{ state: "KY", color: 24.62 },
			{ state: "LA", color: 24 },
			{ state: "ME", color: 24.81 },
			{ state: "MD", color: 36.28 },
			{ state: "MA", color: 37.1 },
			{ state: "MI", color: 29.21 },
			{ state: "MN", color: 31.91 },
			{ state: "MS", color: 26.51 },
			{ state: "MO", color: 27.71 },
			{ state: "MT", color: 23.44 },
			{ state: "NE", color: 27.67 },
			{ state: "NV", color: 28.26 },
			{ state: "NH", color: 26.9 },
			{ state: "NJ", color: 33.55 },
			{ state: "NM", color: 28.98 },
			{ state: "NY", color: 36.15 },
			{ state: "NC", color: 30.95 },
			{ state: "ND", color: 24.24 },
			{ state: "OH", color: 29.44 },
			{ state: "OK", color: 25.84 },
			{ state: "OR", color: 33.29 },
			{ state: "PA", color: 29.67 },
			{ state: "RI", color: 33.3 },
			{ state: "SC", color: 27.7 },
			{ state: "SD", color: 29.82 },
			{ state: "TN", color: 27.39 },
			{ state: "TX", color: 32.21 },
			{ state: "UT", color: 28.12 },
			{ state: "VT", color: 31.53 },
			{ state: "VA", color: 38.79 },
			{ state: "WA", color: 39.62 },
			{ state: "WV", color: 20.64 },
			{ state: "WI", color: 27.14 },
			{ state: "WY", color: 25.06 }
		];

		var default_metadata = {
			color: { title: "Sales", fieldName: "SALES", count: 1 }
			, state: { title: "State", fieldName: "STATE_ISO2", count: 1 }

		};

		renderConfig.data = default_dataset;
		renderConfig.dataBuckets.buckets = default_metadata;
		renderConfig.moonbeamInstance.getSeries(0).color = grey;
		renderConfig.moonbeamInstance.getSeries(1).color = pv.color(grey).lighter(0.18).color;
		renderCallback(renderConfig);
	}

	// Your extension's configuration
	var config = {
		id: 'com.ibi.usa.hexmap',     // string that uniquely identifies this extension
		containerType: 'svg',  // either 'html' or 'svg' (default)
		initCallback: initCallback,
		preRenderCallback: preRenderCallback,  // reference to a function that is called right *before* your extension is rendered.  Will be passed one 'preRenderConfig' object, defined below.  Use this to configure a Monbeam instance as needed
		renderCallback: renderCallback,  // reference to a function that will draw the actual chart.  Will be passed one 'renderConfig' object, defined below
		noDataPreRenderCallback: noDataPreRenderCallback,
		noDataRenderCallback: noDataRenderCallback,
		resources: {  // Additional external resources (CSS & JS) required by this extension
			script: window.jQuery ? ['lib/ibi_hex_map.js'] : [ 'lib/jquery-latest.js', 'lib/ibi_hex_map.js'],
			css: ['css/hexmap.css']
		},
		modules: {
			dataSelection: {
				supported: true,  // Set this true if your extension wants to enable data selection
				needSVGEventPanel: false, // if you're using an HTML container or altering the SVG container, set this to true and the chart engine will insert the necessary SVG elements to capture user interactions
				svgNode: function (arg) { }  // if you're using an HTML container or altering the SVG container, return a reference to your root SVG node here.
			},
			eventHandler: {
				supported: true
			},
			tooltip: {
				supported: true  // Set this true if your extension wants to enable HTML tooltips
				// This callback is called when no default tooltip content is passed into the chart.
				// Use this to define 'nice' default tooltips for the given target, ids & data.
				// Return value can be a string (including HTML), or HTML nodes, or any Moonbeam tooltip API object.

			},
			colorScale: {
				supported: true,  // This must be true to enable color scale support
				minMax: function (renderConfig) {
					// Return a {min, max} object that defines the axis min and max values for this color scale
					var lowest = Number.POSITIVE_INFINITY;
					var highest = Number.NEGATIVE_INFINITY;
					var tmp;
					for (var i = renderConfig.data.length - 1; i >= 0; i--) {
						tmp = renderConfig.data[i].color;
						if (tmp < lowest) lowest = tmp;
						if (tmp > highest) highest = tmp;
					}

					return {
						min: lowest,
						max: highest
					};
				}
			},
			legend: {
				colorMode: 'data' // Return 'data' to always draw a color scale in the legend
			}
		}
	};

	// Required: this call will register your extension with the chart engine
	tdgchart.extensionManager.register(config);

}());
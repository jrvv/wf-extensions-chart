/* Copyright (c) 1996-2021 TIBCO Software Inc. All Rights Reserved. */
/* $Revision: 1.5 $ */

(function() {

	var isIE11 = !!window.MSInputMethodContext && !!document.documentMode;
	var noDataCallback = '';
	var numberFormatRegex;

	//start VIZ-457
	//regex workaround for IE11
	//if the 'lookbehind' character is present, IE11 balks.
	//so using a token to replace dynamically to work around that.
	try { 
		if (!isIE11) {
			var notIE11Expression = '\\B(?LESS_THAN!\\.\\d*)(?=(\\d{3})+(?!\\d))';
			notIE11Expression = notIE11Expression.replace('LESS_THAN', '<' );
			numberFormatRegex = new RegExp(notIE11Expression,'g');
		}
	} catch(e) {
		//VIZ-696 this is to catch exception thrown by iPad/Chrome and iPad/Safari and possibly others that also cannot 'lookbehind'
	}

	if (numberFormatRegex == undefined) {
		//safe version
		numberFormatRegex = new RegExp('\\B(?=(\\d{3})+(?!\\d))','g');
	}
	//end VIZ-457
	
	// Decimal and grouping separator (will be checked in render callback)
	var decimalSeparator 			=	".";
	var groupingSeparator 			=	",";

	function numberWithGroupingSeparator(number, groupingSeparator) {
		var temp_number_with_grouping = number;
		if (temp_number_with_grouping <= -100  && temp_number_with_grouping > -1000) {
			temp_number_with_grouping = temp_number_with_grouping;
		}
		else {
			//VIZ-457
			temp_number_with_grouping = temp_number_with_grouping.toString().replace(numberFormatRegex, groupingSeparator);
		}
		return temp_number_with_grouping;
	}

	function abbreviateNumber(number, decimals, userLang) {
		var SI_POSTFIXES = ["", "K", "M", "B", "T", "P", "E"];
		if (userLang == 'de-DE') {
			SI_POSTFIXES = ["", "Tsd.", "Mio.", "Mrd.", "Bio.", "Brd.", "Trio."];
		}
		var tier = Math.log10(Math.abs(number)) / 3 | 0;
		if (tier == 0) 
			return number;
		var postfix = SI_POSTFIXES[tier];
		var scale = Math.pow(10, tier * 3);
		var scaled = number / scale;
		var formatted = scaled.toFixed(decimals) + '';
		return formatted + postfix;
	}

	function changeBackground(color) {
		document.body.style.background = color;
	}
	
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
	// 	var chart = preRenderConfig.moonbeamInstance;
	// 	chart.title.visible = ;
	// 	chart.title.text = "My DataGrid";  // contrived example
	// 	chart.footnote.visible = false;
	// 	chart.footnote.text = "footnote";
	// 	chart.footnote.align = 'right';
	// 
	}
	
	function noDataPreRenderCallback(preRenderConfig) {
		var chart = preRenderConfig.moonbeamInstance;
		chart.legend.visible = false;
		chart.dataArrayMap = undefined;
		chart.dataSelection.enabled = false;
	}

	// Required: Invoked during each chart engine draw cycle
	// This is where your extension should be rendered
	// Arguments:
	//  - renderConfig: the standard callback argument object, including additional properties width, height, etc
	function renderCallback(renderConfig) {
		
		var chart = renderConfig.moonbeamInstance;
		var props = renderConfig.properties;
		
		var container = renderConfig.container;
		var data = renderConfig.data;
		var dataBuckets = renderConfig.dataBuckets;	
				
	//	var userLang = navigator.language || navigator.userLanguage;  	// This gets the browser language
		var userLang = document.documentElement.lang;					// This gets the webfocus language
		
		//$(renderConfig.rootContainer).parent().css('backgroundColor',props.backgroundColor);
		
		// Check the CDN setting of the webfocus system
		if (props.setCDN == true) {
			var innerHTML = document.documentElement.innerHTML;
		
			var decimalSeparatorText		=	"setDecimalSeparator";
			var groupingSeparatorText		=	"setGroupingSeparator";
			var decimalSeparatorPosition	=	0;
			var groupingSeparatorPosition	=	0;

			// Determine the position of the decimal and grouping text
			decimalSeparatorPosition		=	innerHTML.search(decimalSeparatorText)
			groupingSeparatorPosition		= 	innerHTML.search(groupingSeparatorText);
		
			// Change position to the decimal and grouping separator
			decimalSeparatorPosition		=	decimalSeparatorPosition + 21;
			groupingSeparatorPosition		=	groupingSeparatorPosition + 22;

			// Determine the decimal and grouping separator
			if (decimalSeparatorPosition !== 20) {
				decimalSeparator			=	innerHTML.substr(decimalSeparatorPosition,1);
			}
			if (groupingSeparatorPosition !== 21) {
				groupingSeparator			=	innerHTML.substr(groupingSeparatorPosition,1);
				if (groupingSeparator == "[") {
						groupingSeparator	=	"'";
				}
			}	
		}
			
		/* Format JSON Data */
		if (typeof data[0].measure !== 'undefined'||typeof data[0].xaxis !== 'undefined') {
			var total1 = 0;
			var total1_temp = 0;
			var total2 = 0;
			var total2_temp = 0;
			var previous = 0;
			var temp_value = 0;
			var bars = [];
			
			for (var i=0; i<data.length; i++) {
				/* Process Data */
				if (typeof data[i].xaxis !== 'undefined') {
					temp_value = data[i].measure;
					// aggregate values or no aggregation
					if (props.aggregateValues == true) {
						total1 = temp_value + total1;
						total1_temp = total1.toFixed(props.total.decimalPlaces);
						bars.push(total1_temp);
					}
					else {
						total1 = temp_value;
						total1_temp = total1.toFixed(props.total.decimalPlaces);
						bars.push(total1_temp);
					}

					
					if (i!=0){
						previous = i - 1;
						temp_value = data[previous].measure;
						// aggregate values or no aggregation
						if (props.aggregateValues == true) {
							total2 = temp_value + total2;
						}
						else {
							total2 = temp_value;
						}
					}
				}
			}
			
			total1 = total1.toFixed(props.total.decimalPlaces);
			total2 = total2.toFixed(props.total.decimalPlaces);			
	
			var titleElement = $('foreignObject[class="title"]');

			var titleHeight =  titleElement.length == 1 ? titleElement.height() + 5 : 0;

			var title = '';
			
			if (noDataCallback == 'no_Data') {
				title =  'Gross Profit';
				noDataCallback = '';
			}
			else {
				title =  dataBuckets.getBucket("measure").fields[0].title;
			}

			var seriesColor = props.barProperties.goodColor;
			var dynamicColorBackground = props.barProperties.goodColor;
			
			var percentChange = '';
			// if no total2 value, no change will be shown
			if (total2==0)
				percentChange = '';
			// if total2 is not equal ''
			else {
				// if deviation should be shown in percent
				var deviationTimeframe = props.deviationVsPrevious.deviationTimeframe;
				
				if (props.deviationVsPrevious.deviationInPercent == true) {
					if (total2 < 0){
						percentChange = Math.round(((total1/total2)-1)*100000)/1000*(-1);
					}
					else {
						percentChange = Math.round(((total1/total2)-1)*100000)/1000;
					}

					
					//VIZ-642 store the number as not a string;
					var percentChangeNumber = percentChange;

					percentChange = percentChange.toFixed(props.deviationVsPrevious.decimalPlaces);
					var goodIs = eval(percentChange+props.barProperties.goodIs);
					seriesColor = goodIs? seriesColor: props.barProperties.badColor;
					dynamicColorBackground = goodIs? dynamicColorBackground: props.barProperties.badColor;

					percentChange = percentChange.replace(".", decimalSeparator);
					percentChange = goodIs? '+' + numberWithGroupingSeparator(percentChange, groupingSeparator) + '% ' + deviationTimeframe : numberWithGroupingSeparator(percentChange, groupingSeparator) + '% ' + deviationTimeframe;
				
				//VIZ-642 remove plus sign if a negative number

				percentChange = percentChangeNumber < 0 ? percentChange.replace('+','') : percentChange;
				}
				// if deviation should be shown as absolute number
				else {
					percentChange = total1-total2;
					percentChange = percentChange.toFixed(props.deviationVsPrevious.decimalPlaces);
					var goodIs = eval(percentChange+props.barProperties.goodIs);
					seriesColor = goodIs? seriesColor: props.barProperties.badColor;
					dynamicColorBackground = goodIs? dynamicColorBackground: props.barProperties.badColor;
					
					if (props.deviationVsPrevious.abbreviateNumber == true) {
						percentChange = abbreviateNumber(percentChange, props.deviationVsPrevious.decimalPlaces, userLang);
					}
					else { 
					}							
					percentChange = percentChange.replace(".", decimalSeparator);
					percentChange = goodIs? '+' + numberWithGroupingSeparator(percentChange, groupingSeparator) + ' ' + deviationTimeframe : numberWithGroupingSeparator(percentChange, groupingSeparator) + ' ' + deviationTimeframe;
				}
			}
			// abbreviate Number for total1 value
			if (props.total.abbreviateNumber == true) {
				total1 = abbreviateNumber(total1, props.total.decimalPlaces, userLang);
			}
			else { 
			}
			// number format for total1 value

			total1 = total1.replace(".", decimalSeparator);
			total1 = numberWithGroupingSeparator(total1, groupingSeparator);

			// total1 value with or without % sign
			if  (props.total.percentValue == true)
				total1 = total1 + '%' ;
			
			// check if dynamic color should be set on sparkline or full widget
			if (props.barProperties.applyDynamicColorOn == 'sparkline') {
				dynamicColorBackground = '';
				changeBackground("#ffffff");
			}
			else {
				seriesColor = '#ffffff';
				changeBackground(dynamicColorBackground);
				dynamicColorBackground = ';background-color:'+dynamicColorBackground;
			}
			
			// chart properties
			var chartProperties;
			if (props.type=='bar')
				chartProperties = {	type: props.type , barWidth: props.barProperties.width, height: props.barProperties.height, barColor: seriesColor, negBarColor: seriesColor};
			else
				chartProperties = {	type: props.type , width: props.barProperties.width * (bars.length-1), height: props.barProperties.height, lineColor: seriesColor, lineWidth: 2, fillColor: 'rgba(0,0,0,0)', spotColor: 'rgba(0,0,0,0)', minSpotColor: 'rgba(0,0,0,0)', maxSpotColor: 'rgba(0,0,0,0)', highlightLineColor: 'rgba(0,0,0,0)' };
			
			// switch on square design
			if (props.squareDesign == true) {
				// create kpi-container-sq				
				$(container).css('top',titleHeight+'px').append('<div class="kpi-container-sq" style="font-family:'+props.fontFamily+';font-size:'+props.fontSize+';color:'+props.color+';font-style:'+props.fontStyle+dynamicColorBackground+'"></div>');
				// fill containers on html page - 1st line
				$(container).find('.kpi-container-sq').append('<div><div class="kpi-title-sq" style="font-weight:'+props.measureName.fontWeight+';font-size:'+props.measureName.fontSize+';color:'+props.measureName.color+';font-style:'+props.measureName.fontStyle+'">' + title + '</div></div>');
				// fill containers on html page - 2nd line
				$(container).find('.kpi-container-sq').append('<div><div class="kpi-total-sq" style="font-weight:'+props.total.fontWeight+';font-size:'+props.total.fontSize+';color:'+props.total.color+';font-style:'+props.total.fontStyle+'">' + total1 + '</div></div>');
				// fill containers on html page - 3rd line
				if (props.deviationVsPrevious.disableDeviation == true) {
				}
				else {
					$(container).find('.kpi-container-sq').append('<div><div class="kpi-change-sq" style="font-size:'+props.deviationVsPrevious.fontSize+';color:'+props.deviationVsPrevious.color+';font-style:'+props.deviationVsPrevious.fontStyle+'">'+percentChange+'</div></div>');
				}
				// fill containers on html page - 4th line
				if (props.barProperties.disableSparklineChart == true) {
				}
				else {					
					$(container).find('.kpi-container-sq').append('<div><div class="kpi-sparkline-sq"></div></div>');
					$(container).find('.kpi-sparkline-sq').sparkline(bars, chartProperties);
				}
			}
			else {			
				// create kpi-container
				$(container).css('top',titleHeight+'px').append('<div class="kpi-container" style="font-family:'+props.fontFamily+';font-size:'+props.fontSize+';color:'+props.color+';font-style:'+props.fontStyle+dynamicColorBackground+'"></div>');
				// fill containers on html page - 1st line
				if (props.deviationVsPrevious.disableDeviation == true) {
					$(container).find('.kpi-container').append('<div><div class="kpi-title-no-change" style="font-weight:'+props.measureName.fontWeight+';font-size:'+props.measureName.fontSize+';color:'+props.measureName.color+';font-style:'+props.measureName.fontStyle+'">' + title + '</div></div>');
				}
				else {
					$(container).find('.kpi-container').append('<div><div class="kpi-title" style="font-weight:'+props.measureName.fontWeight+';font-size:'+props.measureName.fontSize+';color:'+props.measureName.color+';font-style:'+props.measureName.fontStyle+'">' + title + '</div><div class="kpi-change" style="font-size:'+props.deviationVsPrevious.fontSize+';color:'+props.deviationVsPrevious.color+';font-style:'+props.deviationVsPrevious.fontStyle+'">'+percentChange+'</div></div>');
				}
				// fill containers on html page - 2nd line			
				if (props.barProperties.disableSparklineChart == true) {
					$(container).find('.kpi-container').append('<div><div class="kpi-total" style="font-weight:'+props.total.fontWeight+';font-size:'+props.total.fontSize+';color:'+props.total.color+';font-style:'+props.total.fontStyle+'">' + total1 + '</div></div>');
				}
				else {
					$(container).find('.kpi-container').append('<div><div class="kpi-total" style="font-weight:'+props.total.fontWeight+';font-size:'+props.total.fontSize+';color:'+props.total.color+';font-style:'+props.total.fontStyle+'">' + total1 + '</div><div class="kpi-sparkline"></div></div>');
					$(container).find('.kpi-sparkline').sparkline(bars, chartProperties);
				}
			}
		}
		
		renderConfig.renderComplete();	
	}
	
	function noDataRenderCallback(renderConfig) {
		var container = renderConfig.container;
		var grey = renderConfig.baseColor;
		renderConfig.data = [{"xaxis":"1","measure":35861466.38,"_s":0,"_g":0},{"xaxis":"2","measure":32447335.21,"_s":0,"_g":1},{"xaxis":"3","measure":35431268.47,"_s":0,"_g":2},{"xaxis":"4","measure":32401840.77,"_s":0,"_g":3},{"xaxis":"5","measure":33927910.25,"_s":0,"_g":4},{"xaxis":"6","measure":32732103.34,"_s":0,"_g":5},{"xaxis":"7","measure":33867267.96,"_s":0,"_g":6},{"xaxis":"8","measure":34030687.74,"_s":0,"_g":7},{"xaxis":"9","measure":33129035.69,"_s":0,"_g":8},{"xaxis":"10","measure":34468698.51,"_s":0,"_g":9},{"xaxis":"11","measure":35000631.98,"_s":0,"_g":10},{"xaxis":"12","measure":35063421.35,"_s":0,"_g":11}];
		
		noDataCallback = 'no_Data';
		
		renderCallback(renderConfig);
		
		$(container).append('<div class="placeholder">Add measures or dimensions</div>');
	}

	// Your extension's configuration
	var config = {
		id: 'com.ibi.kpi_with_sparkline_flexible',     // string that uniquely identifies this extension
		containerType: 'html',  // either 'html' or 'svg' (default)
		initCallback: initCallback,
		preRenderCallback: preRenderCallback,  // reference to a function that is called right *before* your extension is rendered.  Will be passed one 'preRenderConfig' object, defined below.  Use this to configure a Monbeam instance as needed
		renderCallback: renderCallback,  // reference to a function that will draw the actual chart.  Will be passed one 'renderConfig' object, defined below
		noDataPreRenderCallback: noDataPreRenderCallback, 
		noDataRenderCallback: noDataRenderCallback,
		resources: {
			script: 
				window.jQuery
					? ['lib/jquery.sparkline.min.js']
					: [
						['', tdgchart.getScriptPath().split('/')[1], 'jquery/js/jquery.js'].join('/'),
						'lib/jquery.sparkline.min.js'
					],
			css: ['css/open-sans.css', 'css/sparkline.css']
		},
		modules: {
			dataSelection: {
				supported: true,  // Set this true if your extension wants to enable data selection
				needSVGEventPanel: true, // if you're using an HTML container or altering the SVG container, set this to true and the chart engine will insert the necessary SVG elements to capture user interactions
				svgNode: function(arg){}  // if you're using an HTML container or altering the SVG container, return a reference to your root SVG node here.
			},
			eventHandler: {
				supported: true
			},
			tooltip: {
				supported: false,  // Set this true if your extension wants to enable HTML tooltips
				// This callback is called when no default tooltip content is passed into the chart.
				// Use this to define 'nice' default tooltips for the given target, ids & data.
				// Return value can be a string (including HTML), or HTML nodes, or any Moonbeam tooltip API object.
				autoContent: function(target, s, g, d, data) {
					if (d.hasOwnProperty('color')) {
						return 'Bar Size: ' + d.value + '<br />Bar Color: ' + d.color;
					}
					return 'Bar Size: ' + d.value;
				}
			}
		}
	};

	// Required: this call will register your extension with the chart engine
	tdgchart.extensionManager.register(config);
}());

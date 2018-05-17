/**

Author: Charles Perin

2018, Apr 20

**/

'use strict';

class UnitExplorer{
  constructor(p){
    this._units = [];
    this._unitWidth = p.unitWidth || 400;
    this._unitHeight = p.unitHeight || 100;
    this._unitCols = p.unitCols || 1;
    this._unitMargin = p.unitMargin || {top: 10, right: 10, bottom: 10, left: 10};
    //unitFilter - a function to filter the units to display
    this._statistics = ["activity","domestic","person","place"];
    this._dataFilter = p.dataFilter || function(d){return true;};
    this._layout = p.layout || {};
    this._unitFilters = p.unitFilters || [];
  }

  init(parent){

    d3.select(parent).append("div").attrs({
      id: "unitExplorerControls"
    });

    this._svg = d3.select(parent).append("svg").attrs({
      id: "unitExplorerSVG"
    });

    this._domains = {
      time: [
        d3.min(this._units, unit => unit.dateMin),
        d3.max(this._units, unit => unit.dateMax)
      ]
    };
    this._statistics.forEach( s => this._domains[s] = [
        0,
        Math.min(50, d3.max(this._units, unit => unit.getMaxValue(s)))
      ]
    );

    console.log(this._domains)

    this.initControls();
    this.initUnits();
    this.update();
  }

  initControls(){

    var $this = this;

    let overallDiv = d3.select("#unitExplorerControls").append("div").styles({
      "border-bottom": "1px solid lightgray",
      margin: "5px 0px 15px 0px"
    });
    overallDiv.append("p").html("Minimum Number Overall:")

    let perDayDiv = d3.select("#unitExplorerControls").append("div").styles({
      "border-bottom": "1px solid lightgray",
      margin: "5px 0px 15px 0px"
    });
    perDayDiv.append("p").html("Maximum Number at a Given Date:")

    this._unitFilters.forEach(function(f){

      f.value = f.default;

      let name = "",
          theDiv = undefined,
          sliderRange = "";

      if(f.type === "minTotal"){
        name += f.name+": ";
        theDiv = overallDiv;
        sliderRange = "max";
      }
      else if(f.type === "maxDay"){
        name += f.name+": ";
        theDiv = perDayDiv;
        sliderRange = "min";
      }

      let divID = "unitControl-"+f.key+"-"+f.type;
      let controlDiv = theDiv.append("div").attr("id", divID).style("margin","5px");

      controlDiv.append("label").html(name);
      controlDiv.append("label").attr("class","amount").html(f.default).style("color","orange").style("font-weight","600");
      controlDiv.append("div").attr("class","slider").styles({
        width: "300px",
        display: "inline-block",
        position: "absolute",
        left: "500px"
      });

      $( "#" + divID + " .slider").slider({
        range: sliderRange,
        min: f.min,
        max: f.max,
        value: f.default,
        slide: function( event, ui ) {
          $( "#"+divID + " .amount" ).html( ui.value );
          f.value = ui.value;
          $this.update();
        }
      });
    //  $( "#" + divID + ".amount" ).html( $( "#" + divID + ".slider" ).slider( "value" ) );
      d3.select("#" + divID ).attr("width","200px");
    });

    //the legend
    var legend = d3.select("#unitExplorerControls").append("div");
    var legendData = [];
    for(var v in constants.color.statistics){
      legendData.push({name: v, color: constants.color.statistics[v]})
    }

    var legendItem = legend.selectAll(".legendItem").data(legendData).enter().append("div").attr("class","legendItem").style("display","inline-block");
    legendItem.append("div").styles({
      width: "20px",
      height: "20px",
      display: "inline-block",
      "background-color": d => d.color,
      "margin": "0px 5px"
    });
    legendItem.append("label").style("display","inline-block").style("margin-right", "5px").html(d => d.name);
    var nbUnits = legend.append("div");
    nbUnits.append("label").html("Number of units shown: ");
    nbUnits.append("label").attr("id", "label-nbUnitsShown").html("");
    nbUnits.append("label").html(" / "+this._units.length);
  }

  initUnits(){
    this._units.forEach(unit => unit.init({
      parent: this._svg,
      domains: this._domains
    }));
  }

  getVisibleUnits(){
    return this._units.filter(unit => unit.isVisible());
  }

  update(){

    var $this = this;

    //update the main SVG dimensions based on number of units to show
    let w = (this._unitWidth + this._unitMargin.left + this._unitMargin.right) * this._unitCols;
    let h = (this._unitHeight + this._unitMargin.top + this._unitMargin.bottom) * Math.floor($this.getVisibleUnits().length / this._unitCols);

    this._svg.attrs({
      width: w,
      height: h
    });

    d3.select("#label-nbUnitsShown").html($this.getVisibleUnits().length);

    this._units.forEach( (unit, u) => unit.update({
      x: this.xUnitFromIndex($this.getVisibleUnits().filter(function(unit2,u2){return u2 < $this.getVisibleUnits().indexOf(unit)}).length),
      y: this.yUnitFromIndex($this.getVisibleUnits().filter(function(unit2,u2){return u2 <  $this.getVisibleUnits().indexOf(unit)}).length),
      width: this._unitWidth,
      height: this._unitHeight,
      layout: this._layout,
      filters: $this._unitFilters
    }));
  }

  getFilterObject(){

  }

  xUnitFromIndex(i){
    return (i % this._unitCols) * (this._unitWidth + this._unitMargin.left + this._unitMargin.right) + this._unitMargin.left;
  }

  yUnitFromIndex(i){
    return Math.floor((i / this._unitCols)) * (this._unitHeight + this._unitMargin.top + this._unitMargin.bottom) + this._unitMargin.top;
  }


  /*
    Load the json file in parameter to create all units, and calls the callback once done
  */
  loadDataFile(file, callback){
    let $this = this;
    d3.json(file).then(function(data) {
      //console.log("data",data)

      $this.createControls(data);

      $this._units = data.map(function(d){
          d.statistics = $this._statistics;
          d.dataFilter = $this._dataFilter;
          d.layout = $this._layout;
          return new Unit(d);
        });

      callback.call();

    });
  }

  createControls(data){
    this._unitFilters.forEach(function(f){
      f.min = 0;
      switch(f.type){
        case "minTotal":
          f.max = Math.max(f.default, d3.max(data, unit => d3.sum(unit.timeseries, series => series[f.key])));
        break;
        case "maxDay":
          f.max = Math.max(f.default, d3.max(data, unit => d3.max(unit.timeseries, series => series[f.key])));
        break;
        default: console.error("Unknown type",f.type);
      }
    });
  }

  /*
    Return the list of units
  */
  get units(){
    return this._units;
  }
}


class Unit{
  constructor(p){
    this._name = p.unit;
    this._visible = true;
    this._statistics = p.statistics;
    p.timeseries.forEach(d => d.date = constants.parseYYYMMDD(d.date));
    this._timeSeries = p.timeseries.filter(p.dataFilter);

    this._dateMin = d3.min(this._timeSeries, d => d.date);
    this._dateMax = d3.max(this._timeSeries, d => d.date);
    this._layout = p.layout;

    this._statSeries = p.statistics.map(d => new UnitStatistic({statistic: d, unit: this}));

    this._metaData = {
      total: {
        activities: d3.sum(this._timeSeries, t => t.activity_count),
        domestic: d3.sum(this._timeSeries, t => t.domestic_count),
        places: d3.sum(this._timeSeries, t => t.place_mentioned_count),
        persons: d3.sum(this._timeSeries, t => t.person_count)
      },
      dayMax: {
        activities: d3.max(this._timeSeries, t => t.activity_count),
        domestic: d3.max(this._timeSeries, t => t.domestic_count),
        places: d3.max(this._timeSeries, t => t.place_mentioned_count),
        persons: d3.max(this._timeSeries, t => t.person_count)
      }
    }
  }

  isVisible(){
    return this._visible;
  }

  init(p){
    var $this = this;

    this._chart = p.parent.append("g").attrs({
      class: "unit"
    });

    this._chart.append("rect").attrs({
      class: "background",
      width: this._width,
      height: this._height
    }).styles({
      stroke: "black",
      fill: "none"
    });

    let top = this._chart.append("g").attr("class", "top").attr("transform", d3.translate(this._layout.top.margin.left, this._layout.top.margin.top));
    top.append("text").attrs({
      dy: "1em",
      dx: "5pt",
      "font-size": 11
    }).text(this._name);

    let bottom = this._chart.append("g").attr("class", "bottom");
    //bottom.append("text").text("here the years").attr("dy","1em");//TODO - replace with time axis



    this._statSeries.forEach(function(stat){
      var histoTmpScale = d3.scaleLinear().domain(p.domains[stat.statistic].map(d => d+1)).nice(constants.histogram.nbBins);

      stat.init({
        parent: $this._chart,
        timeDomainLinechart: p.domains.time,
        statDomainLinechart: p.domains[stat.statistic],
        histogramParam: d3.histogram()
          .value(function(d) { return $this.getTimePointStat(d,stat.statistic); })
          .domain(histoTmpScale.domain())
          .thresholds(histoTmpScale.ticks(constants.histogram.nbBins))
      });
    });
  }

  update(p){

    var $this = this;

    if(p.width != undefined) this._width = p.width;
    if(p.height != undefined) this._height = p.height;
    if(p.x != undefined) this._x = p.x;
    if(p.y != undefined) this._y = p.y;

    if(p.filters){
      this.updateVisibility(p.filters);
    }

    this._chart.attrs({
      transform: d3.translate(this._x,this._y)
    });

    this._chart.select(".background").attrs({
      width: this._width,
      height: this._height
    }).style("fill", function(){
      if($this._name === "3 DIVISION: 8 Battalion King's Own Royal Lancaster Regiment") return "#FFEEEE";
      return "white";
    });

    this._chart.select(".bottom").attr("transform", d3.translate(
      this._layout.left.margin.left + this._layout.left.margin.right + this._layout.left.width + this._layout.bottom.margin.left,
      this._height - this._layout.bottom.margin.top - this._layout.bottom.margin.bottom - this._layout.bottom.height));

    this._chart.style("visibility", this.isVisible() ? "visible" : "hidden");

    //update each statistic series
    this._statSeries.forEach( (stat, s) => stat.update({
      linechartDimensions: this.getLineChartDimensions(s),
      histogramDimensions: this.gehistogramDimensions(s),
    }));
  }

  updateVisibility(filters){
    this._visible = true;
    if(this._metaData.total.activities < filters.filter(f => f.key === "activity_count" && f.type === "minTotal")[0].value){
        this._visible = false;
    }
    if(this._metaData.total.domestic < filters.filter(f => f.key === "domestic_count" && f.type === "minTotal")[0].value){
      this._visible = false;
    }
    if(this._metaData.total.places < filters.filter(f => f.key === "place_mentioned_count" && f.type === "minTotal")[0].value){
        this._visible = false;
    }
    if(this._metaData.total.persons < filters.filter(f => f.key === "person_count" && f.type === "minTotal")[0].value){
      this._visible = false;
    }

    if(this._metaData.dayMax.activities > filters.filter(f => f.key === "activity_count" && f.type === "maxDay")[0].value){
      this._visible = false;
    }
    if(this._metaData.dayMax.domestic > filters.filter(f => f.key === "domestic_count" && f.type === "maxDay")[0].value){
      this._visible = false;
    }
    if(this._metaData.dayMax.places > filters.filter(f => f.key === "place_mentioned_count" && f.type === "maxDay")[0].value){
      this._visible = false;
    }
    if(this._metaData.dayMax.persons > filters.filter(f => f.key === "person_count" && f.type === "maxDay")[0].value){
      this._visible = false;
    }
  }

  getLineChartDimensions(i){
    let x = this._layout.left.width + this._layout.left.margin.left + this._layout.left.margin.right,
        width = this._width - x,
        y0 = this._layout.top.height + this._layout.top.margin.top + this._layout.top.margin.bottom,
        y1 = this._height - this._layout.bottom.height + this._layout.bottom.margin.top + this._layout.bottom.margin.bottom,
        height = (y1 - y0) / this._statistics.length,
        y = y0 + i * height;

    return {x: x, y: y, width: width, height: height};
  }

  gehistogramDimensions(i){
    let x = this._layout.left.margin.left,
        width = this._layout.left.width - this._layout.left.margin.left - this._layout.left.margin.right,
        y0 = this._layout.top.height + this._layout.top.margin.top + this._layout.top.margin.bottom,
        y1 = this._height - this._layout.bottom.height + this._layout.bottom.margin.top + this._layout.bottom.margin.bottom,
        height = (y1 - y0) / this._statistics.length,
        y = y0 + i * height;
    return {x: x, y: y, width: width, height: height};
  }

  getMinValue(statName){
    return d3.min(this._timeSeries, timePoint => this.getTimePointStat(timePoint, statName));
  }

  getMaxValue(statName){
    return d3.max(this._timeSeries, timePoint => this.getTimePointStat(timePoint, statName));
  }

  getTimePointStat(timePoint, stat){
    switch(stat){
      case "activity":
        return timePoint.activity_count;
      break;
      case "domestic":
        return timePoint.domestic_count;
      break;
      case "person":
        return timePoint.person_count;
      break;
      case "place":
        return timePoint.place_mentioned_count;
      break;
      default: throw new Exception("Unknown statistic "+stat);
    }
  }

  get name(){
    return this._name;
  }

  get dateMin(){
    return this._dateMin;
  }

  get dateMax(){
    return this._dateMax;
  }

  get timeSeries(){
    return this._timeSeries;
  }
}


/*
UnitStatistic
*/
class UnitStatistic{
  constructor(p){
    this._statistic = p.statistic;
    this._unit = p.unit;
    var $this = this;

    this.line = d3.line()
      .x(function(d) { return $this.getLinechartTimePointX(d); })
      .y(function(d) { return $this.getLinechartTimePointY(d, $this._statistic) });

    this._bisectDateLinechart = d3.bisector(function(d) { return d.date; }).left;
  }

  init(p){

    let $this = this;

    this._xScaleLinechart = d3.scaleTime().domain(p.timeDomainLinechart);
    this._yScaleLinechart = d3.scaleLinear().domain(p.statDomainLinechart).clamp(true);

    this._histogramParam = p.histogramParam;
    let bins = this._histogramParam(this._unit._timeSeries);
    this._xScaleHistogram = d3.scaleLinear().domain([0, constants.histogram.tmpMaxValue]);//TODO - max value over all histogram bins
    this._yScaleHistogram = d3.scaleLinear().domain([0, bins.length]);

    //console.log("bin widths: " + bins.map(b => "[" + b.x1 + ", " + b.x0 + "]" ));

    this._chart = p.parent.append("g").attrs({
      class: "statSeries"
    });

    this._chart.append("path").attrs({
      class: "statLine",
      fill: "none",
      stroke: constants.color.statistics[this._statistic],
      "stroke-linejoin": "round",
      "stroke-linecap": "round",
      "stroke-width": .5
    });

    this._focus = this._chart.append("g")
        .attr("class", "focus")
        .style("display", "none");

    this._focus.append("line")
        .attr("class", "x-hover-line hover-line")
        .attr("y1", 0)
        .styles({
          stroke: "#6F257F",
          "stroke-width": 1,
          "stroke-dasharray": "2,2"
        });
    this._focus.append("line")
        .attr("class", "y-hover-line hover-line")
        .attr("x1", 0)
        .attr("x2", 0)
        .styles({
          stroke: "#6F257F",
          "stroke-width": 1,
          "stroke-dasharray": "3,3"
        });
    this._focus.append("circle")
        .attr("r", 2.5);
    this._focus.append("text");

    this._chart.append("rect").attrs({
          class: "overlay",
        }).styles({
          stroke: "black",
          fill: "none",
          "pointer-events": "all"
        })
        .on("mouseover", function() { $this._focus.style("display", null); })
        .on("mouseout", function() { $this._focus.style("display", "none"); })
        .on("mousemove", mousemove);

    function mousemove() {
        let mouseDate =  $this._xScaleLinechart.invert(d3.mouse(this)[0]),
            i = $this._bisectDateLinechart($this._unit.timeSeries, mouseDate, 1),
            d0 = $this._unit.timeSeries[i - 1],
            d1 = $this._unit.timeSeries[i];
        if(d0 == undefined || d1 == undefined) return;
        let closestData = mouseDate - d0.date > d1.date - mouseDate ? d1 : d0,
            x = $this.getLinechartTimePointX(closestData),
            y = $this.getLinechartTimePointY(closestData, $this._statistic),
            value = $this._unit.getTimePointStat(closestData, $this._statistic);
        let shortDate = constants.formatShortDate(closestData.date);

        $this._focus.attr("transform", d3.translate(x, y));
        $this._focus.select("text")
          .text(`${value} (${shortDate})`)
          .attrs({
            dx: function(){
                return (x > $this._widthLinechart - 150) ? -5 : 5;
            },
            dy: function(){
                return (y < 20) ? ".9em" : "-.3em";
            }
          }).styles({
            "text-anchor": function(){
                return (x > $this._widthLinechart - 150) ? "end": "start";
            }
          })
        $this._focus.select(".x-hover-line").attr("y2", $this._heightLinechart - y);
        $this._focus.select(".y-hover-line").attr("x2", $this._widthLinechart - x);
      }

      this._histogram = p.parent.append("g").attrs({
        class: "histogram"
      });
      let histobars = this._histogram.selectAll(".histoBar").data(bins).enter().append("g").attr("class","histoBar").append("rect").styles({
        stroke: "none",
        fill: constants.color.statistics[this._statistic]
      });

  }



  update(p){
    var $this = this;
    if(p.linechartDimensions.width != undefined) {
      this._widthLinechart = p.linechartDimensions.width;
      this._xScaleLinechart.rangeRound([0, this._widthLinechart]);
    }
    if(p.linechartDimensions.height != undefined) {
      this._heightLinechart = p.linechartDimensions.height;
      this._yScaleLinechart.rangeRound([this._heightLinechart, 0]);
    }
    if(p.linechartDimensions.x != undefined) this._xLinechart = p.linechartDimensions.x;
    if(p.linechartDimensions.y != undefined) this._yLinechart = p.linechartDimensions.y;

    if(p.histogramDimensions.width != undefined){
      this._widthHistogram = p.histogramDimensions.width;
      this._xScaleHistogram.rangeRound([0, this._widthHistogram]);
    }
    if(p.histogramDimensions.height != undefined){
      this._heightHistogram = p.histogramDimensions.height;
      this._yScaleHistogram.rangeRound([0, this._heightHistogram]);
    }
    if(p.histogramDimensions.x != undefined) this._xHistogram = p.histogramDimensions.x;
    if(p.histogramDimensions.y != undefined) this._yHistogram = p.histogramDimensions.y;

    var histobarHeight = $this._yScaleHistogram(1) - $this._yScaleHistogram(0);
    this._chart.attrs({
      transform: d3.translate(this._xLinechart,this._yLinechart)
    });
    this._histogram.attrs({
      transform: d3.translate(this._xHistogram,this._yHistogram)
    });
    let histoBars = this._histogram.selectAll(".histoBar").attrs({
      transform: function(d,i){
        return d3.translate(
          $this._widthHistogram -  $this._xScaleHistogram(d.length),
          $this._heightHistogram - histobarHeight - $this._yScaleHistogram(i)
        );
      }
    });
    histoBars.select("rect").attrs({
      width: d => this._xScaleHistogram(d.length),
      height: histobarHeight
    });


    this._chart.select(".overlay").attrs({
      width: this._widthLinechart,
      height: this._heightLinechart
    });

    this._chart.select(".statLine")
      .datum(this._unit._timeSeries)
      .attr("d", this.line);

    this._focus.select(".x-hover-line").attrs({
      y2: this._heightLinechart
    });
    this._focus.select(".y-hover-line").attrs({
      x2: 0
    });

  }

  getLinechartTimePointX(timePoint){
    return this._xScaleLinechart(timePoint.date);
  }

  getLinechartTimePointY(timePoint, statistic){
    return this._yScaleLinechart(this._unit.getTimePointStat(timePoint,statistic));
  }

  get statistic(){
    return this._statistic;
  }

}

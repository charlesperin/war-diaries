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
  }

  init(parent){

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
        d3.max(this._units, unit => unit.getMaxValue(s))
      ]
    );

    this.initUnits();
    this.update();
  }

  initUnits(){
    this._units.forEach(unit => unit.init({
      parent: this._svg,
      domains: this._domains
    }));
  }

  update(){

    //update the main SVG dimensions based on number of units to show
    let w = (this._unitWidth + this._unitMargin.left + this._unitMargin.right) * this._unitCols;
    let h = (this._unitHeight + this._unitMargin.top + this._unitMargin.bottom) * Math.floor(this._units.length / this._unitCols);

    this._svg.attrs({
      width: w,
      height: h
    });

    //update each unit
    this._units.forEach( (unit, u) => unit.update({
      x: this.xUnitFromIndex(u),
      y: this.yUnitFromIndex(u),
      width: this._unitWidth,
      height: this._unitHeight,
      layout: this._layout
    }));
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
      console.log("data",data)
      $this._units = data.map(function(d){
        d.statistics = $this._statistics;
        d.dataFilter = $this._dataFilter;
        d.layout = $this._layout;
        return new Unit(d);
      });
      callback.call();
    });
  }

  /*
    Return the list of units
  */
  get units(){
    return this._units;
  }

  /*
    Set the list of units
  */
  set units(units){
    this._units = units;
  }
}




class Unit{
  constructor(p){
    this._name = p.unit;
    this._statistics = p.statistics;
    p.timeseries.forEach(d => d.date = parseYYYMMDD(d.date));
    this._timeSeries = p.timeseries.filter(p.dataFilter);

    this._dateMin = d3.min(this._timeSeries, d => d.date);
    this._dateMax = d3.max(this._timeSeries, d => d.date);
    this._layout = p.layout;

    this._statSeries = p.statistics.map(d => new UnitStatistic({statistic: d, unit: this}));
    //TODO - this._statHistograms = ...
  }

  init(p){

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
    bottom.append("text").text("here the years").attr("dy","1em");//TODO - replace with time axis

    this._statSeries.forEach(stat => stat.init({
      parent: this._chart,
      timeDomain: p.domains.time,
      statDomain: p.domains[stat.statistic]
    }));

  }

  update(p){

    if(p.width != undefined) this._width = p.width;
    if(p.height != undefined) this._height = p.height;
    if(p.x != undefined) this._x = p.x;
    if(p.y != undefined) this._y = p.y;

    this._chart.attrs({
      transform: d3.translate(this._x,this._y)
    });

    this._chart.select(".background").attrs({
      width: this._width,
      height: this._height
    });

    this._chart.select(".bottom").attr("transform", d3.translate(
      this._layout.left.margin.left + this._layout.left.margin.right + this._layout.left.width + this._layout.bottom.margin.left,
      this._height - this._layout.bottom.margin.top - this._layout.bottom.margin.bottom - this._layout.bottom.height));

    //update each statistic series
    this._statSeries.forEach( (stat, s) => stat.update(this.getChartDimensions(s)));
  }

  getChartDimensions(i){
    let x = this._layout.left.width + this._layout.left.margin.left + this._layout.left.margin.right,
        width = this._width - x,
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


  /*
    Return the name of the unit
  */
  get name(){
    return this._name;
  }

  /*
    Set the name of the unit
  */
  set name(name){
    this._name = name;
  }

  /*
    Return the first date associated to the unit
  */
  get dateMin(){
    return this._dateMin;
  }

  /*
    Set the first date associated to the unit
  */
  set dateMin(dateMin){
    this._dateMin = dateMin;
  }

  /*
    Return the last date associated to the unit
  */
  get dateMax(){
    return this._dateMax;
  }

  /*
    Set the last date associated to the unit
  */
  set dateMax(dateMax){
    this._dateMax = dateMax;
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
      .x(function(d) { return $this.getTimePointX(d); })
      .y(function(d) { return $this.getTimePointY(d, $this._statistic) });

    this._bisectDate = d3.bisector(function(d) { return d.date; }).left;
  }

  init(p){

    var $this = this;

    this._xScale = d3.scaleTime().domain(p.timeDomain);
    this._yScale = d3.scaleLinear().domain(p.statDomain);

    this._chart = p.parent.append("g").attrs({
      class: "statSeries",
    });

    this._chart.append("path").attrs({
      class: "statLine",
      fill: "none",
      stroke: "steelblue",
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
        let mouseDate =  $this._xScale.invert(d3.mouse(this)[0]),
            i = $this._bisectDate($this._unit.timeSeries, mouseDate, 1),
            d0 = $this._unit.timeSeries[i - 1],
            d1 = $this._unit.timeSeries[i];
        if(d0 == undefined || d1 == undefined) return;
        let closestData = mouseDate - d0.date > d1.date - mouseDate ? d1 : d0,
            x = $this.getTimePointX(closestData),
            y = $this.getTimePointY(closestData, $this._statistic),
            value = $this._unit.getTimePointStat(closestData, $this._statistic);
        let shortDate = formatShortDate(closestData.date);

        $this._focus.attr("transform", d3.translate(x, y));
        $this._focus.select("text")
          .text(`${value} (${shortDate})`)
          .attrs({
            dx: function(){
                return (x > $this._width - 150) ? -5 : 5;
            },
            dy: function(){
                return (y < 20) ? ".9em" : "-.3em";
            }
          }).styles({
            "text-anchor": function(){
                return (x > $this._width - 150) ? "end": "start";
            }
          })
        $this._focus.select(".x-hover-line").attr("y2", $this._height - y);
        $this._focus.select(".y-hover-line").attr("x2", $this._width - x);
      }
  }

  update(p){
    if(p.width != undefined) {
      this._width = p.width;
      this._xScale.rangeRound([0, this._width]);
    }
    if(p.height != undefined) {
      this._height = p.height;
      this._yScale.rangeRound([this._height, 0]);
    }
    if(p.x != undefined) this._x = p.x;
    if(p.y != undefined) this._y = p.y;

    this._chart.attrs({
      transform: d3.translate(this._x,this._y)
    });

    this._chart.select(".overlay").attrs({
      width: this._width,
      height: this._height
    });

    this._chart.select(".statLine")
      .datum(this._unit._timeSeries)
      .attr("d", this.line);

    this._focus.select(".x-hover-line").attrs({
      y2: this._height
    });
    this._focus.select(".y-hover-line").attrs({
      x2: 0
    });

  }

  getTimePointX(timePoint){
    return this._xScale(timePoint.date);
  }

  getTimePointY(timePoint, statistic){
    return this._yScale(this._unit.getTimePointStat(timePoint,statistic));
  }





  get statistic(){
    return this._statistic;
  }


}

/*
 *  Power BI Visualizations
 *  Calendar. V0.0.1
 *
 *  Copyright (c) Elastcloud Ltd
 *  All rights reserved.
 *  MIT License
 *
 *  Permission is hereby granted, free of charge, to any person obtaining a copy
 *  of this software and associated documentation files (the ""Software""), to deal
 *  in the Software without restriction, including without limitation the rights
 *  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *  copies of the Software, and to permit persons to whom the Software is
 *  furnished to do so, subject to the following conditions:
 *
 *  The above copyright notice and this permission notice shall be included in
 *  all copies or substantial portions of the Software.
 *
 *  THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 *  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 *  THE SOFTWARE.
 *
 *  Acknowledgements
 *  Original code by Ouyang Yadong http://bl.ocks.org/oyyd/859fafc8122977a3afd6
 *  Modified and integrated with love by Max and Andy.
 */
"use strict";
var powerbi;
(function (powerbi) {
    var visuals;
    (function (visuals) {
        var Heatmap = (function () {
            function Heatmap(container) {
                //UI configuration
                this._itemSize = 18;
                this._cellPadding = 1;
                this._width = 800;
                this._height = 800;
                this._margin = { top: 50, right: 20, bottom: 20, left: 25 };
                //Formats
                this._timeFormat = d3.time.format('%Y-%m-%dT%X');
                this._monthDayFormat = d3.time.format('%m.%d');
                this.init(container);
            }
            Heatmap.prototype.init = function (container) {
                var selection = d3.select(container);
                this._container = selection;
                selection
                    .attr('width', this._width)
                    .attr('height', this._height);
                //Scales
                this._colorScale = d3.scale.quantize()
                    .domain(([0, 500]))
                    .range(['#f6faaa', '#FEE08B', '#FDAE61', '#F46D43', '#D53E4F', '#9E0142']);
                this._axisHeight = (this._itemSize + this._cellPadding) * 24; //24 = hours
                this._xScale = d3.scale.ordinal();
                this._yScale = d3.scale.linear()
                    .domain([24, 0])
                    .range([this._axisHeight, 0]);
                this._xAxis = d3.svg.axis()
                    .orient('top');
                this._yAxis = d3.svg.axis()
                    .scale(this._yScale)
                    .orient('left')
                    .ticks(5);
            };
            Heatmap.prototype.convert = function (data) {
                var _this = this;
                //group all records by date with key == converted timestamp to month.day
                var groupedByDate = d3.nest()
                    .key(function (d) { return _this._monthDayFormat(_this._timeFormat.parse(d.timestamp)); })
                    .entries(data);
                groupedByDate.forEach(function (group, i) {
                    group.values.forEach(function (item) {
                        item.groupIndex = i;
                        item.value = item.value['PM2.5'];
                    });
                });
                return groupedByDate;
            };
            Heatmap.prototype.update = function (dataIn) {
                var _this = this;
                var data = this.convert(dataIn);
                var rectGroup = this._container.append('g')
                    .attr({
                    'transform': 'translate(' + this._margin.left + ',' + this._margin.top + ')'
                });
                //Creating columns for each date
                var rectCols = rectGroup.selectAll("g")
                    .data(data)
                    .enter()
                    .append("g")
                    .attr({
                    'transform': function (d, i) { return 'translate(' + (i * (_this._itemSize + _this._cellPadding)) + ', 0)'; }
                });
                //Creating time rects for each column
                this._rects = rectCols.selectAll('rect')
                    .data(function (d) { return d.values; })
                    .enter()
                    .append('rect')
                    .attr({
                    "width": function (d) { return _this._itemSize; },
                    "height": function (d) { return _this._itemSize; },
                    "y": function (d, i) { return (_this._itemSize + _this._cellPadding) * i; },
                    "fill": '#ffffff'
                });
                this._rects.append("title")
                    .text(function (d) { return d.timestamp + ' ' + d.value; });
                this._rects
                    .transition()
                    .delay(function (d, i) { return d.groupIndex * 20; })
                    .attr({
                    'fill': function (d) { return _this._colorScale(d.value); }
                });
                this._axisWidth = (data.length - 1) * (this._itemSize + this._cellPadding);
                var dateKeys = data.map(function (item) {
                    return item.key;
                });
                this._xScale.domain(dateKeys).rangePoints([0, this._axisWidth]);
                this._xAxis.scale(this._xScale);
                this._container.append('g')
                    .attr('transform', 'translate(' + this._margin.left + ',' + this._margin.top + ')')
                    .attr('class', 'x axis')
                    .call(this._xAxis)
                    .selectAll("text")
                    .attr("style", "font-size:12px;")
                    .attr("transform", " translate(10, 0) rotate(-45)");
                this._container.append('g')
                    .attr('transform', 'translate(' + this._margin.left + ',' + this._margin.top + ')')
                    .attr('class', 'y axis')
                    .call(this._yAxis)
                    .append('text')
                    .text('time')
                    .attr('transform', 'translate(-10,' + this._axisHeight + ') rotate(-90)');
            };
            return Heatmap;
        }());
        visuals.Heatmap = Heatmap;
    })(visuals = powerbi.visuals || (powerbi.visuals = {}));
})(powerbi || (powerbi = {}));

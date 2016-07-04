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

/// <reference path="../typings/index.d.ts" />


import * as D3 from 'd3';

interface IDataItem {
    timestamp: string,
    value: Object
}

module powerbi.visuals {

    export class Heatmap {

        private _container:D3.Selection<any>;
        private _rects:D3.Selection<any>;

        //UI configuration
        private _itemSize = 18;
        private _cellPadding = 1;
        private _width = 800;
        private _height = 800;
        private _margin = {top: 50, right: 20, bottom: 20, left: 25};

        //Formats
        private _timeFormat = d3.time.format('%Y-%m-%dT%X');
        private _monthDayFormat = d3.time.format('%m.%d');

        private _colorScale:D3.scale.Quantize<any>; //D3.scale.Quantize<number>;

        //Axis and scales
        private _xScale:D3.scale.Ordinal<string, {}>;
        private _yScale:D3.scale.Linear<number, number>;

        private _axisWidth:number;
        private _axisHeight:number;

        private _xAxis:D3.svg.Axis;
        private _yAxis:D3.svg.Axis;

        constructor(container:any) {
            this.init(container);
        }

        private init(container) {

            var selection = d3.select(container);
            this._container = selection;
            selection
                .attr('width', this._width)
                .attr('height', this._height);

            //Scales
            this._colorScale = d3.scale.quantize()
                .domain([0, 500])
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

        }

        convert(data:IDataItem[]) {

            //group all records by date with key == converted timestamp to month.day
            var groupedByDate = d3.nest()
                .key((d:any) => this._monthDayFormat(this._timeFormat.parse(d.timestamp)))
                .entries(data);

            groupedByDate.forEach((group, i) => {
                group.values.forEach((item) => {
                    item.groupIndex = i;
                    item.value = item.value['PM2.5']
                })
            });

            return groupedByDate;
        }

        update(dataIn:Array<IDataItem>) {

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
                    'transform': (d, i) => 'translate(' + ( i * (this._itemSize + this._cellPadding)) + ', 0)'
                });

            //Creating time rects for each column
            this._rects = rectCols.selectAll('rect')
                .data((d) => d.values)
                .enter()
                .append('rect')
                .attr({
                    "width": (d) => this._itemSize,
                    "height": (d) => this._itemSize,
                    "y": (d, i) => (this._itemSize + this._cellPadding) * i,
                    "fill": '#ffffff'
                });


            this._rects.append("title")
                .text((d) => d.timestamp + ' ' + d.value);

            this._rects
                .transition()
                .delay((d, i) => d.groupIndex * 20)
                .attr({
                    'fill': (d) => this._colorScale(d.value)
                });


            this._axisWidth = (data.length - 1) * (this._itemSize + this._cellPadding);

            var dateKeys = data.map((item) => {
                return item.key
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


            return data;
        }


    }
}
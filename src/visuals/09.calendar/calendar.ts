/*
 *  Power BI Visualizations
 *  Calendar. V0.4.1
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
 *  Layout inspired by Rick Wicklin and Robert Allison http://stat-computing.org/dataexpo/2009/posters/
 *  Original code by mbostock http://bl.ocks.org/mbostock/4063318
 *  Modified and integrated with love by Andy.
 */

declare module D3 {
    export module Time {
        export interface Time {
            weekOfYear(x: any): any;//this is missin from d3.d.ts
        }
    }
}

module powerbi.visuals {
    import SelectionManager = utility.SelectionManager;
    export interface DateValue {
        color:string;
        date: Date;
        value: number;
        selector: SelectionId;
        dateStr: string;
        tooltipInfo?: TooltipDataItem[];
    };
    export interface CalendarViewModel {
        values: DateValue[][];
        yearsList: any[];
    };

    export var CalendarChartProps = {
        general: {
            formatString: <DataViewObjectPropertyIdentifier>{ objectName: 'general', propertyName: 'formatString' },
        },
        dataPoint: {
            defaultColor: <DataViewObjectPropertyIdentifier>{ objectName: 'dataPoint', propertyName: 'defaultColor' },
            fill: <DataViewObjectPropertyIdentifier>{ objectName: 'dataPoint', propertyName: 'fill' },
        },
    };

    export class CalendarVisual implements IVisual {
        public static capabilities: VisualCapabilities = {
            dataRoles: [
                {
                    name: 'Category',
                    displayName: 'Category',
                    kind: VisualDataRoleKind.Grouping,
                },
                {
                    name: 'Y',
                    displayName: 'Y',
                    kind: VisualDataRoleKind.Measure,
                }
            ],
            dataViewMappings: [{
                conditions: [
                    // NOTE: Ordering of the roles prefers to add measures to Y before Gradient.
                    { 'Category': { max: 1 }, 'Y': { max: 1 } },
                ],
                categorical: {
                    categories: {
                        for: { in: 'Category' },
                    },
                    values: {
                        group: {
                            by: 'Series',
                            select: [{ bind: { to: 'Y' } }],
                            dataReductionAlgorithm: { top: {} }
                        }
                    },
                    rowCount: { preferred: { max: 2 } }
                },
            }],
            objects: {
                 cellColor: {
                    displayName: 'Cells color',
                    properties: {
                        fill: {
                            displayName: 'Cell fill',
                            type: { fill: { solid: { color: true } } }
                        }
                    }
                },
                drawLegend: {
                    displayName: 'Draw Legend?',
                    properties: {
                        show: {
                            displayName: data.createDisplayNameGetter("Visual_Show"),
                            type: { bool: true }
                        },
                        transparency: {//visibleGapsPercentage
                            displayName: 'Visible gaps',
                            type: { numeric: true }
                        },
                    }
                },
                general: {
                    displayName: data.createDisplayNameGetter('Visual_General'),
                    properties: {
                        formatString: {
                            type: { formatting: { formatString: true } },
                        },
                        filter: {
                            type: { filter: {} },
                            rule: {
                                output: {
                                    property: 'selected',
                                    selector: ['Values'],
                                }
                            }
                        },
                    },
                },
                dataPoint: {
                    displayName: data.createDisplayNameGetter('Visual_DataPoint'),
                    properties: {
                        defaultColor: {
                            displayName: data.createDisplayNameGetter('Visual_DefaultColor'),
                            type: { fill: { solid: { color: true } } }
                        },
                        fill: {
                            displayName: data.createDisplayNameGetter('Visual_Fill'),
                            type: { fill: { solid: { color: true } } }
                        },
                        // fillRule: {
                        //     displayName: data.createDisplayNameGetter('Visual_Gradient'),
                        //     type: { fillRule: {} },
                        //     rule: {
                        //         inputRole: 'Y',
                        //         output: {
                        //             property: 'fill',
                        //             selector: ['Category'],
                        //         },
                        //     },
                        // }
                    }
                },
                labels: {
                    displayName: data.createDisplayNameGetter('Visual_DataPointsLabels'),
                    properties: {
                        show: {
                            displayName: data.createDisplayNameGetter('Visual_Show'),
                            type: { bool: true },                           
                        },
                        color: {
                            displayName: data.createDisplayNameGetter('Visual_LabelsFill'),
                            type: { fill: { solid: { color: true } } }
                        },
                        labelDisplayUnits: {
                            displayName: data.createDisplayNameGetter('Visual_DisplayUnits'),
                            type: { formatting: { labelDisplayUnits: true } }
                        }
                    }
                }
            }
        };
        
        

        private drawMonthPath = false;
        private drawLegend = false;
        private drawLabels = true;
        private invertSortOrder = true;
        private width = 1016;
        private height = 144;
        private cellSize = 18; // cell size
        private element: HTMLElement;
        private rect: D3.Selection;
        private selectionManager: SelectionManager;
        private maxDomain: number;
        private colors: IDataColorPalette;
        private hostService: IVisualHostServices;
        private selectedKey;
        private defaultDataPointColorTop: string;
        private defaultDataPointColorBottom: string;
        private dataViews:DataView[];

        constructor(cellSizeOpt?: number) {
            if (cellSizeOpt) {
                this.cellSize = cellSizeOpt;
            }
        }

        public init(options: VisualInitOptions) {
            this.colors = options.style.colorPalette.dataColors;
            this.element = options.element.get(0);
            this.selectionManager = new SelectionManager({ hostServices: options.host });
            this.hostService = options.host;
            this.defaultDataPointColorTop = '#01B8AA';
            this.defaultDataPointColorBottom = '#01B8AA';
        }
        
        public update(options: VisualUpdateOptions) {
            d3.select(this.element).selectAll("*").remove();
            var viewModel = this.convert(options.dataViews[0], this.colors);

            if (viewModel == null) return;
            var dataView = options.dataViews[0];
            if (dataView.metadata && dataView.metadata.objects) {
                    var defaultColor = DataViewObjects.getFillColor(dataView.metadata.objects, CalendarChartProps.dataPoint.defaultColor);
                    if (defaultColor)
                        this.defaultDataPointColorTop = defaultColor;
                }

            this.maxDomain = viewModel.yearsList.map((year: number) => {
                return viewModel.values[year]
                    .map(dv => { return dv.value ? dv.value : 0; })
                    .reduce((p, c) => { if (c > p) { return c; } else { return p; } }, 0);
            }).reduce((p, c) => { if (c > p) { return c; } else { return p; } }, 0);

            var dataViews = options.dataViews;
            var currentViewport = options.viewport;
            var dataView:DataView = undefined;
            if (dataViews && dataViews.length > 0) {
                dataView = dataViews[0];
            }
            this.draw(dataView, this.element, options.viewport.width, options.viewport.height, viewModel, this.colors);
        }

        private renderTooltip(selection: D3.Selection): void {
            TooltipManager.addTooltip(selection,(tooltipEvent: TooltipEvent) => {
                return (<DateValue>tooltipEvent.data).tooltipInfo;
            });
        }
        
        private createChangeForFilterProperty(selectedId, filterPropertyIdentifier: DataViewObjectPropertyIdentifier): VisualObjectInstancesToPersist {
            var properties: { [propertyName: string]: DataViewPropertyValue } = {};
            var selectors: data.Selector[] = [];

            if (selectedId) {
                selectors = [selectedId.selector];
            }

            var instance = {
                objectName: filterPropertyIdentifier.objectName,
                selector: undefined,
                properties: properties
            };

            var filter = powerbi.data.Selector.filterFromSelector(selectors, false);

            if (filter == null) {
                properties[filterPropertyIdentifier.propertyName] = {};
                return <VisualObjectInstancesToPersist> {
                    remove: [instance]
                };
            }
            else {
                properties[filterPropertyIdentifier.propertyName] = filter;
                return <VisualObjectInstancesToPersist> {
                    merge: [instance]
                };
            }
        }


        public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstance[] {
            var instances: VisualObjectInstance[] = [];
            var enumeration = new ObjectEnumerationBuilder();

            switch (options.objectName) {
                case 'cellColor':
                    var cellColor: VisualObjectInstance = {
                        objectName: 'cellColor',
                        displayName: 'Cells color',
                        selector: null,
                        properties: {
                            fill: this.defaultDataPointColorTop
                        }
                    };
                    instances.push(cellColor);
                    break;
            }
            
            return instances;
        }

        private static getTooltipData(displayName: string, value: number): TooltipDataItem[] {
            return [{
                displayName: displayName,
                value: value < 0 ? "" : value.toString()
            }];
        }
        private prevSelection: D3.Selection;
        private draw(dataView: DataView, element, itemWidth: number, itemHeight: number, calendarViewModel: CalendarViewModel, colors: IDataColorPalette) {
            var colorScale = colors.getNewColorScale();
            var yearslist = calendarViewModel.yearsList;
            
            if (this.invertSortOrder)
            {
                yearslist = yearslist.reverse();
            }
            var format = d3.time.format("%Y-%m-%d");
            var svg = d3.select(element).selectAll("svg")
                .data(yearslist)
                .enter().append("svg");

            svg.attr("width", itemWidth)
                .attr("height", itemWidth / 7)
                .attr("viewBox", "-20 -20 " + (this.width - 20) + " " + (this.height + 4))
                .append("g")
                .attr("transform", "translate(" + (20 + (this.width - this.cellSize * 52) / 2) + "," + (20 + this.height - this.cellSize * 7 - 1) + ")");

            if (this.drawLabels) {
                var textGroup = svg.append("g").attr("fill", "#cccccc");
                textGroup.append("text")
                    .attr("transform", "translate(" + this.cellSize * -1.5 + "," + this.cellSize * 3.5 + ")rotate(-90)")
                    .style("text-anchor", "middle")
                    .text(function (d) { return d; });

                textGroup.append("text")
                    .style("text-anchor", "middle")
                    .text("M")
                    .attr("transform", "translate(" + this.cellSize * -0.75 + ")")
                    .attr("x", 0)
                    .attr("y", 2 * this.cellSize);

                textGroup.append("text")
                    .style("text-anchor", "middle")
                    .text("W")
                    .attr("transform", "translate(" + this.cellSize * -0.75 + ")")
                    .attr("x", 0)
                    .attr("y", 4 * this.cellSize);

                textGroup.append("text")
                    .style("text-anchor", "middle")
                    .text("F")
                    .attr("transform", "translate(" + this.cellSize * -0.75 + ")")
                    .attr("x", 0)
                    .attr("y", 6 * this.cellSize);

                textGroup.append("text")
                    .attr("transform", "translate(" + (this.width - (3 * this.cellSize)) + "," + this.cellSize * 3.5 + ")rotate(90)")
                    .style("text-anchor", "middle")
                    .text(function (d) { return d; });

                textGroup.selectAll(".month")
                    .data((d) => { return d3.time.months(new Date(d, 0, 1), new Date(d + 1, 0, 1)); })
                    .enter()
                    .append("text")
                    .attr("transform",(d) => { return "translate(" + d3.time.weekOfYear(d) * this.cellSize + ", -5)"; })
                    .text((d) => { return d3.time.format("%b")(d); });
            }
            var pad = (n: any) => {
                if (n.toString().length === 1) {
                    return "0" + n;
                }

                return n.toString();
            };

            this.rect = svg.selectAll(".day")
                .data((d, i) => {
                return calendarViewModel.values[d]
            })
                .enter().append("rect")
                .attr("width", this.cellSize - 1)
                .attr("height", this.cellSize - 1)
                .attr("class", "day")
                .style({
                    "fill": (d) => d.color,
                    "stroke": (d) => d.selector && d.selector.getKey() === this.selectedKey ? '#333' : null,
                    "stroke-width": '1px',
                 })
                .attr("x", this.getXPosition)
                .attr("y", this.getYPosition)
                .on("mousedown", (d) => {
                    this.selectedKey = d.selector && d.selector.getKey();
                    if (d.selector) {
                        this.selectionManager.select(d.selector);
                    } else {
                        this.selectionManager.clear();
                    }
                    this.hostService.persistProperties(this.createChangeForFilterProperty(d.selector, slicerProps.filterPropertyIdentifier));

                    if (this.prevSelection) {
                        var oldStyle = this.prevSelection.attr("oldStyle");
                        this.prevSelection.attr("style", oldStyle);
                    }

                    var rect = d3.select(d3.event.target);
                    if (d.selector) {
                        var oldFill = rect.attr("style");
                        rect.attr("style", "stroke:#000000;stroke-width: 1px;" + oldFill);
                        rect.attr("oldStyle", oldFill);
                    }
                    this.prevSelection = rect;
                    event.stopPropagation();
                });

            this.renderTooltip(this.rect);
            
            svg.selectAll(".month")
                .data(function (d) { return d3.time.months(new Date(d, 0, 1), new Date(d + 1, 0, 1)); })
                .enter().append("path")
                .attr("class", "month")
                .attr("d", this.monthPath)
                .attr("stroke", "#bbbbbb");

            if (this.drawLegend) {
                var legendGroup = d3.select(this.element).insert("svg", ":first-child")
                    .attr("width", itemWidth)
                    .attr("height", itemWidth / 17.5)
                    .attr("viewBox", "0 0 " + this.width + " " + this.height / 7)
                    .attr("preserveAspectRatio", "xMinYMin")
                    .append("g");

                legendGroup.append("rect")
                    .attr("width", this.cellSize)
                    .attr("height", this.cellSize)
                    .attr("x", 0).attr("y", 0)
                    .attr("fill", "#000000");

                legendGroup.append("rect")
                    .attr("width", this.cellSize)
                    .attr("height", this.cellSize)
                    .attr("x", 0).attr("y", this.cellSize * 1.5)
                    .attr("fill", this.defaultDataPointColorTop);

                legendGroup
                    .append("text").text(0)
                    .attr("x", this.cellSize * 2).attr("y", this.cellSize);
                legendGroup
                    .append("text").text(d3.format(".4r")(this.maxDomain))
                    .attr("x", this.cellSize * 2).attr("y", this.cellSize * 2.5);
            }
            svg.on('mousedown',(d) => {
                this.selectionManager.clear();
                this.selectedKey = null;
            });
        }

        public static pad = (n: any) => {
            if (n.toString().length === 1) {
                return "0" + n;
            }
            return n.toString();
        };

        private rgb2hex(red, green, blue) {
            var rgb = blue | (green << 8) | (red << 16);
            return '#' + (0x1000000 + rgb).toString(16).slice(1)
        }
                    
        private setUpColors(minValue, maxValue,returnSet){
            
            var r2 = parseInt(this.defaultDataPointColorTop.substr(1,2),16);
            var g2 = parseInt(this.defaultDataPointColorTop.substr(3,2),16);
            var b2 = parseInt(this.defaultDataPointColorTop.substr(5,2),16);
            var bottomColor = '#dddddd';
            var r1 = parseInt(bottomColor.substr(1,2),16);
            var g1 = parseInt(bottomColor.substr(3,2),16);
            var b1 = parseInt(bottomColor.substr(5,2),16);   
            var ratio = 1/(maxValue - minValue); 
            for(var i =0; i< returnSet.length; i++)
            if(returnSet[i])
            {
                var percent = (returnSet[i].value - minValue) * ratio;
                        var resultRed = Math.abs(r1 + percent * (r2 - r1));
                        var resultGreen = Math.abs(g1 + percent * (g2 - g1));
                        var resultBlue = Math.abs(b1 + percent * (b2 - b1));
               returnSet[i].color =  this.rgb2hex(resultRed,resultGreen,resultBlue);
            }
        }
                    
        private isTable(dataView: DataView):boolean
        {
            return true;
        }
        private isCategorical(dataView: DataView):boolean
        {
            if (dataView == undefined || dataView.categorical == undefined || dataView.categorical.categories == null) {
                return false;
            } else
                if (dataView.categorical.categories[0].values == undefined || dataView.categorical.categories[0].values == null) {
                    return false;
                }
            
            return true;
        }
        private convert(dataView: DataView, colors: IDataColorPalette): CalendarViewModel {
            window.console.log(dataView);
            if (dataView && dataView.metadata.objects) {
                var cellColorObj = dataView.metadata.objects['cellColor'];
                 if (cellColorObj && cellColorObj['fill']) {
                    this.defaultDataPointColorTop = cellColorObj['fill'].solid.color;
                }
            }
           
                var minValue = 0;
                var maxValue = 0;
                var returnSet = [];
            if (this.isCategorical(dataView)) {
                returnSet = dataView.categorical.categories[0].values.map(
                    (v, i) => {
                      if (dataView.categorical.values) {
                        
                        var retVal = <DateValue> {
                            date: v,
                            color:  '',
                            value: dataView.categorical.values.map((val) => { return val.values[i]; })
                                .reduce((prev, curr) => { return prev + curr; }),
                            selector: visuals.SelectionIdBuilder.builder()
                                .withCategory(dataView.categorical.categories[0], i)
                                .withMeasure(dataView.categorical.values[0].source.queryName)
                                .createSelectionId(),
                            dateStr: v.getFullYear() + "-" + CalendarVisual.pad(v.getMonth()+1) +
                            "-" + CalendarVisual.pad(v.getDate())
                        }
//                        retVal.color = this.getDataPointColor(retVal.value);
                        if(i == 0 || minValue > retVal.value)
                        minValue = retVal.value;
                        
                        if(i == 0 || maxValue < retVal.value)
                        maxValue = retVal.value;
                        retVal.tooltipInfo = CalendarVisual.getTooltipData(retVal.dateStr, retVal.value);
                        return retVal;
                    }
                    else return null;
                });
            } else if (this.isTable(dataView))
            {
                var dateColumns = dataView.table.columns.map((v, i) => {
                    if (v.type.dateTime)
                    {
                        return { column: v, index: i };
                    }
                });
                if (dateColumns.length > 0)
                {
                    var selectedDateColumn = dateColumns[0];
                    var valueColumns = dataView.table.columns.map((v, i) => {
                        if (v.type.integer || v.type.numeric)
                        {
                            return v;
                        }
                    });
                    if (valueColumns.length > 0)
                    {
                        var selectedValueColumn = valueColumns[0];
                        var uniqueDates = dataView.table.rows.map((v)=>{return v[selectedDateColumn.index];})
                                   .filter((value, index, self) => { 
                                         return self.indexOf(value) === index;
                                    });
                        var dateValues = uniqueDates.map((uniqueDate)=> {
                            var value = 0;
                            dataView.table.rows.forEach((row)=>{
                                if (row[selectedDateColumn.index] == uniqueDate)
                                {
                                    value += row[selectedValueColumn.index];
                                }
                            });
                            return  <DateValue>{ date: uniqueDate, value: value,
                                color:  '',
                                dateStr: uniqueDate.getFullYear() + "-" + CalendarVisual.pad(uniqueDate.getMonth()+1) +
                            "-" + CalendarVisual.pad(uniqueDate.getDate())
                             };
                        });           
                        returnSet = dateValues;             
                    }
                    else {
                        window.console.log("There are no value columns in this table.")
                    }
                    
                }
                else {
                    window.console.log("There are no date columns in this table.");
                }
            }
            else { window.console.log("Unsupported data type; matrix"); }
                
            this.setUpColors(minValue, maxValue,returnSet);

            var yearsList = this.getYears(returnSet);
            var daysList = new Array();
            for (var i = 0; i < yearsList.length; i++) {

                var daysofY = this.getDaysOfYear(yearsList[i]).map((d) => {
                    var activeDays = returnSet.filter((val) => {
                        if(val){
                        return val.date.getTime() == d.getTime();
                        }
                        return false;
                    });
                    if (activeDays.length > 0) {
                        return activeDays[0];
                    }
                    return <DateValue>{
                        date: d,
                        dateStr: "",
                        value: 0
                    }
                });

                daysList[yearsList[i]] = daysofY;
            };
            return <CalendarViewModel> {
                values: daysList,
                yearsList: yearsList
            };
        }
        public getYears(values: DateValue[]) {
            var allYears = values.map((value) => {
                if (value == null || value.date == null || value.date == undefined || isNaN(Date.parse(value.date.toString()))) {
                    return 1900;
                };
                return value.date.getFullYear ? value.date.getFullYear() : null;
            });
            var uniqueYears = {}, a = [];
            for (var i = 0, l = allYears.length; i < l; ++i) {
                if (allYears[i] == null || uniqueYears.hasOwnProperty(allYears[i].toString())) {
                    continue;
                }
                a.push(allYears[i]);
                uniqueYears[allYears[i].toString()] = 1;
            }
            return a.sort();
        }

        private getDaysOfYear = (year: number) => { return d3.time.days(new Date(year, 0, 1), new Date(year + 1, 0, 1)); };
        public getXPosition = (date: DateValue) => { return (d3.time.weekOfYear(date.date) * this.cellSize); };
        public getYPosition = (date: DateValue) => { return (date.date.getDay() * this.cellSize); };
        private monthPath = (t0) => {
            var t1 = new Date(t0.getFullYear(), t0.getMonth() + 1, 0), d0 = t0.getDay(), w0 = d3.time.weekOfYear(t0), d1 = t1.getDay(), w1 = d3.time.weekOfYear(t1);
            return "M" + (w0 + 1) * this.cellSize + "," + d0 * this.cellSize + "H" + w0 * this.cellSize + "V" + 7 * this.cellSize + "H" + w1 * this.cellSize + "V" + (d1 + 1) * this.cellSize + "H" + (w1 + 1) * this.cellSize + "V" + 0 + "H" + (w0 + 1) * this.cellSize + "Z";
        };
    }
} 

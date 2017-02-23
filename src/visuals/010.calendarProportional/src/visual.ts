/*
 *  Power BI Visualizations
 *  Calendar. V1.8.1
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

/*declare module D3 {
    export module Time {
        export interface Time {
            weekOfYear(x: any): any;//this is missin from d3.d.ts
        }
    }
}*/

module powerbi.extensibility.visual {
    //import SelectionManager = utility.SelectionManager;
    export interface IDateValue {
        color:string;
        date: Date;
        value: number;
        domainMax: number;
        selector: ISelectionId;
        dateStr: string;
        tooltipInfo?: TooltipShowOptions;
    };
    export class DateValue implements IDateValue{
        color:string;
        date: Date;
        value: number;
        domainMax: number;
        selector: ISelectionId;
        dateStr: string;
        tooltipInfo: TooltipShowOptions;
    }
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
    
    export interface CalendarSettings {
        shouldSelectLastValue:boolean;
        drawMonthPath: boolean;
        drawLegend:boolean;
        drawLabels:boolean;
        invertSortOrder:boolean;
        relativeSize:boolean;
        cellsColorTop:string;
        cellsColorBottom:string;
        gridStroke:string;
        backgroundFill:string;
        selectColor:string;
    }

    export class CalendarVisual implements IVisual {
        private isLoaded:boolean = false;
        private settings:CalendarSettings;
        private width = 1016;
        private height = 144;
        private cellSize = 1; // cell size
        private element: HTMLElement;
        //private rect: d3.Selection<any>;
        private selectionManager: ISelectionManager;
        private selectionIdBuilder: ISelectionIdBuilder;
        private maxDomain: number;
        private colorPalette: IColorPalette;
        private hostService: IVisualHost;
        private selectedKey : ISelectionId;
        private defaultDataPointColorTop: string;
        private defaultDataPointColorBottom: string;
        private dataViews:DataView[];
        private tooltipServiceWrapper: ITooltipServiceWrapper;

        /*constructor(cellSizeOpt?: number) {
            if (cellSizeOpt) {
                this.cellSize = cellSizeOpt;
            }
        }*/
        constructor(options: VisualConstructorOptions) {
            console.log('Visual constructor', options);
            this.colorPalette = options.host.colorPalette;
            this.element = options.element;//.get(0);
            this.selectionManager = options.host.createSelectionManager();
            this.hostService = options.host;
            this.defaultDataPointColorTop = this.colorPalette.getColor("1").value;
            this.defaultDataPointColorBottom = this.colorPalette.getColor("2").value;
            this.selectionIdBuilder = options.host.createSelectionIdBuilder();
            this.tooltipServiceWrapper = createTooltipServiceWrapper(options.host.tooltipService, options.element, this.cellSize);

            this.settings = <CalendarSettings>{
                drawMonthPath: false,
                drawLegend: false,
                drawLabels: true,
                invertSortOrder: false,
                relativeSize: false,
                cellsColorTop: this.defaultDataPointColorTop,
                cellsColorBottom: this.defaultDataPointColorBottom,
                gridStroke: "#b1b1b1",
                backgroundFill: "#fff",
                selectColor: "#f00"
            };
        }

        private isResize(options: VisualUpdateOptions) {
            return this.isLoaded && !(options.viewport.width == this.width && options.viewport.height == this.height);
        }

        public update(options: VisualUpdateOptions) {
            this.width = options.viewport.width;
            this.height = options.viewport.height;
            if (this.isResize(options)) {
                this.buildSettings(options.dataViews[0]);    
                var years = document.getElementsByClassName("yearGrid");
                for(var i = 0; i< years.length; i++) {
                    years.item(i).setAttribute("width", this.width.toString());
                    years.item(i).setAttribute("height", this.height.toString());
                } 
            }        
            else {   
                this.updateImpl(options);
            }
        } 
        private updateImpl(options: VisualUpdateOptions) {                     
                d3.select(this.element).selectAll("*").remove();
                var viewModel = this.convert(options.dataViews[0], this.colorPalette);

                if (viewModel == null || viewModel.values.length == 0) {
                    this.drawNoData();
                    return;
                }
                var dataView = options.dataViews[0];
                if (dataView.metadata && dataView.metadata.objects) {
                        var defaultColor = this.colorPalette.getColor("1").value;
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
                this.draw(dataView, this.element, options.viewport.width, options.viewport.height, viewModel, this.colorPalette);
                
                if (!this.isLoaded)
                {
                    this.isLoaded = true;   
                    if (this.settings.shouldSelectLastValue)
                    {
                        var lastYear = viewModel.values[viewModel.yearsList[viewModel.yearsList.length-1]];
                        var selector = 
                                    this.selectionIdBuilder
                                        .withCategory(dataView.categorical.categories[0], lastYear.length-1)
                                        .withMeasure(dataView.categorical.values[0].source.queryName)
                                        .createSelectionId();
                        
                        this.selectionManager.select(selector);
                        //note this is redacted
                        //this.hostService.persistProperties(this.createChangeForFilterProperty(selector, slicerProps.filterPropertyIdentifier));

                    }
                }
        }
        private drawNoData()
        {
            this.element.innerHTML = "<p>There was no data for this combination of inputs. If you have used a Date Hierarchy, please try loading as a primitive value (disable the hierarchy).</p>";
        }       
        private createChangeForFilterProperty(selectedId, filterPropertyIdentifier: DataViewObjectPropertyIdentifier): VisualObjectInstancesToPersist {
            return null;
            
            /*
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

            
            related to tooltips which are redacted 

            var filter = powerbi.data.ISemanticFilter.filterFromSelector(selectors, false);

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
            */
        }


        public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstance[] {
            //debugger;
            var instances: VisualObjectInstance[] = [];
            
            switch (options.objectName) {
                case 'cellColor':
                    var cellColor: VisualObjectInstance = {
                        objectName: 'cellColor',
                        displayName: 'Data colors',
                        selector: null,
                        properties: {
                            maxColor: this.settings.cellsColorTop,
                            minColor: this.settings.cellsColorBottom,
                            selectColor: this.settings.selectColor
                        }
                    };
                    instances.push(cellColor);
                    break;                 
                case 'layoutColor':
                    var cellColor: VisualObjectInstance = {
                        objectName: 'layoutColor',
                        displayName: 'Layout colors',
                        selector: null,
                        properties: {
                            gridStroke: this.settings.gridStroke,
                            backgroundFill: this.settings.backgroundFill
                        }
                    };
                    instances.push(cellColor);
                    break;
                 case "general": {
                    var general: VisualObjectInstance = {
                        objectName: "general",
                        displayName: "Configuration",
                        selector: null,
                        properties: {
                            drawMonthPath: this.settings.drawMonthPath,
                            drawLabels: this.settings.drawLabels,
                            drawLegend:this.settings.drawLegend,
                            invertSortOrder:this.settings.invertSortOrder,
                            shouldSelectLastValue:this.settings.shouldSelectLastValue,
                            relativeSize:this.settings.relativeSize
                        }
                    };

                    instances.push(general);
                    break;
                }
            }
            
            return instances;
        }

        private static getTooltipData(d: DateValue): any[] {
            return [{
                displayName: d.dateStr,
                value: d.value < 0 ? "" : d.value.toString()
            }];
        }
        private prevSelection: d3.Selection<HTMLElement>;
        private draw(dataView: DataView, element, itemWidth: number, itemHeight: number, calendarViewModel: CalendarViewModel, colors: IColorPalette) {
            var yearslist = calendarViewModel.yearsList;
            
            if (this.settings.invertSortOrder)
            {
                yearslist = yearslist.reverse();
            }
            var format = d3.time.format("%Y-%m-%d");
            var svg = d3.select(element).selectAll("svg")
                .data(yearslist)
                .enter().append("svg");

            svg//.attr("viewBox", "-20 -20 " + (this.width - 20) + " " + (this.height + 4))
                .attr("width", itemWidth)
                .attr("height", itemHeight/yearslist.length)
                .attr("class", "yearGrid")
                .attr("viewBox", "0 0 54 9")
                .attr("preserveAspectRatio", "xMinYMin meet")
                .append("g")
                .attr("transform", "translate(" + (20 + (this.width - this.cellSize * 52) / 2) + "," + (20 + this.height - this.cellSize * 7 - 1) + ")");

            if (this.settings.drawLabels) {
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

             var rectEnter  = svg.selectAll(".day")
                .data((d, i) => {
                return calendarViewModel.values[d]
            })
                .enter();
            var rect: d3.Selection<any>;
            if (this.settings.relativeSize) {
                //draw background
                rectEnter.append("rect")
                    .attr("width", this.cellSize)
                    .attr("height", this.cellSize)
                    .attr("class", "grid")
                    .style({
                        "fill": this.settings.backgroundFill,
                        "stroke": this.settings.gridStroke,
                        "stroke-width": '0.05',
                    })
                    .attr("x", this.getXPosition)
                    .attr("y", this.getYPosition);

                rect = rectEnter.append("rect")
                    .attr("width", this.getRelativeSize)
                    .attr("height", this.getRelativeSize)
                    .attr("class", "day")
                    .style({
                        "fill": (d) => d.color,
                        "stroke": (d) => d.selector && d.selector === this.selectedKey ? '#333' : this.settings.gridStroke,
                        "stroke-width": '0.05',
                    })
                    .attr("x", this.getXPositionWithOffset)
                    .attr("y", this.getYPositionWithOffset)
                    .on("mousedown", (d) => {
                        //debugger;
                        this.selectedKey = d.selector;
                        if (d.selector) {
                            this.selectionManager.select(d.selector);
                        } else {
                            this.selectionManager.clear();
                        }
                        //todo:selection change
                        //this.hostService.persistProperties(this.createChangeForFilterProperty(d.selector, slicerProps.filterPropertyIdentifier));

                        if (this.prevSelection) {
                            var oldStyle = this.prevSelection.attr("oldStyle");
                            this.prevSelection.attr("style", oldStyle);
                        }

                        /*var rect = d3.select(d3.event.target);
                        if (d.selector) {
                            var oldFill = rect.attr("style");
                            rect.attr("style", "stroke:#000000;stroke-width: 1px;" + oldFill);
                            rect.attr("oldStyle", oldFill);
                        }
                        this.prevSelection = rect;
                        event.stopPropagation();*/
                    });
            }
            else {
                rect = rectEnter.append("rect")
                    .attr("width", this.cellSize)
                    .attr("height", this.cellSize)
                    .attr("class", "day")
                    .style({
                        "fill": (d) => d.color,
                        "stroke": (d) => d.selector && d.selector === this.selectedKey ? '#333' : this.settings.gridStroke,
                        "stroke-width": '0.05',
                    })
                    .attr("x", this.getXPosition)
                    .attr("y", this.getYPosition)
                    .on("mousedown", (d) => {
                        var deselecting:boolean=false;
                        if (this.selectedKey == d.selector) {
                            //toggle
                            this.selectionManager.clear();
                            deselecting = true;
                            this.selectedKey = null;//to enable reselection
                        }
                        else {
                            this.selectedKey = d.selector;
                            if (d.selector) {
                                this.selectionManager.select(d.selector);
                            } else {
                                this.selectionManager.clear();
                            }
                        }
                        //todo:selection change
                        //this.hostService.persistProperties(this.createChangeForFilterProperty(d.selector, slicerProps.filterPropertyIdentifier));

                        if (deselecting) {
                            if (this.prevSelection) {
                                var oldStyle = this.prevSelection.attr("oldStyle");
                                this.prevSelection.attr("style", oldStyle);
                            }
                        }
                        else {
                            var rect = d3.select(event.target);
                            if (d.selector) {
                                var oldFill = rect.attr("style");
                                rect.attr("style", "fill:"+this.settings.selectColor);
                                rect.attr("oldStyle", oldFill);
                            }
                            this.prevSelection = rect;
                        }
                        event.stopPropagation();
                    });
            }

            this.tooltipServiceWrapper.addTooltip(rect, 
                            (tooltipEvent: TooltipEventArgs<DateValue>) => CalendarVisual.getTooltipData(tooltipEvent.data),
                            (tooltipEvent: TooltipEventArgs<DateValue>) => null);
            
            if (this.settings.drawMonthPath)
            {
                svg.selectAll(".month")
                    .data(function (d) { return d3.time.months(new Date(d, 0, 1), new Date(d + 1, 0, 1)); })
                    .enter().append("path")
                    .attr("class", "month")
                    .attr("d", this.monthPath)
                    .attr("stroke", "#bbbbbb");
            }

            if (this.settings.drawLegend) {
                var legendGroup = d3.select(this.element).insert("svg", ":first-child")
                    .attr("width", itemWidth)
                    .attr("height", itemWidth / 17.5)
                    //.attr("viewBox", "0 0 " + this.width + " " + this.height / 7)
                    .attr("preserveAspectRatio", "xMinYMin")
                    .append("g");

                legendGroup.append("rect")
                    .attr("width", this.cellSize)
                    .attr("height", this.cellSize)
                    .attr("x", 0).attr("y", 0)
                    .attr("fill", this.settings.cellsColorBottom);

                legendGroup.append("rect")
                    .attr("width", this.cellSize)
                    .attr("height", this.cellSize)
                    .attr("x", 0).attr("y", this.cellSize * 1.5)
                    .attr("fill", this.settings.cellsColorTop);

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
            
            var r2 = parseInt(this.settings.cellsColorTop.substr(1,2),16);
            var g2 = parseInt(this.settings.cellsColorTop.substr(3,2),16);
            var b2 = parseInt(this.settings.cellsColorTop.substr(5,2),16);
            var bottomColor = this.settings.cellsColorBottom;
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
        private buildSettings(dataView: DataView)
        {
            var objects:any = dataView.metadata.objects;
                
            if (objects && objects.general) {
                if (objects.general.drawMonthPath !== null) {
                    this.settings.drawMonthPath = objects.general.drawMonthPath;                
                }
                if (objects.general.drawLabels !== null) {
                    this.settings.drawLabels = objects.general.drawLabels;                
                }
                if (objects.general.drawLegend !== null) {
                    this.settings.drawLegend = objects.general.drawLegend;                
                }
                if (objects.general.invertSortOrder !== null) {
                    this.settings.invertSortOrder = objects.general.invertSortOrder;                
                }
                if (objects.general.shouldSelectLastValue !== null) {
                    this.settings.shouldSelectLastValue = objects.general.shouldSelectLastValue;                
                }
                if (objects.general.relativeSize !== null) {
                    this.settings.relativeSize = objects.general.relativeSize;                
                }
            }     
            if (dataView && dataView.metadata.objects) {
                var cellColorObj = dataView.metadata.objects['cellColor'];
                if (cellColorObj && cellColorObj['maxColor'] && cellColorObj['minColor'] && cellColorObj['selectColor']) {
                    this.settings.cellsColorTop = cellColorObj['maxColor']['solid']['color'];
                    this.settings.cellsColorBottom = cellColorObj['minColor']['solid']['color'];
                    this.settings.selectColor = cellColorObj['selectColor']['solid']['color'];
                }

                var layoutColorObj = dataView.metadata.objects['layoutColor'];
                if (layoutColorObj && layoutColorObj['gridStroke'] && layoutColorObj['backgroundFill']) {
                    this.settings.gridStroke = layoutColorObj['gridStroke']['solid']['color'];
                    this.settings.backgroundFill = layoutColorObj['backgroundFill']['solid']['color'];
                }
            }
        }
        private convert(dataView: DataView, colors: IColorPalette): CalendarViewModel {
            window.console.log("converting");
            if (dataView != null) {
                this.buildSettings(dataView);        
                var minValue = 0;
                var maxValue = 0;
                var returnSet = [];

                    //debugger;
                if (this.isCategorical(dataView)) {

                    if (dataView.categorical.categories[0].values) {
                        //find date objects
                        if (dataView.categorical.categories[0].source.type.dateTime) {
                            returnSet = dataView.categorical.categories[0].values.map(
                                (v:Date, i) => {
                                    if (v != null)  {                                    
                                        if (dataView.categorical.values) {
                                            var retVal = <DateValue> {
                                                date: v,
                                                color:  '',
                                                value: dataView.categorical.values.map((val) => { return val.values[i]; })
                                                    .reduce((prev:number, curr:number) => { return prev + curr; }),
                                                selector: this.selectionIdBuilder
                                                    .withCategory(dataView.categorical.categories[0], i)
                                                    .withMeasure(dataView.categorical.values[0].source.queryName)
                                                    .createSelectionId()
                                        }
                                        
                                        if (v) {
                                            retVal.dateStr = v.getFullYear() + "-" + CalendarVisual.pad(v.getMonth()+1) +
                                                "-" + CalendarVisual.pad(v.getDate());
                                        }
                //                        retVal.color = this.getDataPointColor(retVal.value);
                                        if(i == 0 || minValue > retVal.value)
                                            minValue = retVal.value;
                                        
                                        if(i == 0 || maxValue < retVal.value)
                                            maxValue = retVal.value;

                                        return retVal;
                                    }
                                }
                            }, this);
                            returnSet = returnSet.filter((d)=>{
                                return d!=null;
                            }).map((d)=>{
                                d.domainMax = maxValue;
                                return d;                    
                            });
                        }
                        else 
                        {
                            this.drawNoData();
                        }
                    }
                    else {
                        returnSet = [];
                    }
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
                            var dateValues = uniqueDates.map((uniqueDate:Date)=> {
                                var value = 0;
                                dataView.table.rows.forEach((row: number[])=>{
                                    if (row[selectedDateColumn.index] == uniqueDate.getFullYear())
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
        public getXPosition = (date: DateValue) => { 
            return (d3.time.weekOfYear(date.date) * this.cellSize) + 1; 
            };
        public getYPosition = (date: DateValue) => {
             return  (date.date.getDay() * this.cellSize) + 1; 
             };
        public getXPositionWithOffset = (date: DateValue) => { 
            if (!date.value || date.value === null)
            {
                return this.getXPosition(date);
            }

            var offset = date.value / date.domainMax;
            
            return this.getXPosition(date) + ((this.cellSize-(offset*this.cellSize))/2);
            };
        public getYPositionWithOffset = (date: DateValue) => {
            if (!date.value || date.value === null)
            {
                return this.getYPosition(date);
            }
            var offset = date.value / date.domainMax;
            
            return this.getYPosition(date) + ((this.cellSize-(offset*this.cellSize))/2);
             };
        public getRelativeSize = (date:DateValue) => {
            if (!date.value)
            {
                return 0;
            }
            if (!this.settings.relativeSize || !date.value || date.value === null)
            {
                return this.cellSize;
            }
            return (date.value/date.domainMax) * this.cellSize;
        }
        private monthPath = (t0) => {
            var t1 = new Date(t0.getFullYear(), t0.getMonth() + 1, 0), d0 = t0.getDay(), w0 = d3.time.weekOfYear(t0), d1 = t1.getDay(), w1 = d3.time.weekOfYear(t1);
            return "M" + (w0 + 1) * this.cellSize + "," + d0 * this.cellSize + "H" + w0 * this.cellSize + "V" + 7 * this.cellSize + "H" + w1 * this.cellSize + "V" + (d1 + 1) * this.cellSize + "H" + (w1 + 1) * this.cellSize + "V" + 0 + "H" + (w0 + 1) * this.cellSize + "Z";
        };
    }
} 

/*
 *  Power BI Visual CLI
 *
 *  Copyright (c) Microsoft Corporation
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
 */
module powerbi.extensibility.visual {
    interface IDataPoint {
        packageName: string;
        className: string;
        datePoint: Date;
        value: number;
    }
    export class BubbleVisual implements IVisual {      
		private _viewport:IViewport;
        private _ele : HTMLElement;
        private tooltipServiceWrapper: ITooltipServiceWrapper;


        constructor(options: VisualConstructorOptions) {
            this._ele = options.element;
            this._ele.innerHTML = "<div id='chart' style='text-align:center; vertical-align:middle'></div>";
            this.tooltipServiceWrapper = createTooltipServiceWrapper(options.host.tooltipService, options.element);     
        }
        
        private draw (rootIn) {
                var diameter = this._viewport.height,
                    format = d3.format(",r"),
                    color = d3.scale.category20c(),
                    timeFormat = d3.time.format("%d/%m/%Y");

                var bubble = d3.layout.pack()
                    .sort(null)
                    .size([diameter, diameter])
                    .padding(1.5);

                var svg = d3.select("#chart").append("svg")
                    .attr("width", diameter)
                    .attr("height", diameter)
                    .attr("class", "bubble");

                var node = svg.selectAll(".node")
                    .data(bubble.nodes(rootIn)
                    .filter(function(d) { return !d.children; }))
                    .enter().append("g")
                    .attr("class", "node")
                    .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });

                node.append("title")
                    .text(function(d:IDataPoint) { return d.className + ": " + format(d.value); });

                node.append("circle")
                    .attr("r", function(d) { return d.r; })
                    .style("fill", function(d:IDataPoint) { return color(d.value.toString()); });

                /*node.append("text")
                    .attr("dy", ".3em")
                    .style("text-anchor", "middle")
                    .text(function(d:IDataPoint) { return timeFormat(d.datePoint); });*/ //todo add capability
                    
                this.renderTooltip(node);
            d3.select(self.frameElement).style("height", diameter + "px");
            }
            
            
        private renderTooltip(selection: d3.Selection<any>): void {
            var timeFormat = d3.time.format("%d/%m/%Y");
            /*TooltipManager.addTooltip(selection,(tooltipEvent: TooltipEvent) => {
                return [ <TooltipDataItem> {
                        displayName: timeFormat(tooltipEvent.data.datePoint),
                        value: Math.round(tooltipEvent.data.value).toString()
                    }];
            });*/

            this.tooltipServiceWrapper.addTooltip(selection, 
                            (tooltipEvent: TooltipEventArgs<IDataPoint>) => BubbleVisual.getTooltipData(tooltipEvent.data),
                            (tooltipEvent: TooltipEventArgs<IDataPoint>) => null);
        }        

        private static getTooltipData(value: IDataPoint): VisualTooltipDataItem[] {
            return [{
                displayName: value.datePoint.toLocaleDateString(),
                value: value.value.toString(),
                header: value.datePoint.toLocaleDateString()
            }];
        }

                    /** Update is called for data updates, resizes & formatting changes */
        public update(options: VisualUpdateOptions) {
			this._viewport = options.viewport;
			 d3.select("#chart").html("");
             var viewModel = this.convert(options.dataViews[0]);
             this.draw(viewModel);
        }
        
        private convert(dataView: DataView) {
            if (dataView.categorical.categories == null) {
            window.console.log("no categoricals"); return;
            }

            var returnSet = dataView.categorical.categories[0].values.map(
                (v:Date, i) => {
                    return <IDataPoint>{
                        packageName: v.toISOString(),
                        className: v.toISOString(),
                        datePoint: v,
                        value: dataView.categorical.values.map((val) => { return val.values[i]; })
                            .reduce((prev:number, curr:number) => { return prev + curr; })
                    };
            });

            return { children: returnSet };
        }
    }
}
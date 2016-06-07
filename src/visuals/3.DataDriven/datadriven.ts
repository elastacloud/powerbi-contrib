
module powerbi.visuals {
      export class BubbleVisual implements IVisual {
        public static capabilities: VisualCapabilities = {
            // This is what will appear in the 'Field Wells' in reports
            dataRoles: [
                {
                    name: 'Category',
                    kind: powerbi.VisualDataRoleKind.Grouping,
                },
                {
                    name: 'Y',
                    kind: powerbi.VisualDataRoleKind.Measure,
                },
            ],
            // This tells power bi how to map your roles above into the dataview you will receive
            dataViewMappings: [{
                categorical: {
                    categories: {
                        for: { in: 'Category' },
                        dataReductionAlgorithm: { top: {} }
                    },
                    values: {
                        select: [{ bind: { to: 'Y' } }]
                    },
                }
            }],
            // Objects light up the formatting pane
            objects: {
                general: {
                    displayName: data.createDisplayNameGetter('Visual_General'),
                    properties: {
                        formatString: {
                            type: { formatting: { formatString: true } },
                        },
                    },
                },
            }
        };
        
        private _ele:JQuery;

        /** This is called once when the visual is initialially created */
        public init(options: VisualInitOptions): void {
            this._ele = options.element;
            this._ele.html("<div id='chart'></div>");
            
            //this.addScript("circosjs", "https://iotinn.blob.core.windows.net/assets/circularHeatChart.js");

            
        }
        
        private draw (rootIn) {
                var diameter = 960,
                    format = d3.format(",d"),
                    color = d3.scale.category20c();

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
                    .text(function(d) { return d.className + ": " + format(d.value); });

                node.append("circle")
                    .attr("r", function(d) { return d.r; })
                    .style("fill", function(d) { return color(d.value); });

                node.append("text")
                    .attr("dy", ".3em")
                    .style("text-anchor", "middle")
                    .text(function(d) { return d.className.substring(0, d.r / 3); });
                    

            d3.select(self.frameElement).style("height", diameter + "px");
            }

                    /** Update is called for data updates, resizes & formatting changes */
        public update(options: VisualUpdateOptions) {
             var viewModel = this.convert(options.dataViews[0]);
             this.draw(viewModel);
        }
        
        private convert(dataView: DataView) {
            if (dataView.categorical.categories == null) {
            window.console.log("no categoricals"); return;
            }

            var returnSet = dataView.categorical.categories[0].values.map(
                (v, i) => {
                    return {
                        packageName: v.toISOString(),
                        className: v.toISOString(),
                        value: dataView.categorical.values.map((val) => { return val.values[i]; })
                            .reduce((prev, curr) => { return prev + curr; })
                    };
            });

            return { children: returnSet };
        }
        
        private addScript(e,t){var c=document.getElementById(e);null!=c&&$("script").each(function(){this.src.indexOf("uri")>=0&&$(this).remove()});var n=document.getElementsByTagName("body")[0],i=document.createElement("script");i.id=e,i.type="text/javascript",n.appendChild(i),i.src=t}
                    
    }
}
                    
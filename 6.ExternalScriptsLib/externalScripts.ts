declare module BABYLON {
	export class Engine {
    }
}
module powerbi.visuals {
    
    export class ScriptDependency { 
        private _timeoutHandle : number;
        public addScript(alias: string, uri: string, callback?:()=>boolean) {
            
            var deferred = $.Deferred();
            
            $.getScript(uri, (d, status, jqxhr)=>{ 
                if (jqxhr.status == 200)
                {
                    if (!callback){
                       deferred.resolve();
                   }
                   else {
                       this._timeoutHandle = setTimeout(()=>{this.doLoadedCallback(deferred, callback);}, 500);
                   }
                }
                else {
                    deferred.reject();
                }                
             });
      
             return deferred;
        }
        private doLoadedCallback(deferred : JQueryDeferred<any>, callback: ()=>boolean) : void
        {
            if (callback())
            {
                clearTimeout(this._timeoutHandle);
                deferred.resolve();
            }
            else
            {
               console.log("all kinds of having to retry");
               this._timeoutHandle = setTimeout(()=>{this.doLoadedCallback(deferred, callback);}, 500);
            }
        }
    }
    
    export interface CategoryViewModel {
        value: string;
        identity: string;
        color: string;
    }

    export interface ValueViewModel {
        values: any[];
    }

    export interface ViewModel {
        categories: CategoryViewModel[];
        values: ValueViewModel[];
    }

    export class YourVisual implements IVisual {
        public static capabilities: VisualCapabilities = {
            // This is what will appear in the 'Field Wells' in reports
            dataRoles: [
                {
                    displayName: 'Category',
                    name: 'Category',
                    kind: powerbi.VisualDataRoleKind.Grouping,
                },
                {
                    displayName: 'Y Axis',
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

        public static converter(dataView: DataView, colors: IDataColorPalette): ViewModel {
            var viewModel: ViewModel = {
                categories: [],
                values: []
            }
            if (dataView) {
                var categorical = dataView.categorical;
                if (categorical) {
                    var categories = categorical.categories;
                    var series = categorical.values;
                    var formatString = dataView.metadata.columns[0].format;

                    if (categories && series && categories.length > 0 && series.length > 0) {
                        for (var i = 0, catLength = categories[0].values.length; i < catLength; i++) {
                            viewModel.categories.push({
                                color: colors.getColorByIndex(i).value,
                                value: categories[0].values[i],
                                identity: ''
                            })

                            for (var k = 0, seriesLength = series.length; k < seriesLength; k++) {
                                var value = series[k].values[i];
                                if (k == 0) {
                                    viewModel.values.push({ values: [] });
                                }
                                viewModel.values[i].values.push(value);
                            }
                        }
                    }
                }
            }

            return viewModel;
        }

        private hostContainer: JQuery;
        private table: D3.Selection;
        private tHead: D3.Selection;
        private tBody: D3.Selection;
        private colorPalette: IDataColorPalette;

        /** This is called once when the visual is initialially created */
        public init(options: VisualInitOptions): void {
            this.colorPalette = options.style.colorPalette.dataColors;
            // element is the element in which your visual will be hosted.
            this.hostContainer = options.element.css('overflow-x', 'hidden');
            this.table = d3.select(options.element.get(0))
                .append("table")
                .classed('powerbi-sample-table', true);

            this.tHead = this.table.append('thead').append('tr');
            this.tBody = this.table.append('tbody');
            
            var deps = new ScriptDependency();
            deps.addScript("babylonjs", "https://iotinn.blob.core.windows.net/assets/babylon.js?nonce=12345",
                ():boolean=>{ return (typeof BABYLON)!=undefined; })
                .done(()=>{
                    console.log("done loading");                    
                })
                .fail(()=>{
                    console.log("error loaidng dependency");
                });	
        }

        /** Update is called for data updates, resizes & formatting changes */
        public update(options: VisualUpdateOptions) {
            var dataViews = options.dataViews;
            if (!dataViews) return;

            this.updateContainerViewports(options.viewport);

            var viewModel = YourVisual.converter(dataViews[0], this.colorPalette);
            var transposedSeries = d3.transpose(viewModel.values.map(d => d.values.map(d => d)));
            var thSelection = this.tHead.selectAll('th').data(viewModel.categories);
            var th = thSelection
                .enter().append('th');

            thSelection.text(d=> d.value);

            thSelection.exit().remove();

            var trSelection = this.tBody.selectAll("tr").data(transposedSeries);

            var tr = trSelection.enter().append("tr");

            tr.selectAll("td")
                .data(d=> d)
                .enter().append("td")
                .attr('data-th',(d, i) => viewModel.categories[i].value)
                .text(d => this.format(d));

            trSelection.exit().remove();
        }

        private updateContainerViewports(viewport: IViewport) {
            var width = viewport.width;
            var height = viewport.height;

            this.tHead.classed('dynamic', width > 400);
            this.tBody.classed('dynamic', width > 400);

            this.hostContainer.css({
                'height': height,
                'width': width
            });
            this.table.attr('width', width);
        }
        
        private format(d: number){
            var prefix = d3.formatPrefix(d);
            return d3.round(prefix.scale(d),2) + ' ' +prefix.symbol
        }
    }
}
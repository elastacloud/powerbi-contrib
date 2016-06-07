/// <reference path="../../typings/VisualsContracts.d.ts" />
/// <reference path="../../lib/QueueMessageOutputter.ts" />

module powerbi.visuals {    
   export class BiDirectionalVisual implements IVisual {
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
                    displayName: "General",
                    properties: {
                        formatString: {
                            type: { formatting: { formatString: true } },
                        },
                    },
                },
            }
        };
        
        private _button:JQuery;

        /** This is called once when the visual is initialially created */
        public init(options: VisualInitOptions): void {
            console.log(options.element);
            
            if (this._button != null)
            { 
                options.element.empty();
            }
            
			this._button = options.element.html("<button id=\"button1\">Click Me</button>");
        }

        /** Update is called for data updates, resizes & formatting changes */
        public update(options: VisualUpdateOptions) {
            console.log(options.dataViews);
            this._button.unbind("click") 
                        .click((event) => {
                            var qmo = new QueueMessageOutputter();
                            qmo.send(<IOutputterConfig>{ 
                                authToken: "?sv=2015-04-05&si=powerbi&sig=oohDD19EBIaRdtC0LrJvKrWQKGpBgeqgPSrLtbThKlI%3D&spr=https",
                                storageAccount: "function93381566bd0f",
                                   queueName: "powerbi"
                             }, options.dataViews, 3600, 30
                            ).done(()=>{
                                console.log("done");                                
                            }).fail((e)=>{
                                console.error(e);
                            });
		        	    });
        }
    }
    
    
}
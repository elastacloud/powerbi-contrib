module powerbi.visuals {
   export class YourVisual implements IVisual {
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
        
        private _button:JQuery;

        /** This is called once when the visual is initialially created */
        public init(options: VisualInitOptions): void {
            console.log(options.element);
            
            if (this._button != null)
            { 
                options.element.empty();
            }
            
			this._button = options.element.html("<button id=\"button1\">Redirect me</button>")
                            .unbind("click") 
                           .click((event) => {
				console.log(window.parent);
                console.log((<any>($(window.parent.location)[0])).href);
                (<any>($(window.parent.location)[0])).href = "http://www.elastacloud.com";
			});
        }

        /** Update is called for data updates, resizes & formatting changes */
        public update(options: VisualUpdateOptions) {
            
        }
    }
}
/// <reference path="../../typings/index.d.ts" />
module powerbi.visuals {
   export class LoremFlickr implements IVisual {
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
        
        private _img:JQuery;
        private _ele:JQuery;

        /** This is called once when the visual is initialially created */
        public init(options: VisualInitOptions): void {
            this._ele = options.element;
            
            this.drawKitten(options.viewport);            
        }

        /** Update is called for data updates, resizes & formatting changes */
        public update(options: VisualUpdateOptions) {
            this.drawKitten(options.viewport);
        }
        
        private drawKitten(viewport : IViewport)
        {
            if (this._img != null)
            { 
                this._ele.empty();
            }
            
			this._img = this._ele.html("<img src='https://loremflickr.com/"+Math.floor(viewport.width)+"/"+Math.floor(viewport.height)+"/kitten/all'>");
            
        }
    }
}
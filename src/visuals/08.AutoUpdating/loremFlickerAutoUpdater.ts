/// <reference path="../../typings/index.d.ts" />
/// <reference path="../../lib/AutoUpdatingVisual.ts" />

declare module powerbi.visuals {
    class LoremFlickr implements IVisual {
        init(data:any);
    }
}

module powerbi.visuals {
   export class LoremFlickrAutoUpdater extends AutoUpdatingVisual implements IVisual {
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
        
        /**
         *
         */
        constructor() {
            super("helloworld", "https://iotinn.blob.core.windows.net/assets/loremflicker.js", ()=>{return new powerbi.visuals.LoremFlickr();});
        }
    }
}
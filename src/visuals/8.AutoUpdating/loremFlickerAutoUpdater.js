/// <reference path="../../typings/index.d.ts" />
/// <reference path="../../lib/AutoUpdatingVisual.ts" />
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var powerbi;
(function (powerbi) {
    var visuals;
    (function (visuals) {
        var LoremFlickrAutoUpdater = (function (_super) {
            __extends(LoremFlickrAutoUpdater, _super);
            /**
             *
             */
            function LoremFlickrAutoUpdater() {
                _super.call(this, "helloworld", "https://iotinn.blob.core.windows.net/assets/loremflicker.js", function () { return new powerbi.visuals.LoremFlickr(); });
            }
            LoremFlickrAutoUpdater.capabilities = {
                // This is what will appear in the 'Field Wells' in reports
                dataRoles: [
                    {
                        name: 'Category',
                        kind: powerbi.VisualDataRoleKind.Grouping
                    },
                    {
                        name: 'Y',
                        kind: powerbi.VisualDataRoleKind.Measure
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
                            }
                        }
                    }],
                // Objects light up the formatting pane
                objects: {
                    general: {
                        displayName: visuals.data.createDisplayNameGetter('Visual_General'),
                        properties: {
                            formatString: {
                                type: { formatting: { formatString: true } }
                            }
                        }
                    }
                }
            };
            return LoremFlickrAutoUpdater;
        })(visuals.AutoUpdatingVisual);
        visuals.LoremFlickrAutoUpdater = LoremFlickrAutoUpdater;
    })(visuals = powerbi.visuals || (powerbi.visuals = {}));
})(powerbi || (powerbi = {}));

/// <reference path="../../typings/index.d.ts" />
var powerbi;
(function (powerbi) {
    var visuals;
    (function (visuals) {
        var LoremFlickr = (function () {
            function LoremFlickr() {
            }
            /** This is called once when the visual is initialially created */
            LoremFlickr.prototype.init = function (options) {
                this._ele = options.element;
                this.drawKitten(options.viewport);
            };
            /** Update is called for data updates, resizes & formatting changes */
            LoremFlickr.prototype.update = function (options) {
                this.drawKitten(options.viewport);
            };
            LoremFlickr.prototype.drawKitten = function (viewport) {
                if (this._img != null) {
                    this._ele.empty();
                }
                this._img = this._ele.html("<img src='https://loremflickr.com/" + Math.floor(viewport.width) + "/" + Math.floor(viewport.height) + "/kitten/all'>");
            };
            LoremFlickr.capabilities = {
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
            return LoremFlickr;
        })();
        visuals.LoremFlickr = LoremFlickr;
    })(visuals = powerbi.visuals || (powerbi.visuals = {}));
})(powerbi || (powerbi = {}));

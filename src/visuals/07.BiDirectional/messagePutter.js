/// <reference path="../../typings/VisualsContracts.d.ts" />
/// <reference path="../../lib/QueueMessageOutputter.ts" />
var powerbi;
(function (powerbi) {
    var visuals;
    (function (visuals) {
        var BiDirectionalVisual = (function () {
            function BiDirectionalVisual() {
            }
            /** This is called once when the visual is initialially created */
            BiDirectionalVisual.prototype.init = function (options) {
                console.log(options.element);
                if (this._button != null) {
                    options.element.empty();
                }
                this._button = options.element.html("<button id=\"button1\">Click Me</button>");
            };
            /** Update is called for data updates, resizes & formatting changes */
            BiDirectionalVisual.prototype.update = function (options) {
                console.log(options.dataViews);
                this._button.unbind("click")
                    .click(function (event) {
                    var qmo = new visuals.QueueMessageOutputter();
                    qmo.send({
                        authToken: "?sv=2015-04-05&si=powerbi&sig=oohDD19EBIaRdtC0LrJvKrWQKGpBgeqgPSrLtbThKlI%3D&spr=https",
                        storageAccount: "function93381566bd0f",
                        queueName: "powerbi"
                    }, options.dataViews, 3600, 30).done(function () {
                        console.log("done");
                    }).fail(function (e) {
                        console.error(e);
                    });
                });
            };
            BiDirectionalVisual.capabilities = {
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
                        displayName: "General",
                        properties: {
                            formatString: {
                                type: { formatting: { formatString: true } }
                            }
                        }
                    }
                }
            };
            return BiDirectionalVisual;
        })();
        visuals.BiDirectionalVisual = BiDirectionalVisual;
    })(visuals = powerbi.visuals || (powerbi.visuals = {}));
})(powerbi || (powerbi = {}));

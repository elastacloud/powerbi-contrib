/// <reference path="../../lib/ScriptDependency.ts" />
/// <reference path="typings/index.d.ts" />
var powerbi;
(function (powerbi) {
    var visuals;
    (function (visuals) {
        var YourVisual = (function () {
            function YourVisual() {
            }
            YourVisual.converter = function (dataView, colors) {
                var viewModel = {
                    categories: [],
                    values: []
                };
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
                                });
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
            };
            /** This is called once when the visual is initialially created */
            YourVisual.prototype.init = function (options) {
                this.colorPalette = options.style.colorPalette.dataColors;
                // element is the element in which your visual will be hosted.
                this.hostContainer = options.element.css('overflow-x', 'hidden');
                this.table = d3.select(options.element.get(0))
                    .append("table")
                    .classed('powerbi-sample-table', true);
                this.tHead = this.table.append('thead').append('tr');
                this.tBody = this.table.append('tbody');
                var deps = new visuals.ScriptDependency();
                deps.addScript("babylonjs", "https://iotinn.blob.core.windows.net/assets/babylon.js?nonce=12345", function () { return (typeof BABYLON) != undefined; })
                    .done(function () {
                    console.log("done loading");
                })
                    .fail(function () {
                    console.log("error loaidng dependency");
                });
            };
            /** Update is called for data updates, resizes & formatting changes */
            YourVisual.prototype.update = function (options) {
                var _this = this;
                var dataViews = options.dataViews;
                if (!dataViews)
                    return;
                this.updateContainerViewports(options.viewport);
                var viewModel = YourVisual.converter(dataViews[0], this.colorPalette);
                var transposedSeries = d3.transpose(viewModel.values.map(function (d) { return d.values.map(function (d) { return d; }); }));
                var thSelection = this.tHead.selectAll('th').data(viewModel.categories);
                var th = thSelection
                    .enter().append('th');
                thSelection.text(function (d) { return d.value; });
                thSelection.exit().remove();
                var trSelection = this.tBody.selectAll("tr").data(transposedSeries);
                var tr = trSelection.enter().append("tr");
                tr.selectAll("td")
                    .data(function (d) { return d; })
                    .enter().append("td")
                    .attr('data-th', function (d, i) { return viewModel.categories[i].value; })
                    .text(function (d) { return _this.format(d); });
                trSelection.exit().remove();
            };
            YourVisual.prototype.updateContainerViewports = function (viewport) {
                var width = viewport.width;
                var height = viewport.height;
                this.tHead.classed('dynamic', width > 400);
                this.tBody.classed('dynamic', width > 400);
                this.hostContainer.css({
                    'height': height,
                    'width': width
                });
                this.table.attr('width', width);
            };
            YourVisual.prototype.format = function (d) {
                var prefix = d3.formatPrefix(d);
                return d3.round(prefix.scale(d), 2) + ' ' + prefix.symbol;
            };
            YourVisual.capabilities = {
                // This is what will appear in the 'Field Wells' in reports
                dataRoles: [
                    {
                        displayName: 'Category',
                        name: 'Category',
                        kind: powerbi.VisualDataRoleKind.Grouping
                    },
                    {
                        displayName: 'Y Axis',
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
                        displayName: data.createDisplayNameGetter('Visual_General'),
                        properties: {
                            formatString: {
                                type: { formatting: { formatString: true } }
                            }
                        }
                    }
                }
            };
            return YourVisual;
        })();
        visuals.YourVisual = YourVisual;
    })(visuals = powerbi.visuals || (powerbi.visuals = {}));
})(powerbi || (powerbi = {}));

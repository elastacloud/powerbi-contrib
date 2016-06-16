/// <reference path="../typings/VisualsContracts.d.ts" />
/// <reference path="ScriptDependency.ts" />
var powerbi;
(function (powerbi) {
    var visuals;
    (function (visuals) {
        var AutoUpdatingVisual = (function () {
            function AutoUpdatingVisual(alias, uri, callback) {
                var _this = this;
                /**
                 *
                 */
                this.dependency = new visuals.ScriptDependency();
                this.dependency.addScript(alias, uri)
                    .done(function () {
                    _this.configured = true;
                    _this.autoVisual = callback();
                })
                    .fail(function () {
                    _this.configured = false;
                });
            }
            AutoUpdatingVisual.prototype.init = function (options) {
                this.autoVisual.init(options);
            };
            AutoUpdatingVisual.prototype.update = function (options) {
                this.autoVisual.update(options);
            };
            return AutoUpdatingVisual;
        })();
        visuals.AutoUpdatingVisual = AutoUpdatingVisual;
    })(visuals = powerbi.visuals || (powerbi.visuals = {}));
})(powerbi || (powerbi = {}));

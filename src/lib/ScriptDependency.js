/// <reference path="typings/index.d.ts" />
var powerbi;
(function (powerbi) {
    var visuals;
    (function (visuals) {
        var ScriptDependency = (function () {
            function ScriptDependency() {
            }
            ScriptDependency.prototype.addScript = function (alias, uri, callback) {
                var _this = this;
                var deferred = $.Deferred();
                $.getScript(uri, function (d, status, jqxhr) {
                    if (jqxhr.status == 200) {
                        if (!callback) {
                            deferred.resolve();
                        }
                        else {
                            _this._timeoutHandle = setTimeout(function () { _this.doLoadedCallback(deferred, callback); }, 500);
                        }
                    }
                    else {
                        deferred.reject();
                    }
                });
                return deferred;
            };
            ScriptDependency.prototype.doLoadedCallback = function (deferred, callback) {
                var _this = this;
                if (callback()) {
                    clearTimeout(this._timeoutHandle);
                    deferred.resolve();
                }
                else {
                    console.log("all kinds of having to retry");
                    this._timeoutHandle = setTimeout(function () { _this.doLoadedCallback(deferred, callback); }, 500);
                }
            };
            return ScriptDependency;
        })();
        visuals.ScriptDependency = ScriptDependency;
    })(visuals = powerbi.visuals || (powerbi.visuals = {}));
})(powerbi || (powerbi = {}));

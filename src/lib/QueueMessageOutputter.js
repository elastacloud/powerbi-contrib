var powerbi;
(function (powerbi) {
    var visuals;
    (function (visuals) {
        var QueueMessageOutputter = (function () {
            function QueueMessageOutputter() {
            }
            QueueMessageOutputter.prototype.send = function (config, message, messageTTL, messageVTO) {
                var messageText = JSON.stringify(message);
                var sasToken = config.authToken;
                if (sasToken[0] !== "?") {
                    console.log("malformed configuration");
                    return;
                }
                var deferred = $.Deferred();
                var obj = {
                    'MessageText': messageText,
                    'MessageTTL': messageTTL,
                    'MessageVTO': messageVTO
                };
                var url = 'https://' + config.storageAccount + '.queue.core.windows.net/' + config.queueName + '/messages' + sasToken + '&visibilitytimeout=' + messageVTO + '&messagettl=' + messageTTL;
                var requestData = '<QueueMessage><MessageText>' + messageText + '</MessageText></QueueMessage>';
                var requestHeaders = [];
                $.ajax({
                    url: url,
                    data: requestData,
                    method: 'POST',
                    successCallback: deferred.resolveWith,
                    failureCallback: deferred.rejectWith,
                    crossDomain: true,
                    requestHeaders: requestHeaders,
                    userState: obj
                }).done(function () {
                    deferred.resolve();
                })
                    .fail(function (e) {
                    deferred.reject(e);
                });
                return deferred;
            };
            return QueueMessageOutputter;
        })();
        visuals.QueueMessageOutputter = QueueMessageOutputter;
    })(visuals = powerbi.visuals || (powerbi.visuals = {}));
})(powerbi || (powerbi = {}));

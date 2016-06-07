module powerbi.visuals {
    export interface IOutputterConfig {
        authToken:string;
        storageAccount: string;
        queueName: string;
    }
    interface IOutputter {
        send(config: IOutputterConfig, message:any, messageTTL:number, messageVTO:number):JQueryDeferred<any>;
    }
    
    export class QueueMessageOutputter implements IOutputter {
        public send(config: IOutputterConfig, message:any, messageTTL:number, messageVTO:number):JQueryDeferred<any> {
            var messageText = JSON.stringify(message);
            var sasToken = config.authToken;
            if (sasToken[0]!=="?")
            {
                console.log("malformed configuration");
                return;
            }
            var deferred = $.Deferred();
            
            var obj = {
                'MessageText': messageText,
                'MessageTTL': messageTTL,
                'MessageVTO': messageVTO
            }
            var url = 'https://'+ config.storageAccount +'.queue.core.windows.net/' + config.queueName + '/messages' + sasToken + '&visibilitytimeout=' + messageVTO + '&messagettl=' + messageTTL;
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
            }).done(
                ()=>{
                    deferred.resolve();
                })
                .fail((e)=>{ 
                    deferred.reject(e);
                    });
            return deferred;
        }
    }
}
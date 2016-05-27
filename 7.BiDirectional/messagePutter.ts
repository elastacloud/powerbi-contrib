module powerbi.visuals {
    interface IOutputterConfig {
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
    
   export class BiDirectionalVisual implements IVisual {
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
        
        private _button:JQuery;

        /** This is called once when the visual is initialially created */
        public init(options: VisualInitOptions): void {
            console.log(options.element);
            
            if (this._button != null)
            { 
                options.element.empty();
            }
            
			this._button = options.element.html("<button id=\"button1\">Click Me</button>");
        }

        /** Update is called for data updates, resizes & formatting changes */
        public update(options: VisualUpdateOptions) {
            console.log(options.dataViews);
            this._button.unbind("click") 
                        .click((event) => {
                            var qmo = new QueueMessageOutputter();
                            qmo.send(<IOutputterConfig>{ 
                                authToken: "?sv=2015-04-05&si=powerbi&sig=oohDD19EBIaRdtC0LrJvKrWQKGpBgeqgPSrLtbThKlI%3D&spr=https",
                                storageAccount: "function93381566bd0f",
                                   queueName: "powerbi"
                             }, options.dataViews, 3600, 30
                            ).done(()=>{
                                console.log("done");                                
                            }).fail((e)=>{
                                console.error(e);
                            });
		        	    });
        }
    }
    
    
}
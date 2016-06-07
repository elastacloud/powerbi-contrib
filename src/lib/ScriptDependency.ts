/// <reference path="typings/index.d.ts" />


module powerbi.visuals {
    export class ScriptDependency { 
        private _timeoutHandle : number;
        public addScript(alias: string, uri: string, callback?:()=>boolean) {
            
            var deferred = $.Deferred();
            
            $.getScript(uri, (d, status, jqxhr)=>{ 
                if (jqxhr.status == 200)
                {
                    if (!callback){
                       deferred.resolve();
                   }
                   else {
                       this._timeoutHandle = setTimeout(()=>{this.doLoadedCallback(deferred, callback);}, 500);
                   }
                }
                else {
                    deferred.reject();
                }                
             });
      
             return deferred;
        }
        private doLoadedCallback(deferred : JQueryDeferred<any>, callback: ()=>boolean) : void
        {
            if (callback())
            {
                clearTimeout(this._timeoutHandle);
                deferred.resolve();
            }
            else
            {
               console.log("all kinds of having to retry");
               this._timeoutHandle = setTimeout(()=>{this.doLoadedCallback(deferred, callback);}, 500);
            }
        }
    }
}
/// <reference path="../typings/VisualsContracts.d.ts" />
/// <reference path="ScriptDependency.ts" />


module powerbi.visuals {    
   export class AutoUpdatingVisual implements IVisual {
       /**
        *
        */
       private dependency = new ScriptDependency();
       private autoVisual:IVisual;
       private configured:boolean;
       constructor(alias:string, uri:string, callback?:()=>IVisual) {
           this.dependency.addScript(alias, uri)
                .done(()=>{
                    this.configured = true;             
                    this.autoVisual = callback(); 
                })
                .fail(()=>{
                    this.configured = false;
                });	
       }
       
       public init(options:any)
       {
           this.autoVisual.init(options);
       }
       
       public update(options:any)
       {
           this.autoVisual.update(options);
       }
   }
}
declare module google.maps {
    /***** Map *****/
    export class LatLng {
        constructor(lat:number, long: number);
    }
    export class Map {        
        constructor(mapDiv: Element, opts?: any);fitBounds(bounds: any): void;
    }
    export class Marker {
        constructor(opts?: any);
    }
    export enum Animation {
        DROP,
        BOUNCE
    }
}
declare module google.maps.visualization{
    export class HeatmapLayer
    {
        constructor(opts?:any);
        setMap(map: google.maps.Map);
    }
}


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
    export interface IWeightLocation {
        location: ILatlong;
        weight: number;
    }
    export interface ILatlong {
        lat: number;
        lng: number;
    }
    export interface GMapsVisualData {
        locations: IWeightLocation[];
    }
	
    export interface CategoryViewModel {
        value: string;
        identity: string;
        color: string;
    }

    export interface ValueViewModel {
        values: any[];
    }

    export interface ViewModel {
        categories: CategoryViewModel[];
        values: ValueViewModel[];
    }

    export class GMapsVisual implements IVisual {
		private visual : GMapsVisual;
		constructor()
        {
            this.visual = this;              
            //reentry points for GMaps to which 'this' is Window
            (<any>window).visual = this;
        }
		
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

		private map : google.maps.Map;
        public isMapReady : boolean = false;
        private isDataAvailable : boolean = false;
        private data: GMapsVisualData;
        private latestUpdate: DataView[];

        
        /** This is called once when the visual is initialially created */
        public init(options: VisualInitOptions): void {
            options.element.append("<div id='map' style='height:"
                +options.viewport.height+"px' />");
			
			 var deps = new ScriptDependency();
            deps.addScript("babylonjs", "https://maps.googleapis.com/maps/api/js?key=AIzaSyA69_K4SMeQVnVnTxJtlIQG9R1tXkDEleQ&callback=visual.onMapsReady&libraries=visualization",
                ():boolean=>{ return (typeof google)!=undefined; })
                .done(()=>{
                    console.log("done loading");                    
                })
                .fail(()=>{
                    console.log("error loaidng dependency");
                });	
                
        }

        public drawData(dataViews : DataView[]) : void {
            if (!this.visual.isMapReady || !this.visual.isDataAvailable) {                
            window.console.log('no map ready or data ready');
            return;
            }
            //note this should be a convert func!
            this.data = <GMapsVisualData> {
                locations: [
                    { location: new google.maps.LatLng(51.529598, -0.133059) , weight: 0.9},
                    { location: new google.maps.LatLng(51.528851, -0.131428) , weight: 0.8},
                    { location: new google.maps.LatLng(51.528771, -0.132329) , weight: 0.7},
                    { location: new google.maps.LatLng(51.535445, -0.118597) , weight: 0.7},
                    { location: new google.maps.LatLng(51.527863, -0.131385) , weight: 0.8},
                    { location: new google.maps.LatLng(51.527142, -0.12924) , weight: 0.9},
                    { location: new google.maps.LatLng(51.528904, -0.126836) , weight: 0.9},                    
                    { location: new google.maps.LatLng(51.532456, -0.122535), weight: 0.7},
                    { location: new google.maps.LatLng(51.532426, -0.122485), weight: 0.3},
                    { location: new google.maps.LatLng(51.532396, -0.122685), weight: 0.8},
                    { location: new google.maps.LatLng(51.532506, -0.121985), weight: 0.4},
                    { location: new google.maps.LatLng(51.5325166, -0.122985), weight: 0.7},
                    { location: new google.maps.LatLng(51.532446, -0.122585), weight: 0.5},
                ]
            };
          var heatmap = new google.maps.visualization.HeatmapLayer({
              data: this.data.locations
            });
            heatmap.setMap(this.map);
            
        }
        
        public onMapsReady() : void {
            this.map = new google.maps.Map(document.getElementById('map'), {
            center: {lat: 51.532496, lng: -0.122505},
            zoom: 16
          });         
          this.isMapReady = true;
          this.drawData(this.latestUpdate);
        }
        public update(options: VisualUpdateOptions) {
            this.latestUpdate = options.dataViews;
            this.isDataAvailable = true;
            (<any>window).isDataAvailable = true;//gmaps entry
            this.drawData(options.dataViews);
        }
	}
}
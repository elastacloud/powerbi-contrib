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

        
        /** This is called once when the visual is initialially created */
        public init(options: VisualInitOptions): void {
            options.element.append("<div id='map' style='height:"
                +options.viewport.height+"px' />");
			
			this.addScript("mapsdk", "https://maps.googleapis.com/maps/api/js?key=AIzaSyA69_K4SMeQVnVnTxJtlIQG9R1tXkDEleQ&callback=visual.onMapsReady&libraries=visualization");
        }

        public drawData() : void {
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
          this.drawData();
        }
        public update(options: VisualUpdateOptions) {
            
            this.isDataAvailable = true;
            (<any>window).isDataAvailable = true;//gmaps entry
            this.drawData();
        }

        private addScript(alias: string, uri: string) {
         var existentScript = document.getElementById(alias);
            if (existentScript != null) {
                if ((<any>window).google !== undefined && google.maps !== undefined) {
                delete google.maps;
                $('script').each(function () {
                    if (this.src.indexOf('googleapis.com/maps') >= 0
                            || this.src.indexOf('maps.gstatic.com') >= 0
                            || this.src.indexOf('earthbuilder.googleapis.com') >= 0) {
                        // console.log('removed', this.src);
                        $(this).remove();
                    }
                });
            }
            }
               var body= document.getElementsByTagName('body')[0];
               var script= document.createElement('script');
               script.id = alias;
               script.type= 'text/javascript';               
               body.appendChild(script);
               script.src= uri;

        }
	}
}
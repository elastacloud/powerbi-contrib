/*
 *  Power BI Visual CLI
 *
 *  Copyright (c) Microsoft Corporation
 *  All rights reserved.
 *  MIT License
 *
 *  Permission is hereby granted, free of charge, to any person obtaining a copy
 *  of this software and associated documentation files (the ""Software""), to deal
 *  in the Software without restriction, including without limitation the rights
 *  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *  copies of the Software, and to permit persons to whom the Software is
 *  furnished to do so, subject to the following conditions:
 *
 *  The above copyright notice and this permission notice shall be included in
 *  all copies or substantial portions of the Software.
 *
 *  THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 *  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 *  THE SOFTWARE.
 */

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



module powerbi.extensibility.visual {
    
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
		public static visual : GMapsVisual;
        
        private element:HTMLElement;
		private map : google.maps.Map;
        public isMapReady : boolean = false;
        private isDataAvailable : boolean = false;
        private data: GMapsVisualData;
        private latestUpdate: DataView[];

        constructor(options: VisualConstructorOptions) {
            GMapsVisual.visual = this;              
            //reentry points for GMaps to which 'this' is Window
            (<any>window).visual = this;
            this.element = options.element;
			
            var deps = new ScriptDependency();
            deps.addScript("gmaps", "https://maps.googleapis.com/maps/api/js?key=AIzaSyA69_K4SMeQVnVnTxJtlIQG9R1tXkDEleQ&libraries=visualization",
                ():boolean=>{ return (typeof google)!=undefined; })
                .done(()=>{
                    this.onMapsReady();
                    console.log("done loading");                    
                })
                .fail(()=>{
                    console.log("error loaidng dependency");
                });	
                
        }

        public drawData(dataViews : DataView[]) : void {
            if (!GMapsVisual.visual.isMapReady || !GMapsVisual.visual.isDataAvailable) {                
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
            this.element.innerHTML = ("<div id='map' style='height:"
                +options.viewport.height+"px' />");

            this.latestUpdate = options.dataViews;
            this.isDataAvailable = true;
            (<any>window).isDataAvailable = true;//gmaps entry
            this.onMapsReady();
        }
    }
}
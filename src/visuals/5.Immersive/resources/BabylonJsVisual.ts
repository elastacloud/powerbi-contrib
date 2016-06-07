declare module BABYLON {
	export class Engine {
		constructor(canvas:HTMLElement, antialias:boolean);
		runRenderLoop(it:any);
		resize();
	}
	export class Scene {
		constructor(engine:Engine);	
		render();	
	}
	export class ArcRotateCamera {
		constructor(name, alpha, beta, radius, target, scene : Scene);
		setPosition(vector: Vector3);
		attachControl(element:HTMLElement, noPreventDefault:boolean);
	}
	export class Vector3 {
		constructor(x, y, z);
		static Zero();
	}
	export class StandardMaterial {
		constructor(name: string, scene : Scene);
		refractionTexture : CubeTexture;
		reflectionTexture : CubeTexture;
		diffuseColor : Color3;
		invertRefractionY : boolean;
		indexOfRefraction : number;
		specularPower : number;
		refractionFresnelParameters : FresnelParameters;
		reflectionFresnelParameters : FresnelParameters;
		backFaceCulling : boolean;
		specularColor : Color3;
		disableLighting: boolean;
	}
	export class Mesh {
		static CreateSphere(name : string, segments, diameter, scene : Scene);
		static CreateBox(name : string, size, scene : Scene);
	}
	export class PointLight {
		constructor(name : string, position, scene : Scene);
	}
	export class CubeTexture {
		constructor(rootUrl : string, scene : Scene);
		coordinatesMode : any;
	}
	export class Color3 {
		constructor(r, g, b);
		static Black();
		static White();
	}
	export class FresnelParameters {
		power : number;		
		leftColor : Color3;
		rightColor : Color3;
	}
	export enum Texture {
		SKYBOX_MODE
	}
}
module powerbi.visuals {
	
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

    export class BabylonVisual implements IVisual {
		private visual : BabylonVisual;
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

//		private renderCanvas : HTMLCanvasElement;
        public isMapReady : boolean = false;
        private isDataAvailable : boolean = false;
 //       private data: GMapsVisualData;

        
        /** This is called once when the visual is initialially created */
        public init(options: VisualInitOptions): void {
            options.element.append("<canvas id='renderCanvas' style='height:"
                +options.viewport.height+"px' />");
			
			this.addScript("babylonjshandminified12", "https://www.babylonjs.com/hand.minified-1.2.js");
			this.addScript("babylonjscannon", "https://www.babylonjs.com/cannon.js");
			this.addScript("babylonjsoimo", "https://www.babylonjs.com/oimo.js");
			this.addScript("babylonjs", "https://www.babylonjs.com/babylon.js");		
			
        }     
       
        public update(options: VisualUpdateOptions) {
	 		var canvas = document.getElementById("renderCanvas");
		
			//hack the loadtime			 
			 setTimeout(() => {
			        var engine = new BABYLON.Engine(canvas, true);
			
			        var createScene = function () {
			            var scene = new BABYLON.Scene(engine);
			            var camera = new BABYLON.ArcRotateCamera("Camera", 0, 0, 10, BABYLON.Vector3.Zero(), scene);
			            var material = new BABYLON.StandardMaterial("kosh", scene);
			            var sphere1 = BABYLON.Mesh.CreateSphere("Sphere1", 32, 5, scene);
			            var light = new BABYLON.PointLight("Omni0", new BABYLON.Vector3(-17.6, 18.8, -49.9), scene);
			        
			            camera.setPosition(new BABYLON.Vector3(-15, 3, 0));
			            camera.attachControl(canvas, true);
			        
			            // Sphere1 material
			            material.refractionTexture = new BABYLON.CubeTexture("https://iotinn.blob.core.windows.net/assets/TropicalSunnyDay", scene);
			            material.reflectionTexture = new BABYLON.CubeTexture("https://iotinn.blob.core.windows.net/assets/TropicalSunnyDay", scene);
			            material.diffuseColor = new BABYLON.Color3(0, 0, 0);
			            material.invertRefractionY = false;
			            material.indexOfRefraction = 0.98;
			            material.specularPower = 128;
			            sphere1.material = material;
			        
			            material.refractionFresnelParameters = new BABYLON.FresnelParameters();
			            material.refractionFresnelParameters.power = 2;
			            material.reflectionFresnelParameters = new BABYLON.FresnelParameters();
			            material.reflectionFresnelParameters.power = 2;
			            material.reflectionFresnelParameters.leftColor = BABYLON.Color3.Black();
			            material.reflectionFresnelParameters.rightColor = BABYLON.Color3.White();
			        
			            // Skybox
			            var skybox = BABYLON.Mesh.CreateBox("skyBox", 100.0, scene);
			            var skyboxMaterial = new BABYLON.StandardMaterial("skyBox", scene);
			            skyboxMaterial.backFaceCulling = false;
			            skyboxMaterial.reflectionTexture = new BABYLON.CubeTexture("https://iotinn.blob.core.windows.net/assets/TropicalSunnyDay", scene);
			            skyboxMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
			            skyboxMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);
			            skyboxMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
			            skyboxMaterial.disableLighting = true;
			            skybox.material = skyboxMaterial;
			        
			            return scene;
			        }
			        
			        
			        var scene = createScene();
			
			        engine.runRenderLoop(function () {
			            scene.render();
			        });
			
			        // Resize
			        window.addEventListener("resize", function () {
			            engine.resize();
			        });
			 }, 10000);
        }

        private addScript(alias: string, uri: string) {
         var existentScript = document.getElementById(alias);
            if (existentScript != null) { 
				$('script').each(function () {
                    if (this.src.indexOf('uri') >= 0) {
                        // console.log('removed', this.src);
                        $(this).remove();
                    }
                });
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
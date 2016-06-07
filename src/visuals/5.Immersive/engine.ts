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
            
            options.element.append("<canvas id='renderCanvas' style='width:"
                +options.viewport.width+"px' />");
            options.element.append("<div id='camerasList' />");
			
			this.addScript("babylonjshandminified12", "https://iotinn.blob.core.windows.net/assets/hand.minified-1.2.js");
			this.addScript("babylonjscannon", "https://iotinn.blob.core.windows.net/assets/cannon.js");
			this.addScript("babylonjsoimo", "https://iotinn.blob.core.windows.net/assets/oimo.js");
			this.addScript("babylonjs", "https://iotinn.blob.core.windows.net/assets/babylon.js");		
			
        }     
		
		private draw(canvas)
		{ 
            var demo = {
                scene: "V8",
                incremental: false,
                binary: false,
                doNotUseCDN: false,
                collisions: true,
                offline: false,
                onload: function () {
                    scene.activeCamera.minZ = 1;
                    scene.lights[0].getShadowGenerator().usePoissonSampling = true;
                    scene.lights[0].getShadowGenerator().bias *= 2;
                }
            };
            var mode = "";

            var sceneChecked;
			var sceneLocation = "https://yoda.blob.core.windows.net/wwwbabylonjs/Scenes/";

            // Babylon
            var engine = new BABYLON.Engine(canvas, true);
            var scene;

            var loadScene = function (name, incremental, sceneLocation, then) {
                sceneChecked = false;

                BABYLON.SceneLoader.ForceFullSceneLoadingForIncremental = true;

                engine.resize();

                var dlCount = 0;
                BABYLON.SceneLoader.Load(sceneLocation + name + "/", name + incremental + ".babylon", engine, function (newScene) {
                    scene = newScene;
                    scene.executeWhenReady(function () {
                        canvas.style.opacity = 1;
                        if (scene.activeCamera) {
                            scene.activeCamera.attachControl(canvas);

                            if (newScene.activeCamera.keysUp) {
                                newScene.activeCamera.keysUp.push(90); // Z
                                newScene.activeCamera.keysUp.push(87); // W
                                newScene.activeCamera.keysDown.push(83); // S
                                newScene.activeCamera.keysLeft.push(65); // A
                                newScene.activeCamera.keysLeft.push(81); // Q
                                newScene.activeCamera.keysRight.push(69); // E
                                newScene.activeCamera.keysRight.push(68); // D
                            }
                        }

                        if (then) {
                            then();
                        }

                    });

                }, function (evt) {
                    if (evt.lengthComputable) {
                        engine.loadingUIText = "Loading, please wait..." + (evt.loaded * 100 / evt.total).toFixed() + "%";
                    } else {
                        dlCount = evt.loaded / (1024 * 1024);
                        engine.loadingUIText = "Loading, please wait..." + Math.floor(dlCount * 100.0) / 100.0 + " MB already loaded.";
                    }
                });

                canvas.style.opacity = 0;
            };

            // Render loop
            var renderFunction = function () {
                // Fps
                //divFps.innerHTML = engine.getFps().toFixed() + " fps";

                // Render scene
                if (scene) {
                    if (!sceneChecked) {
                        var remaining = scene.getWaitingItemsCount();
                        engine.loadingUIText = "Streaming items..." + (remaining ? (remaining + " remaining") : "");
                    }

                    scene.render();

                    // Streams
                    if (scene.useDelayedTextureLoading) {
                        var waiting = scene.getWaitingItemsCount();
                        if (waiting > 0) {
                            status.innerHTML = "Streaming items..." + waiting + " remaining";
                        } else {
                            status.innerHTML = "";
                        }
                    }
                }
            };

            // Launch render loop
            engine.runRenderLoop(renderFunction);

            // Resize
            window.addEventListener("resize", function () {
                engine.resize();
            });
            
            console.log("loading scene");
            loadScene(demo.scene, mode, sceneLocation, function () {
                BABYLON.StandardMaterial.BumpTextureEnabled = true;
                if (demo.collisions !== undefined) {
                    scene.collisionsEnabled = demo.collisions;
                }

                if (demo.onload) {
                    console.log("loading");
                    demo.onload();
                }

                for (var index = 0; index < scene.cameras.length; index++) {
                    var camera = scene.cameras[index];
                    var option = new Option();
                    option.text = camera.name;
                    option.value = camera;

                    if (camera === scene.activeCamera) {
                        option.selected = true;
                    }

                    camerasList.appendChild(option);
                }
            });
	
		}
       
        public update(options: VisualUpdateOptions) {
	 		var canvas = document.getElementById("renderCanvas");
		
			//hack the loadtime			 
			 setTimeout(() => {
				 try {
			       if (BABYLON)
				   {
					   this.draw(canvas);
				   }
				 }
				 catch (err)
				 {
					 this.update(options);
				 }
			 }, 1000);
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
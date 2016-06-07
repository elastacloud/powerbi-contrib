var powerbi;
(function (powerbi) {
    var visuals;
    (function (visuals) {
        var BabylonVisual1460931639309;
        (function (BabylonVisual1460931639309) {
            var BabylonVisual = (function () {
                function BabylonVisual() {
                    //		private renderCanvas : HTMLCanvasElement;
                    this.isMapReady = false;
                    this.isDataAvailable = false;
                    this.visual = this;
                    //reentry points for GMaps to which 'this' is Window
                    window.visual = this;
                }
                //       private data: GMapsVisualData;
                /** This is called once when the visual is initialially created */
                BabylonVisual.prototype.init = function (options) {
                    options.element.append("<canvas id='renderCanvas' style='height:" + options.viewport.height + "px' />");
                    this.addScript("babylonjshandminified12", "https://www.babylonjs.com/hand.minified-1.2.js");
                    this.addScript("babylonjscannon", "https://www.babylonjs.com/cannon.js");
                    this.addScript("babylonjsoimo", "https://www.babylonjs.com/oimo.js");
                    this.addScript("babylonjs", "https://www.babylonjs.com/babylon.js");
                };
                BabylonVisual.prototype.update = function (options) {
                    var canvas = document.getElementById("renderCanvas");
                    //hack the loadtime			 
                    setTimeout(function () {
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
                        };
                        var scene = createScene();
                        engine.runRenderLoop(function () {
                            scene.render();
                        });
                        // Resize
                        window.addEventListener("resize", function () {
                            engine.resize();
                        });
                    }, 10000);
                };
                BabylonVisual.prototype.addScript = function (alias, uri) {
                    var existentScript = document.getElementById(alias);
                    if (existentScript != null) {
                        $('script').each(function () {
                            if (this.src.indexOf('uri') >= 0) {
                                // console.log('removed', this.src);
                                $(this).remove();
                            }
                        });
                    }
                    var body = document.getElementsByTagName('body')[0];
                    var script = document.createElement('script');
                    script.id = alias;
                    script.type = 'text/javascript';
                    body.appendChild(script);
                    script.src = uri;
                };
                BabylonVisual.capabilities = {
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
                            displayName: powerbi.data.createDisplayNameGetter('Visual_General'),
                            properties: {
                                formatString: {
                                    type: { formatting: { formatString: true } },
                                },
                            },
                        },
                    }
                };
                return BabylonVisual;
            })();
            BabylonVisual1460931639309.BabylonVisual = BabylonVisual;
        })(BabylonVisual1460931639309 = visuals.BabylonVisual1460931639309 || (visuals.BabylonVisual1460931639309 = {}));
    })(visuals = powerbi.visuals || (powerbi.visuals = {}));
})(powerbi || (powerbi = {}));
var powerbi;
(function (powerbi) {
    var visuals;
    (function (visuals) {
        var plugins;
        (function (plugins) {
            plugins.BabylonVisual1460931639309 = {
                name: 'BabylonVisual1460931639309',
                class: 'BabylonVisual1460931639309',
                capabilities: powerbi.visuals.BabylonVisual1460931639309.BabylonVisual.capabilities,
                custom: true,
                create: function () { return new powerbi.visuals.BabylonVisual1460931639309.BabylonVisual(); }
            };
        })(plugins = visuals.plugins || (visuals.plugins = {}));
    })(visuals = powerbi.visuals || (powerbi.visuals = {}));
})(powerbi || (powerbi = {}));

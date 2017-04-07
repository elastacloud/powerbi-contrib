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

module powerbi.extensibility.visual {
    export class Visual implements IVisual {
        private target: HTMLElement;
        private updateCount: number;
        private _ele:HTMLElement;
        private loader:number;
        private config;

        constructor(options: VisualConstructorOptions) {
            console.log('Visual constructor', options);
             this._ele = options.element; 
             this.config =  { animal : "kitten" };
        }

        public update(options: VisualUpdateOptions) {
            var that = this;
            if (that.loader)
            {
                console.log("clearing timeout");
                clearTimeout(that.loader);
            }

            that.loader = setTimeout(function() {
                that.drawAnimal(options);
                delete that.loader;
            }, 1000);
        }
        
        private drawAnimal(options:VisualUpdateOptions)
        {            
            if (options.dataViews.length == 0)
            {
                this._ele.innerHTML = "<p>Give me something to bind to.</p>";
                return;
            }

            var uri = "https://loremflickr.com/"+Math.floor(options.viewport.width)+"/"+Math.floor(options.viewport.height)+"/"+this.getAnimal(options)+"/all";
            console.log('Loading', uri);
			this._ele.innerHTML = "<img src='"+uri+"'>";
        }

        private getAnimal(options:VisualUpdateOptions):string
        {
            if (options.dataViews.length > 0 && options.dataViews[0].metadata.objects){ 
                this.config.animal = options.dataViews[0].metadata.objects["animal"]["animal"].toString();
            } 
            else {
                debugger;
            }

            return this.config.animal;
        }

        public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstanceEnumeration {
            let objectName: string = options.objectName;
            let objectEnumeration: VisualObjectInstance[] = [];

            switch( objectName ) {
                case 'animal':
                    objectEnumeration.push({
                        objectName: objectName,
                        properties: { 
                            animal : this.config.animal
                         },
                        selector: null//bind to object properties
                    });
                    break;
            };

            return objectEnumeration;
        }
    }
}
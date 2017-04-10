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
        private ele:HTMLElement;
        constructor(options: VisualConstructorOptions) {
            console.log('Visual constructor', options);
            this.ele = options.element;
        }

        public update(options: VisualUpdateOptions) {
            console.log('Visual update', options);
            var single = this.getSizeInBytes(options.dataViews[0]);
            var displayMeta = new DisplayMeta(single);
            this.ele.innerHTML = "<p>" + displayMeta.header() + "</p>";
            this.ele.innerHTML += "<p>" + displayMeta.valueWithUnit() + "</p>";
            
            debugger;
        }

        private getSizeInBytes(dv: DataView):number {
            if (dv.single && dv.single.value)
                return Number(dv.single.value);

            return 0;
        }
    }
}
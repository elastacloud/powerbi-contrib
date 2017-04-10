
module powerbi.extensibility.visual {
    export class DisplayMeta {
        private _sizeInBytes:number=0;
        private _header:string;
        private _value:number;
        private _uom:string="Err";
        constructor(sizeInBytes:number) {
            this._sizeInBytes = sizeInBytes;

            var size = Math.log2(sizeInBytes);
            var nearestPow = 0;
            if (size == NaN)
            {
                this._header = "Oops";
                this._value = 0;
                return;
            }
            else if (size < 10)
            {
                this._header = "Bytes";
                this._uom = "B";
                nearestPow = 1;
            }
            else if (size < 20)
            {
                this._header = "Kilobytes";
                this._uom = "KB";
                nearestPow = 10;
            }
            else if (size < 30)
            {
                this._header = "Megabytes";
                this._uom = "MB";
                nearestPow = 20;
            }
            else if (size < 40)
            {
                this._header = "Gigabytes";
                this._uom = "GB";
                nearestPow = 30;
            }
            else if (size < 50)
            {
                this._header = "Terabytes";
                this._uom = "TB";
                nearestPow = 40;
            }
            else if (size < 60)
            {
                this._header = "Petabytes";
                this._uom = "PB";
                nearestPow = 50;
            }
            else if (size < 70)
            {
                this._header = "Exabytes";
                this._uom = "EB";
                nearestPow = 60;
            }
            else if (size < 80)
            {
                this._header = "Zettabytes";
                this._uom = "ZB";
                nearestPow = 70;
            }
            else
            {
                this._header = "Yottabyte";
                this._uom = "YB";
                nearestPow = 80;
            }
            this._value = sizeInBytes/Math.pow(2, nearestPow);
        }

        public header():string {
            return this._header;
        }
        public value():number {
            return this._value;
        }
        public valueWithUnit():string {
            return Math.round(this.value()) + " " + this._uom;
        }
    }
}
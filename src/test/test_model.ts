// import express from 'express';
const verp = require('../core');
const { BaseModel, IrModel } = require('../core/models');

// @MetaModel.init()
// export class IrModel extends Model { // Model
//   create(vals_list: []=[]) {
//     console.log('IrModel create...');
//   }

//   @deprecated('Test deprecated')
//   list() {
//     console.log('IrModel list...');
//   }
// }

const b = new BaseModel();
b.create();

const m = new IrModel();
m.list();

class NewId extends Number {
  private _uuid: string;
  origin: any;
  ref: any;
  constructor(origin?: any, ref?: any) {
    super();
    this._uuid = 'uuidv1'.slice(0, 8);
    this.origin = origin;
    this.ref = ref;
  }

  valueOf() {
    const value =  this.origin ? this.origin : this.ref;
    console.log('valueOf', value);
    return value;
  }

  _bool() {
    return false;
  }

  toString() {
    let idPart;
    if (this.origin || this.ref) {
      idPart = String(this.origin || this.ref);
    }
    else {
      idPart = this._uuid;
    }
    return `NewId_${idPart}`;
  }
}

class O {
    id?: Number;
    constructor(id?: any) {
        this.id = id;
    }
}

const n= new NewId();
const n1 = new NewId(1);

const o = new O()
const o1 = new O(n);
const o2 = new O(n1);

console.log(o.id || 0);
console.log(o1.id || 0);
console.log(o2.id || 0);

console.log(o.id ?? 0);
console.log(o1.id ?? 0);
console.log(o2.id ?? 0);

export {};
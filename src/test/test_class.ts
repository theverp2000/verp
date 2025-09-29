import { stringify } from "querystring";

class MetaModel {
  // Inherit method to create base classes.
  static inherit(...bases: any[]) {
    class classes {
      // The base classes
      get __bases() { return bases; }
    }

    if (bases.length) {
      let name: any;
      if (typeof bases[0] === 'string') {
        name = bases[0];
        bases.splice(1);
      } else {
        name = bases[0].name ?? typeof bases[0];
      }
      const des: any = Object.getOwnPropertyDescriptor(classes, 'name');
      if (des) {
        des.value = name;
        Object.defineProperty(classes, 'name', des);
      }
    }

    // Copy over properties and methods
    for (const base of bases) {
      MetaModel.copy(classes, base);
      MetaModel.copy(classes.prototype, base.prototype);
    }
    if (bases.length) {
      Object.setPrototypeOf(classes, bases[0]);
    }
    return classes;
  }

  // Copies the properties from one class to another
  static copy(target, source: object) {
    const SPECIAL_KEYS = ['constructor', 'prototype', 'name', 'length'];
    for (const key of Reflect.ownKeys(source)) {
      if (key !== "constructor" && key !== "prototype" && key !== "name" && key !== "length") {
        const desc: any = Object.getOwnPropertyDescriptor(source, key);
        Object.defineProperty(target, key, desc);
      }
    }
  }
}

class Base {
  static type = 'base';
  name: string;
  
  constructor(name) {
    this.name = name;
  }
  func() {
    console.log(`${this}`);
  }
  
  static sfunc() {
    console.log(`New func`);
  }
}

function discover(obj: any, prefix='', level=0, json=false) {
  const str = '';//new Array(level*3).join(' ');
  console.log('%s---%s', str, prefix, obj ? '': 'undefined')
  if (obj) {
    const des: any = Object.getOwnPropertyDescriptors(obj);
    console.log('%s', str, json ? stringify(des) : des);
  }
  console.log('%s---%s .constructor:', str, prefix, obj.constructor ? '': 'undefined')
  if (obj.constructor) {
    const des: any = Object.getOwnPropertyDescriptors(obj.constructor);
    console.log('%s', str, json ? stringify(des) : des);
  }
  console.log('%s---%s .prototype:', str, prefix, obj.prototype ? '': 'undefined')
  if (obj.prototype) {
    const des: any = Object.getOwnPropertyDescriptors(obj.prototype);
    console.log('%s', str, json ? stringify(des) : des);
  }
}

function discoverObject(obj: any, prefix?: string, detail=false, level=0) {
  if (!obj.prototype) return;
  const str = new Array(level*3).join(' ');
  if (prefix) console.log('\n%s***%s', str, prefix);
  if (detail) discover(obj, prefix, level);
  console.log('%sname: %s', str, obj.name)
  console.log('%stype: %s', str, typeof obj)
  console.log('%sargs len: %s', str, obj.length)
  console.log('%sprototype: %s, type', str, obj.prototype, typeof obj.prototype);
  console.log('%sconstructor: %s, type', str, obj.constructor, typeof obj.constructor)
  
  discoverObject(obj.prototype, '', detail, level+1);
}

function newfunc() {
  console.log(`New func`);
}

function test() {
  const Animal = {
    speak() {
      console.log(`${this.name} makes a noise.`);
    }
  };

  class Cat {
    name: string;
    constructor(name) {
      this.name = name;
    }
    static _copy() {
      console.log('%s Copy', this.name)
    }
    paste() {
      console.log('%s Paste', this.name)
    }
    copy = Cat._copy;
  }
  
  class Dog {//extends Cat { // CACH 1
    code: string;
    constructor(name) {
      // super(`name: ${name}`);
      this.code = name;
    }
    beat() {
      console.log('%s Beat code=', this.code)
    }
  }

  class Cun {

  }

  Object.setPrototypeOf(Cat.prototype, Animal);
  const _c: any = new Cat('Meo');
  // discover(Cat, 'Cat class');
  // discover(_c, 'Cat instance');
  _c.copy(); // Meo Copy
  _c.paste(); // Meo Patse
  _c.speak(); // Meo makes a noise.

  Object.setPrototypeOf(Dog.prototype, Cat); // CACH 2
  const _d: any = new Dog('Cho');
  // discover(Dog, 'Dog class');
  // discover(_d, 'Dog instance');
  _d.beat(); // Cho Beat code=  
  // _d.copy(); // name: Cho Copy  // CACH 2 => _d.copy is not a function
  // _d.paste(); // name:Cho Paste // CACH 2 => _d.paste is not a function
  // _d.speak(); // name: Chomakes a noise   // CACH 2 => _d.speak is not a function
  // const Dog2: any = Dog;
  // Dog2._copy(); // Dog2._copy is not a function
  
  Object.setPrototypeOf(Cun.prototype, Dog);
  const _e: any = new Cun();
  discover(Cun, 'Cun class');
  discover(_e, 'Cun instance');
  _e.beat(); // ChoCon Beat code=
  // _e.copy(); // CACH 1 => _d.copy is not a function
  // _e.paste(); // CACH 1 => _d.paste is not a function
  // _e.speak(); // CACH 1 => _d.speak is not a function

  // const ModelClass = Object.create(Dog.prototype);
  // const d1 = Object.create(ModelClass);
  // d1.speak(); // undefined makes a noise.

  // const d2 = new ModelClass();

  // Object.setPrototypeOf(ModelClass.prototype, Dog);
  
  // const d2 = Object.create(ModelClass);
  
}

function doAll(cls) {
  const ModelClass = cls;
  const pro = Object.getPrototypeOf(cls);

  const ModelClass1 = Object.create(pro);
  const ModelClass2 = Object.create(cls.prototype);
  const ModelClass3 = Object.create(null);

  Object.setPrototypeOf(ModelClass3, cls);

  const m1 = Object.create(ModelClass1);
  const m2 = Object.create(ModelClass2);
  const m3 = Object.create(ModelClass3);

  m1.func();
  m2.func();
  m3.func();
}

function testOne() {
  class One {
    static _name = 'Lop Mot';
    static init() {
      console.log(`${this.name} _init`);
    }
    new(name: string) {
      console.log(`${this}: new with name=${name}`);
    }
  }

  class Two extends One {
    // name: string;
    // code = 'ABC';
    constructor(a,b) {
      super();
      super.new('');
      // this.name = name;
    }
    new(name: string) {
      console.log(`${this}: new with name=${name}`);
    }
  }
  const one = new One();
  const o = One.constructor();

  // discoverObject(One, 'Class One');

  // discoverObject(one, 'Instance one');

  discoverObject(Two, 'Class Two');
}

class One {
  static _name = 'Lop Mot';
  static _init(code: string) {
    console.log(`${this.name} _init ${code}`);
  }
  first(name: string) {
    console.log(`First: ${this} with name=${name}`);
  }
  static mro(cls?: any): any[] {
    cls = cls ?? this;
    if (!cls.mro)
      return [];

    const pro = Object.getPrototypeOf(cls);
    if (pro === undefined) {
      return [cls];
    }
    const r = cls.mro(pro);
    return [cls, ...r]; 
  }
}

class Two extends One {
  name: string;
  code: number;
  constructor(a: string , b: number) {
    super();
    super.first('');
    this.name = a;
  }
  second(name: string) {
    console.log(`Second ${this} with name=${name}`);
  }
  static _second(name: string) {
    console.log(`Second ${this.name} with name=${name}`);
  }
}

class Three extends Two {
  constructor() {
    super('Three', 3)
  }
}

function test02() {
  function isInstanceOf(obj: any, ancestor: any) {
    console.log(`${obj.name} isinstanceof ${ancestor.name}: ${obj instanceof ancestor}`);
  }

  class Three1 extends Two {}

  const one = new One();
  // discoverObject(one, 'Instance one');

  const two: any = new Two('abc', 3);
  two.first('two'); // two.prototype.first('two'); => Cannot read properties of undefined
  two.second('two'); 

  const three: any = new Three();
  three.first('three');
  three.second('three');

  const three0: any = new Three1('a', 31);
  three0.first('three0'); 
  three0.second('three0');

  const Three2: any = Object.setPrototypeOf(Three1.prototype, Two); //Three1
  Three2._init('DEF'); // Two _init DEF
  Three2._second('DEF'); // Second Two with name=DEF

  // After set prototype
  const three1: any = Object.create(Three1); // new Three1('a', 'b');  => error: Function.prototype.toString requires that 'this' be a Function
  // three1.prototype.first('three1'); // three1.first('three1'); => error: three1.first is not a function
  // three1.second('three1');// error three1.second is not a function
  
  const three2: any = Object.create(Three2); // new Three2(); => error
  three2.prototype.first('three2'); // three2.first('three2'); => error
  three2.prototype.second('three2');//

  // discoverObject(Three1, 'Class Three1');
  const des = Object.getOwnPropertyDescriptors(Three1.prototype);
  if (des) {
    for (const d of Object.entries(des)) {
      console.log('name: %s, value: %s', d[0], d[1]);
    }
  }
  const pro = Object.getOwnPropertyDescriptor(Three1, 'prototype');
  console.log('pro: %s', pro);

  const Four = createClass(Two);
  Four._init('Four');
  Four._second('Four');
  const four = Object.create(Four).prototype;
  four.first('four');
  four.second('four');

  const Five = createClass2(Three);
  Five._init('five');
  Five._second('five');
  const five = Object.create(Five);
  five.prototype.first('five');
  five.prototype.second('five');

  isInstanceOf(three, Two);  // true
  // isInstanceOf(three0, Two); // false
  // isInstanceOf(three1, Two); // false
  // isInstanceOf(three2, Two); // false
  // isInstanceOf(four, Two);   // false
  // isInstanceOf(five, Two);   //false

  // isInstanceOf(Three, Two);  // false
  // isInstanceOf(Three1, Two); // false
  // isInstanceOf(Three2, Two); // false
  // isInstanceOf(Four, Two);   // false
  // isInstanceOf(Five, Two);   //false

  isInstanceOf(Three, Two.constructor);  // true
  isInstanceOf(Three1, Two.constructor); // true
  // isInstanceOf(Three2, Two.prototype); // false
  // isInstanceOf(Four, Two.prototype);   // false
  // isInstanceOf(Five, Two.prototype);   //false

  Four.prototype.first('Four');
  four.first('four');
}

function test03() {
  const User: any = MetaModel.inherit('User', Two);
  Object.assign(User, {
    '_name': 'User',
    '_register': false,
    '_originalModule': 'cls._moduleName',
    '_parentsModule': {},                  //# map parent to introducing module
    '_parentsChildren': new Set(),      //# names of children models
    '_inheritsChildren': new Set(),            //# names of children models
    '_fields': {},                          //# populated in _setup_base()
  });
  const user = new User();
  User._second();
  User._init('abc');
  user.second();
  user.first('abc');
  console.log(User._second === Two._second);

  // const Three1: any = Three;
  // Three1._first();
  const Partner: any = MetaModel.inherit(Three);
  Partner._first();
  const partner = new Partner();

  const Admin: any = MetaModel.inherit();
  const admin = new Admin();
  
}

function test04() {
  const three = new Three();
  const mro = Three.mro();
  console.log(mro);
}

function createClass(base: any) {
  class Temp {}
  return Object.setPrototypeOf(Temp.prototype, base);
}

function createClass2(base: any) {
  // const Temp = function() {}
  return Object.setPrototypeOf((function() {}).prototype, base);
}

function createClass3(base: any) {
  function Temp() {}
  return Object.setPrototypeOf(Temp.prototype, base);
}


// doAll(Base);
test04();

export {};
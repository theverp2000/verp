function func() {

}

class O extends Object {

}

const arr: any = [];
const se: any = new Set();
const map: any = new Map(); 
const obj: any = new O();
const dic: any = {};
const rec: Record<any, any> = {}

// console.log(func.name, func.constructor.name, Object.getPrototypeOf(func).name);//"func",  "Function",  "" 
// console.log(O.name, O.constructor.name, Object.getPrototypeOf(O).name);            //"O",  "Function",  "Object" 
// console.log(arr.name, arr.constructor.name, Object.getPrototypeOf(arr).name);//undefined,  "Array",  undefined 
// console.log(se.name, se.constructor.name, Object.getPrototypeOf(obj).name);  //undefined,  "Set",  undefined 
// console.log(map.name, map.constructor.name, Object.getPrototypeOf(map).name);//undefined,  "Map",  undefined 
// console.log(obj.name, obj.constructor.name, Object.getPrototypeOf(obj).name);//undefined,  "O",  undefined 
// console.log(dic.name, dic.constructor.name, Object.getPrototypeOf(obj).name);//undefined,  "Object",  undefined 
// console.log(rec.name, rec.constructor.name, Object.getPrototypeOf(rec).name);//undefined,  "Object",  undefined
check(func);
check(O);
check(arr);
check(se);
check(map);
check(obj);
check(dic);
check(rec);

function check(obj) {
  const name = obj.constructor.name;
  let str;
  if (name === 'Function') {
    str = `${obj.name} is Function`
    const pro = Object.getPrototypeOf(obj).name;
    if (pro) {
      str = `${obj.name} is Class extends ${pro}`;
    }
  }
  else if (name === 'Object') {
    str = `This is an instance of class Object {}`
  }
  else {
    str = `This is an instance of class ${name}`;
  }
  console.log(str+':', Object.keys(Object.getOwnPropertyDescriptors(obj)), 
    // Object.keys(Object.getOwnPropertyDescriptors( Object.getPrototypeOf(obj)))
  );
}
/**
 * 
func is Function: [ 'length', 'name', 'prototype' ]
O is Class extends Object: [ 'length', 'name', 'prototype' ]
This is an instance of class Array: [ 'length' ]
This is an instance of class Set: []
This is an instance of class Map: []
This is an instance of class O: []
This is an instance of class Object {}: []
This is an instance of class Object {}: []

func is Function: [ 'length', 'name', 'prototype' ] [
  'length',      'name',
  'arguments',   'caller',
  'constructor', 'apply',
  'bind',        'call',
  'toString'
]
O is Class extends Object: [ 'length', 'name', 'prototype' ] [
  'length',
  'name',
  'prototype',
  'assign',
  'getOwnPropertyDescriptor',
  'getOwnPropertyDescriptors',
  'getOwnPropertyNames',
  'getOwnPropertySymbols',
  'is',
  'preventExtensions',
  'seal',
  'create',
  'defineProperties',
  'defineProperty',
  'freeze',
  'getPrototypeOf',
  'setPrototypeOf',
  'isExtensible',
  'isFrozen',
  'isSealed',
  'keys',
  'entries',
  'fromEntries',
  'values',
  'hasOwn'
]
This is an instance of class Array: [ 'length' ] [
  'length',      'constructor',    'concat',
  'copyWithin',  'fill',           'find',
  'findIndex',   'lastIndexOf',    'pop',
  'push',        'reverse',        'shift',
  'unshift',     'slice',          'sort',
  'splice',      'includes',       'indexOf',
  'join',        'keys',           'entries',
  'values',      'forEach',        'filter',
  'flat',        'flatMap',        'map',
  'every',       'some',           'reduce',
  'reduceRight', 'toLocaleString', 'toString',
  'at',          'findLast',       'findLastIndex'
]
This is an instance of class Set: [] [
  'constructor', 'has',
  'add',         'delete',
  'clear',       'entries',
  'forEach',     'size',
  'values',      'keys'
]
This is an instance of class Map: [] [
  'constructor', 'get',
  'set',         'has',
  'delete',      'clear',
  'entries',     'forEach',
  'keys',        'size',
  'values'
]
This is an instance of class O: [] [ 'constructor' ]
This is an instance of class Object {}: [] [
  'constructor',
  '__defineGetter__',
  '__defineSetter__',
  'hasOwnProperty',
  '__lookupGetter__',
  '__lookupSetter__',
  'isPrototypeOf',
  'propertyIsEnumerable',
  'toString',
  'valueOf',
  '__proto__',
  'toLocaleString'
]
This is an instance of class Object {}: [] [
  'constructor',
  '__defineGetter__',
  '__defineSetter__',
  'hasOwnProperty',
  '__lookupGetter__',
  '__lookupSetter__',
  'isPrototypeOf',
  'propertyIsEnumerable',
  'toString',
  'valueOf',
  '__proto__',
  'toLocaleString'
]
 */
export {}
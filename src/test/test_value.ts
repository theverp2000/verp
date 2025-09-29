class A {
  static list = [1,2];
}

class B extends Object {
  name = 'BBB'
}

function getValue(obj: any): any {
  if (obj == undefined) // or null
    return obj;
  if (obj instanceof Array) 
    return Array.from(obj)
  if (obj instanceof Set) 
    return new Set(obj)
  if (obj instanceof Map) 
    return new Map(obj)
  if (typeof obj === 'object') 
    return Object.create(obj)
  else // primitive: number, string, boolean, class/function
    return obj;
}

console.log(typeof null, typeof Object.create(null)); // "object",  "object"
console.log(typeof new Set([1]), (new Set([1])) instanceof Set) // #Object
console.log(typeof ([]), ([]) instanceof Array) // # Object
console.log(typeof (new Map()), (new Map()) instanceof Map) // #Object
console.log(typeof Object.create({}), (Object.create({})) instanceof Object)
console.log(typeof (new Object()), (new Object()) instanceof Object)
console.log(typeof {a:1}, ({a:1}) instanceof Object)
console.log(typeof A, A instanceof Object)
console.log(typeof (new A()), (new A()) instanceof Object)
console.log(typeof (new B()), (new B()) instanceof Object)

let b: any = 1;
let a: any = 1;
console.log(typeof a, a, typeof b, b)
b = getValue(a);
a = 2;
console.log(typeof a, a, typeof b, b)

a = true;
console.log(typeof a, a, typeof b, b)
b = getValue(a);
a = false;
console.log(typeof a, a, typeof b, b)

a = 'true';
console.log(typeof a, a, typeof b, b)
b = getValue(a);
a = 'false';
console.log(typeof a, a, typeof b, b)

a = null;
console.log(typeof a, a, typeof b, b)
b = getValue(a);
a = 2;
console.log(typeof a, a, typeof b, b)

a = undefined;
console.log(typeof a, a, typeof b, b)
b = getValue(a);
a = 2;
console.log(typeof a, a, typeof b, b)

a = [1];
console.log(typeof a, a, typeof b, b)
b = getValue(a);
a.push(2);
console.log(typeof a, a, typeof b, b)

a = new Set([1]);
console.log(typeof a, a, typeof b, b)
b = getValue(a);
a.add(2);
console.log(typeof a, a, typeof b, b)

a = new Map([['code', 1]]);
console.log(typeof a, a, typeof b, b)
b = getValue(a);
a.set('name', 2);
console.log(typeof a, a, typeof b, b)

a = A;
console.log(typeof a, a, typeof b, b)
b = getValue(a);
a.list.push(3);
console.log(typeof a, a.list, typeof b, b.list)

a = new B();
b = new B();
console.log(typeof a, a, typeof b, b)
b = getValue(a);
a.name = 'AAA';
console.log(typeof a, a, typeof b, b)

a = new B();
b = new B();
console.log(typeof a, a, typeof b, b)
b = Object.create(a);
a.name = 'AAA';
b.name = 'FFF'
console.log(typeof a, a, typeof b, b)

b = new B();
console.log(typeof a, a, typeof b, b)
b = Object.assign(Object.create(a), a);
a.name = 'AAA';
b.name = 'FFF'
console.log(typeof a, a, typeof b, b)

export {}
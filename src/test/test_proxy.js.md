/* eslint-disable prefer-rest-params */
class Field extends Function {
  // _value: any;
  constructor(val) {
    super();
    this._value = val;
  }
  get value() { return this._value }
  set value(val) { this._value = val }
}

class Model extends Function{
  // id: any
  // arr: any
  // n: any
  static label = new Field('Tony');
  static code = new Field(123);

  constructor(someID, arr, n) {
      super()
      this.id = someID
      this.arr = arr
      this.n = n
      this.label = this.constructor.label;
      this.code = this.constructor.code;

      return new Proxy(this, {
        apply(target, thisArg, ...argumentsList) {
          return target.__call__(argumentsList[0]);
        },
        get(target, prop, receiver) {
          if (prop in target && target[prop] instanceof Field) {
            return target[prop].value;
          }
          return Reflect.get(target, prop, receiver);
        },
        set(target, prop, value) {
          if (prop in target && target[prop] instanceof Field) {
            target[prop].value = value;
            return true;
          }
          return Reflect.set(target, prop, value);
        }
      })
  }
  __call__(a){                  // simple mult functions
      return a * this.n
  }

  *[Symbol.iterator](){         // make it iterable for demo purposes
      // yield *this.arr.map(this) // call itself in a map!
      yield *this.arr.map((e) => e);
  }
}


const f = new Model("FrankenFunction", [1, 2, 3, 4], 5)

// access instance variable
console.log("id:", f.id)

// call it 
console.log("calling with 100: ", f(100))

// use the iterator
// get multiples of calling this on arr
console.log([...f])

// change the __call__ function to power instead
Model.prototype.__call__ = function(a){
  return  a ** this.n 
}
// change n to get squares:
f.n = 2

// call it again with new __call__
console.log("calling with 10:", f(10))  // 10**2
console.log([...f]) // or iterate

console.log('ladel: ', f.label) // or iterate
f.code = 432;
console.log('code: ', f.code) // or iterate

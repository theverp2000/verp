class Field {//extends Function {
  _value: any;
  constructor(val: any) {
    // super();
    this._value = val;
  }
  async __get__(instance, owner): Promise<any> { 
    return this._value 
  }
  async __set__(instance, value) { 
    this._value = value 
  }
}

class Base extends Function {
  protected id: any
  protected arr: any
  protected n: any
}

const secret = Symbol('secret');
const love = Symbol('love');

class Model extends Base {
  [secret]() { return 'I am scared!' }
  [love] = 'I love you!'

  private static label = new Field('Name');
  private static code = new Field(123);

  constructor(someID, arr, n) {
    super()
    this.id = someID
    this.arr = arr
    this.n = n
    const entries = Object.entries(this.constructor);
    for (const [key, field] of entries.filter(([k,v]) => v instanceof Field)) {
      this[key] = field;
    }

    const proxy = new Proxy(this, {
      apply(target, thisArg, args: any[]=[]) {
        return target.__call__(args[0]);
      },
      get(target, prop, receiver): any {
        if (prop in target && target[prop] instanceof Field) {
          return target[prop].__get__(target, target.constructor);
        }
        return Reflect.get(target, prop, receiver);
      },
      set(target, prop, value) {
        if (prop in target && target[prop] instanceof Field) {
          target[prop].__set__(target, value);
          return true;
        }
        return Reflect.set(target, prop, value);
      }
    });

    Object.defineProperty(proxy, 'name', {value: this.constructor.name});

    return proxy;
  }

  private __call__(a) {                  // simple mult functions
      return a * this.n
  }

  *[Symbol.iterator]() {         // make it iterable for demo purposes
      yield *this.arr.map((e: any) => e);
  }
}

async function main() {
  const f: any = new Model("FrankenFunction", [1, 2, 3, 4], 5)

  // access instance variable
  console.log("id:", f.id)

  // call it 
  console.log("calling with 100: ", f(100))

  // use the iterator
  // get multiples of calling this on arr
  console.log([...f])

  // change the __call__ function to power instead
  // Model.prototype.__call__ = function(a){
  //   return  a ** this.n 
  // }
  // change n to get squares:
  // f.n = 2

  // call it again with new __call__
  console.log("calling with 10:", f(10))  // 10**2
  console.log([...f]) // or iterate

  console.log('ladel: ', await f.label)
  console.log('code: ', await f.code)
  f.label = 'Tommy';
  f.code = 432;
  console.log('ladel: ', await f.label)
  console.log('code: ', await f.code)

  const cls = f.constructor;
  console.log(f[secret]())
  console.log(f[love])

}

main()
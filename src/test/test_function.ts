class Dict<T> extends Object {
  [index: string]: any;

  constructor(obj?: any) {
    super(obj);
    if (obj) {
      Dict.fill<T>(this, obj);
    }
  }

  static from<T>(obj: any) {
    return new Dict<T>(obj);
  }

  static fill<T>(dict: Dict<T>, obj: any) {
    if (obj instanceof Map) {
      for (const [key, value] of obj) {
        dict[key] = value as T;
      }
    }
    else if (obj instanceof Set) {
      let i = 0;
      for (const value of obj) {
        dict[String(i++)] = value as T;
      }
    }
    else if (typeof obj === 'object') {
      // Array, Object
      for (const [key, value] of Object.entries<T>(obj)) {
        dict[key] = value as T;
      }
    }
  }

  static fromKeys<T>(list: any[], value: T | null) {
    const dict = new Dict<T>();
    for (const key of Object.values(list)) {
      dict[key] = value;
    }
    return dict;
  }

  *[Symbol.iterator] () {
    for (const [key, value] of Object.entries<T>(this)) {
      yield [key, value];
    }
  }

  forEach(callbackfn: (value: T, key: string, map: Dict<T>) => void, thisArg?: any) {
    for (const [key, val] of Object.entries<T>(this)) {
      callbackfn(val, key, this);
    }
  }

  get length() {
    return Object.keys(this).length; 
  }

  entries(): [string, T][] {
    return Object.entries<T>(this);
  }

  items(): [string, T][] {
    return this.entries();
  }

  keys() {
    return Object.keys(this);
  }

  values() {
    return Object.values<T>(this);
  }

  get(key: string, value?: T) {
    return this[key] == undefined ? value : this[key];
  }

  set(key: string, value: T) {
    this[key] = value;
  }

  setdefault(key: string, value: T): T {
    if (!this.has(key)) {
      this.set(key, value);
    }
    return this[key];
  }

  pop(key: string, value?: T): [string, T|undefined] {
    const res = this[key] as T ?? value;
    delete this[key];
    return [key, res];
  }

  popitem(): [string, T|undefined]{
    const keys = Object.keys(this);
    const key = keys[keys.length - 1];
    return this.pop(key);
  }

  has(key: string): boolean {
    // eslint-disable-next-line no-prototype-builtins
    return key in this || this.hasOwnProperty(key);
  }

  includes(key: string) {
    return this.has(key);
  }

  clear() {
    for (const key of Object.keys(this)) {
      delete this[key];
    }
  }
}

class DefaultDict extends Dict<any> {
  [index:string]: any;
  constructor(defaultInit: Function) {
    super();
    return new Proxy({}, {
      get: (target: any, name) => {
        if (target[name])
          return target[name]; 
        target[name] = defaultInit.name ?
        new (defaultInit as any)()
        : defaultInit()
        return target[name];
      }
    })
  }
}

// const counts = new DefaultDict(Number)
// counts.c++
// console.log(counts.c) // 1

// const lists = new DefaultDict(Array)
// lists.men.push('bob')
// lists.women.push('alice')
// console.log(lists.men) // ['bob']
// console.log(lists.women) // ['alice']
// console.log(lists.nonbinary) // []
// console.log(lists.toString())

const maps = new DefaultDict(() => new DefaultDict(Dict))
// console.log(typeof Map);
const res = maps['men'];
console.log(typeof res);
res['id1']['bob'] = 'BOB' 
// maps.women.set('code', 'alice')
// console.log(maps.men) // ['bob']
// console.log(maps.women) // ['alice']
// console.log(lists.nonbinary) // []
console.log(maps['men'])
console.log(res['id1'])
const res2 = maps.pop('men');
console.log(res2)
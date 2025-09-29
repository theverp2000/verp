import { isAsyncFunction } from 'util/types';

async function aFunc(): Promise<number> {
  return 1;
}

async function sFunc() {
  async function fun(value) {
    value['n'] = await aFunc()
    console.log('Inside func n=%s', value['n'])
  }
  const value = {};
  console.log('Before call Promise n=%s', value['n']);
  return Promise.all([
    console.log('Inside Promise'),
    fun(value),
    console.log('Inside Promise n=%s', value['n'])
  ]);
}

async function getattr(obj: any, attr: string, value?: any): Promise<any> {
  function result(data, value) {
    if (data !== undefined) {
      return data;
    } else {
      if (value === undefined) {
        throw new Error(`${obj} has not attr "${attr}"`)
      }
      return value;
    }
  }

  if ('__get__' in obj) {
    // if (isAsyncFunction(obj['__get__'])) {
    //   const promise = new Promise(function(resolve) {
    //     resolve(obj['__get__'](obj[attr], obj)); // we got data here, so resolve the Promise
    //   })
    //   .then(function(data) {
    //     const res = result(data, value);
    //     console.log('res=%s', res);
    //     return res;
    //   });
    // } else {
      const data = await obj['__get__'](obj[attr], obj);
      return result(data, value)
    // }
  } 
  else {
    try {
      const des: any = Object.getOwnPropertyDescriptor(obj, attr);
      return result(des?.value, value)
      // if (des) {
      //   return des.value;
      // } else {
      //   if (value === undefined) {
      //     throw new Error('Key Error')
      //   }
      //   return value;
      // }
    } catch (e) {
      if (value === undefined) {
        throw new Error('Key Error')
      }
      return value;
    }
  }
}

class Dict extends Object {
  [index: string]: any;

  get(key: string, value?: any) {
    if (!(key in this) && value===undefined) {
      throw new Error('Key error')
    }
    return this[key] == undefined ? value : this[key];
  }

  set(key: string, value: any) {
    this[key] = value;
  }

  async __get__(key: string, value?: any) {
    console.log('called  __get__');
    return this.get(key, value);
  }
}

const d = new Dict();
d.set('attr', 1)

async function doAll() {
  const b = await getattr(d, 'code', 'NAA')
  console.log('b:', b);
  let v;
  getattr(d, 'code').then((a) => {
    v = a;
    console.log('a:', v);
  });
  console.log('v:', v); // => undefined
}
console.log('Main')
doAll();

// console.log(getattr(m, 'attr'))

function monads() {
  function composeM(chainMethod: string) {
    return (...ms: any[]) => 
      ms.reduce((f, g) => {return (x: any) => g(x)[chainMethod](f) });
  }
  
  const composePromises = composeM('then');
  const label = 'API call composition';
   
  // a => Promise(b)
  async function getUserById(id: number) {
    console.log('id', id);
    return id === 3 ?
    Promise.resolve({ name: 'Kurt', role: 'Author' }) : undefined;
  }
  // b => Promise(c)
  async function hasPermission(txt: string, { role }) {
    console.log('txt', txt);
    Promise.resolve(role === 'Author');
  }
   
  // Compose the functions (this works!)
  const authUser = composePromises(hasPermission, getUserById); // 
  console.log(composeM.toString()); // >> 
    // "function composeM(chainMethod) {
    //    return (...ms) => ms.reduce((f, g) => { return (x) => g(x)[chainMethod](f); });
    // }" 
  console.log(composePromises.toString());//  "(...ms) => ms.reduce((f, g) => { return (x) => g(x)[chainMethod](f); })" 
  console.log(authUser.toString()); // >> "(x) => g(x)[chainMethod](f)"
  authUser(3).then((res) => console.log(res, label)); // >> "API call composition"
}
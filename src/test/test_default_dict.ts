class DefaultDict2 extends Function {
  private _data = new Map<any, any>();
  private _defaultFactory;

  constructor(defaultFactory: Function = () => new Object()) {
    super();
    this._defaultFactory = defaultFactory;
    return new Proxy(this, {
      get(target, prop, receiver): any {
        if (target[prop]) {
          return Reflect.get(target, prop, receiver);
        }
        if (!target._data.has(prop)) {
          target._data.set(prop, target._defaultFactory(prop));
        }
        return target._data.get(prop);
      },
      set(target, prop, value, receiver) {
        if (target[prop]) {
          return Reflect.set(target, prop, value, receiver);
        }
        if (!target._data.has(prop)) {
          target._data.set(prop, target._defaultFactory(prop));
        }
        target._data.set(prop, value);
        return true;
      },
      deleteProperty(target, prop): boolean {
        if (prop in target) {
          return Reflect.deleteProperty(target, prop);
        }
        return target._data.delete(prop);
      },
      has(target, prop): boolean {
        if (prop in target) {
          return true;
        }
        return target._data.has(prop);
      }
    });
  }
  
  *[Symbol.iterator]() {
    for (const entry of this._data) {
      yield entry;
    }
  }

  get size() {
    return this._data.size;
  }

  get(key, val) {
    return this._data.get(key) ?? val;
  }

  set(key, val) {
    return this._data.set(key, val);
  }

  has(key) {
    return this._data.has(key);
  }

  entries() {
    return this._data.entries();
  }

  items = this.entries;

  values() {
    return this._data.values();
  }

  keys() {
    return this._data.keys();
  }
}

function main() {
  const dict = new DefaultDict2(() => []) as any;
  dict['tony'].push(100);
  dict['tony'].push(200);
  for (const v of dict) {
    console.log(JSON.stringify(v));
  }

  const dict2 = new DefaultDict2(() => new Set()) as any;
  dict2['tommy'].add(300);
  dict2['tommy'].add(400);
  for (const v of dict2) {
    console.log(v.toString());
  }

  function _get(id) {
    return values[id];
  } 
  const values = {'a': 'AAA', 'b': 'BBB'}
  const dict3 = new DefaultDict2(_get) as any;
  const list: any[] = [];
  list.push(dict3['a']);
  list.push(dict3['b']);
  for (const v of list) {
    console.log(v.toString());
  }

  const dict4 = new DefaultDict2(() => 500) as any;
  const list2: any[] = [];
  list2.push(dict4['a']);
  list2.push(dict4['b']);
  for (const v of list2) {
    console.log(v.toString());
  }
}

main();

export {}
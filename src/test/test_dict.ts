class DefaultDict2 extends Function {
  private _data = new Map<any, any>();
  private _defaultFactory;
  constructor(defaultFactory: any) {
    super();
    this._defaultFactory = defaultFactory;
    return new Proxy(this, {
      get(target, prop, receiver): any {
        if (target[prop]) {
          return Reflect.get(target, prop, receiver);
        }
        if (!target._data.has(prop)) {
          try { // function
            target._data.set(prop, target._defaultFactory(prop));
          } catch(e) {
            if (e instanceof TypeError) {
              try { // class
                target._data.set(prop, new target._defaultFactory(prop));
              } catch(e) { // variables
                target._data.set(prop, target._defaultFactory);
              }
            } else { // variables
              target._data.set(prop, target._defaultFactory);
            }
          }
        }
        return target._data.get(prop);
      }
    });
  }
  
  *[Symbol.iterator]() {
    for (const entry of this._data) {
      yield entry;
    }
  }

  get(key, val) {
    return this._data.get(key) ?? val;
  }
}

function print(dict) {
  for (const d of dict) {
    console.log(d);
  }
}

function main() {
  const dictf = new DefaultDict2(() => {console.log('dict1')});
  const dictv = new DefaultDict2(100);
  const dicta = new DefaultDict2([]);
  const dicts = new DefaultDict2(Set);
  const dictm = new DefaultDict2(Map);
  const dicto = new DefaultDict2(Object);
  const list = [dictf, dictv, dicta, dicts, dictm, dicto];
  for (const dict of list) {
    print(dict);
  }
}

main();
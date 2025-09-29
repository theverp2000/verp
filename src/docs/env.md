const POPULAR_KEYS: Set<any> = new Set(['then', 'args', 'cr', 'uid', 'su', 'registry', 'transaction', 'req', 'cache', '_user', '_cacheKey', '_protected', 'daemonic','label', 'ident']);

export class Environment extends Function {
  private constructor() {
    super();
    return this._getProxy();
  }

  _getProxy() {
    return new Proxy(this, {
      get(target, prop: any, receiver) {
        if (POPULAR_KEYS.has(prop)) { // Fast check
          return Reflect.get(target, prop, receiver);
        }
        if (prop === 'items') { // For debug
          return Reflect.get(target, prop, receiver);
        }
        if (prop !== 'items' && prop in target) {
          return Reflect.get(target, prop, receiver);
        }
        const cls = target.registry.models[prop];
        if (cls) {
          return cls.prototype._browse(receiver, [], []);
        }
        throw new KeyError('Undefined model "%s"', prop);        
      },
    });
  }
}
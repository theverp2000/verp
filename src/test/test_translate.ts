type indexType = string|number|symbol;

class Dict<T> extends Object {
  [index: indexType]: any;

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
        dict[key] = value;
      }
    }
    else if (obj instanceof Set) {
      let i = 1;
      for (const value of obj.values()) {
        dict[i++] = value;
      }
    }
    else if (obj instanceof Array) {
      let i = 1;
      for (const value of Object.values<any>(obj)) {
        i++;
        if (value instanceof Array)
          dict[value[0]] = value[1];
        else
          dict[i] = value;
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

  isEmpty() {
    return this.length == 0;
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

  get(key: indexType, value?: T): T {
    return this[key] !== undefined ? this[key] : value ;
    /*
    if (key in this) {
      return this[key];// !== undefined ? this[key] : value ;
    }
    else if (value !== undefined) {
      return value; 
    }
    throw new KeyError(`KeyError: not found key "${key.toString()}" in %`, this)
    */
  }

  set(key: indexType, value: T) {
    this[key] = value;
  }

  setdefault(key: indexType, value: T): T {
    if (!this.has(key)) {
      this.set(key, value);
    }
    return this[key];
  }

  updateFrom(obj: any) {
    Dict.fill(this, obj);
  }

  pop(key: indexType, value?: T): [string, T] {
    const res = this[key];
    delete this[key];
    return [key.toString(), res !== undefined ? res : value];
  }

  popitem(): [string, T]{
    const keys = Object.keys(this);
    const key = keys[keys.length - 1];
    return this.pop(key);
  }

  has(key: indexType): boolean {
    // eslint-disable-next-line no-prototype-builtins
    return key in this || this.hasOwnProperty(key);
  }

  includes(key: indexType) {
    return this.has(key);
  }

  clear() {
    for (const key of Object.keys(this)) {
      delete this[key];
    }
  }
}

const TRANSLATED_ATTRS = Dict.fromKeys([
  'string', 'add-label', 'help', 'sum', 'avg', 'confirm', 'placeholder', 'alt', 'title', 'aria-label',
  'aria-keyshortcuts', 'aria-placeholder', 'aria-roledescription', 'aria-valuetext',
  'value_label', 'data-tooltip',
], (e: Element) => true); 

function translateAttribValue(node: Element) {
  // check if the value attribute of a node must be translated
  const classes = (node.getAttribute('class') || '').trim().split(' ');
  return (
    (node.tagName === 'input' && (node.getAttribute('type') || 'text') === 'text')
    && !classes.includes('datetimepicker-input') 
    || (node.tagName === 'input' && node.getAttribute('type') === 'hidden')
    && classes.includes('o-translatable-input-hidden')
  )
}

TRANSLATED_ATTRS.forEach((e) => console.log(e));

TRANSLATED_ATTRS.updateFrom([
  ['value', translateAttribValue],
  ['text', (e: Element) => e.tagName ==='field' && (e.getAttribute('widget') || 'url') === 'url'],
  ...TRANSLATED_ATTRS.items().map(([attr, cond]) => [`t-attf-${attr}`, cond])
])

TRANSLATED_ATTRS.forEach((e) => console.log(e));

export {}
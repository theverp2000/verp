function bool(obj: any) {
  if (!obj) return !!(obj);
  if (obj instanceof Map) {
      return obj.size > 0
  }
  else if (obj instanceof Set) {
      return obj.size > 0
  }
  else if (obj instanceof Array) {
      return obj.length > 0
  }
  else if (typeof obj === 'object') {
      return Object.entries(obj).length > 0
  }
  return !!(obj);
}

class A {
  name?: string;
  constructor(name?: string) {
      this.name = name;
  }
}
console.log('***** false')
console.log('false', bool(false))
console.log('null', bool(null))
console.log('undefined', bool(undefined))
console.log('', bool(''))
console.log('[]', bool([]))
console.log('{}', bool({}))
console.log('Set()', bool(new Set()))
console.log('Map()', bool(new Map()))
console.log('Object()', bool(new Object()))

console.log('***** true')
console.log("Object({'a':1})", bool(new Object({'a':1})))
console.log('A()', bool(new A()))
console.log('A("ABC")', bool(new A('ABC')))
console.log('true', bool(true))
console.log('1', bool('1'))
console.log('[1]', bool([1]))
console.log("{'a':1}", bool({'a':1}))
console.log('s', bool(new Set([1])));
console.log('m', bool(new Map([[1,1]])));

export {}
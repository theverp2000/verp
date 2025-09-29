const stringify = JSON.stringify;

const oo = {
  s: 'Ten',
  n: 1.01,
  b: true,
  l: [1, 'list', 1.1],
  e: new Set([1, 'set']),
  m: {name: 'ABC', code: 101},
}

class O {
	*[Symbol.iterator]() {
	}
}

function isIterable(obj: any) {
  // checks for null and undefined
  if (obj == null) {
    return false;
  }
  return typeof obj[Symbol.iterator] === 'function';
}

function isIterable2(obj: any) {
  // checks for null and undefined
  if (obj == null) {
    return false;
  }
  return Array.isArray(obj) || obj instanceof Set || typeof obj.next === 'function';
}

const a = [1]
const s = new Set([1])
const m = new Map()
const d = {}
const o = new O()
console.log('a', isIterable(a), isIterable2(a))//true
console.log('s', isIterable(s), isIterable2(s))//true
console.log('m', isIterable(m), isIterable2(m))//false
console.log('d', isIterable(d), isIterable2(d))//false
console.log('o', isIterable(o), isIterable2(o))//true

function fixJson(obj: any, deep=0): any {
  if (deep++ > 10) {
    return obj;
  }
  if (typeof obj === 'string' || typeof obj !== 'object') {
    return obj;
  }
  const o: Record<string, any> = {}
  for (const entry of Object.entries(obj)) {
    const k: any = String(entry[0]);
    const v: any = entry[1];
    if (typeof v === 'string' || typeof v !== 'object') {
      o[k] = v;
    }
    else if (isIterable(v)) {
      const value: any[] = [];
      for (const e of v) {
        value.push(fixJson(e, deep));
      }
      o[k] = value;
    }
    else if (typeof v === 'object') {
      const value: Record<string, any> = {}
      for (const entry of Object.entries(v)) {
        value[String(entry[0])] = fixJson(entry[1], deep);
      }
      o[k] = value;
    } else {
      o[k] = v;
    }
  }
  return o;
}

console.log(oo);
const j = stringify(oo);
console.log('json: ', j)
const ooo = JSON.parse(j);
const json = stringify(fixJson(oo));
const obj = JSON.parse(json);
console.log('obj: ', obj)
console.log('json: ', stringify(obj))

export {}
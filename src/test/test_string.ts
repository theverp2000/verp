class A {
  toString() {
    return `Class("${this.constructor.name}")`;
  }
}

class B extends A {}

const a = new A();
const b = new B();
const list = [a, b];

function main() {
  console.log(`${a},${b}`);
  console.log(String(a) + ',' + String(b));
  console.log(`${list}`);
  console.log(String(list));
  console.log(`${list.join('.')}`);
}

// output the same: "Class("A").Class("B")"
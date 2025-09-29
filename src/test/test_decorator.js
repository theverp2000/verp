function first(msg?: string) {
  console.log("first(): factory evaluated");
  return function (target: any, propertyKey: string, descriptor: TypedPropertyDescriptor<any>) {
    console.log(`${this} first(): %s called %s`, target, msg);
    // return target;
  };
}
 
function second() {
  console.log("second(): factory evaluated");
  function _second(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    console.log(`decorator second(): ${target}, ${propertyKey}, ${descriptor} called`);
    const originalFunc = descriptor.value;
    const wrapper = async (args: any) => {
      console.log(`${this} called second(): ${target}, ${propertyKey}, ${descriptor}`);
      originalFunc.apply(this, [args]);
    }
    descriptor.value = wrapper;
  }
  return _second;
}

function someDecorator() {
  return function (
    target: Object, propertyKey: string, descriptor: PropertyDescriptor
  ): void {
      const originalFunction = target[propertyKey];
      const wrapper = function (args) {
        // here you have access to `this`:
        console.log(`${this} wrapper ${args}`);
        return originalFunction.call(this, args);
      };
      target[propertyKey] = wrapper;
  };
}
 
class ExampleClass {
  name: string;

  constructor(name) {
    this.name = name;
  }

  toString() {
    return `Str: ${this.name}`
  }
  // @first('Tony')
  @second()
  method() {
    console.log('Method Example Class');
  }

  @someDecorator()
  method1(args) {
    console.log(`${this.name} Method1 Example Class ${args}`);
  }

  static _method() {
    console.log('Example Class');
  }
}
// const _keys = Object.getOwnPropertyNames(ExampleClass);
// console.log(_keys)
// const keys = Object.getOwnPropertyNames(ExampleClass.prototype);
console.log('*** Bat dau ***')
const e = new ExampleClass('Tony');
e.method1([1,2]);

export {}
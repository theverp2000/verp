import util from 'util';

class My {
  debug() {
    console.time('Debug');
    const error = new Error();
    const stack = error.stack?.split('\n') || [];

    util.formatWithOptions({ colors: true }, 'See object %O', { foo: 42 });
    stack.forEach((s) => console.log(s));

    const animals = [
      { animal: 'Horse', name: 'Henry', age: 43 },
      { animal: 'Dog', name: 'Fred', age: 13 },
      { animal: 'Cat', name: 'Frodo', age: 18 }
    ];
    
    console.table(animals);
    console.timeEnd('Debug');
  }
}

const my = new My();
my.debug();

export {}
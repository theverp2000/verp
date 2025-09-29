function test1() {
  // Importing events
  const EventEmitter = require('events');

  // Initializing event emitter instances 
  const eventEmitter = new EventEmitter();

  // Registering to myEvent 
  eventEmitter.on('myEvent', (msg) => {
    console.log(msg);
  });

  // Triggering myEvent
  eventEmitter.emit('myEvent', "First event");
}

function test2() {
  // Importing events
  const EventEmitter = require('events');

  // Initializing event emitter instances 
  let eventEmitter = new EventEmitter();
  
  let geek1 = (msg) => {
      console.log("Message from geek1: " + msg);
  };
  
  let geek2 = (msg) => {
      console.log("Message from geek2: " + msg);
  };

  // Registering geek1 and geek2
  eventEmitter.on('myEvent', geek1);
  eventEmitter.on('myEvent', geek1);
  eventEmitter.on('myEvent', geek2);
  
  // Removing listener geek1 that was
  // registered on the line 33
  eventEmitter.removeListener('myEvent', geek1);
  
  // Triggering myEvent
  eventEmitter.emit('myEvent', "Event occurred");

  // Removing all the listeners to myEvent
  eventEmitter.removeAllListeners('myEvent');

  // Triggering myEvent
  eventEmitter.emit('myEvent', "Event occurred");
}

function test3() {
  const { once, EventEmitter } = require('events');
  
  async function run() {
    const ee = new EventEmitter();
  
    process.nextTick(() => {
      ee.emit('myevent', 42);
    });
  
    const [value] = await once(ee, 'myevent');
    console.log(value);
  
    const err = new Error('kaboom');
    process.nextTick(() => {
      ee.emit('error', err);
    });
  
    try {
      await once(ee, 'myevent');
    } catch (err) {
      console.log('error happened', err);
    }
  }

  run();
}

function test4() {
  const { EventEmitter, once } = require('events');
  
  const ee = new EventEmitter();
  const ac = new AbortController();
  
  async function foo(emitter, event, signal) {
    try {
      await once(emitter, event, { signal });
      console.log('event emitted!');
    } catch (error) {
      if (error.name === 'AbortError') {
        console.error('Waiting for the event was canceled!');
      } else {
        console.error('There was an error', error.message);
      }
    }
  }
  
  foo(ee, 'foo', ac.signal);
  ac.abort(); // Abort waiting for the event
  ee.emit('foo'); // Prints: Waiting for the event was canceled!
}

function test5() {
  const { on, EventEmitter } = require('events');
  
  (async () => {
    const ee = new EventEmitter();
  
    // Emit later on
    process.nextTick(() => {
      ee.emit('foo', 'bar');
      ee.emit('foo', 42);
    });
  
    for await (const event of on(ee, 'foo')) {
      // The execution of this inner block is synchronous and it
      // processes one event at a time (even with await). Do not use
      // if concurrent execution is required.
      console.log(event); // prints ['bar'] [42]
    }
    // Unreachable here
  })();
}

function test6() {
  const { on, EventEmitter } = require('events');
  const ac = new AbortController();

  (async () => {
    const ee = new EventEmitter();

    // Emit later on
    process.nextTick(() => {
      ee.emit('foo', 'bar');
      ee.emit('foo', 42);
    });

    for await (const event of on(ee, 'foo', { signal: ac.signal })) {
      // The execution of this inner block is synchronous and it
      // processes one event at a time (even with await). Do not use
      // if concurrent execution is required.
      console.log(event); // prints ['bar'] [42]
    }
    // Unreachable here
  })();

  process.nextTick(() => ac.abort());
}

// https://stackoverflow.com/questions/53138464/unexpected-behavior-mixing-process-nexttick-with-async-await-how-does-the-event
async function run(){

  process.nextTick(()=>{
      console.log(1);
  });

  await (new Promise<void>(resolve=>resolve()).then(()=>{console.log(2)}));

  console.log(3);

  process.nextTick(()=>{
      console.log(4);
  });

  new Promise<void>(resolve=>resolve()).then(()=>{console.log(5)});

} // Print: 1 2 3 5 4

async function runSame(){

  process.nextTick(()=>{
      console.log(1);
  });

  await Promise.resolve().then(()=>{console.log(2)});

  console.log(3);

  process.nextTick(()=>{
      console.log(4);
  });

  Promise.resolve().then(()=>{console.log(5)});

} // Print: 1 2 3 5 4

// runSame(); // Print: 1 2 3 5 4

// Promise.resolve().then(run); // Print: 2 3 5 1 4

async function run2(){

  Promise.resolve().then(() => {
      console.log(1);
  })
  Promise.resolve().then(() => {
      console.log(2)
  });

  await Promise.resolve().then(()=>{});

  console.log(3);

  Promise.resolve().then(() => {
      console.log(4)
  });

  Promise.resolve().then(()=>{console.log(5)});

}

// run2(); // Print: 1 2 3 4 5

async function run3(){

  process.nextTick(async ()=>{
      console.log(1);
      await Promise.resolve().then(()=>{console.log(2)});
      console.log(3);
      process.nextTick(()=>{
          console.log(4);
          Promise.resolve().then(()=>{console.log(5)});
      });
  });
}

run3(); // Print: 1 2 3 4 5
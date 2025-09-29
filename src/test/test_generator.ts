import {CountingStream, iter} from './../core/tools/iterable'

const stream = new CountingStream(iter(['a','b','c']));
console.log('Start.....')

for (const value of stream) {
  console.log(stream.index, value)
}
// console.log(stream.return(0));

// let value = stream.next();
// while (!value.done){
//   console.log(stream.index, value)
//   value = stream.next();
// }

export {}
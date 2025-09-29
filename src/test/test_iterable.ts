import * as _ from '../core/tools/iterable';


function main() {
  const s1 = _.repeat(10);
  const s2 = new Set(['a', 'b', 'c', 'd']);
  for (const val of _.zip(s1, s2, '*')) {
    console.log(val);
  }
}

main();

export {}
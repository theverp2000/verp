function *splitEvery(n: number, iterable: any[], pieceMaker:any=Array) {
  iterable = Array(...iterable);
  let piece = iterable.splice(0, n);
  while (piece.length) {
    yield piece;
    piece = iterable.splice(0, n);
  }
}

const list = [1,2,3,4,5,6,7,8,9,10];

for (const subIds of splitEvery(3, list)) {
  console.log(subIds);
}

export {};
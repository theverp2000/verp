function *protecting(what: any, records: any) {
  try {
    console.log('Try in protecting')
    yield 10;
  } finally {
    console.log('Finally protecting');
  }
}

function main() {
  const p = protecting({}, {});
  console.log(p.next());
}

main();

export {}
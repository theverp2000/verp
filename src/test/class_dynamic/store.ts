export class Tesla {
  constructor(private ai: string) {
    console.log(`${ai} is driving Tesla`);
  }
}

export class Audi {
  constructor(private ai: string) {
    console.log(`${ai} is driving Audi`);
  }
}

export const Store: any = {
  Tesla,
  Audi
}
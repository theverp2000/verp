// const commands = new Map<string, any>();

import * as path from "path";

console.log('In module %s', __filename);

function getModule(modul: any) {
  const name: string[] = [];
  // let modul: any = module;
  while (modul != null) {
    name.push(path.basename(modul.filename, '.ts'));
    modul = modul.parent;
  }
  return name.reverse().join('.');
}

class Command {
  name: string;

  show(str: string) {
    console.log(`I'm a ${str}`);
    console.log(getModule(module));
  }
}

function main() {
  // console.log(`CommonJs Command.main with process.argv=${process.argv}`);
  const args = process.argv.slice(2);
  console.log(`CommonJs Command.main with args=${args}.`);
}


exports = module.exports = new Command();

exports.program = exports;
exports.Command = Command;
exports.main = main;

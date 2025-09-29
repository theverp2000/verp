// const commands = new Map<string, any>();

console.log('In module %s',  __filename);

class Command {
  name: string;

  show(str: string) {
    console.log(`I'm a ${str}`);
    console.log(module.id);
  }
}

function main() {
  // console.log(`Es2017 Command.main with process.argv=${process.argv}`);
  const args = process.argv.slice(2);
  console.log(`Es2017 Command.main with args=${args}.`);
}

const program = new Command();

export default program;

export {
  Command,
  program,
  main
}
// https://2ality.com/2022/07/nodejs-child-process.html

import fs from 'fs';
import assert from 'node:assert';
import { spawn, spawnSync } from 'node:child_process';
import { Readable, Writable } from 'node:stream';
import path from 'path';

// https://stackoverflow.com/questions/10623798/how-do-i-read-the-contents-of-a-node-js-stream-into-a-string-variable
async function streamToString(stream) {
  const chunks: any[] = [];
  return new Promise((resolve, reject) => {
    stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
    stream.on('error', (err) => reject(err));
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
  })
}

async function test232() {
  const childProcess = spawn(
    'echo "Hello, how are you?"',
    {
      shell: true, // (A)
      stdio: ['ignore', 'pipe', 'inherit'], // (B)
    }
  );
  // const stdout = Readable.toWeb(
  //   childProcess.stdout.setEncoding('utf-8'));  
  console.log(
    await streamToString(childProcess.stdout),
    'Hello, how are you?\n' // (C)
  );
}

async function test233() {
  async function echoUser({shell, args}) {
    const childProcess = spawn(
      `echo`, args,
      {
        stdio: ['ignore', 'pipe', 'inherit'],
        shell,
      }
    );
    // const stdout = Readable.toWeb(
    //   childProcess.stdout.setEncoding('utf-8'));
    return streamToString(childProcess.stdout);
  }
  
  // Results on Unix
  assert.equal(
    await echoUser({shell: false, args: ['$USER']}), // (A)
    '$USER\n'
  );
  assert.equal(
    await echoUser({shell: true, args: ['$USER']}), // (B)
    'rauschma\n'
  );
  assert.equal(
    await echoUser({shell: true, args: [String.raw`\$USER`]}), // (C)
    '$USER\n'
  );
}

async function test234() {
  const childProcess = spawn(
    `(echo cherry && echo apple && echo banana) | sort`,
    {
      stdio: ['ignore', 'pipe', 'inherit'],
      shell: true,
    }
  );
  // const stdout = Readable.toWeb(
  //   childProcess.stdout.setEncoding('utf-8'));
  assert.equal(
    await streamToString(childProcess.stdout),
    'apple\nbanana\ncherry\n'
  );
}

async function test24() {
  const childProcess = spawn(
    `sort`, // (A)
    {
      stdio: ['pipe', 'pipe', 'inherit'],
    }
  );
  const stdin = Writable.toWeb(childProcess.stdin); // (B)
  const writer = stdin.getWriter(); // (C)
  try {
    await writer.write('Cherry\n');
    await writer.write('Apple\n');
    await writer.write('Banana\n');
  } finally {
    writer.close();
  }
  
  // const stdout = Readable.toWeb(
  //   childProcess.stdout.setEncoding('utf-8'));
  assert.equal(
    await streamToString(childProcess.stdout),
    'Apple\nBanana\nCherry\n'
  );
}

async function test25() {
  const echo = spawn( // (A)
    `echo cherry && echo apple && echo banana`,
    {
      stdio: ['ignore', 'pipe', 'inherit'],
      shell: true,
    }
  );
  const sort = spawn( // (B)
    `sort`,
    {
      stdio: ['pipe', 'pipe', 'inherit'],
      shell: true,
    }
  );

  //==== Transferring chunks from echo.stdout to sort.stdin ====

  const echoOut = Readable.toWeb(
    echo.stdout.setEncoding('utf-8'));
  const sortIn = Writable.toWeb(sort.stdin);

  const sortInWriter = sortIn.getWriter();
  try {
    for await (const chunk of echoOut) { // (C)
      await sortInWriter.write(chunk);
    }
  } finally {
    sortInWriter.close();
  }

  //==== Reading sort.stdout ====

  // const sortOut = Readable.toWeb(
  //   sort.stdout.setEncoding('utf-8'));
  assert.equal(
    await streamToString(sort.stdout),
    'apple\nbanana\ncherry\n'
  );
}

async function test25_sass() {
  const sass = spawn(
    `rtlcss -`,
    {
      stdio: ['pipe', 'pipe', 'inherit'],
      shell: true,
    }
  );

  const str = `html {
    direction:ltr;
    font-family: "Droid Sans", sans-serif/*rtl:prepend:"Droid Arabic Kufi"*/;
    font-size:16px/*rtl:14px*/;
  }`;
  const sortIn = Writable.toWeb(sass.stdin);

  const sortInWriter = sortIn.getWriter();
  try {
    await sortInWriter.write(str);
  } finally {
    sortInWriter.close();
  }

  //==== Reading sass.stdout ====
  const result = await streamToString(sass.stdout);
  console.log(result);
}

async function test261() {
  const childProcess = spawn(
    'echo hello',
    {
      stdio: ['inherit', 'inherit', 'pipe'],
      shell: '/bin/does-not-exist', // (A)
    }
  );
  childProcess.on('error', (err) => { // (B)
    console.log(err.toString());
    assert.equal(
      err.toString(),
      'Error: spawn /bin/does-not-exist ENOENT'
    );
  });
}

async function test262() {
  const childProcess = spawn(
    'does-not-exist',
    {
      stdio: ['inherit', 'inherit', 'pipe'],
      shell: true,
    }
  );
  childProcess.on('exit',
    async (exitCode, signalCode) => { // (A)
      assert.equal(exitCode, 1, 'OK')//127);
      assert.equal(signalCode, null);
      // const stderr = Readable.toWeb(
      //   childProcess.stderr.setEncoding('utf-8'));
      const err = await streamToString(childProcess.stderr);
      console.log(err);
      assert.equal(
        err,
        '/bin/sh: does-not-exist: command not found\n'
      );
    }
  );
  childProcess.on('error', (err) => { // (B)
    console.error('We never get here!');
  });
}

async function test263() {
  const childProcess = spawn(
    'kill $$', // (A)
    {
      stdio: ['inherit', 'inherit', 'pipe'],
      shell: true,
    }
  );
  console.log(childProcess.pid); // (B)
  childProcess.on('exit', async (exitCode, signalCode) => {
    assert.equal(exitCode, 1); //null (C)
    assert.equal(signalCode, null);//'SIGTERM'); // (D)
    const stderr = Readable.toWeb(
      childProcess.stderr.setEncoding('utf-8'));
    const msg = await streamToString(childProcess.stderr);
    console.log(msg);
    assert.equal(
      msg,
      '' // (E)
    );
  });
}

async function test271() {
  const tmpFile = __dirname + path.sep + 'tmp-file.txt';
  const childProcess = spawn(
    `(echo first && echo second) > "${tmpFile}"`,
    {
      shell: true,
      stdio: 'inherit',
    }
  );
  childProcess.on('exit', (exitCode, signalCode) => { // (A)
    assert.equal(exitCode, 0);
    assert.equal(signalCode, null);
    assert.equal(
      fs.readFileSync(tmpFile, {encoding: 'utf-8'}),
      'first \r\nsecond\r\n'
    );
  });
}

async function test272() {
  async function onExit(eventEmitter) {
    return new Promise<any>((resolve, reject) => {
      eventEmitter.once('exit', (exitCode, signalCode) => {
        if (exitCode == 0) { // (B)
          resolve({exitCode, signalCode});
        } else {
          reject(new Error(
            `Non-zero exit: code ${exitCode}, signal ${signalCode}`));
        }
      });
      eventEmitter.once('error', (err) => { // (C)
        reject(err);
      });
    });
  }

  const tmpFile = __dirname + path.sep + 'tmp-file.txt';
  const childProcess = spawn(
    `(echo first && echo second) > ${tmpFile}`,
    {
      shell: true,
      stdio: 'inherit',
    }
  );
  
  const {exitCode, signalCode} = await onExit(childProcess); // (A)
  
  assert.equal(exitCode, 0);
  assert.equal(signalCode, null);
  assert.equal(
    fs.readFileSync(tmpFile, {encoding: 'utf-8'}),
    'first \r\nsecond\r\n'
  );
}

async function test281() {
  const abortController = new AbortController(); // (A)

  const childProcess = spawn(
    `echo Hello`,
    {
      stdio: 'inherit',
      shell: true,
      signal: abortController.signal, // (B)
    }
  );
  childProcess.on('error', (err) => {
    console.log(err.toString());
    assert.equal(
      err.toString(),
      'AbortError: The operation was aborted'
    );
  });
  abortController.abort(); // (C)
}

async function test282() {
  const childProcess = spawn(
    `echo Hello`,
    {
      stdio: 'inherit',
      shell: true,
    }
  );
  childProcess.on('exit', (exitCode, signalCode) => {
    console.log(exitCode, signalCode);
    assert.equal(exitCode, null);
    assert.equal(signalCode, 'SIGTERM');
  });
  childProcess.kill(); // default argument value: 'SIGTERM'
}

async function test31() {
  spawnSync(
    'echo', ['Command starts'],
    {
      stdio: 'inherit',
      shell: true,
    }
  );
  console.log('After spawnSync()');
}

async function test32() {
  const result = spawnSync(
    `echo rock && echo paper && echo scissors`,
    {
      stdio: ['ignore', 'pipe', 'inherit'], // (A)
      encoding: 'utf-8', // (B)
      shell: true,
    }
  );
  console.log(result);
  assert.equal(
    result.stdout, // (C)
    'rock \r\npaper \r\nscissors\r\n'
  );
  assert.equal(result.stderr, null); // (D)
}

async function test33() {
  const result = spawnSync(
    `sort`,
    {
      stdio: ['pipe', 'pipe', 'inherit'],
      encoding: 'utf-8',
      input: 'Cherry\nApple\nBanana\n', // (A)
    }
  );
  assert.equal(
    result.stdout,
    'Apple\r\nBanana\r\nCherry\r\n'
  );
}

async function test341() {
  const result = spawnSync(
    'echo hello',
    {
      stdio: ['ignore', 'inherit', 'pipe'],
      encoding: 'utf-8',
      shell: '/bin/does-not-exist',
    }
  );
  console.log(result);
  assert.equal(
    result.error?.toString(),
    'Error: spawnSync /bin/does-not-exist ENOENT'
  );
}

async function test342() {
  const result = spawnSync(
    'does-not-exist',
    {
      stdio: ['ignore', 'inherit', 'pipe'],
      encoding: 'utf-8',
      shell: true,
    }
  );
  console.log(result);
  assert.equal(result.status, 1);
  assert.equal(result.signal, null);
  assert.equal(
    result.stderr, 
    // linux: '/bin/sh: does-not-exist: command not found\n'
    "'does-not-exist' is not recognized as an internal or external command,\r\n" + 'operable program or batch file.\r\n'
  );
}

async function test343() {
  const result = spawnSync(
    // 'kill $$', // linux
    `taskkill /F /PID $$`, // windows
    {
      stdio: ['ignore', 'inherit', 'pipe'],
      encoding: 'utf-8',
      shell: true,
    }
  );
  console.log(result);
  assert.equal(result.status, 1);
  assert.equal(result.signal, 'SIGTERM');
  assert.equal(result.stderr, ''); // (A)
}

async function main() {
  console.log('Start');
  await test25_sass();
  console.log('Stop');
};

main();
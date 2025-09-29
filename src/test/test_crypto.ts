import * as fs from 'fs';
import crypto, { createCipheriv, createDecipheriv, randomBytes, scryptSync, timingSafeEqual } from 'crypto';


const filePath = __dirname + '/test_file/res.lang.csv';

function sha1(str) {
  return crypto
  .createHash('sha1')
  .update(JSON.stringify(str), 'utf-8')
  .digest('hex');
}

async function main2() {
  const buf = fs.readFileSync(filePath);
  const str = fs.readFileSync(filePath, {
    encoding: "utf8",
  });
  console.log(crypto.createHmac(buf.toString(), 'sha1'));
  console.log(sha1(str));
  console.log(
    await new Promise((resolve, reject) => {
      const hash = crypto.createHash("sha1");
      const input = fs.createReadStream(filePath);
      input.on("readable", () => {
        const data = input.read();
        if (data) {
          hash.update(data);
        } else {
          resolve(hash.digest("hex"));
        }
      });
    })
  );
}

function test_checksum() {
  fs.readFile(filePath, function(err, data) {
    var checksum = generateChecksum(data);
    console.log(checksum);
  });
}

function generateChecksum(str, algorithm?:any, encoding?:any) {
  return crypto
      .createHash(algorithm || 'sha1')
      .update(str, 'base64')
      .digest(encoding || 'hex');
}


const algorithm = 'aes-192-cbc';
const salt = randomBytes(24); // 192/8
const lifetime = 25000;
//Encrypting text
function encrypt(pass) {
  const hashedPassword = scryptSync(pass, salt, 24);
  console.log(hashedPassword.byteLength);
  const iv = randomBytes(16);
  const cipher = createCipheriv(algorithm, hashedPassword, iv);

  const encrypted = Buffer.concat([cipher.update(pass), cipher.final()]);
  return { algorithm, key: hashedPassword.toString('hex'), iv: iv.toString('hex'), encrypted: encrypted.toString('hex') };
}

function encrypt2(pass) {
  const keyEncrypt = scryptSync(pass, salt, 24);
  console.log(keyEncrypt.byteLength);
  const iv = randomBytes(16);
  const cipher = createCipheriv(algorithm, keyEncrypt, iv);

  const textToEncrypt = 'My Secret Text';
  const encrypted = Buffer.concat([
    cipher.update(textToEncrypt, 'utf8'),
    cipher.final(),
  ]);
  return { algorithm, key: keyEncrypt.toString('hex'), iv: iv.toString('hex'), encrypted: encrypted.toString('hex') };
}

// Decrypting text
function decrypt(info) {
  let key = Buffer.from(info.key, 'hex');
  let iv = Buffer.from(info.iv, 'hex');
  let encrypted = Buffer.from(info.encrypted, 'hex');

  let decipher = createDecipheriv(info.algorithm, key, iv);
  let decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString();
}

function _test() {
  const pass = 'admin';
  const info = encrypt(pass);
  const saved = `$${info.algorithm}$${lifetime}$${info.key}$${info.iv}$${info.encrypted}`
  console.log(saved);
  const inverse = decrypt(info); 
  console.log(inverse);
}

function test() {
  const pass = 'admin';
  const salt1 = Buffer.from('719cd67d5616c82ade9a1484e0988cc5', 'hex');
  const key1 = scryptSync(pass, salt1, 64);
  // const saved = `${key1.toString('hex')}.${salt1.toString('hex')}`;
  const saved = "67f85c39aa4b5b43621a9675dd8c51c06763c3068bcbaceec72bbd66000554804fc3cdec7a2d427a4a54e400a27e576094fd981d9e0fa2ab90abed404c7711d.22f9c1e08541ecc73cf5b15429e62ead";
  console.log(saved);
  
  const [key, salt] = saved.split(".");
  const savedPasswordBuf = Buffer.from(key, "hex");
  const passwordBuf = scryptSync(pass, Buffer.from(salt, "hex"), 64);
  console.log(timingSafeEqual(passwordBuf, savedPasswordBuf));
}

test();

export {}
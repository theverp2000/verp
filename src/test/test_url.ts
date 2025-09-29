import _ from 'lodash';
import * as utf8 from 'utf8';
import { format } from 'util';

function encodeRFC3986URI(str: string) {
  return encodeURI(str)
    .replace(/%5B/g, "[")
    .replace(/%5D/g, "]")
    .replace(
      /[!'()*]/g,
      (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`
    );
}

const URI_SAFE = `!#$&'()*+,-./0123456789:;=?@ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz~`;

const COM_SAFE = `!'()*-.0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz~`;

const ALL_SAFE = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

/**
 * utf 128 nochanged: ☺☻♥♦♣♠\n♫☼►◄↕‼¶§▬↨↑↓→∟↔▲▼123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\]^_`abcdefghijklmnopqrstuvwxyz{|}~⌂
 * uri 82 charcodes nochanged: !#$&'()*+,-./0123456789:;=?@ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz~
 * com 71 charcodes nochanged: !'()*-.0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz~
 *     com < uri 11 charcodes: #$&+,/:;=?@
 * all changed ex 61 alphanum: 0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz
 * @param str 
 * @param type default = uri # undefined
 * @returns 
 */
function encode(str: string, type?: 'uri'|'com'|'all'|'utf8'|'utf-8'|undefined) {
  if (type === 'utf8' || type === 'utf-8') {
    return utf8.encode(str);
  }
  else if (type === 'com') {
    return encodeURIComponent(str);
  }
  else if (type === 'all') {
    return encodeURIComponent(str)
        .replace(/\-/g, '%2D')
        .replace(/\_/g, '%5F')
        .replace(/\./g, '%2E')
        .replace(/\!/g, '%21')
        .replace(/\~/g, '%7E')
        .replace(/\*/g, '%2A')
        .replace(/\'/g, '%27')
        .replace(/\(/g, '%28')
        .replace(/\)/g, '%29');
  } else {
    return encodeURI(str); // 'uri' or undefined
  }
}

function decode(str: string, type?: 'uri'|'com'|'all'|'utf8'|'utf-8'|undefined) {
  if (type === 'utf8' || type === 'utf-8') {
    return utf8.encode(str);
  }
  else if (type === 'com') {
    return decodeURIComponent(str);
  }
  else if (type === 'all') {
    return decodeURIComponent(
        str
            .replace(/\\%2D/g, '-')
            .replace(/\\%5F/g, '_')
            .replace(/\\%2E/g, '.')
            .replace(/\\%21/g, '!')
            .replace(/\\%7E/g, '~')
            .replace(/\\%2A/g, '*')
            .replace(/\\%27/g, "'")
            .replace(/\\%28/g, '(')
            .replace(/\\%29/g, ')')
    );
  } else {
    return decodeURI(str);
  }
}

class UnicodeError extends Error {};

function cleanString(input: string, errors: string = 'replace') {
  var output = "";
  for (var i = 0; i < input.length; i++) {
    if (input.charCodeAt(i) <= 127) {
      output += input.charAt(i);
    } else {
      if (errors === 'ignore') {
        continue;
      } else if (errors === 'backslashreplace') {
        output += '\\';
      } else if (errors === 'namereplace') {
        output += `[${i}]<${input.charCodeAt(i)}>`;
      } else if (errors === 'strict') {
        throw new UnicodeError(`String "${input}" error at [${i}] charcode ${input.charCodeAt(i)}`);
      } else {
        output += '?';
      }
    }
  }
  return output;
}

const ALWAYS_SAFE = Buffer.from("abcdefghijklmnopqrstuvwxyz"
  + "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
  + "0123456789"
  + "-._~");
const BYTE_TO_HEX = _.range(256).map(char => cleanString(format("%%%s", char.toString(16).toUpperCase())));

function _union(bufferA: any, bufferB: any) {
  for (let i = 0; i < bufferB.length; i++) {
    const byteB = bufferB.subarray(i, i+1);
    if (!bufferA.includes(byteB)) { // Checks if byteA exists anywhere in bufferB
      bufferA = Buffer.concat([bufferA, byteB]);
    }
  }
  return bufferA; // Returns a new Buffer with unique common bytes
}

function urlQuote(str, options: { charset?: string, errors?: string, safe?: any, unsafe?: any }={}) {
  let { charset='utf-8', errors='strict', safe='/:', unsafe='' } = options;
  if (!(str instanceof Uint8Array) || typeof str !== 'string')
    str = String(str)
  if (typeof str === 'string') {
    str = cleanString(str, errors);
    str = Buffer.from(str as any, charset as BufferEncoding);
  }
  if (typeof safe === 'string')
    safe = Buffer.from(safe) as any;
  if (typeof unsafe === 'string')
    unsafe = Buffer.from(unsafe) as any;
  safe =  _union(safe, ALWAYS_SAFE);
  let rv: any = Buffer.from('');
  for (const char of str) {
    if (safe.includes(char)) {
      rv = Buffer.concat([rv, Buffer.from([char])]);
    }
    else {
      rv = Buffer.concat([rv, Buffer.from(BYTE_TO_HEX[char])]);
    }
  }
  return Buffer.from(rv).toString(charset as BufferEncoding);
}

function compareEncodes() {
  const arr = Array(256)
      .fill(0)
      .map((_, i) => String.fromCharCode(i))
      // .filter((c) => encodeURI(c) != encodeURIComponent(c));
  const _encodeURI = arr.filter(c => encode(c).length == 1);
  console.log(_encodeURI.length, _encodeURI.join(''))
  // encodeURI nochange
  // 82: !#$&'()*+,-./0123456789:;=?@ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz~

  const _encodeURIComponent = arr.filter(c => encode(c, 'com').length == 1);
  console.log(_encodeURIComponent.length, _encodeURIComponent.join(''))
  // encodeURIComponent nochange
  // 71: !'()*-.0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz~

  console.log(arr.filter((c) => encode(c) != encode(c, 'com')).join(''))
  // 11: #$&+,/:;=?@

  const _encodeAll = arr.filter(c => encode(c, 'all').length == 1);
  console.log(_encodeAll.length, _encodeAll.join(''))
  // 62: encode nochange
  // 0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz

  const _encodeUTF = arr.filter(c => encode(c, 'utf8').length == 1);
  console.log(_encodeUTF.length, _encodeUTF.join(''))
  // 128 ☺☻♥♦♣♠\n♫☼►◄↕‼¶§▬↨↑↓→∟↔▲▼123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\]^_`abcdefghijklmnopqrstuvwxyz{|}~⌂

  // console.log("encode(c) != encode(c, 'utf8')")
  // console.log(arr.filter((c) => encode(c) != encode(c, 'utf8')).join(''))
}

// compareEncodes();

function main() {
  // const str = Array(256).fill(0).map((_, i) => String.fromCharCode(i)).join('');
  const str = "http://localhost:7979/web#cids=1&menuId=5&action=37&model=ir.module.module&viewType=kanban&-_.!~*'()&:;=?@"
  // console.log(str);
  console.log(urlQuote(str, {safe: URI_SAFE})); // encodeURI
  console.log(urlQuote(str, {safe: COM_SAFE})); // encodeURIComponent
  console.log(urlQuote(str, {safe: ALL_SAFE})); // encodeAlphanum
}

main()

export {}
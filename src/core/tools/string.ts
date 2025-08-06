import _ from "lodash";
import { format, TextDecoder } from "util";
import { isInstance } from "./func";
import { stringify } from "./json";

export const f = format;

/**
 * i_love_you_so_much => iLoveYouSoMuch => ILoveYouSoMuch
 * @param str
 * @returns
 */
export function UpCamelCase(str: string) {
  return _.upperFirst(_.camelCase(str));
}

/**
 * iLoveYouSoMuch => i-love-you-so-much
 * ILoveYouSoMuch => i-love-you-so-much
 * @param s
 * @returns
 */
export function camelToHyphen(s: string) {
  return _.lowerFirst(s).replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}

/**
 * iLoveYouSoMuch => i_love_you_so_much
 * ILoveYouSoMuch => i_love_you_so_much
 * @param s
 * @returns
 */
export function camelCaseTo_(s: string) {
  return _.lowerFirst(s).replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase();
}

/**
 * iLoveYouSoMuch => i_love_you_so_much
 * ILoveYouSoMuch => i.love.you.so.much
 * @param s
 * @returns
 */
export function camelCaseToDot(s: string) {
  return _.lowerFirst(s).replace(/([a-z])([A-Z])/g, '$1.$2').toLowerCase();
}

export function ustr(data) {
  return String(data);
}

/**
 * i_love_you_so_much => i-love-you-so-much
 * @param s
 * @returns
 */
export function _toHyphen(s: string) {
  return s.replace(/_/g, '-');
}

export function _format(str: string, replacements: Record<string, any> = {}): string {
  return str.replace(
    /{\w+}/g,
    (all) => replacements[all.substring(1, all.length - 1)] ?? all
  );
}

export const _f = _format;

export function _format2(str: string, replacements: Record<string, any> = {}): string {
  return str.replace(
    /%\(\w+\)[ds]/g,
    (all) => replacements[all.substring(2, all.length - 2)] ?? all
  );
}

export const _f2 = _format2;

/**
 * Convert %s in string to $n, with n = 1...
 * @param str
 * @param fmt
 * @returns
 */
export function _convert$(str: string, fmt = '%s') {
  let index = 0;
  let i = 0;
  while (true) {
    index = str.indexOf(fmt, index);
    if (index == -1)
      break;
    str = str.replace(fmt, `$${++i}`);
  }
  return str;
}

export function rstrip(str: string, sub: string = '/') {
  if (str.endsWith(sub)) {
    return str.substring(0, str.length - sub.length);
  } else {
    return str;
  }
}

export function lstrip(str: string, sub: string = ' ') {
  if (str.startsWith(sub)) {
    return str.substring(sub.length);
  } else {
    return str;
  }
}

export function strip(str: string, char?: string) {
  if (!str) {
    return str;
  }
  if (!char) {
    return str.trim();
  }
  if (str.startsWith(char)) {
    str = str.slice(1);
  }
  if (str.endsWith(char)) {
    str = str.slice(0, -1);
  }
  return str;
}

/**
 * This function is difference to function stringify
 * ex: d = {'a': 'text', 'b': 100, 'c': true, 'd': [1,1], 'e': {ee: 1}}
 * stringify => '{"a":"text", "b": 100, "c": true, "d": [1,1], "e": {"ee": 1}}'
 * this func => "{'a': 'text','b': 100, 'c': true, 'd': [1,1], 'e': {'ee': 1}}"
 * @param obj
 * @returns string
 */
export function objectToText(obj) {
  //create an array that will later be joined into a string.
  var result = [];

  //is object
  //    Both arrays and objects seem to return "object"
  //    when typeof(obj) is applied to them. So instead
  //    I am checking to see if they have the property
  //    join, which normal objects don't have but
  //    arrays do.
  if (typeof (obj) == "object" && (obj.join == undefined)) {
    result.push("{");
    for (const prop in obj) {
      result.push(`'${prop}'`, ": ", objectToText(obj[prop]), ",");
    };
    result.push("}");

    //is array
  } else if (typeof (obj) == "object" && !(obj.join == undefined)) {
    result.push("[");
    for (const prop in obj) {
      result.push(objectToText(obj[prop]), ",");
    }
    result.push("]");

    //is function
  } else if (typeof (obj) == "function") {
    result.push(obj.toString());

    //quotes with string
  } else if (typeof (obj) == "string") {
    result.push(`'${obj}'`);

    //all other values can be done with JSON.stringify
  } else {
    result.push(JSON.stringify(obj));
  }

  return result.join("");
}

export function isASCII(str: string, extended: boolean = false) {
  return (extended ? /^[\x00-\xFF]*$/ : /^[\x00-\x7F]*$/).test(str);
}

export function num2words(num: number, lang: string) {
  return String(num);
}

export function repr(obj: any) {
  if ((typeof obj === 'object' || typeof obj === 'function') && ('repr' in obj)) {
    return obj.repr();
  }
  return stringify(obj);
}/**
 *  Generates a text value (an instance of textType) from an arbitrary
    source.
    * false and null are converted to empty strings
    * text is passed through
    * bytes are decoded as UTF-8
    * rest is textified via the current version's relevant data model method
 * @param source
 * @returns
 */

export function toText(source) {
  if (source == null || source === false)
    return '';

  if (isInstance(source, Uint8Array))
    return (new TextDecoder('utf-8')).decode(source);

  if (typeof source === 'string')
    return source;

  return stringify(source);
}

export function stringPart(str: string, sub: string): [string, string, string] {
  var index = str.indexOf(sub); // Gets the first index where a sub occours
  if (index < 0) {
    return [str, '', ''];
  }
  return [str.substring(0, index), sub, str.substring(index + sub.length)];
}

export function rstringPart(str: string, sub: string): [string, string, string] {
  var index = str.lastIndexOf(sub); // Gets the last index where a space occours
  if (index < 0) {
    return ['', '', str];
  }
  return [str.substring(0, index), sub, str.substring(index + sub.length)];
}

export const rpartition = rstringPart;

export function split(str: string, sep: string = ' ', num: number = 1): string[] {
  const split = str.split(sep);
  const last = split.slice(num).join(sep);
  return num ? split.slice(0, num).concat(last ? [last] : []) : split;
}

export function rsplit(str: string, sep: string = ' ', num: number = 1): string[] {
  const split = str.split(sep);
  const last = split.slice(0, -num).join(sep);
  return num ? (last ? [last] : []).concat(split.slice(-num)) : split;
}

export function removeQuotes(value: string, quotes = `"'`) {
  if (value.slice(0, 1) === value.slice(-1) && quotes.includes(value[0])) {
    value = value.slice(1, -1);
  }
  return value;
}

export function ellipsis(text: string, size: number, chars: string = '...') {
  if (text.length > size) {
    return text.slice(0, size - chars.length) + chars;
  }
  return text;
}

export async function replaceAsync(str, regex, asyncFn) {
  const promises = [];
  str.replace(regex, (match, ...args) => {
    const promise = asyncFn(match, ...args);
    promises.push(promise);
  });
  const data = await Promise.all(promises);
  return str.replace(regex, () => data.shift());
}

export function escapeRegExp(text: string) {
  return text ? text.replace(/[[\]{}()*+?./,^$|#\s\t\n\r\v\f]/g, '\$&') : text;
}

/**
 * utf8 128 nochanged: ☺☻♥♦♣♠\n♫☼►◄↕‼¶§▬↨↑↓→∟↔▲▼123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\]^_`abcdefghijklmnopqrstuvwxyz{|}~⌂
 * uri  82 charcodes nochanged: !#$&'()*+,-./0123456789:;=?@ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz~
 * com  71 charcodes nochanged: !'()*-.0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz~
 *      com < uri 11 charcodes: #$&+,/:;=?@
 * all changed ex 61 alphanum: 0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz
 * @param str 
 * @param type 
 * @returns 
 */
function encode(str: string, type?: 'uri' | 'com' | 'all' | undefined) {
  if (type === 'com') {
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

function decode(str: string, type?: 'uri' | 'com' | 'all' | undefined) {
  if (type === 'com') {
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
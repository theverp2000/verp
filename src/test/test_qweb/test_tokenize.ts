import { LexicalAnalyzer, Generator } from 'javascript-compiling-tokenizer';

// const exrp = `
//   const m = {'a': 1, 'b': 2};
//   request
//     . header["body"]
//     .csrfToken();
// `;

const exrp = `for (const i of await request.csrfToken()) {}`;

// const exrp = `
//   import 'util';
//   async function f(a) {
//     const con;
//     let le;
//     request.header['body'].csrfToken();
//     console.log(arr, '"Here"', arr.filter((a) => !a));
//   }
//   let b = await f(100);
// `;
const tree = new LexicalAnalyzer({verbose: false}).start(exrp);

console.log(JSON.stringify(tree));
/** const exrp = 'request.csrfToken()'; =>
 * {"tokens":[{"type":"name","value":"request"},{"type":"operator","value":"."},{"type":"name","value":"csrfToken"},{"type":"params","value":[]}],"current":20}
 */

/** javascript
 * ** Expr:   request.csrfToken() 
=> $[TokenInfo(type=57 (ENCODING), string='utf-8', start=(0, 0), end=(0, 0), line=''), TokenInfo(type=1 (NAME), string='request', start=(1, 0), end=(1, 7), line='request.csrfToken()'), TokenInfo(type=53 (OP), string='.', start=(1, 7), end=(1, 8), line='request.csrfToken()'), TokenInfo(type=1 (NAME), string='csrfToken', start=(1, 8), end=(1, 18), line='request.csrfToken()'), TokenInfo(type=255 (QWEB), string='()', start=(1, 18), end=(1, 20), line=''), TokenInfo(type=4 (NEWLINE), string='', start=(1, 20), end=(1, 21), line=''), TokenInfo(type=0 (ENDMARKER), string='', start=(2, 0), end=(2, 0), line='')] 
=> values['request'].csrfToken()
 */

// const exrp = `function f(a) {
//   request.csrfToken();
//   console.log(arr, '"Here"', arr.filter((a) => !a));
// }`;
/** =>
 * {"tokens":[
 *  {"type":"name","value":"function"},{"type":"space","value":" "},{"type":"name","value":"f"},{"type":"params","value":[{"type":"name","value":"a"}]},{"type":"space","value":" "},{"type":"codeblock","value":[{"type":"carriagereturn","value":"\n"},{"type":"space","value":" "},{"type":"space","value":" "},{"type":"name","value":"request"},{"type":"operator","value":"."},{"type":"name","value":"csrfToken"},{"type":"params","value":[]},{"type":"statementseperator","value":";"},{"type":"carriagereturn","value":"\n"},{"type":"space","value":" "},{"type":"space","value":" "},{"type":"name","value":"console"},{"type":"operator","value":"."},{"type":"name","value":"log"},{"type":"params","value":[{"type":"name","value":"arr"},{"type":"seperator","value":","},{"type":"space","value":" "},{"type":"string","value":"'\"Here\"'"},{"type":"seperator","value":","},{"type":"space","value":" "},{"type":"name","value":"arr"},{"type":"operator","value":"."},{"type":"name","value":"filter"},{"type":"params","value":[{"type":"params","value":[{"type":"name","value":"a"}]},{"type":"space","value":" "},{"type":"arrow","value":"=>"},{"type":"space","value":" "},{"type":"assignee","value":"!a"}]}]},{"type":"statementseperator","value":";"},{"type":"carriagereturn","value":"\n"}]}],"current":94}
 */

const js = new Generator().start(tree.tokens);
console.log(js)

let expr1 = 'var = a.b';
let tree1 = new LexicalAnalyzer({verbose: false}).start(expr1);
// var ASSIGNABLE_CHARACTERS = /[^\s\n\t\r,.;(){}[\]=]/;
/*
{"tokens":[{"type":"var","value":[{"type":"space","value":" "},{"type":"assigner","value":"="},{"type":"space","value":" "},{"type":"assignee","value":"a"},{"type":"operator","value":"."},{"type":"name","value":"b"}]}],"current":10}
*/

// var ASSIGNABLE_CHARACTERS = /[^\s\n\t\r,;(){}[\]=]/;
/*
{"tokens":[{"type":"var","value":[{"type":"space","value":" "},{"type":"assigner","value":"="},{"type":"space","value":" "},{"type":"assignee","value":"a.b"}]}],"current":10}
*/
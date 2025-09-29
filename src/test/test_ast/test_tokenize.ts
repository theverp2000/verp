import { parse } from "./parse";
import { tokenize } from "./tokenize";

class ValueError extends Error { }

function _compileExpr(expr, raiseOnMissing = false) {
  let tokens;
  try {
    tokens = tokenize(expr);
  } catch (e) {
    throw new ValueError(`Cannot compile expression: ${expr}`);
  }
  return tokens;
  // const namespaceExpr = this._compileExprTokens(tokens, this._allowedKeywords.concat(Object.keys(this._prepareGlobals())), null, raiseOnMissing);
  // testExpr('return '+ namespaceExpr, _SAFE_QWEB_OPCODES);
  // return namespaceExpr;
}

const descr = `[['date', '>=', contextToday().sub({days: 365}).combine('min').toFormat('yyyy-MM-dd HH:mm:ss')],['date', '<=', contextToday().combine('min').toFormat('yyyy-MM-dd HH:mm:ss')]]`;

function main() {
  const expr = descr;//'const domain = [a, [1,2,3], {c: 100, d: (val) => Number(val)}]';
  const tokens = _compileExpr(expr);
  console.log(JSON.stringify(tokens));
  const res = parse(tokens);
  console.log(expr);
  console.log(res);
}

main();

const tokens = [
  {
    "type": 2, // Symbol
    "value": "["
  },
  {
    "type": 2, // Symbol
    "value": "["
  },
  {
    "type": 1, // string
    "value": "date"
  },
  {
    "type": 2, // Symbol
    "value": ","
  },
  {
    "type": 1, // string
    "value": ">="
  },
  {
    "type": 2, // Symbol
    "value": ","
  },
  {
    "type": 3, // Name
    "value": "contextToday"
  },
  {
    "type": 2, // Symbol
    "value": "("
  },
  {
    "type": 2, // Symbol
    "value": ")"
  },
  {
    "type": 2, // Symbol
    "value": "."
  },
  {
    "type": 3, // Name
    "value": "sub"
  },
  {
    "type": 2, // Symbol
    "value": "("
  },
  {
    "type": 2, // Symbol
    "value": "{"
  },
  {
    "type": 3, // Name
    "value": "days"
  },
  {
    "type": 2, // Symbol
    "value": ":"
  },
  {
    "type": 0, // number
    "value": 365
  },
  {
    "type": 2, // Symbol
    "value": "}"
  },
  {
    "type": 2, // Symbol
    "value": ")"
  },
  {
    "type": 2, // Symbol
    "value": "."
  },
  {
    "type": 3, // Name
    "value": "combine"
  },
  {
    "type": 2, // Symbol
    "value": "("
  },
  {
    "type": 1, // string
    "value": "min"
  },
  {
    "type": 2, // Symbol
    "value": ")"
  },
  {
    "type": 2, // Symbol
    "value": "."
  },
  {
    "type": 3, // Name
    "value": "toFormat"
  },
  {
    "type": 2, // Symbol
    "value": "("
  },
  {
    "type": 1, // string
    "value": "yyyy-MM-dd HH:mm:ss"
  },
  {
    "type": 2, // Symbol
    "value": ")"
  },
  {
    "type": 2, // Symbol
    "value": "]"
  },
  {
    "type": 2, // Symbol
    "value": ","
  },
  {
    "type": 2, // Symbol
    "value": "["
  },
  {
    "type": 1, // string
    "value": "date"
  },
  {
    "type": 2, // Symbol
    "value": ","
  },
  {
    "type": 1, // string
    "value": "<="
  },
  {
    "type": 2, // Symbol
    "value": ","
  },
  {
    "type": 3, // Name
    "value": "contextToday"
  },
  {
    "type": 2, // Symbol
    "value": "("
  },
  {
    "type": 2, // Symbol
    "value": ")"
  },
  {
    "type": 2, // Symbol
    "value": "."
  },
  {
    "type": 3, // Name
    "value": "combine"
  },
  {
    "type": 2, // Symbol
    "value": "("
  },
  {
    "type": 1, // string
    "value": "min"
  },
  {
    "type": 2, // Symbol
    "value": ")"
  },
  {
    "type": 2, // Symbol
    "value": "."
  },
  {
    "type": 3, // Name
    "value": "toFormat"
  },
  {
    "type": 2, // Symbol
    "value": "("
  },
  {
    "type": 1, // string
    "value": "yyyy-MM-dd HH:mm:ss"
  },
  {
    "type": 2, // Symbol
    "value": ")"
  },
  {
    "type": 2, // Symbol
    "value": "]"
  },
  {
    "type": 2, // Symbol
    "value": "]"
  }
]
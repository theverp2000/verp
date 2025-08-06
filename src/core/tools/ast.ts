import ast from 'abstract-syntax-tree';
import { ValueError } from '../helper/errors';

export function astParse(source: any) {  
  let expr;
  try {
    expr = 'const __astParse__ = ' + source.trim();
    expr = ast.parse(expr).body[0];
    expr = expr['declarations'][0];
    expr = expr['init'];
  } catch(e) {
    throw new ValueError("Invalid expression: %s", source);
  }

  if (typeof(expr) !== 'object') {
    throw new ValueError("Non-dict expression");
  }
  if (expr.properties && !expr.properties.every(prop => prop.key !== 'Literal')) {
    throw new ValueError("Non-string literal dict key");
  }
  return expr;
}
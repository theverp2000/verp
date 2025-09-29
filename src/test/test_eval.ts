import * as vm from 'vm';

function safeEval(code: string, context?: {}, options?: {}) {
  const sandbox = {}
  const resultKey = 'SAFE_EVAL_' + Math.floor(Math.random() * 1000000)
  sandbox[resultKey] = {}
  const clearContext = `
    (function(){
      Function = undefined;
      const keys = Object.getOwnPropertyNames(this).concat(['constructor']);
      keys.forEach((key) => {
        const item = this[key];
        if (!item || typeof item.constructor !== 'function') return;
        this[key].constructor = undefined;
      });
    })();
  `;
  code = clearContext + resultKey + '=' + code
  if (context) {
    Object.keys(context).forEach(function (key) {
      sandbox[key] = context[key]
    })
  }
  vm.runInNewContext(code, sandbox, options)
  return sandbox[resultKey]
}

function unsafeEval(code: string, context?: {}, options?: {}) {
  const sandbox = {}
  const resultKey = 'SAFE_EVAL_' + Math.floor(Math.random() * 1000000)
  sandbox[resultKey] = {}
  code = resultKey + '=' + code;
  if (context) {
    Object.keys(context).forEach(function (key) {
      sandbox[key] = context[key]
    })
  }
  vm.runInNewContext(code, sandbox, options);
  return sandbox[resultKey]
}

async function unsafeAsync(codeLines: string[], values: {}={}, options: {}={}) {
  async function _compile(opt) {
    const wrapFunc = [
      `async function* __defName__(values) {\n`, 
      `}`
    ];
    const code = wrapFunc[0] 
                + codeLines.join('\n') 
                + wrapFunc[1];
    const globalsDict = Object.assign({}, opt);//this._prepareGlobals(opt);
    const compiledFn = unsafeEval(code, globalsDict);

    async function* _runCodeAsync(vals: {}={}) {
      try {
        vals = Object.assign(vals, opt);
        for await (const val of compiledFn(opt)) {
          yield val;
        }
      } catch(e) {
        throw e;
      }
    }
    return _runCodeAsync;
  }

  const rendering = (await _compile(options))(values);
  let result = <any>[];
  for await (const str of rendering) {
    if (str) {
      result.push(str);
    } 
  }

  return result.length == 1 ? result[0] : result;
}

function main() {
  // string concatenation
  var code = '"app" + "le"';
  var evaluated = safeEval(code) // "apple"
  console.log(evaluated);

  var code = '{name: "Borat", hobbies: ["disco dance", "sunbathing"]}';
  var evaluated = safeEval(code) // {name: "Borat", hobbies: ["disco dance", "sunbathing"]}
  console.log(evaluated);

  var code = '(function square(b) { return b * b; })(5)'
  var evaluated = safeEval(code) // 25
  console.log(evaluated);
}

async function mainAsync() {
  var code = [
    `async function func() {
      return Promise.all([100, 200]);
    };`,
    'const res = await func();',
    `for (const r of res) yield await r;`
  ]
  var [evaluated] = await unsafeAsync(code);
  console.log(evaluated);
}

function mainEval() {
  let projectData = { 
    id: 'abc',
    name: 'New hotel wing',
    finance: {
      EstimateAtCompletion: 2735500,
      costToDate: 1735500,
      contingency: 250000
    },
    risk: {
     open80PctCostImpact: 275000
    }
  }

  /*
  * @param {string} textExpression - code to evaluate passed as plain text
  * @param {object} contextData - some JavaScript object 
  * that can be referred to as $data in the textExpression
  * @returns {*} depend on the tagetExpression
  */
  function wrappedEval(textExpression, contextData){
    let fn = Function(`"use strict"; var $data = this;return (${textExpression})`)
    return fn.bind(contextData)();
  }

  // assume that the list was loaded from some server call
  let aProjects = [projectData];

  let filterExpression = '$data.finance.contingency < $data.risk.open80PctCostImpact'
  let fnFilterProjects =  wrappedEval.bind(this, filterExpression)
  let aFilteredProjects = aProjects.filter(p => fnFilterProjects(p) );
  console.log(JSON.stringify(aFilteredProjects));
}

mainAsync();

export {}
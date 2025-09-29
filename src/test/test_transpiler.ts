import * as trans from '../core/tools/js_transpiler';

function test(func, ...args: any) {
  console.log(func(...args));
}

function isErpModule() {
  test(trans.isErpModule, 
    ' // @verp-module alias=web.AbstracAction default=false');
}

function urlToModulePath() {
  test(trans.urlToModulePath, 
    'web/static/src/one/two/three.js');
}

function wrapWithVerpDefine() {
  test(trans.wrapWithVerpDefine, 'web', 'console.log("test")');
}

function main() {
  // test(trans.convertRelativeRequire, '@module/path', 'require("./path")');
  test(trans.convertLegacyDefaultImport, `import module_name from "addon.module_name"; import moduleName from "addon.moduleName"`);
}

main();
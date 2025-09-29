import * as core from '../core'
import { initializeSysPath, loadErpModule, loadInformationFromDescriptionFile } from "../core/modules";

const mods = core.modules.getModules();

for (const mod of mods) {
  const modPath = core.modules.getModulePath(mod);
  require(modPath);
  console.log('Loaded module %s', mod);
}

for (const mod of mods) {
  const modPath = core.modules.getModuleLoaded(mod);
  if (modPath) {
    console.log('Found loaded module %s', mod);
  } else {
    console.log('Not found loaded module %s', mod);
  }
  console.log('try reload again %s', mod);
  require(core.modules.getModulePath(mod));
}

const info = loadInformationFromDescriptionFile('base')
// console.log(info);

export {}
import {Glob, glob} from "glob";
import path from 'path';

const MANIFEST_NAMES = ['package.json'];

function stringPart(str: string, sub: string): [string|undefined, string, string] {
  var index = str.indexOf(sub);  // Gets the first index where a space occours
  if (index < 0) {
    return [undefined, sub, str];
  } 
  return [str.substring(0, index), sub, str.substring(index + sub.length)];
}

/**
 *  / ** /
 *  / * / 
 * @param pt 
 * @returns 
 */
function getModuleList(pt: string) {
  const mods = new Set<string>();
  pt = path.normalize(pt);
  let dir, ext;
  const sub1 = `${path.sep}*${path.sep}`;
  const sub2 = `${path.sep}**${path.sep}`;
  let sub = sub2;
  const nocurdir = pt.indexOf(sub) >= 0;
  let index = pt.indexOf(sub);  // Gets the first index where a space occours
  if (index < 0) {
    sub = sub1;
    index = pt.indexOf(sub);
  }
  if (index < 0) {
    dir = path.dirname(pt);
    ext = path.basename(pt);
  }
  else {
    dir = pt.substring(0, index);
    ext = `${sub === sub1 ? '*' : '**'}/${pt.substring(index + sub.length)}`;
  }
  console.log(pt, dir, ext);
  // MANIFEST_NAMES.forEach((mname) => {
    // const mg = glob.sync(`**/${mname}`, {
    //   ignore: [
    //     '**/node_modules/**',
    //     '**/.git/**',
    //   ],
    //   cwd: path
    // })
    let mg = glob.sync(ext.replaceAll(`${path.sep}`, `/`), {
      nodir: true,
      noglobstar: sub === sub1,
      ignore: [],
      cwd: dir
    })
    // if (nocurdir) {
    //   mg = mg.filter(name => name.indexOf('/') >= 0)
    // }
  
    // .map((name) => name.split('/'))
    // .filter((list) => list.length > 1)
    // .map((list) => list.slice(-2)[0])
    // .forEach((mod) => mods.add(mod))
    // mg.forEach((name) => {
    //   const list = name.split('/');
    //   if (list.length > 1) {
    //     mods.add(list.slice(-2)[0])
    //   }
    // })
  // });
  
  return mg;
}

let fp;
// fp = '**\\*';
// fp = 'D:\\Programs\\Nodejs\\.Verp\\tsverp\\src\\verp\\addons\\web\\static\\lib\\bootstrap\\scss\\_functions.scss';
//      "D:\\Programs\\Nodejs\\.Verp\\tsverp\\src\\verp\\addon\\web\\static\\lib\\bootstrap\\scss\\_functions.scss"
// fp = 'D:\\Programs\\Nodejs\\.Verp\\tsverp\\src\\verp\\addons\\web\\static\\lib\\bootstrap\\scss\\**\\*.scss';
// fp = 'D:\\Programs\\Nodejs\\.Verp\\tsverp\\src\\verp\\addons\\web\\static\\lib\\bootstrap\\scss\\**\\*.*';
// fp = 'D:\\Programs\\Nodejs\\.Verp\\tsverp\\src\\verp\\addons\\web\\static\\lib\\bootstrap\\scss\\**\\*';

fp = 'D:\\Programs\\Nodejs\\.Toverp\\verp\\src\\test\\*\\file\\*';

console.log('***', fp)
console.log(getModuleList(fp));

export {}
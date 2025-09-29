import fsPro from 'fs/promises';
import path from 'path';

async function readDir(fullPath) {
  const files: string[] = [],
  dirs: string[] =[];
  try {
    const dirents = await fsPro.readdir(fullPath, { withFileTypes: true, recursive: true });
    for (const dirent of dirents) {
      if (dirent.isFile()) {
        files.push(dirent.name);
      }
      else if (dirent.isDirectory()) {
        dirs.push(dirent.name);
      }
    }
    return [fullPath, dirs, files];
  } catch(e) {
    console.error(e);
  }
}

async function* walkDir(top, topdown = true, onerror?: Function, followlinks = false) {
  top = path.normalize(top);

  // We may not have read permission for top, in which case we can't
  // get a list of the files the directory contains.  os.walk
  // always suppressed the exception then, rather than blow up for a
  // minor reason when (say) a thousand readable directories are still
  // left to visit.  That logic is copied here.
  let dirents: any[] = [];
  try {
    // Note that scandir is global in this module due
    // to earlier import-*.
    dirents = await fsPro.readdir(top, { withFileTypes: true, recursive: true });
  } catch (e) {
    if (typeof onerror === 'function') {
      onerror(e);
    }
    return;
  }
  const dirs: string[] = [];
  const nondirs: string[] = [];
  const walkDirs: string[] = [];
  for (const entry of dirents) {
    const isDir = entry.isDirectory();
    if (isDir) {
      dirs.push(entry.name);
    }
    else {
      nondirs.push(entry.name);
    }
    if (!topdown && isDir) {
      // Bottom-up: recurse into sub-directory, but exclude symlinks to
      // directories if followlinks is False
      let walkInto: boolean;
      if (followlinks) {
        walkInto = true;
      }
      else {
        walkInto = !entry.isSymbolicLink();
      }
      if (walkInto) {
        walkDirs.push(entry.path);
      }
    }
  }
  // Yield before recursion if going top down
  if (topdown) {
    yield [top, dirs, nondirs];

    // Recurse into sub-directories
    for (const dirname of dirs) {
      const newPath = path.join(top, dirname);
      if (followlinks) {
        for await (const [top, dirs, nondirs] of walkDir(newPath, topdown, onerror, followlinks)) {
          yield [top, dirs, nondirs];
        }
      }
    }
  }
  else {
    // Recurse into sub-directories
    for (const newPath of walkDirs) {
      for await (const [top, dirs, nondirs] of walkDir(newPath, topdown, onerror, followlinks)) {
        yield [top, dirs, nondirs];
      }
    }
    // Yield after recursion if going bottom up
    yield [top, dirs, nondirs];
  }
}

async function main() {
  for await (const res of walkDir(__dirname)) {
    console.log(res);
  }
}

main();
export function bool(obj: any): boolean {
  if (obj === null || obj === undefined) return false;
  if (typeof obj === 'boolean') return obj;
  if (obj instanceof Date) return true;

  if (typeof obj === 'object' || typeof obj === 'function') {
    if ('_bool' in obj) { // ModelRecords or other classes have _bool function
      return obj._bool();
    }
    if ('length' in obj) {
      return obj.length > 0;
    }
    if ('size' in obj) {
      return obj.size > 0;
    }
    return Object.keys(obj).length > 0;
  }
  return !!obj;
}
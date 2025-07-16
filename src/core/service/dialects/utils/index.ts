export function isNodeError(val: unknown): val is NodeJS.ErrnoException {
  return val instanceof Error && 'code' in val;
}

export const EMPTY_OBJECT = Object.freeze(Object.create(null));

export const EMPTY_ARRAY = Object.freeze([]);

export type Nullish<T> = T | null | undefined;

export type NonNullish<T> = T extends null | undefined ? never : T;

export type NonUndefined<T> = T extends undefined ? never : T;

export type NonUndefinedKeys<T, K extends keyof T> = {
  [P in keyof T]: P extends K ? NonUndefined<T[P]> : T[P];
};

export type StrictRequiredBy<T, K extends keyof T> = NonUndefinedKeys<Omit<T, K> & Required<Pick<T, K>>, K>;

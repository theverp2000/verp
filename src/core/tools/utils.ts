import { NotImplementedError, ValueError } from "../helper/errors";
import { parseInt } from "./func";
import { accumulate, len, map, range } from "./iterable";

export function getRandom(min: number, max?: number, step: number = 1): number {
  const floatRandom = Math.random();
  if (max == null) {
    min = 0;
    max = min;
  }
  const difference = Math.abs(max - min);
  // random between 0 and the difference;
  const random = Math.round(difference * floatRandom);
  const randomWithinRange = random * step + min;
  return randomWithinRange;
}

/**
 * Return a random int in the range [0,n).  Raises ValueError if n==0.
 */
function randBelow(max) { // max included
  if (max <= 0) {
    throw new NotImplementedError();
  }
  return getRandom(0, max);
}

/**
 * Chooses k unique random elements from a population sequence or set.

  Returns a new list containing elements from the population while
  leaving the original population unchanged.  The resulting list is
  in selection order so that all sub-slices will also be valid random
  samples.  This allows raffle winners (the sample) to be partitioned
  into grand prize and second place winners (the subslices).

  Members of the population need not be hashable or unique.  If the
  population contains repeats, then each occurrence is a possible
  selection in the sample.

  To choose a sample in a range of integers, use range as an argument.
  This is especially fast and space efficient for sampling from a
  large population:   sample(range(10000000), 60)
 * @param population 
 * @param k 
 * @returns 
 */
export function sample(population, k) {
  // Sampling without replacement entails tracking either potential
  // selections (the pool) in a list or previous selections in a set.

  // When the number of selections is small compared to the
  // population, then tracking selections is efficient, requiring
  // only a small set and an occasional reselection.  For
  // a larger number of selections, the pool tracking method is
  // preferred since the list takes less space than the
  // set and it doesn't suffer from frequent reselections.

  if (population instanceof Set) {
    population = Array.from(population);
  }
  if (!Array.isArray(population)) {
    throw new TypeError("Population must be an iterable. For dicts, use Object.keys(d).");
  }
  let n = population.length;
  if (!(0 <= k && k <= n)) {
    throw new ValueError("Sample larger than population or is negative");
  }
  let result = Array(k).fill([null]);
  let setsize = 21;        // size of a small set minus size of an empty list
  if (k > 5) {
    setsize += 4 ** Math.ceil(Math.log(k * 3) / Math.log(4)) // table size for big sets
  }
  if (n <= setsize) {
    // An n-length list is smaller than a k-length set
    const pool = Array.from(population);
    for (const i of range(k)) {         // invariant:  non-selected at [0,n-i)
      const j = randBelow(n - i);
      result[i] = pool[j];
      pool[j] = pool[n - i - 1];   // move non-selected item into vacancy
    }
  }
  else {
    const selected = new Set();
    const selectedAdd = selected.add;
    for (const i of range(k)) {
      let j = randBelow(n);
      while (selected.has(j)) {
        j = randBelow(n);
      }
      selectedAdd(j);
      result[i] = population[j];
    }
  }
  return result;
}

/**
 * Return a k sized list of population elements chosen with replacement.

  If the relative weights or cumulative weights are not specified,
  the selections are made with equal probability.
 * @param population 
 * @param weights 
 * @param cumWeights 
 * @param k 
 * @returns 
 */
export function choices(population: number[], weights?: number[], cumWeights?: number[], k: number = 1) {
  if (cumWeights == null) {
    if (weights == null) {
      let total = len(population);
      return map(range(k), i => population[parseInt(Math.random() * total)]);
    }
    cumWeights = Array.from(accumulate(weights));
  }
  else if (weights != null) {
    throw new TypeError('Cannot specify both weights and cumulative weights');
  }
  if (cumWeights.length != len(population)) {
    throw new ValueError('The number of weights does not match the population');
  }
  const hi = cumWeights.length - 1;
  const total = cumWeights[hi];
  return map(range(k), (i) => population[bisect(cumWeights, Math.random() * total, 0, hi)]);
}

/**
 * Create a string of digit [0-9] with length = n
 * @param n 
 * @returns 
 */
export function urandom(n) {
  var add = 1, max = 12 - add;   // 12 is the min safe number Math.random() can generate without it starting to pad the end with zeros.   

  if (n > max) {
    return urandom(max) + urandom(n - max);
  }

  max = Math.pow(10, n + add);
  var min = max / 10; // Math.pow(10, n) basically
  var number = Math.floor(Math.random() * (max - min + 1)) + min;

  return ("" + number).substring(add);
}

/**
 * Choose a random item from range(start, stop[, step]).
 * @param start 
 * @param stop 
 * @param step 
 * @param int 
 * @returns 
 */
export function randrange(start: any, stop?: any, step: number = 1, int = parseInt) {
  // This code is a bit messy to make it fast for the
  // common case while still doing adequate error checking.
  const istart = int(start);
  if (istart !== start) {
    throw new ValueError("non-integer arg 1 for randrange()");
  }
  if (stop == null) {
    if (istart > 0) {
      return getRandom(istart);
    }
    throw new ValueError("empty range for randrange()");
  }
  // stop argument supplied.
  const istop = int(stop);
  if (istop !== stop) {
    throw new ValueError("non-integer stop for randrange()");
  }
  const width = istop - istart;
  if (step == 1 && width > 0)
    return getRandom(istart, istop);
  if (step == 1) {
    throw new ValueError("empty range for randrange() (%s,%s, %s)", istart, istop, width);
  }

  // Non-unit step argument supplied.
  const istep = int(step);
  if (istep !== step)
    throw new ValueError("non-integer step for randrange()")
  let n;
  if (istep > 0)
    n = (width + istep - 1) // istep
  else if (istep < 0)
    n = (width + istep + 1) // istep
  else
    throw new ValueError("zero step for randrange()")

  if (n <= 0)
    throw new ValueError("empty range for randrange()")

  return getRandom(istart, n, istep);
}

export function randomToken(n: number = 10) {
  // the token has an entropy of about 120 bits (6 bits/char * 20 chars)
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from(range(n)).map(x => chars[getRandom(0, chars.length)]).join('');
}

export class Slice {
  start: number;
  stop: number;

  constructor(start: number, stop?: number) {
    this.start = start;
    this.stop = stop;
  }
}

/**
 * Return the index where to insert item x in list a, assuming a is sorted.

    The return value i is such that all e in a[:i] have e <= x, and all e in
    a[i:] have e > x.  So if x already appears in the list, a.insert(x) will
    insert just after the rightmost x already there.

    Optional args lo (default 0) and hi (default len(a)) bound the
    slice of a to be searched.
 * @param a 
 * @param x 
 * @param lo 
 * @param hi 
 * @returns 
 */
export function bisect(a: number[], x: number, lo: number = 0, hi?: number) {
  if (lo < 0) {
    throw new ValueError('lo must be non-negative');
  }
  if (hi == null) {
    hi = len(a);
  }
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (x < a[mid]) {
      hi = mid;
    }
    else {
      lo = mid + 1;
    }
  }
  return lo;
}
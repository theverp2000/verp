import { randomInt } from "crypto";
import { addDate, diffDate } from "./date_utils";
import { isInstance, parseInt } from "./func";
import { enumerateAsync, next, nextAsync } from "./iterable";
import { _f, choices, f, SeedRandom } from "./utils";
import { StopIteration } from "../helper";

export class Populate {

  /**
   * Format the given value (with method `'format'`) when it is a string.
   * @param val 
   * @param counter 
   * @param values 
   * @returns 
   */
  static formatStr(val, counter, values) {
    if (typeof (val) === 'string') {
      return _f(val, { counter: counter, values: values });
    }
    return val;
  }

  /**
   * Return a factory for an iterator of values dicts that sets the field
    to the given value in each input dict.
  * @param val 
  * @param formatter 
  * @returns Function(iterator, string, string) -> dict: function of the form (iterator, fieldName, modelName) -> values
  */
  static constant(val, formatter: Function = Populate.formatStr) {
    async function* generate(iterator, fieldName) {
      for await (const [counter, values] of enumerateAsync(iterator)) {
        values[fieldName] = formatter(val, counter, values)
        yield values;
      }
    }
    return generate;
  }

  /**
   * Return a random number generator object with the given seed.
   * @param seed 
   * @returns 
   */
  static random(seed) {
    return new SeedRandom(seed);
  }

  /**
   * Instantiate a generator by calling all the field factories.
   * @param fieldFactories 
   * @param modelName 
   * @returns 
   */
  static chainFactories(fieldFactories, modelName) {
    let generator = Populate.rootFactory();
    for (const [fname, fieldFactory] of fieldFactories) {
      generator = fieldFactory(generator, fname, modelName);
    }
    return generator;
  }

  /**
   * Return a generator with empty values dictionaries (except for the flag ``__complete``).
   * @returns 
   */
  static *rootFactory() {
    yield { '__complete': false }
    while (true) {
      yield { '__complete': true }
    }
  }

  /**
   * Return a factory for an iterator of values dicts with pseudo-randomly
      chosen values (among ``vals``) for a field.

    @param vals list in which a value will be chosen, depending on `weights`
    @param weights list of probabilistic weights
    @param seed optional initialization of the random number generator
    @param formatter (val, counter, values) --> formattedValue
    @param counterOffset
    @returns function of the form (iterator, fieldName, modelName) -> values
   */
  static randomize(vals, weights?: any, seed?: boolean, formatter = Populate.formatStr, counterOffset = 0) {
    async function* generate(iterator, fieldName, modelName) {
      const r = Populate.random(f('%s+field+%s', modelName, seed || fieldName));
      for await (const [counter, values] of enumerateAsync(iterator)) {
        const val = Array.from(choices(vals, weights))[0];
        values[fieldName] = formatter(val, counter + counterOffset, values);
        yield values;
      }
    }
    return generate;
  }

  /**
   * Return a factory for an iterator of values dicts that combines all ``vals`` for
      the field with the other field values in input.

      @param vals list in which a value will be chosen, depending on `weights`
      @param weights list of probabilistic weights
      @param seed optional initialization of the random number generator
      @param formatter (val, counter, values) --> formattedValue
      @param then if defined, factory used when vals has been consumed.
      @returns function of the form (iterator, fieldName, modelName) -> values
   */
  static cartesian(vals, weights?: any, seed = false, formatter = Populate.formatStr, func?: any) {
    async function* generate(iterator, fieldName, modelName) {
      let counter = 0;
      // for (const values of iterator) {
      for await (const [_counter, values] of enumerateAsync(iterator)) {
        if (values['__complete']) {
          break  // will consume and lose an element, (complete so a filling element). If it is a problem, use peekable instead.
        }
        for (const val of vals) {
          yield { ...values, [fieldName]: formatter(val, counter+1, values) }
        }
        counter += 1;
      }
      const factory = func || Populate.randomize(vals, weights, seed, formatter, counter);
      for await (const val of factory(iterator, fieldName, modelName)) {
        yield val;
      }
    }
    return generate;
  }

  /**
   * Return a factory for an iterator of values dicts that picks a value among ``vals``
      for each input.  Once all ``vals`` have been used once, resume as ``then`` or as a
      ``randomize`` generator.

      @param vals list in which a value will be chosen, depending on `weights`
      @param weights list of probabilistic weights
      @param seed optional initialization of the random number generator
      @param formatter (val, counter, values) --> formattedValue
      @param then if defined, factory used when vals has been consumed.
      @returns function of the form (iterator, fieldName, modelName) -> values
   */
  static iterate(vals, weights?: any, seed: any = false, formatter = Populate.formatStr, func?: any) {
    async function* generate(iterator, fieldName, modelName) {
      let counter = 0;
      for (const val of vals) { // iteratable order is important, shortest first
        let values;
        try {
          values = await nextAsync(iterator);
        } catch(e) {
          if (isInstance(e, StopIteration)) {
            break;
          }
          throw e;
        }
        values[fieldName] = formatter(val, counter, values);
        values['__complete'] = false;
        yield values;
        counter += 1;
      }
      const factory = func || Populate.randomize(vals, weights, seed, formatter, counter);
      for await (const val of factory(iterator, fieldName, modelName)) {
        yield val;
      }
    }
    return generate;
  }

  /**
   * Return a factory for an iterator of values dicts that computes the field value
      as ``function(values, counter, random)``, where ``values`` is the other field values,
      ``counter`` is an integer, and ``random`` is a pseudo-random number generator.

      @param func (values, counter, random) --> fieldValues
      @param seed optional initialization of the random number generator
      @returns function of the form (iterator, fieldName, modelName) -> values
   */
  static compute(func, seed?: any) {
    async function* generate(iterator, fieldName, modelName) {
      const random = Populate.random(f('%s+field+%s', modelName, seed || fieldName));
      for await (const [counter, values] of enumerateAsync(iterator)) {
        const val = await func({values, counter: counter+1, random });
        values[fieldName] = val;
        yield values;
      }
    }
    return generate;
  }

  /**
   * Return a factory for an iterator of values dicts that sets the field
      to a random integer between a and b included in each input dict.

      @param a minimal random value
      @param b maximal random value
      @returns function of the form (iterator, fieldName, modelName) -> values
   */
  static randint(a, b, seed?: any) {
    function* getRandInt(opts: {random?: any} = {}) {
      return opts.random.randint(a, b);
    }
    return Populate.compute(getRandInt, seed);
  }

  /**
   * Return a factory for an iterator of values dicts that sets the field
      to a random float between a and b included in each input dict.
   * @param a 
   * @param b 
   * @param seed 
   * @returns 
   */
  static randfloat(a, b, seed?: any) {
    function* getRandFloat(opts: {random?: any} = {}) {
      return opts.random.uniform(a, b);
    }
    return Populate.compute(getRandFloat, seed);
  }

  /**
   * Return a factory for an iterator of values dicts that sets the field
      to a random datetime between relative_before and relative_after, relatively to
      base_date

      @param baseDate (datetime) override the default base date if needed.
      @param relativeAfter (relativedelta, timedelta) range up which we can go after the
          base date. If not set, defaults to 0, i.e. only in the past of reference.
      @param relativeBefore (relativedelta, timedelta) range up which we can go before the
          base date. If not set, defaults to 0, i.e. only in the future of reference.
      @returns (generator) iterator for random dates inside the defined range
   */
  static randdatetime(opts: { baseDate?: any, relativeBefore?: any, relativeAfter?: any, seed?: any } = {}) {
    const baseDate = opts.baseDate || new Date(2020, 0, 1);
    const secondsBefore = opts.relativeBefore && diffDate(addDate(baseDate, opts.relativeBefore), baseDate, 'seconds').seconds || 0;
    const secondsAfter = opts.relativeAfter && diffDate(addDate(baseDate, opts.relativeAfter), baseDate, 'seconds').seconds || 0;

    function _getRandDatetime(opts: { random?: any } = {}) {
      return addDate(baseDate, { seconds: randomInt(parseInt(secondsBefore), parseInt(secondsAfter)) });
    }
    return Populate.compute(_getRandDatetime, opts.seed);
  }
}
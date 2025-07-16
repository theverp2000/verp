export class TimeoutError extends Error {}

interface ErrorOptions {
  cause?: unknown;
}

const supportsErrorCause = (() => {
  // eslint-disable-next-line @typescript-eslint/prefer-ts-expect-error -- Supported in TS 4.6, not before
  // @ts-ignore
  const err = new Error('Dummy 1', { cause: new Error('Dummy 2') });

  return 'cause' in err;
})();

export class BaseError extends Error {
  declare cause?: any;

  constructor(message?: string, options?: ErrorOptions) {
    // TODO [>=2023-04-30]: remove this ts-ignore (Sequelize 8)
    // eslint-disable-next-line @typescript-eslint/prefer-ts-expect-error -- Supported in TS 4.6, not before
    // @ts-ignore
    super(supportsErrorCause ? message : addCause(message, options?.cause), options);
    this.name = 'SequelizeBaseError';

    if (!supportsErrorCause && options?.cause) {
      // TODO [>=2023-04-30]:
      //  Once all supported node versions have support for Error.cause (added in Node 16.9.0), delete this line:
      //  This is a breaking change and must be done in a MAJOR release.
      this.cause = options.cause;
    }
  }
}
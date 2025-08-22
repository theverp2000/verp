import type { Class } from 'type-fest';
import { Sequelize } from "../sequelize";
import { Connection } from '../dialects/abstract';
import assert from 'node:assert';
import { EMPTY_OBJECT, StrictRequiredBy } from '../dialects/utils';

export enum IsolationLevel {
  READ_UNCOMMITTED = 'READ UNCOMMITTED',
  READ_COMMITTED = 'READ COMMITTED',
  REPEATABLE_READ = 'REPEATABLE READ',
  SERIALIZABLE = 'SERIALIZABLE',
}

export enum TransactionType {
  DEFERRED = 'DEFERRED',
  IMMEDIATE = 'IMMEDIATE',
  EXCLUSIVE = 'EXCLUSIVE',
}

export class ConstraintChecking {
  toString() {
    return this.constructor.name;
  }

  isEqual(_other: unknown): boolean {
    throw new Error('isEqual implementation missing');
  }

  static toString() {
    return this.name;
  }

  get constraints(): readonly string[] {
    throw new Error('constraints getter implementation missing');
  }
}

export interface TransactionOptions {
  /**
   * Whether this transaction will only be used to read data.
   * Used to determine whether sequelize is allowed to use a read replication server.
   */
  readOnly?: boolean | undefined;
  isolationLevel?: IsolationLevel | null | undefined;
  type?: TransactionType | undefined;
  constraintChecking?: ConstraintChecking | Class<ConstraintChecking> | undefined;

  /**
   * Parent transaction.
   * Will be retrieved from CLS automatically if not provided or if null.
   */
  transaction?: Transaction | null | undefined;
}

export type NormalizedTransactionOptions = StrictRequiredBy<Omit<TransactionOptions, 'constraintChecking'>, 'type' | 'isolationLevel' | 'readOnly'> & {
  constraintChecking?: ConstraintChecking | undefined,
};

export function normalizeTransactionOptions(
  sequelize: Sequelize,
  options: TransactionOptions = EMPTY_OBJECT,
): NormalizedTransactionOptions {
  return {
    ...options,
    type: options.type ?? sequelize.options.transactionType,
    isolationLevel: options.isolationLevel === undefined
      ? (sequelize.options.isolationLevel ?? null)
      : options.isolationLevel,
    readOnly: options.readOnly ?? false,
    constraintChecking: typeof options.constraintChecking === 'function' ? new options.constraintChecking() : options.constraintChecking,
  };
}

export class Transaction {
  readonly sequelize: Sequelize;

  private readonly savepoints: Transaction[] = [];
  readonly options: Readonly<NormalizedTransactionOptions>;
  readonly parent: Transaction | null;
  readonly id: string;
  name: string;
  private finished: 'commit' | undefined;
  #connection: Connection | undefined;

  constructor(sequelize: Sequelize, options: TransactionOptions) {
    this.sequelize = sequelize;

    // get dialect specific transaction options
    const generateTransactionId = this.sequelize.dialect
      .queryGenerator
      .generateTransactionId;

    const normalizedOptions = normalizeTransactionOptions(this.sequelize, options);
    this.parent = normalizedOptions.transaction ?? null;
    delete normalizedOptions.transaction;

    this.options = Object.freeze(normalizedOptions);

    if (this.parent) {
      this.id = this.parent.id;
      this.parent.savepoints.push(this);
      this.name = `${this.id}-sp-${this.parent.savepoints.length}`;
    } else {
      const id = generateTransactionId();
      this.id = id;
      this.name = id;
    }
  }

  forceCleanup() {
    throw new Error('Method not implemented.');
  }

  commit() {
    throw new Error('Method not implemented.');
  }

  rollback() {
    throw new Error('Method not implemented.');
  }

  cleanup() {
    throw new Error('Method not implemented.');
  }
  
  begin() {
    const queryInterface = this.sequelize.getQueryInterface();
    const self: any = this;
    if (this.sequelize.dialect.supports.settingIsolationLevelDuringTransaction) {
      queryInterface.startTransaction(self, self.options);

      if (this.options.isolationLevel) {
        queryInterface.setIsolationLevel(self, self.options.isolationLevel, self.options);
      }

      return;
    }

    if (this.options.isolationLevel) {
      queryInterface.setIsolationLevel(self, self.options.isolationLevel, self.options);
    }

    queryInterface.startTransaction(self, self.options);
  }

  prepareEnvironment() {
    let connection;
    if (this.parent) {
      connection = this.parent.#connection;
    } else {
      connection = this.sequelize.connectionManager.getConnection({
        type: this.options.readOnly ? 'read' : 'write',
        uuid: this.id,
      });
    }

    assert(connection != null, 'Transaction failed to acquire Connection.');

    connection.uuid = this.id;

    this.#connection = connection;

    let result;
    try {
      this.begin();

      result = this.setDeferrable();
    } catch (error) {
      try {
        this.rollback();
      } finally {
        throw error; // eslint-disable-line no-unsafe-finally -- while this will mask the error thrown by `rollback`, the previous error is more important.
      }
    }

    return result;
  }

  setDeferrable(): void {
    const self: any = this;
    if (self.options.constraintChecking) {
      self
        .sequelize
        .getQueryInterface()
        .deferConstraints(this.options.constraintChecking, { transaction: self });
    }
  }

  getConnection(): Connection {
    if (!this.#connection) {
      throw new Error('This transaction is not bound to a connection.');
    }

    return this.#connection;
  }

  getConnectionIfExists(): Connection | undefined {
    return this.#connection;
  }
}
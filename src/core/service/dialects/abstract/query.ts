import _ from "lodash";
import { AbstractDialect, GetConnectionOptions } from ".";
import { ConstraintChecking, CreateDatabaseOptions, DatabaseDescription, IsolationLevel, QueryRawOptions, QueryRawOptionsWithType, QueryTypes, Sequelize, setTransactionFromCls } from "../../dbservice";
import { Transaction } from "../../sequelize";
import { isNodeError } from "../utils";
import * as deprecations from "../utils/deprecations";
import { BaseError, TimeoutError } from "../utils/errors";
import { logger } from '../utils/logger';
import { Connection } from './index';

const debug = logger.debugContext('connection-manager');

export interface DeferConstraintsOptions extends QueryRawOptions { }

export class AbstractQueryGenerator {
  static QUOTE_NAME: string;
  static QUOTE_STRING: string;

  constructor(options?: QueryGeneratorOptions) {};
  
  get QUOTE_NAME() {
    // @ts-expect-error -- untyped constructor
    return this.constructor.QUOTE_NAME;
  }

  get QUOTE_STRING() {
    // @ts-expect-error -- untyped constructor
    return this.constructor.QUOTE_STRING;
  }

  describeTableQuery(tableName: string) {
    return `DESCRIBE ${this.quote(tableName)};`;
  }

  now(): string {
    throw new Error("Method not implemented.");
  }

  quote(name: string, char: string=this.QUOTE_NAME) {
    if (typeof name !== 'string') {
      throw new Error(`qname received a non-string name: ${typeof name}`);
    }
    return char + name.replaceAll(char, char + char) + char;
  }

  quotes(names: any, char: string=this.QUOTE_NAME) {
    if (names.includes('.')) {
      names = names.split('.');

      const head = names.slice(0, -1).join('->');
      const tail = names.at(-1);

      return `${this.quote(head, char)}.${tail === '*' ? '*' : this.quote(tail, char)}`;
    }

    if (names === '*') {
      return '*';
    }

    return this.quote(names, char);
  }

  quoteIdentifiers = this.quotes;

  string(name: string) {
    return this.quote(name, this.QUOTE_STRING);
  }

  generateTransactionId() {
    return crypto.randomUUID();
  }

  startTransactionQuery(transaction) {
    if (transaction.parent) {
      // force quoting of savepoint identifiers for postgres
      return `SAVEPOINT ${this.quote(transaction.name)};`;
    }

    return 'START TRANSACTION;';
  }
}

export class AbstractQueryInterface {
  readonly sequelize: Sequelize;

  constructor(
    sequelize: Sequelize,
    queryGenerator: AbstractQueryGenerator,
    // internalQueryInterface?: AbstractQueryInterfaceInternal,
  ) {
    this.sequelize = sequelize;
    this.queryGenerator = queryGenerator;
    // this.#internalQueryInterface = internalQueryInterface ?? new AbstractQueryInterfaceInternal(sequelize, queryGenerator);
  }

  removeConstraint(tableName: string, arg1: any, arg2: { transaction: Transaction; }) {
    throw new Error('Method not implemented.');
  }
  createTable(name: string, value: any, arg2: { transaction: Transaction; }) {
    throw new Error('Method not implemented.');
  }
  queryGenerator: any;
  addConstraint(tableName: string, definition: any) {
    throw new Error('Method not implemented.');
  }
  createDatabase(name: string, options?: CreateDatabaseOptions) {
    throw new Error('Method not implemented.');
  };

  /**
   * Creates a database
   */
  dropDatabase(name: string, options?: QueryRawOptions) {

  };

  /**
   * Lists all available databases
   */
  listDatabases(options?: QueryRawOptions): DatabaseDescription[] {
    return []
  };
  
  /**
   * Describe a table structure
   *
   * This method returns an array of hashes containing information about all attributes in the table.
   *
   * ```js
   * {
   *    name: {
   *      type:         'VARCHAR(255)', // this will be 'CHARACTER VARYING' for pg!
   *      allowNull:    true,
   *      defaultValue: null
   *    },
   *    isBetaMember: {
   *      type:         'TINYINT(1)', // this will be 'BOOLEAN' for pg!
   *      allowNull:    false,
   *      defaultValue: false
   *    }
   * }
   * ```
   *
   * @param tableName
   * @param options Query options
   */
  describeTable(tableName: string, options?: DescribeTableOptions): ColumnsDescription {
    const table = this.queryGenerator.extractTableDetails(tableName);

    if (typeof options === 'string') {
      deprecations.noSchemaParameter();
      table.schema = options;
    }

    if (typeof options === 'object' && options !== null) {
      if (options.schema) {
        deprecations.noSchemaParameter();
        table.schema = options.schema;
      }

      if (options.schemaDelimiter) {
        deprecations.noSchemaDelimiterParameter();
        table.delimiter = options.schemaDelimiter;
      }
    }

    const sql = this.queryGenerator.describeTableQuery(table);
    const queryOptions: QueryRawOptionsWithType<QueryTypes.DESCRIBE> = { ...options, type: QueryTypes.DESCRIBE };

    try {
      const data = this.sequelize.queryRaw(sql, queryOptions);
      /*
       * If no data is returned from the query, then the table name may be wrong.
       * Query generators that use information_schema for retrieving table info will just return an empty result set,
       * it will not throw an error like built-ins do (e.g. DESCRIBE on MySql).
       */
      if (_.isEmpty(data)) {
        throw new Error(`No description found for table ${table.tableName}${table.schema ? ` in schema ${table.schema}` : ''}. Check the table name and schema; remember, they _are_ case sensitive.`);
      }

      return data;
    } catch (error: unknown) {
      if (error instanceof BaseError && error.cause?.code === 'ER_NO_SUCH_TABLE') {
        throw new Error(`No description found for table ${table.tableName}${table.schema ? ` in schema ${table.schema}` : ''}. Check the table name and schema; remember, they _are_ case sensitive.`);
      }

      throw error;
    }
  }

  startTransaction(transaction: Transaction, options?: any) {
    if (!transaction || !(transaction instanceof Transaction)) {
      throw new Error('Unable to start a transaction without transaction object!');
    }

    options = { ...options, transaction: transaction.parent || transaction };
    options.transaction.name = transaction.parent ? (transaction as any).name : undefined;
    const sql = this.queryGenerator.startTransactionQuery(transaction);

    return this.sequelize.queryRaw(sql, options);
  }

  setIsolationLevel(transaction: Transaction, value: IsolationLevel, options?: any) {
    if (!transaction || !(transaction instanceof Transaction)) {
      throw new Error('Unable to set isolation level for a transaction without transaction object!');
    }

    if (transaction.parent || !value) {
      // Not possible to set a separate isolation level for savepoints
      return;
    }

    options = { ...options, transaction: transaction.parent || transaction };

    const sql = this.queryGenerator.setIsolationLevelQuery(value, {
      parent: transaction.parent,
    });

    if (!sql) {
      return;
    }

    return this.sequelize.queryRaw(sql, options);
  }

  deferConstraints(constraintChecking: ConstraintChecking, options?: DeferConstraintsOptions): void {
    setTransactionFromCls(options ?? {}, this.sequelize);
    if (!options?.transaction) {
      throw new Error('Missing transaction in deferConstraints option.');
    }

    const sql = this.queryGenerator.setConstraintCheckingQuery(constraintChecking);

    this.sequelize.queryRaw(sql, { ...options, raw: true, type: QueryTypes.RAW });
  }

  quote(identifier, force) {
    return this.queryGenerator.quote(identifier, force);
  }

  /**
   * Split a list of identifiers by "." and quote each part.
   *
   * @param {string} identifiers
   *
   * @returns {string}
   */
  quotes(identifiers) {
    return this.queryGenerator.quotes(identifiers);
  }
}

interface DescribeTableOptions extends QueryRawOptions {
  /**
   * @deprecated Use a TableNameWithSchema object to specify the schema or set the schema globally in the options.
   */
  schema?: string;
  /**
   * @deprecated Use a TableNameWithSchema object to specify the schemaDelimiter.
   */
  schemaDelimiter?: string;
}

interface ColumnDescription {
  type: string;
  allowNull: boolean;
  defaultValue: string;
  primaryKey: boolean;
  autoIncrement: boolean;
  comment: string | null;
}

type ColumnsDescription = Record<string, ColumnDescription>;

export class AbstractConnectionManager<TConnection extends Connection = Connection> {
  protected lib: any;

  protected readonly sequelize: Sequelize;
  protected readonly config: Sequelize['config'];
  protected readonly dialect: AbstractDialect;
  protected readonly dialectName: any;
  
  _closed: boolean = false;

  constructor(dialect: AbstractDialect, sequelize: Sequelize) {
    const config = _.cloneDeep(sequelize.config) ?? {};

    this.sequelize = sequelize;
    this.config = config as Sequelize['config'];
    this.dialect = dialect;
    this.dialectName = this.sequelize.options.dialect;
  }
  
  get isClosed() {
    return this._closed;
  }

  close() {
    this._closed = true;
  }

  _loadDialectModule(moduleName: string): unknown {
    try {
      if (this.sequelize.config.dialectModulePath) {
        return require(this.sequelize.config.dialectModulePath);
      }

      if (this.sequelize.config.dialectModule) {
        return this.sequelize.config.dialectModule;
      }

      return require(moduleName);
    } catch (error) {
      if (isNodeError(error) && error.code === 'MODULE_NOT_FOUND') {
        if (this.sequelize.config.dialectModulePath) {
          throw new Error(`Unable to find dialect at ${this.sequelize.config.dialectModulePath}`);
        }

        throw new Error(`Please install ${moduleName} package manually`);
      }

      throw error;
    }
  }

  getConnection(options?: GetConnectionOptions) {
    // this._initDatabaseVersion();

    try {
      const Client = this.lib;
      const client = new Client(options);

      client.connectSync('postgresql://verp:verp@localhost:5432/src'); // OK
      debug('connection acquired');

      return client;
    } catch (error) {
      if (error instanceof TimeoutError) {
        throw error; //ConnectionAcquireTimeoutError(error);
      }

      throw error;
    }
  }

  releaseConnection(connection: TConnection) {
    // this.pool.release(connection);
    debug('connection released');
  }
}

export interface QueryGeneratorOptions {
  sequelize: Sequelize;
  dialect: AbstractDialect;
}

export interface AbstractQueryOptions {
  rawErrors: any;
  type?: QueryTypes;

  fieldMap?: boolean;
  plain: boolean;
  raw: boolean;
  nest: boolean;
  hasJoin: boolean;

  /**
   * A function that gets executed while running the query to log the sql.
   */
  logging?: boolean | ((sql: string, timing?: number) => void);
  queryLabel?: string;

  include: boolean;
  includeNames: unknown[];
  includeMap: any;

  originalAttributes: unknown[];
  attributes: unknown[];
}

export class AbstractQuery {
  /**
   * The SQL being executed by this Query.
   */
  sql: string;

  /**
   * Returns a unique identifier assigned to a query internally by Sequelize.
   */
  uuid: unknown;

  /**
   * A Sequelize connection instance.
   */
  connection: Connection;

  /**
   * Returns the current sequelize instance.
   */
  sequelize: Sequelize;

  options: AbstractQueryOptions;
  formatError: any;

  constructor(connection: Connection, sequelize: Sequelize, options?: AbstractQueryOptions) {
    this.uuid = crypto.randomUUID();
    this.connection = connection;
    this.sequelize = sequelize;
    this.options = {
      plain: false,
      raw: false,
      logging: console.debug,
      ...options,
    };
    this.checkLoggingOption();

    if (options.rawErrors) {
      // The default implementation in AbstractQuery just returns the same
      // error object. By overidding this.formatError, this saves every dialect
      // having to check for options.rawErrors in their own formatError
      // implementations.
      this.formatError = AbstractQuery.prototype.formatError;
    }
  }

  /**
   * Execute the passed sql query.
   *
   */
  run(sql, parameters, options) {
    throw new Error('The run method wasn\'t overwritten!');
  }

  /**
   * Check the logging option of the instance and print deprecation warnings.
   *
   * @private
   */
  checkLoggingOption() {
    if (this.options.logging === true) {
      deprecations.noTrueLogging();
      this.options.logging = console.debug;
    }
  }
}
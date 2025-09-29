import { LocalStorage } from "node-localstorage";
import _ from "lodash";
import retry from "retry";
import { setOptions, URI } from "../../tools";
import { AbstractDialect } from "../dialects/abstract";
import { Transaction, TransactionOptions } from "../sequelize";


export const ConnectionInfoFields = 'uri,database,dialect,username,password,host,port,ssl'.split(',');

export interface ConnectionOptions {
  uri: string,
  database: string,
  dialect?: any,
  username?: string,
  password?: string,
  host?: string,
  port?: number | string,
  ssl?: boolean
}

interface DialectOptions {
  [key: string]: any;
  account?: string;
  role?: string;
  warehouse?: string;
  schema?: string;
  odbcConnectionString?: string;
  charset?: string;
  timeout?: number;
  options?: string | Record<string, unknown>;
}

interface PoolOptions {
  /**
   * Maximum number of connections in pool. Default is 5
   */
  max?: number;

  /**
   * Minimum number of connections in pool. Default is 0
   */
  min?: number;

  /**
   * The maximum time, in milliseconds, that a connection can be idle before being released
   */
  idle?: number;

  /**
   * The maximum time, in milliseconds, that pool will try to get connection before throwing error
   */
  acquire?: number;

  /**
   * The time interval, in milliseconds, after which sequelize-pool will remove idle connections.
   */
  evict?: number;

  /**
   * The number of times to use a connection before closing and replacing it.  Default is Infinity
   */
  maxUses?: number;

  /**
   * A function that validates a connection. Called with client. The default function checks that client is an
   * object, and that its state is not disconnected
   */
  validate?(client?: unknown): boolean;
}

export type Dialect = 'mysql' | 'postgres' | 'sqlite' | 'mariadb' | 'mssql' | 'db2' | 'snowflake' | 'ibmi';

enum IsolationLevel {
  READ_UNCOMMITTED = 'READ UNCOMMITTED',
  READ_COMMITTED = 'READ COMMITTED',
  REPEATABLE_READ = 'REPEATABLE READ',
  SERIALIZABLE = 'SERIALIZABLE',
}

enum TransactionType {
  DEFERRED = 'DEFERRED',
  IMMEDIATE = 'IMMEDIATE',
  EXCLUSIVE = 'EXCLUSIVE',
}

enum TransactionNestMode {
  /**
   * In this mode, nesting a transaction block in another will reuse the parent transaction
   * if its options are compatible (or throw an error otherwise).
   *
   * This is the default mode.
   */
  reuse = 'reuse',

  /**
   * In this mode, nesting a transaction block will cause the creation of a SAVEPOINT
   * on the current transaction if the options provided to the nested transaction block are compatible with the parent one.
   */
  savepoint = 'savepoint',

  /**
   * In this mode, nesting a transaction block will always create a new transaction, in a separate connection.
   * This mode is equivalent to setting the "transaction" option to "null" in the nested transaction block.
   *
   * Be very careful when using this mode, as it can easily lead to transaction deadlocks if used improperly.
   */
  separate = 'separate',
}

type NormalizedPoolOptions = Readonly<Required<PoolOptions>>;

interface Config {
  readonly database: string;
  readonly dialectModule?: object;
  readonly host?: string;
  readonly port: number | string;
  readonly username: string;
  readonly password: string | null;
  readonly pool: NormalizedPoolOptions;
  readonly protocol: string;
  readonly native: boolean;
  readonly ssl: boolean;
  readonly replication: NormalizedReplicationOptions;
  readonly dialectModulePath: null | string;
  readonly keepDefaultTimezone?: boolean;
  readonly dialectOptions: Readonly<DialectOptions>;
}

export interface Options {
  /**
     * The dialect of the database you are connecting to. One of mysql, postgres, sqlite, mariadb and mssql.
     *
     * @default 'mysql'
     */
  dialect?: Dialect;

  /**
   * If specified, will use the provided module as the dialect.
   *
   * @example
   * `dialectModule: require('@myorg/tedious'),`
   */
  dialectModule?: object;

  /**
   * If specified, load the dialect library from this path. For example, if you want to use pg.js instead of
   * pg when connecting to a pg database, you should specify 'pg.js' here
   */
  dialectModulePath?: string;

  /**
   * An object of additional options, which are passed directly to the connection library
   */
  dialectOptions?: DialectOptions;

  /**
   * Only used by sqlite.
   *
   * @default ':memory:'
   */
  storage?: string;

  /**
   * The name of the database
   */
  database?: string;

  /**
   * The username which is used to authenticate against the database.
   */
  username?: string;

  /**
   * The password which is used to authenticate against the database.
   */
  password?: string;

  /**
   * The host of the relational database.
   *
   * @default 'localhost'
   */
  host?: string;

  /**
   * The port of the relational database.
   */
  port?: number | string;

  /**
   * A flag that defines if is used SSL.
   */
  ssl?: boolean;

  /**
   * The protocol of the relational database.
   *
   * @default 'tcp'
   */
  protocol?: string;

  /**
   * The version of the Database Sequelize will connect to.
   * If unspecified, or set to 0, Sequelize will retrieve it during its first connection to the Database.
   */
  databaseVersion?: string;

  /**
   * The timezone used when converting a date from the database into a JavaScript date. The timezone is also
   * used to SET TIMEZONE when connecting to the server, to ensure that the result of NOW, CURRENT_TIMESTAMP
   * and other time related functions have in the right timezone. For best cross platform performance use the
   * format
   * +/-HH:MM. Will also accept string versions of timezones supported by Intl.Locale (e.g. 'America/Los_Angeles');
   * this is useful to capture daylight savings time changes.
   *
   * @default '+00:00'
   */
  timezone?: string;

  /**
   * A flag that defines if the default timezone is used to convert dates from the database.
   *
   * @default false
   */
  keepDefaultTimezone?: boolean;

  /**
   * A flag that defines if null values should be passed to SQL queries or not.
   *
   * @default false
   */
  omitNull?: boolean;

  /**
   * A flag that defines if native library shall be used or not. Currently only has an effect for postgres
   *
   * @default false
   */
  native?: boolean;

  /**
   * Connection pool options
   */
  pool?: PoolOptions;

  // TODO [>7]: remove this option
  /**
   * Set to `false` to make table names and attributes case-insensitive on Postgres and skip double quoting of
   * them.
   *
   * @default true
   */
  quotes?: boolean;

  /**
   * Set the default transaction isolation level. See `Sequelize.Transaction.ISOLATION_LEVELS` for possible
   * options.
   *
   * @default 'REPEATABLE_READ'
   */
  isolationLevel?: IsolationLevel;

  /**
   * Set the default transaction type. See Sequelize.Transaction.TYPES for possible options. Sqlite only.
   *
   * @default 'DEFERRED'
   */
  transactionType?: TransactionType;

  /**
   * Disable built in type validators on insert and update, e.g. don't validate that arguments passed to integer
   * fields are integer-like.
   *
   * @default false
   */
  noTypeValidation?: boolean;

  /**
   * The PostgreSQL `standard_conforming_strings` session parameter. Set to `false` to not set the option.
   * WARNING: Setting this to false may expose vulnerabilities and is not recommended!
   *
   * @default true
   */
  standardConformingStrings?: boolean;

  /**
   * The PostgreSQL `client_min_messages` session parameter.
   * Set to `false` to not override the database's default.
   *
   * Deprecated in v7, please use the sequelize option "dialectOptions.clientMinMessages" instead
   *
   * @deprecated
   * @default 'warning'
   */
  clientMinMessages?: string | boolean;

  /**
   * Set to `true` to automatically minify aliases generated by sequelize.
   * Mostly useful to circumvent the POSTGRES alias limit of 64 characters.
   *
   * @default false
   */
  minifyAliases?: boolean;

  /**
   * Set to `true` to show bind parameters in log.
   *
   * @default false
   */
  logQueryParameters?: boolean;

  retry?: Object;

  /**
   * If defined the connection will use the provided schema instead of the default ("public").
   */
  schema?: string;

  /**
   * SQLite only. If set to false, foreign keys will not be enforced by SQLite.
   *
   * @default true
   */
  // TODO: move to dialectOptions, rename to noForeignKeyEnforcement, and add integration tests with
  //  query-interface methods that temporarily disable foreign keys.
  foreignKeys?: boolean;

  /**
   * Disable the use of AsyncLocalStorage to automatically pass transactions started by {@link Sequelize#transaction}.
   * You will need to pass transactions around manually if you disable this.
   */
  disableClsTransactions?: boolean;

  /**
   * How nested transaction blocks behave by default.
   * See {@link ManagedTransactionOptions#nestMode} for more information.
   *
   * @default TransactionNestMode.reuse
   */
  defaultTransactionNestMode?: TransactionNestMode;
}

interface NormalizedReplicationOptions {
  read: ConnectionOptions[];

  write: ConnectionOptions;
}

type RequiredBy<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;

interface NormalizedOptions extends RequiredBy<Options,
  | 'transactionType'
  | 'isolationLevel'
  | 'noTypeValidation'
  | 'dialectOptions'
  | 'dialect'
  | 'timezone'
  | 'disableClsTransactions'
  | 'defaultTransactionNestMode'
> {
  readonly replication: NormalizedReplicationOptions;
}

export class Sequelize {
  readonly options: NormalizedOptions;
  readonly config: Config;
  readonly pool?: PoolOptions;
  readonly dialect: AbstractDialect;
  readonly connectionManager: any;
  #transactionCls: LocalStorage | undefined;

  constructor(database, username?, password?, options?) {
    if (arguments.length === 1 && _.isPlainObject(database)) {
      // new Sequelize({ ... options })
      options = database;
    } else if (arguments.length === 1 && typeof database === 'string' || arguments.length === 2 && _.isPlainObject(username)) {
      // new Sequelize(URI, { ... options })
      options = username ? { ...username } : Object.create(null);

      _.defaultsDeep(options, new URI(arguments[0]));
    } else {
      // new Sequelize(database, username, password, { ... options })
      options = options ? { ...options } : Object.create(null);

      setOptions(options, {
        database,
        username,
        password,
      });
    }

    if (options.pool === false) {
      throw new Error('Support for pool:false was removed in v4.0');
    }

    this.options = {
      dialect: null,
      dialectModule: null,
      dialectModulePath: null,
      dialectOptions: Object.create(null),
      host: 'localhost',
      protocol: 'tcp',
      define: {},
      query: {},
      sync: {},
      timezone: '+00:00',
      keepDefaultTimezone: false,
      standardConformingStrings: true,
      logging: console.debug,
      omitNull: false,
      native: false,
      replication: false,
      ssl: undefined,
      // TODO [>7]: remove this option
      quotes: true,
      hooks: {},
      retry: {
        max: 5,
        match: [
          'SQLITE_BUSY: database is locked',
        ],
      },
      transactionType: TransactionType.DEFERRED,
      isolationLevel: null,
      databaseVersion: null,
      noTypeValidation: false,
      benchmark: false,
      minifyAliases: false,
      logQueryParameters: false,
      disableClsTransactions: false,
      defaultTransactionNestMode: TransactionNestMode.reuse,
      ...options,
      pool: setOptions(options.pool || {}, {
        max: 5,
        min: 0,
        idle: 10_000,
        acquire: 60_000,
        evict: 1000,
      }),
    };

    if (!this.options.dialect) {
      throw new Error('Dialect needs to be explicitly supplied as of v4.0.0');
    }

    let Dialect;
    // Requiring the dialect in a switch-case to keep the
    // require calls static. (Browserify fix)
    switch (this.getDialect()) {
      case 'mariadb':
        Dialect = require('../dialects/mariadb').DbMaria;
        break;
      case 'mssql':
        Dialect = require('../dialects/mssql').DbMssql;
        break;
      case 'mysql':
        Dialect = require('../dialects/mysql').DbMysql;
        break;
      case 'postgres':
        Dialect = require('../dialects/postgres').DbPostgres;
        break;
      case 'sqlite':
        Dialect = require('../dialects/sqlite').DbSqlite;
        break;
      default:
        throw new Error(`The dialect ${this.getDialect()} is not supported. Supported dialects: mariadb, mssql, mysql, postgres, sqlite, ibmi, db2 and snowflake.`);
    }

    if (!this.options.port) {
      this.options.port = Dialect.getDefaultPort();
    } else {
      this.options.port = Number(this.options.port);
    }

    const connectionConfig = {
      database: this.options.database,
      username: this.options.username,
      password: this.options.password || null,
      host: this.options.host,
      port: this.options.port,
      protocol: this.options.protocol,
      ssl: this.options.ssl,
      dialectOptions: this.options.dialectOptions,
    };

    this.config = {
      ...connectionConfig,
      pool: null,//this.options.pool,
      native: this.options.native,
      replication: this.options.replication,
      dialectModule: this.options.dialectModule,
      dialectModulePath: this.options.dialectModulePath,
      keepDefaultTimezone: this.options.keepDefaultTimezone,
    };

    this.dialect = new Dialect(this);

    this.connectionManager = this.dialect.connectionManager;
  }

  getDialect() {
    return this.options.dialect;
  }

  getDatabaseVersion(): string {
    if (this.options.databaseVersion == null) {
      throw new Error('The current database version is unknown. Please call `sequelize.authenticate()` first to fetch it, or manually configure it through options.');
    }

    return this.options.databaseVersion;
  }

  getDatabaseName() {
    return this.config.database;
  }

  getQueryInterface() {
    return this.queryInterface;
  }

  get queryInterface() {
    return this.dialect.queryInterface;
  }

  /**
   * The QueryGenerator instance, dialect dependant.
   */
  get queryGenerator() {
    return this.dialect.queryGenerator;
  }

  startUnmanagedTransaction(options?: TransactionOptions): Transaction {
    const self: any = this;
    const transaction = new Transaction(
      self,
      options,
    );

    transaction.prepareEnvironment();

    return transaction;
  }

  queryRaw = this.query;
  
  query(sql: any, options: any): any {
    const retryOptions = { ...this.options.retry, ...options.retry };
    const operation = retry.operation();
    let bindParameters = options.bind;
    // return operation.attempt(() => 
    {
      const connection = options.transaction ? options.transaction.getConnection()
        : options.connection ? options.connection
        : this.connectionManager.getConnection({
          useMaster: options.useMaster,
          type: options.type === 'SELECT' ? 'read' : 'write',
        });

      if (this.options.dialect === 'db2' && options.alter && options.alter.drop === false) {
        connection.dropTable = false;
      }

      const query = new this.dialect.Query(connection, this, options);
      try {
        const res = query.run(sql, bindParameters, { minifyAliases: options.minifyAliases });
        return res;
      } finally {
        if (!options.transaction && !options.connection) {
          this.connectionManager.releaseConnection(connection);
        }
      }
    }
    // , retryOptions);
  }
  
  close() {
    return this.connectionManager.close();
  }

  getCurrentClsTransaction(): Transaction | undefined {
    // return this.#transactionCls?.getStore();
    throw new Error('Not implemented');
    return this.#transactionCls as any;
  }
};

export function setTransactionFromCls(options: any, sequelize: Sequelize): void {
  if (options.transaction && (options.connection && options.connection !== options.transaction.getConnection())) {
    throw new Error(`You are using mismatching "transaction" and "connection" options. Please pass either one of them, or make sure they're both using the same connection.`);
  }

  if (options.transaction === undefined && options.connection == null) {
    options.transaction = sequelize.getCurrentClsTransaction();
  }

  if (options.connection) {
    const clsTransaction = sequelize.getCurrentClsTransaction();
    const transactionConnection = clsTransaction?.getConnectionIfExists();
    if (transactionConnection && transactionConnection === options.connection) {
      options.transaction = clsTransaction;
    }
  } else {
    options.connection = options.transaction?.getConnectionIfExists();
  }
}
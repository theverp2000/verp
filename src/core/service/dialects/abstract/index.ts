import type { Class } from 'type-fest';
import { NotImplementedError } from "../../../helper/errors";
import { Dialect, Sequelize } from "../../dbservice";
import { AbstractConnectionManager, AbstractQuery, AbstractQueryGenerator, AbstractQueryInterface } from "./query";

export abstract class AbstractDataType<
  /** The type of value we'll accept - ie for a column of this type, we'll accept this value as user input. */
  AcceptedType,
> {
}

export interface Connection {
  /** custom property we attach to different dialect connections */
  uuid?: string | undefined;
}

export interface GetConnectionOptions {
  /**
   * Set which replica to use. Available options are `read` and `write`
   */
  type: 'read' | 'write';

  /**
   * Force master or write replica to get connection from
   */
  useMaster?: boolean;

  /**
   * ID of the connection.
   */
  uuid?: string | 'default';
}

export interface IDbService {
  supports: DialectSupports;
  queryGenerator: AbstractQueryGenerator;
  queryInterface: AbstractQueryInterface;

  // options: {};
  now(): string;
  // name(name: string): string;
  // string(name: string): string;
  quote(name: string, char?: string): string;
  quotes(names: any, char?: string): string;
  hasUnaccent(cr): Promise<boolean>;
  hasTrigram(cr): Promise<boolean>;

  createEmptyDatabase(name: string): Promise<void>;

  getSystemDbName(): string;
  getVarcharMaximumLength(type: string): number;
  getDataTypeBlob(): string;
  getDataTypeDatetime(): string

  convertDataTypeFloat(type: string): string;
  convertDataTypeVarchar(type: string): string;
  convertDataTypeDatetime(type: string): string;

  sqlCreateDatabase(name): string;
  sqlDropDatabase(name: string): string;

  sqlSetSessionTimeout(): string;

  sqlCreateNewSequence(name: string): string;

  sqlSelectExistingTables(tableNames: string[]): string;
  sqlSelectTablesExists(tableNames: string[]): string;
  sqlSelectSequenceByName(name: string): string;
  sqlSelectNextSequence(names: string[]): string
  sqlSelectLastSequence(names: string[]): string;
  sqlSelectForeignKey(tablename1, columnname1, tablename2, columnname2, ondelete): string;
  sqlSelectAllForeignKeys(tableNames: string[], schemaName?: string): string;
  sqlSelectTableExists(tableName: any): string;
}

export interface SupportableNumericOptions {
  zerofill: boolean;
  /** Whether this dialect supports the unsigned option natively */
  unsigned: boolean;
}

export interface SupportableDecimalNumberOptions extends SupportableNumericOptions {
  /** Whether NaN can be inserted in a column that uses this DataType. */
  NaN: boolean;
  /** Whether Infinity/-Infinity can be inserted in a column that uses this DataType. */
  infinity: boolean;
}

export interface SupportableFloatOptions extends SupportableDecimalNumberOptions {
  /** Whether scale & precision can be specified as parameters */
  scaleAndPrecision: boolean;
}

export interface SupportableExactDecimalOptions extends SupportableDecimalNumberOptions {
  /**
   * Whether this dialect supports unconstrained numeric/decimal columns. i.e. columns where numeric values of any length can be stored.
   * The SQL standard requires that "NUMERIC" with no option be equal to "NUMERIC(0,0)", but some dialects (postgres)
   * interpret it as an unconstrained numeric.
   */
  unconstrained: boolean;

  /**
   * Whether this dialect supports constrained numeric/decimal columns. i.e. columns where numeric values of any length can be stored.
   */
  constrained: boolean;
}

export type DialectSupports = {
  'DEFAULT': boolean,
  'DEFAULT VALUES': boolean,
  'VALUES ()': boolean,
  // TODO: rename to `update.limit`
  'LIMIT ON UPDATE': boolean,
  'ON DUPLICATE KEY': boolean,
  'ORDER NULLS': boolean,
  'UNION': boolean,
  'UNION ALL': boolean,
  'RIGHT JOIN': boolean,
  EXCEPTION: boolean,

  forShare?: 'LOCK IN SHARE MODE' | 'FOR SHARE' | undefined,
  lock: boolean,
  lockOf: boolean,
  lockKey: boolean,
  lockOuterJoinFailure: boolean,
  skipLocked: boolean,
  finalTable: boolean,

  /* does the dialect support returning values for inserted/updated fields */
  returnValues: false | 'output' | 'returning',

  /* features specific to autoIncrement values */
  autoIncrement: {
    /* does the dialect require modification of insert queries when inserting auto increment fields */
    identityInsert: boolean,

    /* does the dialect support inserting default/null values for autoincrement fields */
    defaultValue: boolean,

    /* does the dialect support updating autoincrement fields */
    update: boolean,
  },
  /* Do we need to say DEFAULT for bulk insert */
  bulkDefault: boolean,
  /**
   * Whether this dialect has native support for schemas.
   * For the purposes of Sequelize, a Schema is considered to be a grouping of tables.
   * For instance, in MySQL, "CREATE DATABASE" creates what we consider to be a schema.
   */
  schemas: boolean,
  /**
   * Whether this dialect has native support for having multiple databases per instance (in the postgres or mssql sense).
   * For the purposes of Sequelize, a database is considered to be a grouping of schemas.
   * For instance, in MySQL, "CREATE DATABASE" creates what we consider to be a schema,
   * so we do not consider that MySQL supports this option.
   */
  multiDatabases: boolean,
  transactions: boolean,
  settingIsolationLevelDuringTransaction: boolean,
  transactionOptions: {
    type: boolean,
  },
  migrations: boolean,
  upserts: boolean,
  inserts: {
    ignoreDuplicates: string, /* dialect specific words for INSERT IGNORE or DO NOTHING */
    updateOnDuplicate: boolean | string, /* whether dialect supports ON DUPLICATE KEY UPDATE */
    onConflictDoNothing: string, /* dialect specific words for ON CONFLICT DO NOTHING */
    onConflictWhere: boolean, /* whether dialect supports ON CONFLICT WHERE */
    conflictFields: boolean, /* whether the dialect supports specifying conflict fields or not */
  },
  constraints: {
    restrict: boolean,
    /**
     * This dialect supports marking a column's constraints as deferrable.
     * e.g. 'DEFERRABLE' and 'INITIALLY DEFERRED'
     */
    deferrable: boolean,
    unique: boolean,
    default: boolean,
    check: boolean,
    foreignKey: boolean,
    /** Whether this dialect supports disabling foreign key checks for the current session */
    foreignKeyChecksDisableable: boolean,
    primaryKey: boolean,
    onUpdate: boolean,
    add: boolean,
    remove: boolean,
    removeOptions: {
      cascade: boolean,
      ifExists: boolean,
    },
  },
  index: {
    collate: boolean,
    length: boolean,
    parser: boolean,
    concurrently: boolean,
    type: boolean,
    using: boolean | number,
    functionBased: boolean,
    operator: boolean,
    where: boolean,
    include: boolean,
  },
  groupedLimit: boolean,
  indexViaAlter: boolean,
  alterColumn: {
    /**
     * Can "ALTER TABLE x ALTER COLUMN y" add UNIQUE to the column in this dialect?
     */
    unique: boolean,
  },
  dataTypes: {
    CHAR: boolean,
    /**
     * Whether this dialect provides a binary collation on text, varchar & char columns.
     */
    COLLATE_BINARY: boolean,
    /** This dialect supports case-insensitive text */
    CITEXT: boolean,
    /** Options supportable by all int types (from tinyint to bigint) */
    INTS: SupportableNumericOptions,
    /** @deprecated */
    REAL: SupportableFloatOptions,
    /** This dialect supports 4 byte long floating point numbers */
    FLOAT: SupportableFloatOptions,
    /** This dialect supports 8 byte long floating point numbers */
    DOUBLE: SupportableFloatOptions,
    /** This dialect supports arbitrary precision numbers */
    DECIMAL: false | SupportableExactDecimalOptions,
    /**
     * The dialect is considered to support JSON if it provides either:
     * - A JSON data type.
     * - An SQL function that can be used as a CHECK constraint on a text column, to ensure its contents are valid JSON.
     */
    JSON: boolean,
    JSONB: boolean,
    ARRAY: boolean,
    RANGE: boolean,
    GEOMETRY: boolean,
    GEOGRAPHY: boolean,
    HSTORE: boolean,
    TSVECTOR: boolean,
    CIDR: boolean,
    INET: boolean,
    MACADDR: boolean,
    DATETIME: {
      /** Whether "infinity" is a valid value in this dialect's DATETIME data type */
      infinity: boolean,
    },
    DATEONLY: {
      /** Whether "infinity" is a valid value in this dialect's DATEONLY data type */
      infinity: boolean,
    },
    TIME: {
      /** Whether the dialect supports TIME(precision) */
      precision: boolean,
    },
  },
  REGEXP: boolean,
  /**
   * Case-insensitive regexp operator support ('~*' in postgres).
   */
  IREGEXP: boolean,
  /** Whether this dialect supports SQL JSON functions */
  jsonOperations: boolean,
  /** Whether this dialect supports returning quoted & unquoted JSON strings  */
  jsonExtraction: {
    unquoted: boolean,
    quoted: boolean,
  },
  tmpTableTrigger: boolean,
  indexHints: boolean,
  tableHints: boolean,
  searchPath: boolean,
  /**
   * This dialect supports E-prefixed strings, e.g. "E'foo'", which
   * enables the ability to use backslash escapes inside of the string.
   */
  escapeStringConstants: boolean,

  /** Whether this dialect supports changing the global timezone option */
  globalTimeZoneConfig: boolean,
  dropTable: {
    cascade: boolean,
  },
  maxExecutionTimeHint: {
    select: boolean,
  },
  truncate: {
    cascade: boolean,
  },
};

export abstract class AbstractDialect implements IDbService {
  readonly supports: DialectSupports = {
    DEFAULT: true,
    'DEFAULT VALUES': false,
    'VALUES ()': false,
    'LIMIT ON UPDATE': false,
    'ON DUPLICATE KEY': true,
    'ORDER NULLS': false,
    UNION: true,
    'UNION ALL': true,
    'RIGHT JOIN': true,
    EXCEPTION: false,
    lock: false,
    lockOf: false,
    lockKey: false,
    lockOuterJoinFailure: false,
    skipLocked: false,
    finalTable: false,
    returnValues: false,
    autoIncrement: {
      identityInsert: false,
      defaultValue: true,
      update: true,
    },
    bulkDefault: false,
    schemas: false,
    multiDatabases: false,
    transactions: true,
    settingIsolationLevelDuringTransaction: true,
    transactionOptions: {
      type: false,
    },
    migrations: true,
    upserts: true,
    inserts: {
      ignoreDuplicates: '',
      updateOnDuplicate: false,
      onConflictDoNothing: '',
      onConflictWhere: false,
      conflictFields: false,
    },
    constraints: {
      restrict: true,
      deferrable: false,
      unique: true,
      default: false,
      check: true,
      foreignKey: true,
      foreignKeyChecksDisableable: false,
      primaryKey: true,
      onUpdate: true,
      add: true,
      remove: true,
      removeOptions: {
        cascade: false,
        ifExists: false,
      },
    },
    index: {
      collate: true,
      length: false,
      parser: false,
      concurrently: false,
      type: false,
      using: true,
      functionBased: false,
      operator: false,
      where: false,
      include: false,
    },
    groupedLimit: true,
    indexViaAlter: false,
    alterColumn: {
      unique: true,
    },
    dataTypes: {
      CHAR: true,
      COLLATE_BINARY: false,
      CITEXT: false,
      INTS: { zerofill: false, unsigned: false },
      FLOAT: { NaN: false, infinity: false, zerofill: false, unsigned: false, scaleAndPrecision: false },
      REAL: { NaN: false, infinity: false, zerofill: false, unsigned: false, scaleAndPrecision: false },
      DOUBLE: { NaN: false, infinity: false, zerofill: false, unsigned: false, scaleAndPrecision: false },
      DECIMAL: { constrained: true, unconstrained: false, NaN: false, infinity: false, zerofill: false, unsigned: false },
      CIDR: false,
      MACADDR: false,
      INET: false,
      JSON: false,
      JSONB: false,
      ARRAY: false,
      RANGE: false,
      GEOMETRY: false,
      GEOGRAPHY: false,
      HSTORE: false,
      TSVECTOR: false,
      DATETIME: {
        infinity: false,
      },
      DATEONLY: {
        infinity: false,
      },
      TIME: {
        precision: true,
      },
    },
    jsonOperations: false,
    jsonExtraction: {
      unquoted: false,
      quoted: false,
    },
    REGEXP: false,
    IREGEXP: false,
    tmpTableTrigger: false,
    indexHints: false,
    tableHints: false,
    searchPath: false,
    escapeStringConstants: false,
    globalTimeZoneConfig: false,
    dropTable: {
      cascade: false,
    },
    maxExecutionTimeHint: {
      select: false,
    },
    truncate: {
      cascade: false,
    },
  };
  // Data
  queryGenerator: AbstractQueryGenerator;
  queryInterface: AbstractQueryInterface;
  readonly connectionManager: AbstractConnectionManager<any>;
  readonly Query: typeof AbstractQuery;
  readonly sequelize: Sequelize;
  readonly name: Dialect;
  readonly DataTypes: Record<string, Class<AbstractDataType<any>>>;

  constructor(sequelize?: Sequelize, dialectDataTypes?: Record<string, Class<AbstractDataType<any>>>, dialectName?: Dialect) {
    this.sequelize = sequelize;
    this.DataTypes = dialectDataTypes;
    this.name = dialectName;
  }

  now(): string {
    // @ts-expect-error -- untyped constructor
    return this.constructor.now();
  }

  getDefaultOptions() {
    // @ts-expect-error -- untyped constructor
    return this.constructor.getDefaultOptions();
  }

  getDefaultPort(): number {
    // @ts-expect-error -- untyped constructor
    return this.constructor.getDefaultPort();
  }

  quote(name: string, char: string) {
    return this.queryGenerator.quote(name, char);
  }

  quotes(name: string, char: string) {
    return this.queryGenerator.quotes(name, char);
  }
  
  // Helpers
  async hasUnaccent(cr) {
    return false;
  }

  async hasTrigram(cr) {
    return false;
  }

  async createEmptyDatabase(name: string) {
    throw new Error("Method not implemented.");
  }

  getSystemDbName(): string {
    return this.getDefaultOptions()['database'];
  }

  getVarcharMaximumLength(type: string): number {
    const start = type.indexOf('(');
    const end = type.indexOf(')');
    const maximum = start < end && end < type.length ? Number(type.slice(start + 1, end)) : 0;
    return maximum;
  }

  getDataTypeBlob(): string {
    throw new Error("Method not implemented.");
  }

  getDataTypeDatetime(): string {
    throw new Error("Method not implemented.");
  }

  // Convert data types
  convertDataTypeFloat(type: string): string {
    return type.toUpperCase();
  }

  convertDataTypeVarchar(type: string): string {
    return type.toUpperCase();
  }

  convertDataTypeDatetime(type: string): string {
    return type.toUpperCase();
  }

  // SQL
  sqlCreateDatabase(name) {
    return 'CREATE DATABASE ' + name;
  }

  sqlDropDatabase(name) {
    return 'DROP DATABASE ' + name;
  }

  sqlSetNextSequence(name: string, value: number): string {
    return `SELECT SETVAL(${name}, ${value})`;
  }  

  sqlSetSessionTimeout(): string {
    throw new Error("Method not implemented.");
  }

  sqlCreateNewSequence(name: string): string {
    throw new NotImplementedError('Need to code');
  }

  sqlSelectExistingTables(tableNames: string[]): string {
    throw new NotImplementedError('Need to code');
  }

  sqlSelectTablesExists(tableNames: string[]): string {
    throw new NotImplementedError('Need to code');
  }

  sqlSelectNextSequence(names: string[]): string {
    throw new NotImplementedError('Need to code');
  }

  sqlSelectLastSequence(names: string[]): string {
    throw new Error("Method not implemented.");
  }

  sqlSelectSequenceByName(name: string): string {
    throw new Error("Method not implemented.");
  }

  sqlSelectForeignKey(tablename1, columnname1, tablename2, columnname2, ondelete): string {
    throw new Error("Method not implemented.");
  }

  sqlSelectAllForeignKeys(tableNames: string[], schemaName?: string): string {
    throw new Error("Method not implemented.");
  }

  sqlSelectTableExists(tableName): string {
    throw new Error("Method not implemented.");
  }
}


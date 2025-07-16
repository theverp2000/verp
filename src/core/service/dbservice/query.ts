import { Connection } from "../dialects/abstract";
import { Transaction } from "../sequelize";

export enum QueryTypes {
  SELECT = "SELECT",
  INSERT = "INSERT",
  UPDATE = "UPDATE",
  BULKUPDATE = "BULKUPDATE",
  DELETE = "DELETE",
  UPSERT = "UPSERT",
  SHOWINDEXES = "SHOWINDEXES",
  DESCRIBE = "DESCRIBE",
  RAW = "RAW",
  SHOWCONSTRAINTS = "SHOWCONSTRAINTS"
}

export interface Transactionable {
  /**
   * The transaction in which this query must be run.
   * Mutually exclusive with {@link Transactionable.connection}.
   *
   * If {@link Options.disableClsTransactions} has not been set to true, and a transaction is running in the current AsyncLocalStorage context,
   * that transaction will be used, unless null or another Transaction is manually specified here.
   */
  transaction?: Transaction | null | undefined;

  /**
   * The connection on which this query must be run.
   * Mutually exclusive with {@link Transactionable.transaction}.
   *
   * Can be used to ensure that a query is run on the same connection as a previous query, which is useful when
   * configuring session options.
   *
   * Specifying this option takes precedence over CLS Transactions. If a transaction is running in the current
   * AsyncLocalStorage context, it will be ignored in favor of the specified connection.
   */
  connection?: Connection | null | undefined;
}

export interface QueryRawOptions extends Transactionable {

}

export interface CreateDatabaseOptions extends QueryRawOptions {
  encoding?: string;
}

export interface DatabaseDescription {
  name: string;
}

export interface QueryRawOptionsWithType<T extends QueryTypes> extends QueryRawOptions {
  /**
   * The type of query you are executing. The query type affects how results are formatted before they are
   * passed back. The type is a string, but `Sequelize.QueryTypes` is provided as convenience shortcuts.
   */
  type: T;
}
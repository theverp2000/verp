import { PgConnection } from ".";
import { DatabaseError } from "../../../helper";
import { Sequelize } from "../../dbservice";
import { AbstractQuery, AbstractQueryGenerator, AbstractQueryInterface } from "../abstract/query";

export class PostgresQueryGenerator extends AbstractQueryGenerator {
  static readonly QUOTE_NAME = '"';
  static readonly QUOTE_STRING = "'";
  
  now(): string {
    return `SELECT (now() AT TIME ZONE 'UTC')`;
  }

  escape(tableName: any) {
    return `"${tableName}"`;
  }

}

export class PostgresQueryInterface extends AbstractQueryInterface {
  queryGenerator: PostgresQueryGenerator;

  constructor(sequelize?: Sequelize, queryGenerator?: PostgresQueryGenerator) {
    super(sequelize, queryGenerator);
  }
}

export class PostgresQuery extends AbstractQuery {
  run(sql, parameters, options) {
    let queryResult;

    try {
      queryResult = (this.connection as PgConnection).querySync(sql, parameters);
    } catch(e) {
      throw new DatabaseError(e.message);
    }

    let _rows = Array.isArray(queryResult)
      ? queryResult.reduce((allRows, r) => allRows.concat(r.rows || []), [])
      : queryResult.rows;
    const _rowCount = Array.isArray(queryResult)
      ? queryResult.reduce(
        (count, r) => (Number.isFinite(r.rowCount) ? count + r.rowCount : count),
        0,
      )
      : queryResult.rowCount || 0;

    const rows = queryResult;
    const rowCount = rows?.length

    return [
      rows && (this.options.plain && rows[0] || rows) || undefined,
      rowCount,
    ];
  }
}
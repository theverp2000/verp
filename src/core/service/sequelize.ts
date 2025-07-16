// export { Sequelize, Transaction, QueryTypes, DataTypes, TransactionOptions } from './dbservice';
export { Sequelize, Transaction, QueryTypes, DataTypes, TransactionOptions } from '@sequelize/core';

export const ConnectionInfoFields = 'uri,database,dialect,username,password,host,port,ssl'.split(',');

export interface ConnectionInfo {
  uri: string,
  database: string,
  dialect?: any,
  username?: string,
  password?: string,
  host?: string,
  port?: number,
  ssl?: boolean
}
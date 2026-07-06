import { Sequelize } from 'sequelize';
import { env } from './env.js';
import { enableDbLogging, initLogModel } from '../models/Log.js';

export const sequelize: Sequelize | null = env.databaseUrl
  ? new Sequelize(env.databaseUrl, {
      logging: (sql) => console.debug('[DB]', sql),
    })
  : null;

// The database is optional: without DATABASE_URL, or when the connection
// fails, chat logs go to stdout and the server keeps running.
export async function initDatabase(): Promise<void> {
  if (!sequelize) {
    console.debug('[DB] DATABASE_URL not set. Chat logs go to stdout only.');
    return;
  }
  try {
    initLogModel(sequelize);
    await sequelize.sync();
    enableDbLogging();
    console.debug('[DB] Database synchronized successfully.');
  } catch (error) {
    console.error('[DB] Database unavailable, falling back to stdout logging:', error);
  }
}

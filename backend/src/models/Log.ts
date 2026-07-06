import { DataTypes, Model, type Optional, type Sequelize } from 'sequelize';

export type LogType = 'request' | 'response';

interface LogAttributes {
  id: number;
  ip: string;
  userAgent: string;
  type: LogType;
  payload: string;
}

type LogCreationAttributes = Optional<LogAttributes, 'id'>;

export class Log extends Model<LogAttributes, LogCreationAttributes> {}

let dbLoggingEnabled = false;

export function initLogModel(sequelize: Sequelize): void {
  Log.init(
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      ip: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      userAgent: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      type: {
        type: DataTypes.ENUM('request', 'response'),
        allowNull: false,
      },
      payload: {
        type: DataTypes.TEXT('long'),
        allowNull: false,
      },
    },
    {
      tableName: 'logs',
      sequelize,
    },
  );
}

export function enableDbLogging(): void {
  dbLoggingEnabled = true;
}

export interface ChatLogEntry {
  ip: string;
  userAgent: string;
  type: LogType;
  payload: string;
}

// Never throws: a database failure must not break the chat flow.
export async function recordLog(entry: ChatLogEntry): Promise<void> {
  if (dbLoggingEnabled) {
    try {
      await Log.create(entry);
      console.debug(`[DB] ${entry.type} log persisted for ${entry.ip}`);
      return;
    } catch (error) {
      console.error('[DB] Failed to persist log entry, writing to stdout instead:', error);
    }
  }
  console.debug(
    `[DB] ${entry.type} log ip=${entry.ip} ua=${JSON.stringify(entry.userAgent)} payload=${entry.payload}`,
  );
}

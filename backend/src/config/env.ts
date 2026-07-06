import dotenv from 'dotenv';

dotenv.config();

export interface Env {
  port: number;
  openaiApiKey: string;
  openaiModel: string;
  allowedOrigins: string[];
  databaseUrl: string | undefined;
  dailyRequestCap: number; // global OpenAI-call ceiling per UTC day (bounds cost under IP rotation)
}

function parseDailyCap(raw: string | undefined): number {
  const n = Number.parseInt(raw ?? '', 10);
  return Number.isFinite(n) && n > 0 ? n : 1500;
}

function parsePort(raw: string | undefined): number {
  if (!raw) return 3000;
  const port = Number.parseInt(raw, 10);
  if (Number.isNaN(port) || port <= 0 || port > 65535) {
    console.error(`[SERVER] Invalid PORT value "${raw}".`);
    process.exit(1);
  }
  return port;
}

function parseAllowedOrigins(raw: string | undefined): string[] {
  const value = raw ?? 'https://krystianslowik.com,http://localhost:4321';
  return value
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
}

function requireOpenaiApiKey(): string {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    console.error(
      '[SERVER] OPENAI_API_KEY is not set. Set it in the environment or backend/.env before starting.',
    );
    process.exit(1);
  }
  return key;
}

export const env: Env = {
  port: parsePort(process.env.PORT),
  openaiApiKey: requireOpenaiApiKey(),
  openaiModel: process.env.OPENAI_MODEL ?? 'gpt-4o',
  allowedOrigins: parseAllowedOrigins(process.env.ALLOWED_ORIGINS),
  databaseUrl: process.env.DATABASE_URL || undefined,
  dailyRequestCap: parseDailyCap(process.env.DAILY_REQUEST_CAP),
};

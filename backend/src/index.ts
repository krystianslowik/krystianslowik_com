import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import { initDatabase } from './config/database.js';
import { rateLimiter } from './middleware/rateLimiter.js';
import chatRouter from './routes/chat.js';

const app = express();
app.disable('x-powered-by');

// Behind the k8s ingress: trust exactly ONE proxy hop (Traefik), so req.ip is the
// address Traefik saw. `true` would trust the leftmost client-supplied
// X-Forwarded-For entry and let callers spoof fresh rate-limit buckets per request.
app.set('trust proxy', 1);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g., curl, health probes).
      if (!origin) return callback(null, true);
      if (env.allowedOrigins.includes(origin)) return callback(null, true);
      console.warn(`[CORS] Request from origin ${origin} blocked.`);
      return callback(new Error('Not allowed by CORS'));
    },
  }),
);

// The rate limiter reads req.body.conversation, so JSON parsing must run first.
app.use(express.json({ limit: '100kb' }));

app.get('/healthz', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use('/chat', rateLimiter, chatRouter);

// Global error handler: never leak stack traces, map known failures to clean JSON.
// (Express 5 also routes body-parse errors and the CORS rejection here.)
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (err.message === 'Not allowed by CORS') {
    res.status(403).json({ error: 'Origin not allowed.' });
    return;
  }
  if ('type' in err && (err as { type?: string }).type === 'entity.parse.failed') {
    res.status(400).json({ error: 'Body must be valid JSON.' });
    return;
  }
  console.error('[SERVER] Unhandled error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

const server = app.listen(env.port, () => {
  console.debug(`[SERVER] Chat API server running on port ${env.port}`);
});

// Graceful shutdown for k8s rollouts: stop accepting, drain in-flight, then exit.
const shutdown = (signal: string) => {
  console.debug(`[SERVER] ${signal} received, draining connections.`);
  server.close(() => {
    console.debug('[SERVER] Drained. Bye.');
    process.exit(0);
  });
  setTimeout(() => {
    console.warn('[SERVER] Drain timed out after 10s, exiting.');
    process.exit(0);
  }, 10_000).unref();
};
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// The database is optional and must never block or crash the server.
void initDatabase();

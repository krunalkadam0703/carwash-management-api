import express, { Application, Request, Response } from 'express';
import { toNodeHandler } from 'better-auth/node';
import cookieParser from 'cookie-parser';
import apiRouter from './routes/index.js';
import { auth } from './config/auth.config.js';
import { errorMiddleware } from './middlewares/error.middleware.js';

const app: Application = express();

app.disable('x-powered-by');
app.set('trust proxy', 1);

const configuredOrigins = process.env.BETTER_AUTH_TRUSTED_ORIGINS?.split(',')
  .map((origin) => origin.trim())
  .filter(Boolean) ?? [];

const allowedOrigins = new Set([
  ...configuredOrigins,
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:8080',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:8080',
]);

app.use((req, res, next) => {
  const origin = req.headers.origin;

  if (origin && allowedOrigins.has(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Vary', 'Origin');
  }

  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');

  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }

  next();
});

app.all('/api/auth/{*authPath}', toNodeHandler(auth));

// High-Performance Body Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
const cookieSecret = process.env.COOKIE_SECRET || 'local-dev-fallback-secret-12345';
app.use(cookieParser(cookieSecret));

// Fast infrastructure health-check probe (bypasses routing trees for speed)
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'UP',
    timestamp: new Date().toISOString(),
  });
});

// Attach Master API Gateways
app.use('/api/v1', apiRouter);

// Fallback 404 Route Interceptor for invalid paths
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: { message: 'Requested API resource path not found.' },
  });
});

// Central Error Boundary Layer (CRITICAL: Must be registered last)
app.use(errorMiddleware);

export default app;



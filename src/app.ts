import express, { Application, Request, Response } from 'express';
import cookieParser from 'cookie-parser';
import apiRouter from './routes/index.js';
import { errorMiddleware } from './middlewares/error.middleware.js';

const app: Application = express();

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

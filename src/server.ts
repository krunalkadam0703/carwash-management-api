import http from 'http';
import cluster from 'cluster';
import { availableParallelism } from 'os';

import app from './app.js';
import { prisma } from './infrastructure/prisma/prisma.client.js';
import { RedisClient } from './infrastructure/redis/index.js';

const PORT = Number(process.env.PORT) || 5000;
const numCPUs = availableParallelism();

if (cluster.isPrimary && process.env.NODE_ENV === 'production') {
  console.log(`🚀 Primary Process [${process.pid}] managing cluster.`);

  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    console.error(`❌ Worker [${worker.process.pid}] exited (Code: ${code}, Signal: ${signal})`);

    cluster.fork();
  });
} else {
  bootstrap();
}

async function bootstrap(): Promise<void> {
  try {
    await RedisClient.initialize();
    await prisma.$connect();

    const server = http.createServer(app);

    server.listen(PORT, () => {
      console.log(`⚡ Worker [${process.pid}] listening on port ${PORT}`);
    });

    const gracefulShutdown = async (signal: string): Promise<void> => {
      console.log(`🛑 Received ${signal}. Starting graceful shutdown.`);

      server.close(async () => {
        try {
          await RedisClient.disconnect();
          await prisma.$disconnect();

          console.log('✅ Redis disconnected');
          console.log('✅ PostgreSQL disconnected');
          console.log('✅ HTTP server closed');

          process.exit(0);
        } catch (error) {
          console.error('Shutdown error:', error);
          process.exit(1);
        }
      });

      setTimeout(() => {
        console.error('⚠️ Forced shutdown timeout reached');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => void gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => void gracefulShutdown('SIGINT'));
  } catch (error) {
    console.error('Application startup failed:', error);
    process.exit(1);
  }
}

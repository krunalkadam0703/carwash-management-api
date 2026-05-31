import http from 'http';
import cluster from 'cluster';
import { availableParallelism } from 'os';
import app from './app.js';

const PORT = process.env.PORT || 5000;
const numCPUs = availableParallelism();

if (cluster.isPrimary && process.env.NODE_ENV === 'production') {
  console.log(`🚀 Primary Process [${process.pid}] managing cluster loop.`);
  console.log(`Spawning cluster nodes across ${numCPUs} available CPU cores...`);

  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    console.error(`❌ Worker Process [${worker.process.pid}] dropped (Code: ${code} | Signal: ${signal}). Reviving instance...`);
    cluster.fork();
  });
} else {
  const server = http.createServer(app);

  server.listen(PORT, () => {
    console.log(`⚡ Active Worker Process [${process.pid}] listening safely on port ${PORT}`);
  });

  // Safe Connection Draining Lifecycle Protocol (Graceful Shutdown)
  const gracefulShutdown = (signal: string) => {
    console.log(`\n🛑 Received ${signal}. Processing structural system drain...`);
    
    server.close(() => {
      console.log('⚙️ Server instance has successfully disconnected all active socket rings.');
      process.exit(0);
    });

    // Enforce hard-kill crash if connections hang too long
    setTimeout(() => {
      console.error('⚠️ Timeout limit hit. Forcing instant termination process layout.');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
}
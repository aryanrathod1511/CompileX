import { Worker } from 'bullmq';
import { redisConnection } from './infrastructure/redis.client';
import { SandboxService } from './services/sandbox.service';
import { ContainerPoolManager } from './services/pool.service';
import { LANGUAGES } from './config/languages.config';
import { PubSubService } from './services/pubsub.service';

console.log('[Worker] Starting background execution worker...');

// Initialize the pre-warmed container pools on worker startup
ContainerPoolManager.initializePools()
  .then(() => console.log('[Worker] Container pools initialized successfully.'))
  .catch((err) => console.error('[Worker] Container pools initialization failed:', err));

const worker = new Worker(
  'sandbox-queue',
  async (job) => {
    const { clientId, language, code } = job.data;
    console.log(`[Worker] Processing execution job for client: ${clientId}, language: ${language}`);

    const langConfig = LANGUAGES[language];
    if (!langConfig) {
      const errorMsg = `System Error: Unsupported language: ${language}`;
      await PubSubService.publishStatus(clientId, errorMsg);
      await PubSubService.publishStatus(clientId, 'exit');
      return;
    }

    try {
      // 1. Acquire warm container from pool (instantly)
      const container = await ContainerPoolManager.acquireContainer(language);

      // 2. Execute user code on the acquired container
      await SandboxService.runInteractiveSession(clientId, container, langConfig, code);
    } catch (err: any) {
      console.error(`[Worker] Job error for client ${clientId}:`, err);
      try {
        await PubSubService.publishOutput(
          clientId,
          `\r\n[System Error]: Failed to start sandbox environment. Details: ${err.message}\r\n`
        );
        await PubSubService.publishStatus(clientId, 'exit');
      } catch (e) {}
    }
  },
  {
    connection: redisConnection,
    concurrency: Number(process.env.CONCURRENCY),
  }
);

worker.on('error', (err) => {
  console.error('[Worker] Global worker error:', err);
});

worker.on('failed', (job, err) => {
  console.error(`[Worker] Job ${job?.id} failed with error:`, err);
});

// Graceful shutdown hooks
const handleGracefulShutdown = async (signal: string) => {
  console.log(`[Worker] Received ${signal}. Shutting down worker...`);
  try {
    await worker.close();
    await ContainerPoolManager.shutdownPools();
  } catch (err) {
    console.error('[Worker] Error during worker shutdown cleanup:', err);
  }
  process.exit(0);
};

process.on('SIGTERM', () => handleGracefulShutdown('SIGTERM'));
process.on('SIGINT', () => handleGracefulShutdown('SIGINT'));

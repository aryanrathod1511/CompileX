import Redis from 'ioredis';

const redisHost = process.env.REDIS_HOST;
console.log(`[RedisClient] Using Redis host: ${redisHost}`);
const redisPort = process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT, 10) : undefined;

console.log(`[RedisClient] Connecting to Redis at ${redisHost}:${redisPort}`);

// Redis connection options
const connectionOptions: any = {
  host: redisHost,
  port: redisPort,
  password: process.env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: null,
  tls: {
    rejectUnauthorized: false
  },
};

export const redisConnection = new Redis(connectionOptions);
export const redisPublish = new Redis(connectionOptions);
export const redisSubscribe = new Redis(connectionOptions);

import { createClient, RedisClientType } from 'redis';
import { redisConfig } from '../../config/redis.config.js';

export class RedisClient {
  private static instance: RedisClientType | null = null;

  private constructor() {}

  public static async initialize(): Promise<void> {
    if (this.instance?.isOpen) {
      return;
    }

    this.instance = createClient({
      socket: {
        host: redisConfig.host,
        port: redisConfig.port,
      },
      username: redisConfig.username,
      password: redisConfig.password,
      database: redisConfig.db,
    });

    this.instance.on('connect', () => {
      console.log('Redis connected');
    });

    this.instance.on('error', (error) => {
      console.error('Redis error:', error);
    });

    await this.instance.connect();
  }

  public static getClient(): RedisClientType {
    if (!this.instance) {
      throw new Error('Redis client not initialized');
    }

    return this.instance;
  }

  public static async disconnect(): Promise<void> {
    if (this.instance?.isOpen) {
      await this.instance.quit();
    }
  }
}
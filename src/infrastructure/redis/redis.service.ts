import { RedisClient } from './redis.client.js';

export class RedisService {
  public async get(key: string): Promise<string | null> {
    return RedisClient.getClient().get(key);
  }

  public async set(
    key: string,
    value: string,
    ttlSeconds?: number,
  ): Promise<void> {
    const client = RedisClient.getClient();

    if (ttlSeconds) {
      await client.set(key, value, { EX: ttlSeconds });
      return;
    }

    await client.set(key, value);
  }

  public async delete(key: string): Promise<void> {
    await RedisClient.getClient().del(key);
  }

  public async exists(key: string): Promise<boolean> {
    return (await RedisClient.getClient().exists(key)) === 1;
  }
}

export const redisService = new RedisService();
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

  public async deleteMany(keys: string[]): Promise<void> {
    if (!keys.length) {
      return;
    }

    await Promise.all(keys.map((key) => RedisClient.getClient().del(key)));
  }

  public async deleteByPattern(pattern: string): Promise<void> {
    const client = RedisClient.getClient();
    const keys: string[] = [];

    for await (const key of client.scanIterator({ MATCH: pattern, COUNT: 100 })) {
      if (Array.isArray(key)) {
        keys.push(...key);
        continue;
      }

      keys.push(key);
    }

    await this.deleteMany(keys);
  }

  public async exists(key: string): Promise<boolean> {
    return (await RedisClient.getClient().exists(key)) === 1;
  }
}

export const redisService = new RedisService();

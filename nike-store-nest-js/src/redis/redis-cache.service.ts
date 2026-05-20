import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisCacheService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisCacheService.name);
  private readonly client?: Redis;

  constructor(private readonly configService: ConfigService) {
    const enabled = this.configService.get<string>('REDIS_ENABLED') !== 'false';
    if (!enabled) {
      this.logger.log('Redis cache disabled by REDIS_ENABLED=false');
      return;
    }

    const options = {
      lazyConnect: true,
      enableOfflineQueue: false,
      maxRetriesPerRequest: 1,
      connectTimeout: Number(
        this.configService.get<string>('REDIS_CONNECT_TIMEOUT_MS') || 2000,
      ),
    };

    const redisUrl = this.configService.get<string>('REDIS_URL');
    this.client = redisUrl
      ? new Redis(redisUrl, options)
      : new Redis({
          ...options,
          host: this.configService.get<string>('REDIS_HOST') || '127.0.0.1',
          port: Number(this.configService.get<string>('REDIS_PORT') || 6379),
          password: this.configService.get<string>('REDIS_PASSWORD') || undefined,
          db: Number(this.configService.get<string>('REDIS_DB') || 0),
        });

    this.client.on('error', (error) => {
      this.logger.warn(`Redis cache unavailable: ${error.message}`);
    });
  }

  async getJson<T>(key: string): Promise<T | null> {
    try {
      const client = await this.getClient();
      const value = await client?.get(key);
      return value ? (JSON.parse(value) as T) : null;
    } catch (error) {
      this.logger.warn(`Redis get failed for ${key}: ${(error as Error).message}`);
      return null;
    }
  }

  async setJson<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    try {
      const client = await this.getClient();
      if (!client) return;
      await client.set(key, JSON.stringify(value), 'EX', ttlSeconds);
    } catch (error) {
      this.logger.warn(`Redis set failed for ${key}: ${(error as Error).message}`);
    }
  }

  async del(key: string): Promise<void> {
    try {
      const client = await this.getClient();
      await client?.del(key);
    } catch (error) {
      this.logger.warn(`Redis delete failed for ${key}: ${(error as Error).message}`);
    }
  }

  async delPattern(pattern: string): Promise<void> {
    try {
      const client = await this.getClient();
      if (!client) return;

      let cursor = '0';
      do {
        const [nextCursor, keys] = await client.scan(
          cursor,
          'MATCH',
          pattern,
          'COUNT',
          100,
        );
        cursor = nextCursor;
        if (keys.length > 0) {
          await client.del(...keys);
        }
      } while (cursor !== '0');
    } catch (error) {
      this.logger.warn(
        `Redis pattern delete failed for ${pattern}: ${(error as Error).message}`,
      );
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.client && this.client.status !== 'end') {
      await this.client.quit().catch(() => this.client?.disconnect());
    }
  }

  private async getClient(): Promise<Redis | null> {
    if (!this.client) return null;
    if (this.client.status === 'wait' || this.client.status === 'end') {
      await this.client.connect();
    }
    return this.client;
  }
}

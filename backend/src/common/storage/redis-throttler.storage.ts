import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ThrottlerStorage } from '@nestjs/throttler';
import Redis from 'ioredis';
import { getRedisOptions } from '../config/redis.config';

@Injectable()
export class RedisThrottlerStorage implements ThrottlerStorage, OnModuleDestroy {
  private readonly redis: Redis;
  private readonly enabled: boolean;

  constructor(config: ConfigService) {
    this.enabled = config.get('THROTTLE_USE_REDIS', 'true') !== 'false';

    this.redis = new Redis({
      ...getRedisOptions(config),
      maxRetriesPerRequest: 1,
      lazyConnect: true,
    });
  }

  async onModuleDestroy() {
    await this.redis.quit().catch(() => undefined);
  }

  async increment(
    key: string,
    ttl: number,
  ): Promise<{ totalHits: number; timeToExpire: number; isBlocked: boolean; timeToBlockExpire: number }> {
    if (!this.enabled) {
      return { totalHits: 1, timeToExpire: ttl, isBlocked: false, timeToBlockExpire: 0 };
    }

    try {
      if (this.redis.status !== 'ready') {
        await this.redis.connect();
      }

      const totalHits = await this.redis.incr(key);
      if (totalHits === 1) {
        await this.redis.pexpire(key, ttl);
      }
      const timeToExpire = Math.max(await this.redis.pttl(key), 0);

      return {
        totalHits,
        timeToExpire,
        isBlocked: false,
        timeToBlockExpire: 0,
      };
    } catch {
      return { totalHits: 1, timeToExpire: ttl, isBlocked: false, timeToBlockExpire: 0 };
    }
  }
}

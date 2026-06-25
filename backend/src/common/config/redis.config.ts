import { ConfigService } from '@nestjs/config';
import type { RedisOptions } from 'ioredis';

export function getRedisOptions(config: ConfigService): RedisOptions {
  const tlsEnabled = config.get('REDIS_TLS', 'false') === 'true';

  return {
    host: config.get('REDIS_HOST', 'localhost'),
    port: config.get<number>('REDIS_PORT', 6379),
    username: config.get('REDIS_USERNAME') || undefined,
    password: config.get('REDIS_PASSWORD') || undefined,
    ...(tlsEnabled ? { tls: {} } : {}),
  };
}

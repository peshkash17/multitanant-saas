import { ConfigService } from '@nestjs/config';
import type { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';

export function getPostgresOptions(
  config: ConfigService,
): Pick<
  PostgresConnectionOptions,
  'type' | 'host' | 'port' | 'username' | 'password' | 'database' | 'ssl'
> {
  const sslEnabled = config.get('DB_SSL', 'false') === 'true';

  return {
    type: 'postgres',
    host: config.get('DB_HOST', 'localhost'),
    port: config.get<number>('DB_PORT', 5432),
    username: config.get('DB_USERNAME', 'postgres'),
    password: config.get('DB_PASSWORD', 'postgres'),
    database: config.get('DB_NAME', 'postgres'),
    ssl: sslEnabled ? { rejectUnauthorized: false } : false,
  };
}

import { Global, Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerStorage } from '@nestjs/throttler';
import { ConfigService } from '@nestjs/config';

import { AuditLog } from './entities/audit-log.entity';
import { AuditService } from './services/audit.service';
import { FeatureFlagsService } from './services/feature-flags.service';
import { RlsBootstrapService } from './services/rls-bootstrap.service';
import { RedisThrottlerStorage } from './storage/redis-throttler.storage';
import { AuditInterceptor } from './interceptors/audit.interceptor';
import { RlsInterceptor } from './interceptors/rls.interceptor';
import { CustomThrottlerGuard } from './guards/custom-throttler.guard';
import { PermissionsGuard } from './guards/permissions.guard';
import { FeatureFlagsController } from './controllers/feature-flags.controller';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([AuditLog]),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [
          {
            ttl: config.get<number>('THROTTLE_TTL_MS', 60000),
            limit: config.get<number>('THROTTLE_LIMIT', 100),
          },
        ],
      }),
    }),
  ],
  controllers: [FeatureFlagsController],
  providers: [
    AuditService,
    FeatureFlagsService,
    RlsBootstrapService,
    RedisThrottlerStorage,
    PermissionsGuard,
    { provide: ThrottlerStorage, useExisting: RedisThrottlerStorage },
    { provide: APP_GUARD, useClass: CustomThrottlerGuard },
    { provide: APP_INTERCEPTOR, useClass: RlsInterceptor },
    { provide: APP_INTERCEPTOR, useClass: AuditInterceptor },
  ],
  exports: [AuditService, FeatureFlagsService, PermissionsGuard],
})
export class CommonModule {}

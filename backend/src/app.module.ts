import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { CacheModule } from '@nestjs/cache-manager';
import { APP_GUARD, APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import { redisStore } from 'cache-manager-ioredis-yet';

import { CommonModule } from './common/common.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { ProjectsModule } from './projects/projects.module';
import { TasksModule } from './tasks/tasks.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PaymentsModule } from './payments/payments.module';
import { HealthModule } from './health/health.module';

import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

import { User } from './users/entities/user.entity';
import { Organization } from './organizations/entities/organization.entity';
import { Membership } from './organizations/entities/membership.entity';
import { Project } from './projects/entities/project.entity';
import { Task } from './tasks/entities/task.entity';
import { RefreshToken } from './auth/entities/refresh-token.entity';
import { Payment } from './payments/entities/payment.entity';
import { AuditLog } from './common/entities/audit-log.entity';
import { getRedisOptions } from './common/config/redis.config';
import { getPostgresOptions } from './common/config/postgres.config';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    WinstonModule.forRoot({
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.colorize(),
            winston.format.printf(({ timestamp, level, message, context, requestId }) => {
              return `${timestamp} [${context || 'App'}] ${level}: ${message}${requestId ? ` (requestId=${requestId})` : ''}`;
            }),
          ),
        }),
        ...(process.env.NODE_ENV !== 'production'
          ? [
              new winston.transports.File({
                filename: 'logs/error.log',
                level: 'error',
                format: winston.format.combine(
                  winston.format.timestamp(),
                  winston.format.json(),
                ),
              }),
              new winston.transports.File({
                filename: 'logs/combined.log',
                format: winston.format.combine(
                  winston.format.timestamp(),
                  winston.format.json(),
                ),
              }),
            ]
          : []),
      ],
    }),

    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        ...getPostgresOptions(config),
        entities: [User, Organization, Membership, Project, Task, RefreshToken, Payment, AuditLog],
        synchronize:
          config.get('DB_SYNCHRONIZE') === 'true' ||
          config.get('NODE_ENV') !== 'production',
        logging: config.get('NODE_ENV') === 'development',
      }),
    }),

    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: getRedisOptions(config),
      }),
    }),

    CacheModule.registerAsync({
      isGlobal: true,
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => {
        const ttl = Number(config.get('CACHE_TTL_MS', 300_000)) || 300_000;

        if (config.get('CACHE_STORE', 'redis') === 'memory') {
          return { ttl };
        }

        try {
          const redisOptions = getRedisOptions(config);
          const store = await redisStore({
            ...redisOptions,
            ttl,
          });
          return { store, ttl };
        } catch {
          return { ttl };
        }
      },
    }),

    CommonModule,
    HealthModule,
    AuthModule,
    UsersModule,
    OrganizationsModule,
    ProjectsModule,
    TasksModule,
    NotificationsModule,
    PaymentsModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
    { provide: APP_INTERCEPTOR, useClass: TransformInterceptor },
  ],
})
export class AppModule {}

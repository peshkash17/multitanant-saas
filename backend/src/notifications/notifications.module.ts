import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { NotificationsGateway } from './notifications.gateway';
import { NotificationsProcessor } from './notifications.processor';
import { NotificationsController } from './notifications.controller';
import { Membership } from '../organizations/entities/membership.entity';
import { AuthModule } from '../auth/auth.module';
import { TenantGuard } from '../common/guards/tenant.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([Membership]),
    BullModule.registerQueue({ name: 'notifications' }),
    AuthModule,
  ],
  providers: [NotificationsGateway, NotificationsProcessor, TenantGuard],
  controllers: [NotificationsController],
  exports: [NotificationsGateway],
})
export class NotificationsModule {}

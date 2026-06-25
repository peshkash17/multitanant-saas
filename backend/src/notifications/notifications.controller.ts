import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationsGateway } from './notifications.gateway';
import { TenantGuard } from '../common/guards/tenant.guard';

@ApiTags('notifications')
@ApiBearerAuth()
@Controller('organizations/:orgId/notifications')
@UseGuards(TenantGuard)
export class NotificationsController {
  constructor(private readonly gateway: NotificationsGateway) {}

  @Get('presence')
  @ApiOperation({ summary: 'Get online user count for the organization' })
  getPresence(@Param('orgId') orgId: string) {
    return {
      organizationId: orgId,
      onlineCount: this.gateway.getConnectedCount(orgId),
    };
  }
}

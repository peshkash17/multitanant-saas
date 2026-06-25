import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { CreatePaymentRequestDto } from './dto/create-payment.dto';
import { TenantGuard } from '../common/guards/tenant.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../organizations/entities/membership.entity';

@ApiTags('payments')
@ApiBearerAuth()
@UseGuards(TenantGuard, RolesGuard)
@Controller('organizations/:orgId/payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Create a payment (ADMIN only)' })
  create(
    @Param('orgId') orgId: string,
    @Body() dto: CreatePaymentRequestDto,
  ) {
    return this.paymentsService.createPayment(orgId, dto);
  }

  @Get()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'List payments for organization' })
  list(@Param('orgId') orgId: string) {
    return this.paymentsService.listPayments(orgId);
  }

  @Post(':paymentId/verify')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify a payment' })
  verify(
    @Param('orgId') orgId: string,
    @Param('paymentId') paymentId: string,
  ) {
    return this.paymentsService.verifyPayment(orgId, paymentId);
  }

  @Post(':paymentId/refund')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refund a payment' })
  refund(
    @Param('orgId') orgId: string,
    @Param('paymentId') paymentId: string,
  ) {
    return this.paymentsService.refundPayment(orgId, paymentId);
  }
}

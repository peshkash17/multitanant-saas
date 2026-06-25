import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { Payment } from './entities/payment.entity';
import { Membership } from '../organizations/entities/membership.entity';
import { MockPaymentProvider } from './providers/mock-payment.provider';
import { PAYMENT_PROVIDER } from './interfaces/payment-provider.interface';

@Module({
  imports: [TypeOrmModule.forFeature([Payment, Membership])],
  providers: [
    {
      provide: PAYMENT_PROVIDER,
      useFactory: (config: ConfigService) => {
        const provider = config.get('PAYMENT_PROVIDER', 'mock');
        switch (provider) {
          case 'mock':
          default:
            return new MockPaymentProvider();
        }
      },
      inject: [ConfigService],
    },
    PaymentsService,
  ],
  controllers: [PaymentsController],
})
export class PaymentsModule {}

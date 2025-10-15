import { Module } from '@nestjs/common';
import { TransactionController } from './transaction.controller';
import { TransactionService } from './transaction.service';
import { PaystackService } from './paystack.service';
import { BookingModule } from '../booking/booking.module';
import { WalletService } from './wallet.service';
import { CallModule } from '../call/call.module';

@Module({
  imports: [BookingModule, CallModule],
  controllers: [TransactionController],
  providers: [TransactionService, PaystackService, WalletService]
})
export class TransactionModule {}

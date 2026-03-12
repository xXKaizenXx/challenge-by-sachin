import { Module } from '@nestjs/common';
import { AudoRepaymentsService } from './audo-repayments.service';
import { AudoRepaymentsController } from './audo-repayments.controller';

@Module({
  controllers: [AudoRepaymentsController],
  providers: [AudoRepaymentsService]
})
export class AudoRepaymentsModule {}

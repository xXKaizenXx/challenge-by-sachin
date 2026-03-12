import { Module } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { LoanModule } from '../loan/loan.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoanEntity } from '../loan/entities/loan.entity';
import { TransactionEntity } from '../transaction/entities/transaction.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([LoanEntity, TransactionEntity]),
    LoanModule,
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}

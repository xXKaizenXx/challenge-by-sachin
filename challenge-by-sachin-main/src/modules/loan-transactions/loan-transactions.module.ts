import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoanTransactionEntity } from './entities/loan-transaction.entity';
import { LoanTransactionsService } from './loan-transactions.service';
import { LoanTransactionsController } from './loan-transactions.controller';

@Module({
  imports: [TypeOrmModule.forFeature([LoanTransactionEntity])],
  controllers: [LoanTransactionsController],
  providers: [LoanTransactionsService],
  exports: [LoanTransactionsService],
})
export class LoanTransactionsModule {}

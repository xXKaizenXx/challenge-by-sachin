import { Module } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { TransactionController } from './transaction.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransactionEntity } from './entities/transaction.entity';
import { LoanScheduleModule } from '../loan-schedule/loan-schedule.module';
import { UserModule } from '../user/user.module';
import { LoanScheduleEntity } from '../loan-schedule/entities/loan-schedule.entity';
import { forwardRef } from '@nestjs/common';
import { LoanModule } from '../loan/loan.module';
import { GroupPackageModule } from '../group-package/group-package.module';

@Module({
  imports: [
    LoanScheduleModule,
    UserModule,
    forwardRef(() => LoanModule),
    forwardRef(() => GroupPackageModule),
    TypeOrmModule.forFeature([TransactionEntity, LoanScheduleEntity]),
  ],
  controllers: [TransactionController],
  providers: [TransactionService],
})
export class TransactionModule {}

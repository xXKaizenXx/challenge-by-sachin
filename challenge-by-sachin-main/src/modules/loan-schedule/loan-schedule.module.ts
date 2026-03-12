import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoanScheduleEntity } from './entities/loan-schedule.entity';
import { LoanScheduleService } from './loan-schedule.service';
import { LoanScheduleController } from './loan-schedule.controller';
import { LoanModule } from '../loan/loan.module';
import { GroupPackageModule } from '../group-package/group-package.module';
import { GroupModule } from '../group/group.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([LoanScheduleEntity]),
    forwardRef(() => LoanModule),
  ],
  controllers: [LoanScheduleController],
  providers: [LoanScheduleService],
  exports: [LoanScheduleService],
})
export class LoanScheduleModule {}

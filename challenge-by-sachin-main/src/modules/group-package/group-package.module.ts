import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GroupPackageEntity } from './entities/group-package.entity';
import { LoanEntity } from '../loan/entities/loan.entity';
import { UserEntity } from '../user/user.entity';
import { OfficeEntity } from '../office/entities/office.entity';
import { GroupPackageController } from './group-package.controller';
import { GroupPackageService } from './group-package.service';
import { LoanTable } from '../loan-table/entities/loan-table.entity';
import { LoanTableModule } from '../loan-table/loan-table.module';
import { GroupEntity } from '../group/entities/group.entity';
import { CenterModule } from '../center/center.module';
import { Center } from '../center/entities/center.entity';
import { LoanModule } from '../loan/loan.module';
import { StatusEntity } from '../status/entities/status.entity';
import { LoanScheduleEntity } from '../loan-schedule/entities/loan-schedule.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      GroupPackageEntity,
      LoanEntity,
      UserEntity,
      OfficeEntity,
      LoanTable,
      GroupEntity,
      Center,
      StatusEntity,
      LoanScheduleEntity,
    ]),
    CenterModule,
    LoanTableModule,
    forwardRef(() => LoanModule),
  ],
  controllers: [GroupPackageController],
  providers: [GroupPackageService],
  exports: [GroupPackageService],
})
export class GroupPackageModule {}

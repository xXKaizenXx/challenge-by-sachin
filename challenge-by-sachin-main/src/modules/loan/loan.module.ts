import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoanController } from './loan.controller';
import { LoanService } from './loan.service';
import { LoanEntity } from './entities/loan.entity';
import { LoanScheduleEntity } from '../loan-schedule/entities/loan-schedule.entity';
import { ClientEntity } from '../client/entities/client.entity';
import { LoanTable } from '../loan-table/entities/loan-table.entity';
import { StatusModule } from '../status/status.module';
import { ProductModule } from '../product/product.module';
import { ClientModule } from '../client/client.module';
import { GroupModule } from '../group/group.module';
import { GroupPackageModule } from '../group-package/group-package.module';
import { LoanTableModule } from '../loan-table/loan-table.module';
import { LoanScheduleModule } from '../loan-schedule/loan-schedule.module';
import { OfficeModule } from '../office/office.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([LoanEntity, LoanScheduleEntity, ClientEntity, LoanTable]),
    StatusModule,
    ProductModule,
    ClientModule,
    GroupModule,
    forwardRef(() => GroupPackageModule),
    LoanTableModule,
    OfficeModule,
    forwardRef(() => LoanScheduleModule),
  ],
  controllers: [LoanController],
  providers: [LoanService],
  exports: [LoanService],
})
export class LoanModule {}

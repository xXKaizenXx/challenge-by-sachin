import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoanTable } from './entities/loan-table.entity';
import { LoanTableService } from './loan-table.service';
import { LoanTableController } from './loan-table.controller';

@Module({
  imports: [TypeOrmModule.forFeature([LoanTable])],
  providers: [LoanTableService],
  controllers: [LoanTableController],
  exports: [TypeOrmModule, LoanTableService],
})
export class LoanTableModule {}

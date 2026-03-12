import { Module } from '@nestjs/common';
import { CollectionSheetService } from './collection-sheet.service';
import { CollectionSheetController } from './collection-sheet.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoanScheduleEntity } from '../loan-schedule/entities/loan-schedule.entity';

@Module({
  imports: [TypeOrmModule.forFeature([LoanScheduleEntity])],
  controllers: [CollectionSheetController],
  providers: [CollectionSheetService],
  exports: [CollectionSheetService]
})
export class CollectionSheetModule {}

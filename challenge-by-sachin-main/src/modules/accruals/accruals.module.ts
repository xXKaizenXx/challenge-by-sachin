import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccrualsController } from './accruals.controller';
import { AccrualsService } from './accruals.service';
import { AccrualEntity } from './entities/accrual.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AccrualEntity])],
  controllers: [AccrualsController],
  providers: [AccrualsService],
  exports: [AccrualsService],
})
export class AccrualsModule {}

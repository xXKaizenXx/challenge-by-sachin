import { Module } from '@nestjs/common';
import { OfficeService } from './office.service';
import { OfficeController } from './office.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OfficeEntity } from './entities/office.entity';

@Module({
  imports: [TypeOrmModule.forFeature([OfficeEntity])],
  controllers: [OfficeController],
  providers: [OfficeService],
  exports: [OfficeService],
})
export class OfficeModule {}

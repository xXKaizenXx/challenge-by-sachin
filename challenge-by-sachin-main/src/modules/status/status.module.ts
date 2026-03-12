import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StatusService } from './status.service';
import { StatusController } from './status.controller';
import { StatusEntity } from './entities/status.entity';
import { StatusSeederService } from './status-seeder.service';

@Module({
  imports: [TypeOrmModule.forFeature([StatusEntity])],
  controllers: [StatusController],
  providers: [StatusService, StatusSeederService],
  exports: [StatusService],
})
export class StatusModule {}

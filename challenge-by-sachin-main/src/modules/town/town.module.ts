import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TownService } from './town.service';
import { TownController } from './town.controller';
import { Town } from './entities/town.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Town])],
  controllers: [TownController],
  providers: [TownService],
})
export class TownModule {}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GenderService } from './gender.service';
import { GenderController } from './gender.controller';
import { GenderEntity } from './entities/gender.entity';

@Module({
  imports: [TypeOrmModule.forFeature([GenderEntity])],
  controllers: [GenderController],
  providers: [GenderService],
  exports: [GenderService],
})
export class GenderModule {}

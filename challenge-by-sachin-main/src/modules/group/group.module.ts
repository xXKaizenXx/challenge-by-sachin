import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GroupService } from './group.service';
import { GroupController } from './group.controller';
import { GroupEntity } from './entities/group.entity';
import { UserEntity } from '../user/user.entity';
import { OfficeEntity } from '../office/entities/office.entity';
import { ClientEntity } from '../client/entities/client.entity';
import { Center } from '../center/entities/center.entity';
import { StatusModule } from '../status/status.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      GroupEntity,
      UserEntity,
      OfficeEntity,
      ClientEntity,
      Center,
    ]),
    StatusModule,
  ],
  controllers: [GroupController],
  providers: [GroupService],
  exports: [GroupService],
})
export class GroupModule {}

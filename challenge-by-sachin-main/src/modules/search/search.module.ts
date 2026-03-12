import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SearchService } from './search.service';
import { SearchController } from './search.controller';
import { Center } from '../center/entities/center.entity';
import { GroupEntity } from '../group/entities/group.entity';
import { UserEntity } from '../user/user.entity';
import { OfficeEntity } from '../office/entities/office.entity';
import { ClientEntity } from '../client/entities/client.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Center,
      GroupEntity,
      UserEntity,
      OfficeEntity,
      ClientEntity
    ]),
  ],
  controllers: [SearchController],
  providers: [SearchService],
  exports: [SearchService],
})
export class SearchModule {}
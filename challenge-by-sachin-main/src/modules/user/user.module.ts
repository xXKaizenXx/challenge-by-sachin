import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserController } from './user.controller';
import { UserEntity } from './user.entity';
import { UserService } from './user.service';
import { Center } from '../center/entities/center.entity';
import { GroupEntity } from '../group/entities/group.entity';
import { ClientEntity } from '../client/entities/client.entity';
import { LoanEntity } from '../loan/entities/loan.entity';
import { GroupPackageEntity } from '../group-package/entities/group-package.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserEntity,
      Center,
      GroupEntity,
      ClientEntity,
      LoanEntity,
      GroupPackageEntity,
    ])
  ],
  controllers: [UserController],
  exports: [UserService],
  providers: [UserService],
})
export class UserModule {}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientService } from './client.service';
import { ClientController } from './client.controller';
import { ClientEntity } from './entities/client.entity';
import { StatusModule } from '../status/status.module';
import { BankModule } from '../bank/bank.module';
import { CenterModule } from '../center/center.module';
import { LanguageModule } from '../language/language.module';
import { ProvincesModule } from '../provinces/provinces.module';
import { GroupEntity } from '../group/entities/group.entity';
import { GroupModule } from '../group/group.module';
import { Center } from '../center/entities/center.entity';
import { Language } from '../language/entities/language.entity';
import { Province } from '../provinces/entities/province.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ClientEntity, GroupEntity, Center, Language, Province]),
    StatusModule,
    BankModule,
    CenterModule,
    LanguageModule,
    ProvincesModule,
    GroupModule
  ],
  controllers: [ClientController],
  providers: [ClientService],
  exports: [ClientService],
})
export class ClientModule {}

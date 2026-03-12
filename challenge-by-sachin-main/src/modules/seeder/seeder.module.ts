import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeederService } from './seeder.service';
import { SeederController } from './seeder.controller';
import { ClientModule } from '../client/client.module';
import { GroupPackageModule } from '../group-package/group-package.module';
import { CenterModule } from '../center/center.module';
import { BankModule } from '../bank/bank.module';
import { LoanModule } from '../loan/loan.module';
import { LanguageModule } from '../language/language.module';
import { ClientEntity, Province } from '../client/entities/client.entity';
import { GroupPackageEntity } from '../group-package/entities/group-package.entity';
import { Center } from '../center/entities/center.entity';
import { BankEntity } from '../bank/entities/bank.entity';
import { LoanEntity } from '../loan/entities/loan.entity';
import { Language } from '../language/entities/language.entity';
import { UserEntity } from '../user/user.entity';
import { GroupEntity } from '../group/entities/group.entity';
import { GroupModule } from '../group/group.module';
import { UserModule } from '../user/user.module';
import { ProvincesModule } from '../provinces/provinces.module';
import { OfficeEntity } from '../office/entities/office.entity';
import { OfficeModule } from '../office/office.module';
import { LoanTableModule } from '../loan-table/loan-table.module';
import { LoanTable } from '../loan-table/entities/loan-table.entity';
import { AuthModule } from '../auth/auth.module';
import { CenterMeetingDatesModule } from '../center-meeting-dates/center-meeting-dates.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ClientEntity,
      GroupPackageEntity,
      Center,
      BankEntity,
      LoanEntity,
      Language,
      Province,
      UserEntity,
      OfficeEntity,
      GroupEntity,
      LoanTable,
    ]),
    ClientModule,
    GroupPackageModule,
    CenterModule,
    BankModule,
    LoanModule,
    LanguageModule,
    UserModule,
    GroupModule,
    ProvincesModule,
    OfficeModule,
    LoanTableModule,
    AuthModule,
    CenterMeetingDatesModule,
    CenterModule,
    GroupModule,
    GroupPackageModule,
    LoanModule,
    LoanTableModule,
    OfficeModule,
  ],
  controllers: [SeederController],
  providers: [SeederService],
  exports: [SeederService],
})
export class SeederModule {}

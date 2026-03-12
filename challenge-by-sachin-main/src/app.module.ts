import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';

import { TypeOrmModule } from '@nestjs/typeorm';
import { typeOrmConfig } from './database/ormconfig';

import { UserModule } from './modules/user/user.module';
import { AuthModule } from './modules/auth/auth.module';
import { AuditModule } from './modules/audit/audit.module';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { AllExceptionsFilter } from './filters/http-exception.filter';
import { AuditContextInterceptor } from './interceptors/audit-context.interceptor';
import { OfficeModule } from './modules/office/office.module';
import { CenterModule } from './modules/center/center.module';
import { GroupModule } from './modules/group/group.module';
import { ClientModule } from './modules/client/client.module';
import { StatusModule } from './modules/status/status.module';
import { BankModule } from './modules/bank/bank.module';
import { GenderModule } from './modules/gender/gender.module';
import { LanguageModule } from './modules/language/language.module';
import { TownModule } from './modules/town/town.module';
import { CenterMeetingDatesModule } from './modules/center-meeting-dates/center-meeting-dates.module';
import { ChartOfAccountsModule } from './modules/chart-of-accounts/chart-of-accounts.module';
import { ProductModule } from './modules/product/product.module';
import { LoanModule } from './modules/loan/loan.module';
import { LoanScheduleModule } from './modules/loan-schedule/loan-schedule.module';
import { LoanTransactionsModule } from './modules/loan-transactions/loan-transactions.module';
import { AccrualsModule } from './modules/accruals/accruals.module';
import { ProvincesModule } from './modules/provinces/provinces.module';
import { LoanTableModule } from './modules/loan-table/loan-table.module';
import { GroupPackageModule } from './modules/group-package/group-package.module';
import { SeederModule } from './modules/seeder/seeder.module';
import { TransactionModule } from './modules/transaction/transaction.module';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule } from '@nestjs/config';
import { CollectionSheetModule } from './modules/collection-sheet/collection-sheet.module';
import { DisbursementsModule } from './modules/disbursements/disbursements.module';
import { SearchModule } from './modules/search/search.module';
import { AuditMiddleware } from './middlewares/audit.middleware';
import { ReportsModule } from './modules/reports/reports.module';

@Module({
  imports: [
    AuthModule,
    UserModule,
    OfficeModule,
    CenterModule,
    GroupModule,
    ClientModule,
    StatusModule,
    BankModule,
    GenderModule,
    LanguageModule,
    TownModule,
    CenterMeetingDatesModule,
    ChartOfAccountsModule,
    ProductModule,
    LoanModule,
    LoanScheduleModule,
    LoanTransactionsModule,
    AccrualsModule,
    ProvincesModule,
    LoanTableModule,
    GroupPackageModule,
    SeederModule,
    TransactionModule,
    CollectionSheetModule,
    DisbursementsModule,
    SearchModule,
    TypeOrmModule.forRoot(typeOrmConfig),
    ConfigModule.forRoot({
      isGlobal: true, // <- this makes ConfigService available everywhere
    }),
    ScheduleModule.forRoot(),
    AuditModule,
    ReportsModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditContextInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuditMiddleware).forRoutes('*');
  }
}

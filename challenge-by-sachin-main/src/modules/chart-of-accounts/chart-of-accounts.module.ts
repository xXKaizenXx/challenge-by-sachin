import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChartOfAccountsController } from './chart-of-accounts.controller';
import { ChartOfAccountsEntity } from './entities/chart-of-accounts.entity';
import { ChartOfAccountsService } from './chart-of-accounts.service';

@Module({
  imports: [TypeOrmModule.forFeature([ChartOfAccountsEntity])],
  controllers: [ChartOfAccountsController],
  exports: [ChartOfAccountsService],
  providers: [ChartOfAccountsService],
})
export class ChartOfAccountsModule {}

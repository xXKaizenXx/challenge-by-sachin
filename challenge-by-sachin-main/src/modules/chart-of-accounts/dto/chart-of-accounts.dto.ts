import { ApiProperty } from '@nestjs/swagger';
import { AbstractDto } from '../../../common/dtos/abstract.dto';
import {
  ChartOfAccountsEntity,
  AccountType,
} from '../entities/chart-of-accounts.entity';

export class ChartOfAccountsDto extends AbstractDto {
  @ApiProperty()
  accountCode: string;

  @ApiProperty()
  accountName: string;

  @ApiProperty({ enum: AccountType })
  accountType: AccountType;

  @ApiProperty({ required: false })
  accountSubtype?: string;

  @ApiProperty({ required: false })
  parentAccountId?: string;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty({ required: false })
  description?: string;

  @ApiProperty({ required: false })
  parentAccount?: ChartOfAccountsDto;

  @ApiProperty({ required: false, type: [ChartOfAccountsDto] })
  childAccounts?: ChartOfAccountsDto[];

  constructor(account: ChartOfAccountsEntity) {
    super(account);
    this.accountCode = account.accountCode;
    this.accountName = account.accountName;
    this.accountType = account.accountType;
    this.accountSubtype = account.accountSubtype;
    this.parentAccountId = account.parentAccountId;
    this.isActive = account.isActive;
    this.description = account.description;
    this.parentAccount = account.parentAccount
      ? new ChartOfAccountsDto(account.parentAccount)
      : undefined;
    this.childAccounts = account.childAccounts?.map(
      (child) => new ChartOfAccountsDto(child),
    );
  }
}

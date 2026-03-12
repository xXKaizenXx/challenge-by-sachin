import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsUUID,
} from 'class-validator';
import { Trim } from '../../../decorators/transform.decorators';
import { AccountType } from '../entities/chart-of-accounts.entity';

export class CreateChartOfAccountsDto {
  @ApiProperty({ description: 'Account code (e.g., "1001", "2000")' })
  @IsString()
  @IsNotEmpty({
    message: 'Account code is required',
  })
  @Trim()
  readonly accountCode: string;

  @ApiProperty({ description: 'Account name' })
  @IsString()
  @IsNotEmpty({
    message: 'Account name is required',
  })
  @Trim()
  readonly accountName: string;

  @ApiProperty({
    enum: AccountType,
    description: 'Account type',
  })
  @IsEnum(AccountType, {
    message:
      'Account type must be one of: asset, liability, equity, income, expense, contra_asset',
  })
  @IsNotEmpty({
    message: 'Account type is required',
  })
  readonly accountType: AccountType;

  @ApiProperty({
    required: false,
    description:
      'Account subtype (e.g., "current_asset", "long_term_liability")',
  })
  @IsString()
  @IsOptional()
  @Trim()
  readonly accountSubtype?: string;

  @ApiProperty({
    required: false,
    description: 'Parent account ID for hierarchical structure',
  })
  @IsUUID()
  @IsOptional()
  readonly parentAccountId?: string;

  @ApiProperty({
    default: true,
    description: 'Whether the account is active',
  })
  @IsBoolean()
  @IsOptional()
  readonly isActive?: boolean;

  @ApiProperty({
    required: false,
    description: 'Account description',
  })
  @IsString()
  @IsOptional()
  @Trim()
  readonly description?: string;
}

import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class UpdateBankDto {
  @ApiPropertyOptional({ description: 'Name of the bank' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: 'Branch code of the bank' })
  @IsString()
  @IsOptional()
  branchCode?: string;
}

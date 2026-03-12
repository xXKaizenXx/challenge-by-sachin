import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class CreateBankDto {
  @ApiProperty({ description: 'Name of the bank' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Branch code of the bank' })
  @IsString()
  @IsNotEmpty()
  branchCode: string;
}

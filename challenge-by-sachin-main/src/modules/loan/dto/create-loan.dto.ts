import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDateString,
  IsUUID,
  IsArray,
  ValidateNested,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ClientApplicationDto {
  @ApiProperty()
  @IsUUID()
  clientId: string;

  @ApiProperty()
  @IsNumber()
  loanAmount: number;

  @ApiProperty()
  @IsString()
  businessType: string;

  @ApiProperty()
  @IsUUID()
  loanTableId: string;
}

export class CreateLoanDto {
  @ApiProperty({ type: [ClientApplicationDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ClientApplicationDto)
  clientApplications: ClientApplicationDto[];

  @ApiProperty()
  @IsString()
  groupId: string;

  @ApiProperty()
  @IsString()
  loanOfficerId: string;

  @ApiProperty()
  @IsString()
  loanProduct: string;

  @ApiProperty()
  @IsString()
  status: string;

  @ApiProperty()
  @IsDateString()
  targetDisbursementDate: string;

  @ApiProperty()
  @IsNumber()
  totalLoanAmount: number;

  @ApiProperty()
  @IsDateString()
  createdAt: string;
}

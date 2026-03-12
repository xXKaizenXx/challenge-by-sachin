import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { LoanScheduleStatus } from '../../../constants/loan-schedule-status';

export class CreateLoanScheduleDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  loanId: string;

  @ApiProperty()
  @IsNumber()
  installmentNumber: number;

  @ApiProperty()
  @IsDateString()
  dueDate: Date;

  @ApiProperty()
  @IsString()
  principalDue: number;

  @ApiProperty()
  @IsString()
  interestDue: number;

  @ApiProperty()
  @IsString()
  totalDue: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  groupPackage: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  principalPaid?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  interestPaid?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  penaltyPaid?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  penaltyDue?: number;

  @ApiPropertyOptional({ enum: LoanScheduleStatus })
  @IsEnum(LoanScheduleStatus)
  @IsOptional()
  status?: LoanScheduleStatus;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  paidDate?: Date;
}

import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { LoanScheduleStatus } from '../../../constants/loan-schedule-status';

export class UpdateLoanScheduleDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  loanId?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  installmentNumber?: number;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  dueDate?: Date;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  principalDue?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  interestDue?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  totalDue?: number;

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

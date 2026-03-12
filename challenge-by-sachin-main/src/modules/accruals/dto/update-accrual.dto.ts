import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsBoolean,
} from 'class-validator';
import { AccrualStatus } from '../../../constants/accrual-status';

export class UpdateAccrualDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  loanId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  scheduleId?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  accrualDate?: Date;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  interestAccrued?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  penaltyAccrued?: string;

  @ApiPropertyOptional({ enum: AccrualStatus })
  @IsEnum(AccrualStatus)
  @IsOptional()
  status?: AccrualStatus;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  glPosted?: boolean;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  glReference?: string;
}

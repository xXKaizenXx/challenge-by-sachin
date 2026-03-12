import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsBoolean,
} from 'class-validator';
import { AccrualStatus } from '../../../constants/accrual-status';

export class CreateAccrualDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  loanId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  scheduleId: string;

  @ApiProperty()
  @IsDateString()
  accrualDate: Date;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  interestAccrued: string;

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

import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsUUID,
  IsDateString,
  IsBoolean,
} from 'class-validator';

export class UpdateAttendanceDto {
  @ApiPropertyOptional({ description: 'Client ID' })
  @IsUUID()
  @IsOptional()
  clientId?: string;

  @ApiPropertyOptional({ description: 'Meeting date' })
  @IsDateString()
  @IsOptional()
  meetingDate?: string;

  @ApiPropertyOptional({ description: 'Whether client is present' })
  @IsBoolean()
  @IsOptional()
  isPresent?: boolean;

  @ApiPropertyOptional({ description: 'Attendance notes' })
  @IsString()
  @IsOptional()
  notes?: string;
}

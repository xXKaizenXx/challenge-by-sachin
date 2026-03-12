import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsUUID,
  IsOptional,
  IsDateString,
  IsBoolean,
} from 'class-validator';

export class CreateAttendanceDto {
  @ApiProperty({ description: 'Client ID' })
  @IsUUID()
  @IsNotEmpty({ message: 'Client is required' })
  clientId: string;

  @ApiProperty({ description: 'Meeting date' })
  @IsDateString()
  @IsNotEmpty({ message: 'Meeting date is required' })
  meetingDate: string;

  @ApiProperty({ description: 'Whether client is present' })
  @IsBoolean()
  @IsOptional()
  isPresent?: boolean;

  @ApiProperty({ description: 'Attendance notes' })
  @IsString()
  @IsOptional()
  notes?: string;
}

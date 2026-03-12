import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDateString,
} from 'class-validator';

export class CreateReportDto {
  @ApiProperty({ description: 'Report title' })
  @IsString()
  @IsNotEmpty({ message: 'Report title is required' })
  title: string;

  @ApiProperty({ description: 'Report content' })
  @IsString()
  @IsNotEmpty({ message: 'Report content is required' })
  content: string;

  @ApiProperty({ description: 'Report type' })
  @IsString()
  @IsOptional()
  type?: string;

  @ApiProperty({ description: 'Report date' })
  @IsDateString()
  @IsOptional()
  reportDate?: string;
}

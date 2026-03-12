import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsDateString } from 'class-validator';

export class UpdateReportDto {
  @ApiPropertyOptional({ description: 'Report title' })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({ description: 'Report content' })
  @IsString()
  @IsOptional()
  content?: string;

  @ApiPropertyOptional({ description: 'Report type' })
  @IsString()
  @IsOptional()
  type?: string;

  @ApiPropertyOptional({ description: 'Report date' })
  @IsDateString()
  @IsOptional()
  reportDate?: string;
}

import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class UpdateStatusDto {
  @ApiPropertyOptional({ description: 'Name of the status' })
  @IsString()
  @IsOptional()
  name?: string;
}

import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class UpdateTownDto {
  @ApiPropertyOptional({ description: 'Name of the town' })
  @IsString()
  @IsOptional()
  name?: string;
}

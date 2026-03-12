import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class UpdateProvinceDto {
  @ApiPropertyOptional({ description: 'Name of the province' })
  @IsString()
  @IsOptional()
  name?: string;
}

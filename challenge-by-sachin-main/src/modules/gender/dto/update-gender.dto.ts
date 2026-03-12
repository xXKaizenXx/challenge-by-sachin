import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class UpdateGenderDto {
  @ApiPropertyOptional({ description: 'Name of the gender' })
  @IsString()
  @IsOptional()
  name?: string;
}

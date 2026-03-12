import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class UpdateLanguageDto {
  @ApiPropertyOptional({ description: 'Name of the language' })
  @IsString()
  @IsOptional()
  name?: string;
}

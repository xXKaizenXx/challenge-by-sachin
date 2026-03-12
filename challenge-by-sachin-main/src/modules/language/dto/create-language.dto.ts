import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class CreateLanguageDto {
  @ApiProperty({ description: 'Name of the language' })
  @IsString()
  @IsNotEmpty({ message: 'Language name is required' })
  name: string;
}

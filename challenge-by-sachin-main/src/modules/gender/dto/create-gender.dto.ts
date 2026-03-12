import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class CreateGenderDto {
  @ApiProperty({ description: 'Name of the gender' })
  @IsString()
  @IsNotEmpty()
  name: string;
}

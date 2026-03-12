import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class CreateStatusDto {
  @ApiProperty({ description: 'Name of the status' })
  @IsString()
  @IsNotEmpty()
  name: string;
}

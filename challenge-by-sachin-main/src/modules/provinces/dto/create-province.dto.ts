import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class CreateProvinceDto {
  @ApiProperty({ description: 'Name of the province' })
  @IsString()
  @IsNotEmpty({ message: 'Province name is required' })
  name: string;
}

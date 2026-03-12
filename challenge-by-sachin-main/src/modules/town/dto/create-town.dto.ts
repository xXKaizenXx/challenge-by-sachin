import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsUUID } from 'class-validator';
import { Province } from 'src/modules/provinces/entities/province.entity';
import { DeepPartial } from 'typeorm';

export class CreateTownDto {
  @ApiProperty({ description: 'Name of the town' })
  @IsString()
  @IsNotEmpty({ message: 'Town name is required' })
  name: string;

  @ApiProperty({ description: 'Province ID of the town' })
  @IsUUID()
  @IsNotEmpty({ message: 'Province ID is required' })
  province: DeepPartial<Province>;
}

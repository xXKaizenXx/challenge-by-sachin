import { ApiProperty } from '@nestjs/swagger';

export class CenterDto {
  @ApiProperty({ description: 'Center UUID', example: 'c1e2d3f4-5678-1234-5678-abcdef123456' })
  id: string;

  @ApiProperty({ description: 'Center name', example: 'Lusaka Center' })
  name: string;

  @ApiProperty({ description: 'Center code', example: 'AAAAZ' })
  centerCode: string;
}

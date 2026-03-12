import { ApiProperty } from '@nestjs/swagger';

export class CenterInfoDto {
  @ApiProperty({ description: 'Center ID' })
  id: string;

  @ApiProperty({ description: 'Center name' })
  name: string;

  @ApiProperty({ description: 'Center code' })
  centerCode: string;
}

export class UpdateGroupSystemNameResponseDto {
  @ApiProperty({ description: 'Group ID' })
  id: string;

  @ApiProperty({ description: 'Updated system name' })
  systemName: string;

  @ApiProperty({ description: 'Group name' })
  name: string;

  @ApiProperty({ description: 'Success message' })
  message: string;

  @ApiProperty({ 
    description: 'Update timestamp',
    type: 'string',
    format: 'date-time'
  })
  updatedAt: Date;

  @ApiProperty({ 
    description: 'Center information',
    type: CenterInfoDto
  })
  center: CenterInfoDto;
}
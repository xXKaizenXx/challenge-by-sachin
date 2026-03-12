import { IsString, IsUUID, IsArray, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateGroupDto {
  @ApiProperty({ description: 'Name of the group' })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Array of client UUIDs belonging to the group',
    type: [String],
    example: ['uuid1', 'uuid2'],
  })
  @IsArray()
  @IsUUID('all', { each: true })
  clients: string[];

  @ApiProperty({ description: 'UUID of the group leader (must be a client in the group)' })
  @IsUUID()
  groupLeaderId: string;

  @ApiProperty({ description: 'UUID of the center this group belongs to' })
  @IsUUID()
  centerId: string;
}

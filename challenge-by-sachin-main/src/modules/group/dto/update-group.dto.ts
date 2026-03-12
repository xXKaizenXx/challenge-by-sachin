
import { IsOptional, IsString, IsUUID, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateGroupDto {
  @ApiProperty({ required: false, description: 'Name of the group' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ required: false, description: 'Array of UUIDs of clients currently in the group to be removed from the group', type: [String] })
  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  clientIds?: string[];

  @ApiProperty({ required: false, description: 'UUID of the group leader (must be a client in the group)' })
  @IsOptional()
  @IsUUID()
  groupLeaderId?: string;
}

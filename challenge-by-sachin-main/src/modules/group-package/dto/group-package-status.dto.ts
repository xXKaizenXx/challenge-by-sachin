import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class GroupPackageStatusDto {
  @ApiProperty({ description: 'Group package status', example: 'Pending' })
  @IsString()
  status: string;
}


import { IsArray, IsString, IsNotEmpty, ArrayNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class BulkClientCenterTransferDto {

  @ApiProperty({
    example: ['client-id-1', 'client-id-2'],
    description: 'Array of client IDs to transfer',
    type: [String],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  clientIds: string[];

  @ApiProperty({
    example: 'center-id-123',
    description: 'Target center ID',
  })
  @IsString()
  @IsNotEmpty()
  targetCenterId: string;

  @ApiPropertyOptional({
    example: 'group-id-456',
    description: 'Optional target group ID within the center',
  })
  @IsOptional()
  @IsString()
  targetGroupId?: string;

  @ApiPropertyOptional({
    example: 'Relocation due to branch restructuring',
    description: 'Optional reason for the transfer',
  })
  @IsOptional()
  @IsString()
  reason?: string;
}

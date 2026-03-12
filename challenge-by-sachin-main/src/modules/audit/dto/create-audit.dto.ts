import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDateString,
  IsObject,
} from 'class-validator';

export class CreateAuditDto {
  @ApiProperty({ description: 'Audit action' })
  @IsString()
  @IsNotEmpty({ message: 'Audit action is required' })
  action: string;

  @ApiProperty({ description: 'Entity type being audited' })
  @IsString()
  @IsNotEmpty({ message: 'Entity type is required' })
  entityType: string;

  @ApiProperty({ description: 'Entity ID being audited' })
  @IsString()
  @IsNotEmpty({ message: 'Entity ID is required' })
  entityId: string;

  @ApiProperty({ description: 'Audit details' })
  @IsObject()
  @IsOptional()
  details?: object;

  @ApiProperty({ description: 'Audit date' })
  @IsDateString()
  @IsOptional()
  auditDate?: string;
}

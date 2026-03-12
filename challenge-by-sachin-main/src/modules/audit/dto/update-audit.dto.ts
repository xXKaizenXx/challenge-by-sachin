import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsDateString, IsObject } from 'class-validator';

export class UpdateAuditDto {
  @ApiPropertyOptional({ description: 'Audit action' })
  @IsString()
  @IsOptional()
  action?: string;

  @ApiPropertyOptional({ description: 'Entity type being audited' })
  @IsString()
  @IsOptional()
  entityType?: string;

  @ApiPropertyOptional({ description: 'Entity ID being audited' })
  @IsString()
  @IsOptional()
  entityId?: string;

  @ApiPropertyOptional({ description: 'Audit details' })
  @IsObject()
  @IsOptional()
  details?: object;

  @ApiPropertyOptional({ description: 'Audit date' })
  @IsDateString()
  @IsOptional()
  auditDate?: string;
}

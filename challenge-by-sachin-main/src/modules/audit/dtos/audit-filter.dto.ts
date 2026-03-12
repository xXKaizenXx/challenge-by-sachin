import { ApiPropertyOptional } from '@nestjs/swagger';
import { AuditStatus } from '../../../constants/audit-status';
import { Type } from 'class-transformer';
import { IsOptional, IsString, IsEnum, IsNumber, IsDateString } from 'class-validator';
import { Order } from 'src/constants';

export class AuditFilterDto {
  @ApiPropertyOptional({ description: 'Type of auditable entity' })
  @IsOptional()
  @IsString()
  auditableType?: string;

  @ApiPropertyOptional({ description: 'ID of auditable entity' })
  @IsOptional()
  @IsString()
  auditableId?: string;

  @ApiPropertyOptional({ description: 'User ID' })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({ description: 'Event type' })
  @IsOptional()
  @IsString()
  event?: string;

  @ApiPropertyOptional({ enum: AuditStatus, description: 'Audit status' })
  @IsOptional()
  @IsEnum(AuditStatus)
  status?: AuditStatus;

  @ApiPropertyOptional({ description: 'Start date (ISO string)' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date (ISO string)' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'IP address' })
  @IsOptional()
  @IsString()
  ipAddress?: string;

  @ApiPropertyOptional({ enum: ['ASC', 'DESC'], default: 'DESC', description: 'Sort order' })
  @IsOptional()
  @IsString()
  order?: Order.DESC;

  @ApiPropertyOptional({ type: Number, default: 1, description: 'Page number' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number;

  @ApiPropertyOptional({ type: Number, default: 20, description: 'Items per page' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  take?: number;

  @ApiPropertyOptional({ type: Number, description: 'Skip items' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  skip?: number;
}

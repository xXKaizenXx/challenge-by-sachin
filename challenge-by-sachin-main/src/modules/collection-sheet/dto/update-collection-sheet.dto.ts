import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsUUID,
  IsDateString,
  IsNumber,
} from 'class-validator';

export class UpdateCollectionSheetDto {
  @ApiPropertyOptional({ description: 'Center ID' })
  @IsUUID()
  @IsOptional()
  centerId?: string;

  @ApiPropertyOptional({ description: 'Collection date' })
  @IsDateString()
  @IsOptional()
  collectionDate?: string;

  @ApiPropertyOptional({ description: 'Total amount collected' })
  @IsNumber()
  @IsOptional()
  totalAmount?: number;

  @ApiPropertyOptional({ description: 'Collection notes' })
  @IsString()
  @IsOptional()
  notes?: string;
}

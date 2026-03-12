import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsUUID,
  IsOptional,
  IsDateString,
  IsNumber,
} from 'class-validator';

export class CreateCollectionSheetDto {
  @ApiProperty({ description: 'Center ID' })
  @IsUUID()
  @IsNotEmpty({ message: 'Center is required' })
  centerId: string;

  @ApiProperty({ description: 'Collection date' })
  @IsDateString()
  @IsNotEmpty({ message: 'Collection date is required' })
  collectionDate: string;

  @ApiProperty({ description: 'Total amount collected' })
  @IsNumber()
  @IsOptional()
  totalAmount?: number;

  @ApiProperty({ description: 'Collection notes' })
  @IsString()
  @IsOptional()
  notes?: string;
}

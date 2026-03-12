import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { OfficeEntity } from '../entities/office.entity';

export class CreateOfficeDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty({
    message: 'Office name is required',
  })
  name: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  externalId?: string;

  @ApiProperty()
  @IsDateString()
  openingDate: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  parent?: OfficeEntity;
}

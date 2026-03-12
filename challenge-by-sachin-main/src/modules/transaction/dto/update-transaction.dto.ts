import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsNumber,
  IsUUID,
  IsDateString,
} from 'class-validator';

export class UpdateTransactionDto {
  @ApiPropertyOptional({ description: 'Transaction amount' })
  @IsNumber()
  @IsOptional()
  amount?: number;

  @ApiPropertyOptional({ description: 'Transaction type ID' })
  @IsUUID()
  @IsOptional()
  transactionTypeId?: string;

  @ApiPropertyOptional({ description: 'Client ID' })
  @IsUUID()
  @IsOptional()
  clientId?: string;

  @ApiPropertyOptional({ description: 'Transaction date' })
  @IsDateString()
  @IsOptional()
  transactionDate?: string;

  @ApiPropertyOptional({ description: 'Transaction description' })
  @IsString()
  @IsOptional()
  description?: string;
}

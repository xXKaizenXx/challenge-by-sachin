import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class UpdateTransactionTypeDto {
  @ApiPropertyOptional({ description: 'Name of the transaction type' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: 'Description of the transaction type' })
  @IsString()
  @IsOptional()
  description?: string;
}

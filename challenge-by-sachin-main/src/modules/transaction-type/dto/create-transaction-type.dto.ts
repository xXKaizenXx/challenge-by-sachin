import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateTransactionTypeDto {
  @ApiProperty({ description: 'Name of the transaction type' })
  @IsString()
  @IsNotEmpty({ message: 'Transaction type name is required' })
  name: string;

  @ApiProperty({ description: 'Description of the transaction type' })
  @IsString()
  @IsOptional()
  description?: string;
}

import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsUUID,
  IsOptional,
  IsDateString,
  IsArray,
} from 'class-validator';

class RepaymentDto {
  @ApiProperty({ example: 2900 })
  @IsNumber()
  amount: number;

  @ApiProperty({ example: '841f7224-2542-4bb7-8e1d-51fef7479411' })
  @IsUUID()
  scheduleId: string;
}

export class CreateTransactionDto {
  @ApiProperty({
    description: 'Transaction date',
    example: '2025-09-08T13:48:27.762Z',
  })
  @IsDateString()
  transactionDate?: string;

  @ApiProperty({
    description: 'Repayments',
    type: [RepaymentDto],
    example: [
      {
        amount: 2900,
        scheduleId: '841f7224-2542-4bb7-8e1d-51fef7479411',
      },
    ],
  })
  @IsArray()
  @IsNotEmpty({ message: 'Repayments are required' })
  repayments: RepaymentDto[];
}

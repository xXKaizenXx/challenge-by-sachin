import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumberString,
  IsDateString,
  IsNumber,
  MaxLength,
} from 'class-validator';
import {
  LoanTransactionType,
  PaymentMethod,
} from '../entities/loan-transaction.entity';

export class CreateLoanTransactionDto {
  @ApiProperty({ description: 'Loan ID' })
  @IsString()
  @IsNotEmpty()
  loanId: string;

  @ApiPropertyOptional({ description: 'Schedule ID (if applicable)' })
  @IsString()
  @IsOptional()
  scheduleId?: string;

  @ApiProperty({ enum: LoanTransactionType, description: 'Transaction type' })
  @IsEnum(LoanTransactionType)
  transactionType: LoanTransactionType;

  @ApiProperty({ description: 'Transaction date (YYYY-MM-DD)' })
  @IsDateString()
  transactionDate: string;

  @ApiProperty({ description: 'Total amount' })
  @IsNumberString()
  amount: string;

  @ApiPropertyOptional({ description: 'Principal amount' })
  @IsNumberString()
  @IsOptional()
  principalAmount?: string;

  @ApiPropertyOptional({ description: 'Interest amount' })
  @IsNumberString()
  @IsOptional()
  interestAmount?: string;

  @ApiPropertyOptional({ description: 'Penalty amount' })
  @IsNumberString()
  @IsOptional()
  penaltyAmount?: string;

  @ApiPropertyOptional({ description: 'Fee amount' })
  @IsNumberString()
  @IsOptional()
  feeAmount?: string;

  @ApiProperty({ enum: PaymentMethod, description: 'Payment method' })
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @ApiPropertyOptional({ description: 'Receipt number', maxLength: 20 })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  receiptNumber?: string;

  @ApiPropertyOptional({ description: 'Collected by (staff user ID)' })
  @IsString()
  @IsOptional()
  collectedBy?: string;

  @ApiPropertyOptional({ description: 'Notes' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ description: 'Reversal reference (transaction ID)' })
  @IsString()
  @IsOptional()
  reversalRef?: string;
}

import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsNumberString,
  IsDateString,
  MaxLength,
} from 'class-validator';
import {
  LoanTransactionType,
  PaymentMethod,
} from '../entities/loan-transaction.entity';

export class UpdateLoanTransactionDto {
  @ApiPropertyOptional({ description: 'Loan ID' })
  @IsString()
  @IsOptional()
  loanId?: string;

  @ApiPropertyOptional({ description: 'Schedule ID (if applicable)' })
  @IsString()
  @IsOptional()
  scheduleId?: string;

  @ApiPropertyOptional({
    enum: LoanTransactionType,
    description: 'Transaction type',
  })
  @IsEnum(LoanTransactionType)
  @IsOptional()
  transactionType?: LoanTransactionType;

  @ApiPropertyOptional({ description: 'Transaction date (YYYY-MM-DD)' })
  @IsDateString()
  @IsOptional()
  transactionDate?: string;

  @ApiPropertyOptional({ description: 'Total amount' })
  @IsNumberString()
  @IsOptional()
  amount?: string;

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

  @ApiPropertyOptional({ enum: PaymentMethod, description: 'Payment method' })
  @IsEnum(PaymentMethod)
  @IsOptional()
  paymentMethod?: PaymentMethod;

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

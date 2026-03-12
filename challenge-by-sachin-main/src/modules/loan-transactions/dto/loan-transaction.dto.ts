import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AbstractDto } from '../../../common/dtos/abstract.dto';
import {
  LoanTransactionEntity,
  LoanTransactionType,
  PaymentMethod,
} from '../entities/loan-transaction.entity';

export class LoanTransactionDto extends AbstractDto {
  @ApiProperty()
  loanId: string;

  @ApiPropertyOptional()
  scheduleId?: string;

  @ApiProperty({ enum: LoanTransactionType })
  transactionType: LoanTransactionType;

  @ApiProperty()
  transactionDate: Date;

  @ApiProperty()
  amount: string;

  @ApiProperty()
  principalAmount: string;

  @ApiProperty()
  interestAmount: string;

  @ApiProperty()
  penaltyAmount: string;

  @ApiProperty()
  feeAmount: string;

  @ApiProperty({ enum: PaymentMethod })
  paymentMethod: PaymentMethod;

  @ApiPropertyOptional()
  receiptNumber?: string;

  @ApiPropertyOptional()
  collectedBy?: string;

  @ApiPropertyOptional()
  notes?: string;

  @ApiPropertyOptional()
  reversalRef?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  constructor(loanTransaction: LoanTransactionEntity) {
    super(loanTransaction);
    this.loanId = loanTransaction.loanId;
    this.scheduleId = loanTransaction.scheduleId;
    this.transactionType = loanTransaction.transactionType;
    this.transactionDate = loanTransaction.transactionDate;
    this.amount = loanTransaction.amount;
    this.principalAmount = loanTransaction.principalAmount;
    this.interestAmount = loanTransaction.interestAmount;
    this.penaltyAmount = loanTransaction.penaltyAmount;
    this.feeAmount = loanTransaction.feeAmount;
    this.paymentMethod = loanTransaction.paymentMethod;
    this.receiptNumber = loanTransaction.receiptNumber;
    this.collectedBy = loanTransaction.collectedBy;
    this.notes = loanTransaction.notes;
    this.reversalRef = loanTransaction.reversalRef;
    this.createdAt = loanTransaction.createdAt;
    this.updatedAt = loanTransaction.updatedAt;
  }
}

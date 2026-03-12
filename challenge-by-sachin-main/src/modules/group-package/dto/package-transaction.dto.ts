import { ApiProperty } from "@nestjs/swagger";
import { BaseResponseDto } from "src/common/dtos";
import { PaymentMethod, TransactionEntity, TransactionType } from "src/modules/transaction/entities/transaction.entity";


export class PackageTransactionDto {
  @ApiProperty({ example: 'uuid' })
  id: string;

  @ApiProperty({ enum: TransactionType})
  transactionType: TransactionType;

  @ApiProperty({ example: 1000.00 })
  amount: number;

  @ApiProperty({ example: '2025-11-07T10:00:00Z' })
  transactionDate: Date;

  @ApiProperty({ enum: PaymentMethod })
  paymentMethod: PaymentMethod;

  @ApiProperty({ example: 'RCP-12345', required: false })
  receiptNumber?: string;

  @ApiProperty({ example: 'loan-uuid' })
  loanId: string;

  @ApiProperty({ example: 'John Doe' })
  clientName: string;

  @ApiProperty({ example: 'Transaction notes', required: false })
  notes?: string;

  constructor(transaction: TransactionEntity) {
    this.id = transaction.id;
    this.transactionType = transaction.transactionType;
    this.amount = transaction.transactionType === TransactionType.DISBURSEMENT 
      ? transaction.credit : transaction.debit;
    this.transactionDate = transaction.transactionDate;
    this.paymentMethod = transaction.paymentMethod;
    this.receiptNumber = transaction.receiptNumber;
    this.loanId = transaction.loan.id;
    this.clientName = `${transaction.loan.client.firstName} ${transaction.loan.client.lastName}`;
    this.notes = transaction.notes;
  }
}

export class PackageTransactionsResponseDto extends BaseResponseDto<PackageTransactionDto[]> {
  static fromTransactions(
    data: PackageTransactionDto[] | null,
    message = 'Transactions retrieved successfully',
  ): PackageTransactionsResponseDto {
    return BaseResponseDto.from(data, !!data, message) as PackageTransactionsResponseDto;
  }
}
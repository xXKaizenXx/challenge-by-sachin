import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { AbstractEntity } from '../../../common/abstract.entity';
import { LoanEntity } from '../../loan/entities/loan.entity';
import { LoanScheduleEntity } from '../../loan-schedule/entities/loan-schedule.entity';
import { UserEntity } from '../../user/user.entity';

export enum TransactionType {
  DISBURSEMENT = 'Disbursement',
  REPAYMENT = 'Repayment',
  FEE = 'Fee',
  ADJUSTMENT = 'Adjustment',
  WRITE_OFF = 'Write-off',
}

export enum PaymentMethod {
  CASH = 'Cash',
  BANK_TRANSFER = 'Bank Transfer',
  MOBILE_MONEY = 'Mobile Money',
  CHEQUE = 'Cheque',
}

export interface ITransactionEntity {
  id: string;
  transactionType: TransactionType;
  transactionDate: Date;
  paymentMethod: PaymentMethod;
  receiptNumber?: string;
  collectedById?: string;
  notes?: string;
  reversalRef?: string;
  createdAt: Date;
  updatedAt: Date;
  schedule?: LoanScheduleEntity;
  loan?: LoanEntity;
  collectedBy?: UserEntity;
  reversalTransaction?: TransactionEntity;
  reversedBy?: TransactionEntity;
  debit: number;
  credit: number;
}

@Entity('loan_transactions')
@Index(['loan'])
@Index(['transactionDate'])
@Index(['receiptNumber'])
export class TransactionEntity
  extends AbstractEntity
  implements ITransactionEntity
{
  @Column({
    type: 'enum',
    enum: TransactionType,
    nullable: false,
  })
  transactionType: TransactionType;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: false })
  debit: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: false })
  credit: number;

  @Column({ type: 'date', nullable: false })
  transactionDate: Date;

  @Column({
    type: 'enum',
    enum: PaymentMethod,
    nullable: false,
  })
  paymentMethod: PaymentMethod;

  @Column({ unique: true, nullable: true })
  receiptNumber?: string;

  @Column({ nullable: true })
  collectedById?: string;

  @Column({ nullable: true })
  notes?: string;

  @Column({ nullable: true })
  reversalRef?: string;

  // Relationships
  @ManyToOne(() => LoanEntity, (loan) => loan.transactions)
  loan: LoanEntity;

  @ManyToOne(() => LoanScheduleEntity, (schedule) => schedule.transactions, {
    nullable: true,
  })
  schedule?: LoanScheduleEntity;

  @ManyToOne(() => UserEntity, (user) => user.collectedTransactions, {
    nullable: true,
  })
  collectedBy?: UserEntity;

  @ManyToOne(() => TransactionEntity, (transaction) => transaction.reversedBy, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  reversalTransaction?: TransactionEntity;

  @ManyToOne(
    () => TransactionEntity,
    (transaction) => transaction.reversalTransaction,
    {
      nullable: true,
    },
  )
  reversedBy?: TransactionEntity;
}

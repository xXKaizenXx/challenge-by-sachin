import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { AbstractEntity } from '../../../common/abstract.entity';
import { LoanEntity } from '../../loan/entities/loan.entity';
import { LoanScheduleEntity } from '../../loan-schedule/entities/loan-schedule.entity';
import { UserEntity } from '../../user/user.entity';

export enum LoanTransactionType {
  DISBURSEMENT = 'Disbursement',
  REPAYMENT = 'Repayment',
  FEE = 'Fee',
  ADJUSTMENT = 'Adjustment',
  WRITEOFF = 'Write-off',
}

export enum PaymentMethod {
  CASH = 'Cash',
  BANK_TRANSFER = 'Bank Transfer',
  MOBILE_MONEY = 'Mobile Money',
  CHEQUE = 'Cheque',
}

@Entity('loan_transactions')
@Index(['loanId'])
@Index(['transactionDate'])
@Index(['receiptNumber'])
export class LoanTransactionEntity extends AbstractEntity {
  @Column({ name: 'loan_id', type: 'bigint', nullable: false })
  loanId: string;

  @ManyToOne(() => LoanEntity, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'loan_id' })
  loan: LoanEntity;

  @Column({ name: 'schedule_id', type: 'bigint', nullable: true })
  scheduleId?: string;

  @ManyToOne(() => LoanScheduleEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'schedule_id' })
  schedule?: LoanScheduleEntity;

  @Column({
    name: 'transaction_type',
    type: 'enum',
    enum: LoanTransactionType,
    nullable: false,
  })
  transactionType: LoanTransactionType;

  @Column({ name: 'transaction_date', type: 'date', nullable: false })
  transactionDate: Date;

  @Column({
    name: 'amount',
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: false,
  })
  amount: string;

  @Column({
    name: 'principal_amount',
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0.0,
  })
  principalAmount: string;

  @Column({
    name: 'interest_amount',
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0.0,
  })
  interestAmount: string;

  @Column({
    name: 'penalty_amount',
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0.0,
  })
  penaltyAmount: string;

  @Column({
    name: 'fee_amount',
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0.0,
  })
  feeAmount: string;

  @Column({
    name: 'payment_method',
    type: 'enum',
    enum: PaymentMethod,
    nullable: false,
  })
  paymentMethod: PaymentMethod;

  @Column({
    name: 'receipt_number',
    type: 'varchar',
    length: 20,
    unique: true,
    nullable: true,
  })
  receiptNumber?: string;

  @Column({ name: 'collected_by', type: 'bigint', nullable: true })
  collectedBy?: string;

  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'collected_by' })
  collectedByUser?: UserEntity;

  @Column({ name: 'notes', type: 'text', nullable: true })
  notes?: string;

  @Column({ name: 'reversal_ref', type: 'bigint', nullable: true })
  reversalRef?: string;

  @Column({
    name: 'created_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt: Date;

  @Column({
    name: 'updated_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date;
}

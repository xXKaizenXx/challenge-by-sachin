import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { AbstractEntity } from '../../../common/abstract.entity';
import { LoanEntity } from '../../loan/entities/loan.entity';
import { LoanScheduleStatus } from '../../../constants/loan-schedule-status';
import { GroupPackageEntity } from 'src/modules/group-package/entities/group-package.entity';
import { TransactionEntity } from '../../transaction/entities/transaction.entity';

@Entity('loan_schedule')
@Index(['loanId', 'dueDate'])
@Index(['status'])
export class LoanScheduleEntity extends AbstractEntity {
  @Column({ type: 'bigint', nullable: false })
  loanId: string;

  @Column({ name: 'staff_id', type: 'uuid', nullable: false })
  staffId: string;

  @Column({ name: 'center_id', type: 'uuid', nullable: false })
  centerId: string;

  @Column({ name: 'office_id', type: 'uuid', nullable: false })
  officeId: string;

  @ManyToOne(() => LoanEntity, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'loan_id' })
  loan: LoanEntity;

  @Column({ nullable: false })
  installmentNumber: number;

  @Column({ type: 'date', nullable: false })
  dueDate: Date;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: false,
  })
  principalDue: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: false,
  })
  interestDue: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: false,
  })
  totalDue: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
  })
  applicationFeeDue: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
  })
  applicationFeePaid: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
  })
  serviceFeeDue: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0.0,
  })
  principalPaid: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0.0,
  })
  interestPaid: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0.0,
  })
  penaltyPaid: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0.0,
  })
  penaltyDue: number;

  @Column({
    type: 'enum',
    enum: LoanScheduleStatus,
    nullable: true,
  })
  status: LoanScheduleStatus | null;

  @Column({ type: 'date', nullable: true })
  paidDate?: Date;

  @Column({ type: 'decimal', nullable: true })
  serviceFeePaid?: number;

  @Column({ type: 'decimal', nullable: false })
  balance: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: false,
    default: 0,
  })
  totalPaid: number;

  @ManyToOne(() => GroupPackageEntity, (g) => g.schedule, {
    nullable: false,
  })
  groupPackage: GroupPackageEntity;

  @OneToMany(() => TransactionEntity, (transaction) => transaction.schedule)
  transactions: TransactionEntity[];
}

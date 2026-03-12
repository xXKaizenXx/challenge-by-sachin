import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { AbstractEntity } from '../../../common/abstract.entity';
import { LoanEntity } from '../../loan/entities/loan.entity';
import { LoanScheduleEntity } from '../../loan-schedule/entities/loan-schedule.entity';
import { AccrualStatus } from '../../../constants/accrual-status';

@Entity('accruals')
@Index(['loanId'])
@Index(['accrualDate'])
export class AccrualEntity extends AbstractEntity {
  @Column({ name: 'loan_id', type: 'bigint', nullable: false })
  loanId: string;

  @ManyToOne(() => LoanEntity, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'loan_id' })
  loan: LoanEntity;

  @Column({ name: 'schedule_id', type: 'bigint', nullable: false })
  scheduleId: string;

  @ManyToOne(() => LoanScheduleEntity, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'schedule_id' })
  schedule: LoanScheduleEntity;

  @Column({ name: 'accrual_date', type: 'date', nullable: false })
  accrualDate: Date;

  @Column({
    name: 'interest_accrued',
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: false,
  })
  interestAccrued: string;

  @Column({
    name: 'penalty_accrued',
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0.0,
  })
  penaltyAccrued: string;

  @Column({
    name: 'status',
    type: 'enum',
    enum: AccrualStatus,
    default: AccrualStatus.PENDING,
  })
  status: AccrualStatus;

  @Column({ name: 'gl_posted', type: 'boolean', default: false })
  glPosted: boolean;

  @Column({ name: 'gl_reference', type: 'varchar', length: 20, nullable: true })
  glReference?: string;
}

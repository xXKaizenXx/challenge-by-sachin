import {
  Entity,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { AbstractEntity } from '../../../common/abstract.entity';
import { LoanEntity } from '../../loan/entities/loan.entity';
import { UserEntity } from '../../user/user.entity';
import { OfficeEntity } from '../../office/entities/office.entity';
import { LoanScheduleEntity } from 'src/modules/loan-schedule/entities/loan-schedule.entity';

export enum GroupPackageStatus {
  PENDING = 'Pending',
  AWAITING_DISBURSEMENT = 'Awaiting Disbursement',
  ACTIVE = 'Active',
  REJECTED = 'Rejected',
  Completed = 'Completed',
}

@Entity('group_packages')
export class GroupPackageEntity extends AbstractEntity<GroupPackageEntity> {
  @Column({ type: 'uuid', nullable: false })
  groupId: string;

  @Column({ nullable: false })
  groupName: string;

  @Column({ type: 'uuid', nullable: false })
  userId: string;

  @Column({ nullable: false })
  username: string;

  @OneToMany(() => LoanEntity, (loan) => loan.groupPackage, { eager: true })
  loans: LoanEntity[];

  @Column({
    type: 'enum',
    enum: GroupPackageStatus,
    nullable: false,
    default: GroupPackageStatus.PENDING,
  })
  status: GroupPackageStatus;

   @Column({ type: 'date', nullable: false })
  expectedDisbursementDate: Date;
  
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  approvedBy: string;

  @Column({ type: 'decimal', nullable: false, default: 0 })
  amount: number;

  @Column({
    type: 'decimal',
    nullable: false,
    default: 0,
  })
  totalExpectedRepayment: number;

  //repayment dates in jsonb
  @Column({ type: 'jsonb', nullable: true })
  repaymentDates: object;

  @Column({ nullable: false })
  officeId: string;

  @ManyToOne(() => OfficeEntity, (office) => office.id, { eager: true })
  office: OfficeEntity;

  @ManyToOne(() => UserEntity, (user) => user.id, { eager: true })
  user: UserEntity;

  @OneToMany(() => LoanScheduleEntity, (schedule) => schedule.groupPackage, {
    eager: true,
  })
  schedule: LoanScheduleEntity[];
}

import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { AbstractEntity } from '../../../common/abstract.entity';
import { ClientEntity } from '../../client/entities/client.entity';
import { Product } from '../../product/entities/product.entity';
import { UserEntity } from '../../user/user.entity';
import { GroupEntity } from '../../group/entities/group.entity';
import { OfficeEntity } from '../../office/entities/office.entity';
import { StatusEntity } from '../../status/entities/status.entity';
import { GroupPackageEntity } from '../../group-package/entities/group-package.entity';
import { LoanScheduleEntity } from 'src/modules/loan-schedule/entities/loan-schedule.entity';
import { TransactionEntity } from '../../transaction/entities/transaction.entity';

export interface ILoanEntity {
  id: string;
  clientId: string;
  principal: number;
  totalInterest: number;
  interestBreakDown: object;
  totalExpectedRepayment: number;
  expectedDisbursementDate: Date;
  numberOfRepayments: number;
  // loanProductId: string;
  loanProductName: string;
  staffId: string;
  userName: string;
  repaymentEvery: string;
  expectedFirstRepaymentOnDate: Date;
  timeline: object;
  repaymentsDueDates: object;
  apr: number;
  groupId?: string;
  groupName?: string;
  applicationFee: number;
  serviceFee: number;
  installments: object;
  agreementForm?: string;
  disbursementDate?: Date;
  disbursedById?: string;
  disbursedByName?: string;
  firstApprovedOn?: Date;
  firstApprovedById?: string;
  firstApprovedByName?: string;
  secondApprovalById?: string;
  secondApprovalByName?: string;
  secondApprovalOnDate?: Date;
  canBeUsedForTopUp: boolean;
  officeId: string;
  officeName: string;
  inArrears: boolean;
  isWrittenOff: boolean;
  statusId: string;
  status: string;
  arrearsStartDate?: Date;
  nextRepaymentDate?: Date;
  auditDate: object;
  maximumApplicationFee: number;
  businessType: string;
}

@Entity('loans')
export class LoanEntity extends AbstractEntity implements ILoanEntity {
  @Column({ type: 'uuid', nullable: false })
  clientId: string;

  @Column({ nullable: false })
  principal: number;

  @Column({ type: 'decimal', nullable: false })
  totalInterest: number;

  @Column({ type: 'jsonb', nullable: false })
  interestBreakDown: object;

  @Column({
    type: 'decimal',
    nullable: false,
  })
  totalExpectedRepayment: number;

  @Column({ type: 'date', nullable: false })
  expectedDisbursementDate: Date;

  @Column({ nullable: false })
  numberOfRepayments: number;

  // @Column({ name: 'loan_product_id', type: 'uuid', nullable: false })
  // loanProductId: string;

  @Column({ nullable: false })
  loanProductName: string;

  @Column({ type: 'uuid', nullable: false })
  staffId: string;

  @Column({ nullable: false })
  userName: string;

  @Column({ nullable: false })
  repaymentEvery: string;

  @Column({
    type: 'date',
    nullable: false,
  })
  expectedFirstRepaymentOnDate: Date;

  @Column({ type: 'jsonb', nullable: false })
  timeline: object;

  @Column({ type: 'jsonb', nullable: false })
  repaymentsDueDates: object;

  @Column({ type: 'decimal', nullable: false })
  apr: number;

  @Column({ type: 'uuid', nullable: true })
  groupId?: string;

  @Column({ nullable: true })
  groupName?: string;

  @Column({ type: 'decimal', nullable: false })
  applicationFee: number;

  @Column({ nullable: false })
  serviceFee: number;

  @Column({ type: 'jsonb', nullable: false })
  installments: object;

  @Column({ nullable: true })
  agreementForm?: string;

  @Column({ type: 'date', nullable: true })
  disbursementDate?: Date;

  @Column({ type: 'uuid', nullable: true })
  disbursedById?: string;

  @Column({ type: 'varchar', nullable: true })
  disbursedByName?: string;

  @Column({ type: 'date', nullable: true })
  firstApprovedOn?: Date;

  @Column({ type: 'uuid', nullable: true })
  firstApprovedById?: string;

  @Column({ type: 'varchar', nullable: true })
  firstApprovedByName?: string;

  @Column({ type: 'uuid', nullable: true })
  secondApprovalById?: string;

  @Column({ type: 'varchar', nullable: true })
  secondApprovalByName?: string;

  @Column({ type: 'date', nullable: true })
  secondApprovalOnDate?: Date;

  @Column({
    nullable: false,
    default: false,
  })
  canBeUsedForTopUp: boolean;

  @Column({ type: 'uuid', nullable: false })
  officeId: string;

  @Column({ nullable: false })
  officeName: string;

  @Column({
    nullable: false,
    default: false,
  })
  inArrears: boolean;

  @Column({
    nullable: false,
    default: false,
  })
  isWrittenOff: boolean;

  @Column({ nullable: false })
  statusId: string;

  @Column({ nullable: false })
  status: string;

  @Column({ type: 'date', nullable: true })
  arrearsStartDate?: Date;

  @Column({ type: 'date', nullable: true })
  nextRepaymentDate?: Date;

  @Column({ type: 'jsonb', nullable: false })
  auditDate: object;

  @Column({ type: 'decimal', nullable: false })
  maximumApplicationFee: number;

  @Column({ type: 'varchar', nullable: true })
  businessType: string;

  // Relationships
  @ManyToOne(() => ClientEntity, (client) => client.loans, {
    nullable: false,
    eager: true,
  })
  client: ClientEntity;

  @ManyToOne(() => UserEntity, (user) => user.loans, {
    nullable: false,
    eager: true,
  })
  staff: UserEntity;

  @ManyToOne(() => GroupEntity, (group) => group.loans, {
    nullable: true,
    eager: true,
  })
  group?: GroupEntity;

  @ManyToOne(() => UserEntity, (user) => user.disbursedLoans, {
    nullable: true,
    eager: true,
  })
  disbursedBy?: UserEntity;

  @ManyToOne(() => UserEntity, (user) => user.firstApprovedLoans, {
    nullable: true,
    eager: true,
  })
  firstApprovedBy?: UserEntity;

  @ManyToOne(() => UserEntity, (user) => user.secondApprovedLoans, {
    nullable: true,
    eager: true,
  })
  secondApprovalBy?: UserEntity;

  @ManyToOne(() => GroupPackageEntity, (groupPackage) => groupPackage.loans, {
    eager: false,
  })
  groupPackage?: GroupPackageEntity;

  @ManyToOne(() => OfficeEntity, (office) => office.loans, {
    nullable: false,
    eager: true,
  })
  office: OfficeEntity;

  @ManyToOne(() => StatusEntity, (status) => status.loans, {
    nullable: false,
    eager: true,
  })
  statusEntity: StatusEntity;

  @OneToMany(() => LoanScheduleEntity, (schedule) => schedule.loan)
  schedule: LoanScheduleEntity[];

  @OneToMany(() => TransactionEntity, (transaction) => transaction.loan)
  transactions: TransactionEntity[];
}

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  ManyToOne,
  CreateDateColumn,
  DeepPartial,
  OneToMany,
} from 'typeorm';
import { AbstractEntity } from '../../../common/abstract.entity';
import { GroupEntity } from '../../group/entities/group.entity';
import { UserEntity } from '../../user/user.entity';
import { OfficeEntity } from '../../office/entities/office.entity';
import { Center } from '../../center/entities/center.entity';
import { Language } from '../../language/entities/language.entity';
import { Province } from '../../provinces/entities/province.entity';
import { Town } from '../../town/entities/town.entity';
import { StatusEntity } from '../../status/entities/status.entity';
import { BankEntity } from '../../bank/entities/bank.entity';
import { LoanEntity } from 'src/modules/loan/entities/loan.entity';

export interface IClientEntity {
  id: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  dateOfBirth: Date;
  address: object;
  gender: string;
  nationalIdNumber: string;
  mobileNumber: string;
  emailAddress?: string;
  proofOfAddress: string;
  nationalId: string;
  active: boolean;
  blacklisted: boolean;
  status: StatusEntity;
  officeId: string;
  staffId: string;
  activatedById?: string;
  bank: BankEntity;
  groupId?: string;
  center: Center;
  submittedOn: Date;
  activatedOn?: Date;
  auditData: object;
}

@Entity('clients')
export class ClientEntity extends AbstractEntity implements IClientEntity {
  @Column({ name: 'first_name', type: 'varchar', nullable: false })
  firstName: string;

  @Column({ name: 'middle_name', type: 'varchar', nullable: true })
  middleName?: string;

  @Column({ name: 'last_name', type: 'varchar', nullable: false })
  lastName: string;

  @Column({ name: 'date_of_birth', type: 'date', nullable: false })
  dateOfBirth: Date;

  @Column({ name: 'address', type: 'jsonb', nullable: false })
  address: object;

  @Column({ name: 'gender', nullable: false, default: 'female' })
  gender: string;

  @Column({
    name: 'bank_account_number',
    type: 'varchar',
    nullable: false,
    unique: true,
  })
  bankAccountNumber: string;

  @Column({
    name: 'national_id_number',
    type: 'varchar',
    nullable: false,
    unique: true,
  })
  nationalIdNumber: string;

  @Column({
    name: 'mobile_number',
    type: 'varchar',
    nullable: false,
    unique: true,
  })
  mobileNumber: string;

  @Column({
    name: 'email_address',
    type: 'varchar',
    nullable: true,
    unique: true,
  })
  emailAddress?: string;

  @Column({ name: 'proof_of_address', type: 'varchar', nullable: false })
  proofOfAddress: string;

  @Column({ name: 'national_id', type: 'varchar', nullable: false })
  nationalId: string;

  @Column({ name: 'active', type: 'boolean', nullable: false, default: false })
  active: boolean;

  @Column({
    name: 'blacklisted',
    type: 'boolean',
    nullable: false,
    default: false,
  })
  blacklisted: boolean;

  @ManyToOne(() => StatusEntity, { nullable: false, eager: true })
  status: StatusEntity;

  @ManyToOne(() => Province, (province) => province.clients, {
    eager: true,
  })
  province: Province;

  @ManyToOne(() => Town, { nullable: true })
  @JoinColumn({ name: 'town_id' })
  town?: Town;

  @ManyToOne(() => Language, { nullable: false, eager: true })
  @JoinColumn({ name: 'language_id' })
  language: Language;

  @Column({ name: 'office_id', type: 'uuid', nullable: false })
  officeId: string;

  @Column({ name: 'staff_id', type: 'uuid', nullable: false })
  staffId: string;

  @Column({ name: 'activated_by_id', type: 'uuid', nullable: true })
  activatedById?: string;

  @ManyToOne(() => BankEntity, { nullable: false })
  @JoinColumn({ name: 'bank_id' })
  bank: BankEntity;

  @CreateDateColumn({ name: 'submitted_on', type: 'timestamp' })
  submittedOn: Date;

  @Column({ name: 'activated_on', type: 'timestamp', nullable: true })
  activatedOn?: Date;

  @Column({ name: 'audit_data', type: 'jsonb', nullable: false })
  auditData: object;

  // Relationships
  @OneToOne(() => GroupEntity, (group) => group.groupLeader)
  groupLed: GroupEntity;

  @ManyToOne(() => GroupEntity, (group) => group.clients, {
    nullable: true,
  })
  group: GroupEntity;

  @ManyToOne(() => UserEntity, { nullable: false })
  @JoinColumn({ name: 'staff_id' })
  staff: UserEntity;

  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'activated_by_id' })
  activatedBy: UserEntity;

  @ManyToOne(() => OfficeEntity, { nullable: false })
  @JoinColumn({ name: 'office_id' })
  office: OfficeEntity;

  @ManyToOne(() => Center, (center) => center.clients, {
    nullable: false,
  })
  center: Center;

  @OneToMany(() => LoanEntity, (loan) => loan.client)
  loans: LoanEntity[];
}

export { Language } from '../../language/entities/language.entity';
export { Province } from '../../provinces/entities/province.entity';
export { Town } from '../../town/entities/town.entity';

import { IAbstractEntity, AbstractEntity } from '../../common/abstract.entity';
import { Column, Entity, ManyToOne, OneToMany } from 'typeorm';
import { UserDto } from './dtos/user.dto';
import { OfficeEntity } from '../office/entities/office.entity';
import { RoleType } from 'src/constants';
import { LoanEntity } from '../loan/entities/loan.entity';
import { TransactionEntity } from '../transaction/entities/transaction.entity';

export interface IUserEntity extends IAbstractEntity<UserDto> {
  firstName: string;

  lastName: string;

  email?: string;

  username: string;

  password: string;

  phone: string;
}

@Entity({ name: 'users' })
export class UserEntity extends AbstractEntity<UserDto> implements IUserEntity {
  @Column({ nullable: true })
  firstName: string;

  @Column({ nullable: true })
  lastName: string;

  @Column({ unique: true, nullable: true })
  email: string;

  @Column({ unique: true })
  username: string;

  @Column({ nullable: true })
  password: string;

  @Column({
    type: 'enum',
    enum: RoleType,
  })
  role: RoleType;

  @Column({ unique: true, nullable: true })
  phone: string;

  @ManyToOne(() => OfficeEntity, (office) => office.users, { eager: true })
  office: OfficeEntity;

  @OneToMany(() => LoanEntity, (loan) => loan.staff)
  loans: LoanEntity[];

  @OneToMany(() => LoanEntity, (loan) => loan.disbursedBy)
  disbursedLoans: LoanEntity[];

  @OneToMany(() => LoanEntity, (loan) => loan.firstApprovedBy)
  firstApprovedLoans: LoanEntity[];

  @OneToMany(() => LoanEntity, (loan) => loan.secondApprovalBy)
  secondApprovedLoans: LoanEntity[];

  @OneToMany(() => TransactionEntity, (transaction) => transaction.collectedBy)
  collectedTransactions: TransactionEntity[];
}

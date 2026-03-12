import {
  IAbstractEntity,
  AbstractEntity,
} from '../../../common/abstract.entity';
import { Column, Entity, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { ChartOfAccountsDto } from '../dto/chart-of-accounts.dto';

export enum AccountType {
  ASSET = 'asset',
  LIABILITY = 'liability',
  EQUITY = 'equity',
  INCOME = 'income',
  EXPENSE = 'expense',
  CONTRA_ASSET = 'contra_asset',
}

export interface IChartOfAccountsEntity
  extends IAbstractEntity<ChartOfAccountsDto> {
  accountCode: string;
  accountName: string;
  accountType: AccountType;
  accountSubtype?: string;
  parentAccountId?: string;
  isActive: boolean;
  description?: string;
}

@Entity({ name: 'chart_of_accounts' })
export class ChartOfAccountsEntity
  extends AbstractEntity<ChartOfAccountsDto>
  implements IChartOfAccountsEntity
{
  @Column({
    name: 'account_code',
    type: 'varchar',
    length: 20,
    unique: true,
    nullable: false,
  })
  accountCode: string;

  @Column({
    name: 'account_name',
    type: 'varchar',
    length: 100,
    nullable: false,
  })
  accountName: string;

  @Column({
    name: 'account_type',
    type: 'enum',
    enum: AccountType,
    nullable: false,
  })
  accountType: AccountType;

  @Column({
    name: 'account_subtype',
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  accountSubtype?: string;

  @Column({
    name: 'parent_account_id',
    type: 'uuid',
    nullable: true,
  })
  parentAccountId?: string;

  @Column({
    name: 'is_active',
    type: 'boolean',
    default: true,
  })
  isActive: boolean;

  @Column({
    type: 'text',
    nullable: true,
  })
  description?: string;

  @ManyToOne(() => ChartOfAccountsEntity, (account) => account.childAccounts, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'parent_account_id' })
  parentAccount?: ChartOfAccountsEntity;

  @OneToMany(() => ChartOfAccountsEntity, (account) => account.parentAccount)
  childAccounts?: ChartOfAccountsEntity[];
}

import { AbstractEntity } from 'src/common/abstract.entity';
import { Column, Entity, ManyToOne, OneToMany } from 'typeorm';

@Entity('suspended_account_journals')
export class SuspendedAccountJournalEntity extends AbstractEntity {
  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: false })
  debit: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: false })
  credit: number;

  @Column({ nullable: false })
  date: Date;

  @Column({ nullable: false })
  description: string;

  @Column({ nullable: false })
  status: string;

  // @ManyToOne(() => SuspenseAccountEntity, (account) => account.journals)
  // account: SuspenseAccountEntity;
}

@Entity('suspense_accounts')
export class SuspenseAccountEntity extends AbstractEntity {
  @Column({ nullable: false })
  accountNumber: string;

  @Column({ nullable: false })
  accountName: string;

  @Column({ nullable: false })
  accountBalance: number;

  @Column({ nullable: false })
  accountStatus: string;

  @Column({ nullable: false, type: 'uuid', unique: true })
  groupId: string;

  // @OneToMany(() => SuspendedAccountJournalEntity, (journal) => journal.account)
  // journals: SuspendedAccountJournalEntity[];
}

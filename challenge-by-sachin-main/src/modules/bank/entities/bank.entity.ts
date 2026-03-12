import { Entity, Column, OneToMany } from 'typeorm';
import { AbstractEntity } from '../../../common/abstract.entity';
import { ClientEntity } from '../../client/entities/client.entity';

export interface IBankEntity {
  id: string;
  name: string;
  branchCode: string;
  createdAt: Date;
  updatedAt: Date;
}

@Entity('banks')
export class BankEntity extends AbstractEntity implements IBankEntity {
  @Column({ name: 'name', type: 'varchar', nullable: false })
  name: string;

  @Column({
    name: 'branch_code',
    type: 'varchar',
    nullable: false,
    unique: true,
  })
  branchCode: string;

  @OneToMany(() => ClientEntity, (client) => client.bank)
  clients: ClientEntity[];
}

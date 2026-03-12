import { Entity, Column, OneToMany } from 'typeorm';
import { AbstractEntity } from '../../../common/abstract.entity';
import { LoanEntity } from 'src/modules/loan/entities/loan.entity';

export interface IStatusEntity {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

@Entity('statuses')
export class StatusEntity extends AbstractEntity implements IStatusEntity {
  @Column({ name: 'name', type: 'varchar', nullable: false, unique: true })
  name: string;

  @OneToMany(() => LoanEntity, (loan) => loan.status)
  loans: LoanEntity[];
}

import { Entity, Column } from 'typeorm';
import { AbstractEntity } from '../../../common/abstract.entity';

export interface IGenderEntity {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

@Entity('genders')
export class GenderEntity extends AbstractEntity implements IGenderEntity {
  @Column({ name: 'name', type: 'varchar', nullable: false, unique: true })
  name: string;
}

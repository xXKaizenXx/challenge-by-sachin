import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { AbstractEntity } from '../../../common/abstract.entity';
import { UserEntity } from '../../user/user.entity';
import { Center } from '../../center/entities/center.entity';
import { ClientEntity } from '../../client/entities/client.entity';
import { StatusEntity } from '../../status/entities/status.entity';
import { LoanEntity } from 'src/modules/loan/entities/loan.entity';

@Entity('groups')
export class GroupEntity extends AbstractEntity<GroupEntity> {
  @Column({ name: 'system_name', type: 'varchar', nullable: false })
  systemName: string;

  @Column({ name: 'name', type: 'varchar', nullable: false })
  name: string;

  @Column({ name: 'active', type: 'boolean', nullable: false, default: false })
  active: boolean;

  @ManyToOne(() => StatusEntity, { nullable: false, eager: true })
  status: StatusEntity;

  // One-to-many: group has many clients
  @OneToMany(() => ClientEntity, (client) => client.group, { eager: true })
  clients: ClientEntity[];

  // One-to-one: group leader
  @OneToOne(() => ClientEntity, { nullable: false })
  @JoinColumn({ name: 'group_leader_id' })
  groupLeader: ClientEntity;

  @ManyToOne(() => UserEntity, { nullable: false })
  @JoinColumn({ name: 'staff_id' })
  staff: UserEntity;

  @Column({ name: 'staff_name', type: 'varchar', nullable: false })
  staffName: string;

  @ManyToOne(() => UserEntity, { nullable: false })
  @JoinColumn({ name: 'created_by_id' })
  createdBy: UserEntity;

  @Column({ name: 'audit_data', type: 'jsonb', nullable: false })
  auditData: object;

  @ManyToOne(() => Center, (center) => center.groups, {
    nullable: false,
  })
  center: Center;

  @Column({ name: 'timeline', type: 'jsonb', nullable: false })
  timeline: object;

  @Column({ name: 'office_name', type: 'varchar', nullable: false })
  officeName: string;

  @OneToMany(() => LoanEntity, (loan) => loan.group)
  loans: LoanEntity[];
}

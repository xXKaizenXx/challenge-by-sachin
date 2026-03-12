import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { CenterMeetingDates } from '../../center-meeting-dates/entities/center-meeting-dates.entity';
import { AbstractEntity } from '../../../common/abstract.entity';
import { GroupEntity } from 'src/modules/group/entities/group.entity';
import { ClientEntity } from 'src/modules/client/entities/client.entity';

@Entity('center')
export class Center extends AbstractEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', nullable: false })
  name: string;

  @Column({ type: 'varchar', nullable: false, unique: true })
  centerCode: string;

  // staffId foreign key (placeholder relation)
  @Column({ type: 'uuid', nullable: false })
  user: string;

  @Column({ type: 'varchar', nullable: false })
  staffName: string;

  // officeId foreign key (placeholder relation)
  @Column({ type: 'uuid', nullable: false })
  office: string;

  @Column({ type: 'varchar', nullable: false })
  officeName: string;

  @Column({ type: 'timestamp', nullable: false })
  createdBy: Date;

  @ManyToOne(() => CenterMeetingDates, (meetingDates) => meetingDates.centers, {
    nullable: false,
    onDelete: 'CASCADE',
    eager: true,
  })
  @JoinColumn({ name: 'meetingDateId' })
  meetingDates: CenterMeetingDates;

  @Column({ type: 'time', nullable: true })
  meetingTime: string;

  @Column({ type: 'jsonb', nullable: true })
  location: object;

  @Column({ type: 'jsonb', nullable: true })
  centerLeadership?: object;

  @OneToMany(() => GroupEntity, (group) => group.center, {
    nullable: false,
    eager: true,
  })
  groups: GroupEntity[];

  @OneToMany(() => ClientEntity, (client) => client.center, {
    nullable: false,
    eager: true,
  })
  clients: ClientEntity[];
}

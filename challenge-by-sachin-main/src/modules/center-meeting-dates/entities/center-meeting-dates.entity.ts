import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { AbstractEntity } from '../../../common/abstract.entity';
import { Center } from '../../center/entities/center.entity';

export enum WeekNumber {
  ONE = 1,
  TWO = 2,
  THREE = 3,
  FOUR = 4,
}

export enum WeekDay {
  MONDAY = 'Monday',
  TUESDAY = 'Tuesday',
  WEDNESDAY = 'Wednesday',
  THURSDAY = 'Thursday',
  FRIDAY = 'Friday',
}

@Entity('center_meeting_dates')
export class CenterMeetingDates extends AbstractEntity<CenterMeetingDates> {
  @Column({ type: 'enum', enum: WeekNumber })
  week: WeekNumber;

  @Column({ type: 'enum', enum: WeekDay })
  day: WeekDay;

  @OneToMany(() => Center, (center) => center.meetingDates)
  centers: Center[];
}

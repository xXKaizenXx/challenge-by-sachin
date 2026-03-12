import { IsEnum, IsUUID } from 'class-validator';
import { WeekNumber, WeekDay } from '../entities/center-meeting-dates.entity';

export class CreateCenterMeetingDatesDto {
  @IsEnum(WeekNumber)
  week: WeekNumber;

  @IsEnum(WeekDay)
  day: WeekDay;
}

import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { WeekNumber, WeekDay } from '../entities/center-meeting-dates.entity';

export class UpdateCenterMeetingDatesDto {
  @IsEnum(WeekNumber)
  @IsOptional()
  week?: WeekNumber;

  @IsEnum(WeekDay)
  @IsOptional()
  day?: WeekDay;
}

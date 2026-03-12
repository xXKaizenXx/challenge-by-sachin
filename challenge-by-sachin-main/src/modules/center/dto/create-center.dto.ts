import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CreateCenterDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsUUID()
  meetingDateId: string; // Refers to CenterMeetingDates entity

  @IsNotEmpty()
  @IsString()
  meetingTime: string; // Format: HH:mm:ss

  @IsNotEmpty()
  @IsUUID()
  userId: string; // Loan officer assigned to the center
}

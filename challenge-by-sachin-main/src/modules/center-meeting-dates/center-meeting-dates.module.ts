import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CenterMeetingDates } from './entities/center-meeting-dates.entity';
import { CenterMeetingDatesService } from './center-meeting-dates.service';
import { CenterMeetingDatesController } from './center-meeting-dates.controller';

@Module({
  imports: [TypeOrmModule.forFeature([CenterMeetingDates])],
  controllers: [CenterMeetingDatesController],
  providers: [CenterMeetingDatesService],
  exports: [TypeOrmModule],
})
export class CenterMeetingDatesModule {}

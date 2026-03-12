import { Module } from '@nestjs/common';
import { CenterService } from './center.service';
import { CenterController } from './center.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Center } from './entities/center.entity';
import { UserModule } from '../user/user.module';
import { OfficeModule } from '../office/office.module';
import { CenterMeetingDatesModule } from '../center-meeting-dates/center-meeting-dates.module';
import { CenterMeetingDatesService } from '../center-meeting-dates/center-meeting-dates.service';
import { ClientEntity } from '../client/entities/client.entity';
import { GroupEntity } from '../group/entities/group.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Center, ClientEntity, GroupEntity]),
    UserModule,
    OfficeModule,
    CenterMeetingDatesModule,
  ],
  controllers: [CenterController],
  providers: [CenterService, CenterMeetingDatesService],
  exports: [CenterService],
})
export class CenterModule {}

import { ApiProperty } from '@nestjs/swagger';
import { AbstractDto } from '../../../common/dtos/abstract.dto';
import { Center } from '../entities/center.entity';
import { CenterMeetingDates } from '../../center-meeting-dates/entities/center-meeting-dates.entity';
import { GroupDto } from '../../group/dto/group.dto';
import { GroupEntity } from 'src/modules/group/entities/group.entity';
import { BaseResponseDto, PageResponseDto } from 'src/common/dtos';
import { Type } from 'class-transformer';

export class CenterMeetingDatesDto {
  @ApiProperty()
  week: number;
  @ApiProperty()
  day: string;

  constructor(meetingDates: CenterMeetingDates) {
    this.week = meetingDates.week;
    this.day = meetingDates.day;
  }
}

export class CenterDto extends AbstractDto {
  @ApiProperty()
  name: string;

  @ApiProperty()
  user: string;

  @ApiProperty()
  staffName: string;

  @ApiProperty()
  office: string;

  @ApiProperty()
  officeName: string;

  @ApiProperty()
  createdBy: Date;

  @ApiProperty({ type: () => Object })
  meetingDates: CenterMeetingDates;

  @ApiProperty()
  meetingTime: string;

  @ApiProperty({ type: Object, required: false })
  location?: object;

  @ApiProperty({ type: Object, required: false })
  centerLeadership?: object;

  @ApiProperty()
  groups: Partial<GroupEntity>[];

  @ApiProperty()
  centerCode: string;

  constructor(center: Center) {
    console.log('PASSED CENTER', center);
    super(center);
    this.name = center.name;
    this.user = center.user;
    this.staffName = center.staffName;

    this.office = center.office;
    this.officeName = center.officeName;
    this.createdBy = center.createdBy;
    this.meetingDates = center.meetingDates;
    this.meetingTime = center.meetingTime;
    this.location = center.location;
    this.centerLeadership = center.centerLeadership;
    this.groups = center?.groups?.map((group) => ({
      id: group?.id,
      name: group?.name,
      clients: group?.clients,
      systemName: group?.systemName,
      createdAt: group?.createdAt,
    }));
    this.centerCode = center.centerCode;
  }
}

export class MiniCenterDto extends AbstractDto {
  @ApiProperty()
  name: string;

  @ApiProperty()
  centerCode: string;

  @ApiProperty()
  user: string;

  @ApiProperty()
  staffName: string;

  @ApiProperty()
  office: string;

  @ApiProperty()
  officeName: string;

  @ApiProperty()
  createdBy: Date;

  @ApiProperty({ type: () => CenterMeetingDatesDto })
  meetingDates: any;

  @ApiProperty()
  meetingTime: string;

  @ApiProperty({ type: Object, required: false })
  location?: object;

  @ApiProperty({ type: Object, required: false })
  centerLeadership?: object;

  constructor(center) {
    console.log('PASSED CENTER2222222', center);
    super(center);
    this.name = center.name;
    this.centerCode = center.centerCode;
    this.user = center.user;
    this.staffName = center.staffName;
    this.office = center.office;
    this.officeName = center.officeName;
    this.createdBy = center.createdBy;
    this.meetingDates = new CenterMeetingDatesDto(center.meetingDates);
    this.meetingTime = center.meetingTime;
    this.location = center.location;
    this.centerLeadership = center.centerLeadership;
  }
}

export class MiniCenterDtoListResponseDto extends PageResponseDto<MiniCenterDto> {
  @Type(() => MiniCenterDto)
  data: MiniCenterDto[];
}

export class CenterResponseDto extends BaseResponseDto<MiniCenterDto> {
  @Type(() => MiniCenterDto)
  data: MiniCenterDto;
}

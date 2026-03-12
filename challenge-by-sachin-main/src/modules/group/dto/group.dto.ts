import { ApiProperty } from '@nestjs/swagger';
import { AbstractDto } from '../../../common/dtos/abstract.dto';
import { GroupEntity } from '../entities/group.entity';
import { ClientDto } from '../../client/dto/client.dto';
import { UserDto } from 'src/modules/user/dtos/user.dto';
import { BaseResponseDto, PageResponseDto } from 'src/common/dtos';
import { Expose, Type } from 'class-transformer';

class MiniUserDto {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;

  constructor(user: any) {
    this.id = user.id;
    this.firstName = user.firstName;
    this.lastName = user.lastName;
    this.phone = user.phone;
  }
}
export class GroupDto extends AbstractDto {
  @ApiProperty()
  name: string;

  @ApiProperty()
  systemName: string;

  @ApiProperty()
  officeName: string;

  @ApiProperty()
  active: boolean;

  @ApiProperty({ type: () => Object })
  status: { id: string; name: string };

  @ApiProperty({ type: () => Object })
  center: { id: string; name: string };

  @ApiProperty({ type: () => Object })
  staff: {
    id: string,
    firstName: string;
    lastName: string,
    office: {
      id: string,
      name: string,
    }
  };

  @ApiProperty()
  @Expose()
  meetingDates: {
    week: number,
    day: string,
  }

  @ApiProperty()
  @Expose()
  memberCount: number;

  constructor(group: GroupEntity) {
    super(group);
    this.name = group.name;
    this.officeName = group.officeName;
    this.systemName = group.systemName
    this.active = group.active;
    this.status = group.status
      ? { id: group.status.id, name: group.status.name }
      : undefined;
    this.center = group.center
      ? { id: group.center.id, name: group.center.name }
      : undefined;
    this.staff = group.staff
      ? {
        id: group.staff.id,
        firstName: group.staff.firstName,
        lastName: group.staff.lastName,
        office:
        {
          id: group?.staff?.office?.id,
          name: group?.staff?.office?.name,
        }
      }
      : undefined;
    this.meetingDates = {
      week: group.center.meetingDates?.week || null,
      day: group.center.meetingDates?.day || null,
    };
    this.memberCount = group.clients?.length ?? 0;
  }
}

export class GroupSummaryDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  systemName: string;

  @ApiProperty()
  center: any;

  constructor(group: {
    id: string;
    name: string;
    systemName: string;
    center: any;
  }) {
    this.id = group.id;
    this.name = group.name;
    this.systemName = group.systemName;
    this.center = group.center;
  }
}

export class MiniGroupsDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  systemName: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  active: boolean;

  @ApiProperty()
  staffName: string;

  @ApiProperty()
  officeName: string;

  @ApiProperty()
  status: string;

  @ApiProperty({ type: () => MiniUserDto })
  staff: MiniUserDto;

  @ApiProperty({ type: () => MiniUserDto })
  createdBy: MiniUserDto;

  constructor(group: any) {
    this.id = group.id;
    this.createdAt = group.createdAt;
    this.systemName = group.systemName;
    this.name = group.name;
    this.active = group.active;
    this.staffName = group.staffName;
    this.officeName = group.officeName;
    this.status = group.status.name;
    this.staff = new MiniUserDto(group.staff);
    this.createdBy = new MiniUserDto(group.createdBy);
  }
}

export class MiniGroupDtoListResponseDto extends PageResponseDto<MiniGroupsDto> {
  @Type(() => MiniGroupsDto)
  data: MiniGroupsDto[];
}

export class CenterResponseDto extends BaseResponseDto<MiniGroupsDto> {
  @Type(() => MiniGroupsDto)
  data: MiniGroupsDto;
}

import { GroupDto } from './group.dto';
import { BaseResponseDto } from 'src/common/dtos';
import { Type } from 'class-transformer';

export class GroupResponseDto extends BaseResponseDto<GroupDto> {
  @Type(() => GroupDto)
  data: GroupDto;

  constructor(group: any) {
    super();
    this.data = new GroupDto(group);
  }
}

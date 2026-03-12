import { Type } from 'class-transformer';
import { PageResponseDto } from 'src/common/dtos/page-response.dto';
import { GroupDto } from './group.dto';

export class GroupsResponseDto extends PageResponseDto<GroupDto> {
  @Type(() => GroupDto)
  data: GroupDto[];
}
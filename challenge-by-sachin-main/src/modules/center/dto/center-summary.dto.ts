import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { BaseResponseDto } from 'src/common/dtos';

export class CenterSummaryDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  totalClients: number;

  @ApiProperty()
  totalGroups: number;

  @ApiProperty()
  ungroupedClients: number;

  @ApiProperty()
  groupedClients: number;

  constructor(center: any) {
    this.id = center.id;
    this.totalClients = center.totalClients;
    this.totalGroups = center.totalGroups;
    this.ungroupedClients = center.ungroupedClients;
    this.groupedClients = center.groupedClients;
  }
}

export class CenterSummaryResponseDto extends BaseResponseDto<CenterSummaryDto> {
  @Type(() => CenterSummaryDto)
  data: CenterSummaryDto;
}

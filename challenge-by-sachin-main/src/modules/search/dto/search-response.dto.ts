import { ApiProperty } from '@nestjs/swagger';
import { MiniClientDto } from '../../client/dto/client.dto';

export class SearchResultDto<T> {
  @ApiProperty({ description: 'Number of results found' })
  count: number;

  @ApiProperty({ description: 'Array of search results' })
  data: T[];

  constructor(count: number, data: T[]) {
    this.count = count;
    this.data = data;
  }
}

export class SearchResponseDto {
  @ApiProperty({
    type: () => SearchResultDto,
    description: 'Centers search results',
  })
  centers: SearchResultDto<{ id: string; name: string }>;

  @ApiProperty({
    type: () => SearchResultDto,
    description: 'Groups search results',
  })
  groups: SearchResultDto<{ id: string; name: string }>;

  @ApiProperty({
    type: () => SearchResultDto,
    description: 'Staff search results',
  })
  staff: SearchResultDto<{ id: string; name: string }>;

  @ApiProperty({
    type: () => SearchResultDto,
    description: 'Clients search results',
  })
  client: SearchResultDto<{ id: string; firstName: string; nationalIdNumber: string }>;

  @ApiProperty({ description: 'Total count across all entity types' })
  totalCount: number;

  @ApiProperty({ description: 'Search query used' })
  searchQuery: string;

  // @ApiProperty({ description: 'Time taken for search in milliseconds' })
  // searchTime: number;

  constructor(
    centers: SearchResultDto<{ id: string; name: string }>,
    groups: SearchResultDto<{ id: string; name: string }>,
    staff: SearchResultDto<{ id: string; name: string }>,
  client: SearchResultDto<{ id: string; firstName: string; nationalIdNumber: string }>,
    searchQuery: string,
    // searchTime: number,
  ) {
    this.centers = centers;
    this.groups = groups;
    this.staff = staff;
    this.client = client;
    this.totalCount = centers.count + groups.count + staff.count + client.count;
    this.searchQuery = searchQuery;
    // this.searchTime = searchTime;
  }
}
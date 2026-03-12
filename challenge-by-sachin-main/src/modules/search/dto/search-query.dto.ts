import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min, MinLength } from 'class-validator';
import { Type } from 'class-transformer';
import { Order } from 'src/constants';

export enum SearchEntityType {
  ALL = 'all',
  CENTERS = 'centers',
  GROUPS = 'groups',
  STAFF = 'staff',
  CLIENT = 'clients',
}

export class SearchQueryDto {
  @ApiProperty({
    description: 'Search query text (minimum 3 characters)',
    example: 'John Doe',
    minLength: 3,
  })
  @IsString()
  @MinLength(3, { message: 'Search query must be at least 3 characters long' })
  readonly query: string;

  @ApiPropertyOptional({
    enum: SearchEntityType,
    default: SearchEntityType.ALL,
    description: 'Type of entities to search',
  })
  @IsEnum(SearchEntityType)
  @IsOptional()
  readonly entityType?: SearchEntityType = SearchEntityType.ALL;

  @ApiPropertyOptional({
    enum: Order,
    default: Order.DESC,
    description: 'Sort order for results',
  })
  @IsEnum(Order)
  @IsOptional()
  readonly order?: Order = Order.DESC;

  @ApiPropertyOptional({
    minimum: 1,
    default: 1,
    description: 'Page number',
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  readonly page?: number = 1;

  @ApiPropertyOptional({
    minimum: 1,
    maximum: 100,
    default: 20,
    description: 'Number of results per page',
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  readonly take?: number = 20;

  get skip(): number {
    return (this.page - 1) * this.take;
  }
}
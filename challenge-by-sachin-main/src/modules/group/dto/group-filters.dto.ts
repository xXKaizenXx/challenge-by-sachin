import { IsOptional, IsString } from 'class-validator';

export class GroupFiltersDto {
  @IsString()
  @IsOptional()
  searchTerm?: string;

  @IsString()
  @IsOptional()
  status?: string;
}

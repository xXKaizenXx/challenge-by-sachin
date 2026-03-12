import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum } from 'class-validator';
import { PageOptionsDto } from '../../../common/dtos/page-options.dto';
import { GroupPackageStatus } from '../entities/group-package.entity';

export class GroupPackageFilterDto extends PageOptionsDto {
  @ApiPropertyOptional({
    description: 'Filter group packages by status',
    type: String,
  })
  @IsEnum(GroupPackageStatus)
  @IsOptional()
  status?: GroupPackageStatus;

  @ApiPropertyOptional({
    description: 'Filter group packages by centerId',
    type: String,
  })
  @IsString()
  @IsOptional()
  centerId?: string;

  @ApiPropertyOptional({
    description: 'Filter group packages by groupId',
    type: String,
  })
  @IsString()
  @IsOptional()
  groupId?: string;
}

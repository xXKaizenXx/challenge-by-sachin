import { IsOptional, IsString, IsUUID, IsArray, IsEnum } from 'class-validator';
import { GroupPackageStatus } from '../entities/group-package.entity';

export class UpdateGroupPackageDto {
  @IsOptional()
  @IsString()
  groupName?: string;

  @IsOptional()
  @IsEnum(GroupPackageStatus)
  status?: GroupPackageStatus;

  @IsOptional()
  @IsString()
  approvedBy?: string;

  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  loanIds?: string[];
}

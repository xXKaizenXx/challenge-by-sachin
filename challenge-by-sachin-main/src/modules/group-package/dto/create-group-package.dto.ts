import { IsString, IsUUID, IsArray } from 'class-validator';
import { CreateLoanDto } from 'src/modules/loan/dto';

export class CreateGroupPackageDto {
  @IsUUID()
  groupId: string;

  @IsString()
  groupName: string;

  @IsUUID()
  userId: string;

  @IsString()
  username: string;

  @IsArray()
  @IsUUID('all', { each: true })
  loans: CreateLoanDto['clientApplications'];

  @IsUUID()
  officeId: string;
}

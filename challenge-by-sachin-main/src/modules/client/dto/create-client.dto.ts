import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDate,
  IsObject,
  IsUUID,
  IsBoolean,
  IsEmail,
  IsDateString,
} from 'class-validator';
import { DeepPartial } from 'typeorm';
import { Province } from '../entities/client.entity';
import { GroupEntity } from 'src/modules/group/entities/group.entity';

export class CreateClientDto {
  @ApiProperty({ description: 'First name of the client' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiPropertyOptional({ description: 'Middle name of the client' })
  @IsString()
  @IsOptional()
  middleName?: string;

  @ApiProperty({ description: 'Last name of the client' })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({ description: 'Date of birth of the client' })
  @IsDateString()
  @IsNotEmpty()
  dateOfBirth: Date;

  @ApiProperty({ description: 'Address of the client as JSON object' })
  @IsObject()
  @IsNotEmpty()
  address: object;

  @ApiProperty({ description: 'National ID number of the client' })
  @IsString()
  @IsNotEmpty()
  nationalIdNumber: string;

  @ApiProperty({ description: 'Mobile number of the client' })
  @IsString()
  @IsNotEmpty()
  mobileNumber: string;

  @ApiPropertyOptional({ description: 'Email address of the client' })
  @IsEmail()
  @IsOptional()
  emailAddress?: string;

  @ApiPropertyOptional({ description: 'Proof of address file link (will be populated from file upload)' })
  @IsString()
  @IsOptional()
  proofOfAddress?: string;

  @ApiPropertyOptional({ description: 'National ID file link (will be populated from file upload)' })
  @IsString()
  @IsOptional()
  nationalId?: string;

  @ApiPropertyOptional({ description: 'Province ID from province table' })
  @IsUUID()
  province?: string;

  @ApiProperty({ description: 'Gender of the client' })
  gender: string;

  @ApiProperty({ description: 'Bank account number of the client' })
  @IsString()
  @IsNotEmpty()
  bankAccountNumber: string;

  @ApiProperty({ description: 'Bank ID of the client' })
  @IsUUID()
  @IsNotEmpty()
  bankId: string;

  @ApiPropertyOptional({ description: 'Group ID of the client' })
  @IsUUID()
  @IsOptional()
  group?: DeepPartial<GroupEntity>;

  @ApiProperty({ description: 'Center ID of the client' })
  @IsUUID()
  @IsNotEmpty()
  centerId: string;

  @ApiProperty({ description: 'languageId of the client' })
  @IsUUID()
  @IsNotEmpty()
  languageId: string;
}

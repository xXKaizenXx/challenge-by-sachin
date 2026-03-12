import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsObject,
  IsUUID,
  IsBoolean,
  IsEmail,
  IsDateString,
  Length,
  Matches,
  IsNotEmpty,
} from 'class-validator';

export class UpdateClientDto {
  @ApiPropertyOptional({ 
    description: 'First name of the client',
    example: 'John',
    minLength: 1,
    maxLength: 50
  })
  @IsString()
  @IsOptional()
  @Length(1, 50, { message: 'First name must be between 1 and 50 characters' })
  @Matches(/^[a-zA-Z0-9\u00C0-\u017F\s'.-]+$/, { message: 'First name contains invalid characters' })
  firstName?: string;

  @ApiPropertyOptional({ 
    description: 'Middle name of the client',
    example: 'Michael',
    minLength: 1,
    maxLength: 50
  })
  @IsString()
  @IsOptional()
  @Length(1, 50, { message: 'Middle name must be between 1 and 50 characters' })
  @Matches(/^[a-zA-Z0-9\u00C0-\u017F\s'.-]+$/, { message: 'Middle name contains invalid characters' })
  middleName?: string;

  @ApiPropertyOptional({ 
    description: 'Last name of the client',
    example: 'Doe',
    minLength: 1,
    maxLength: 50
  })
  @IsString()
  @IsOptional()
  @Length(1, 50, { message: 'Last name must be between 1 and 50 characters' })
  @Matches(/^[a-zA-Z0-9\u00C0-\u017F\s'.-]+$/, { message: 'Last name contains invalid characters' })
  lastName?: string;

  @ApiPropertyOptional({ description: 'Date of birth of the client' })
  @IsDateString()
  @IsOptional()
  dateOfBirth?: Date;

  @ApiPropertyOptional({ description: 'Address of the client as JSON object' })
  @IsObject()
  @IsOptional()
  address?: object;

  @ApiPropertyOptional({ 
    description: 'Gender of the client',
    example: 'male',
    enum: ['male', 'female', 'other']
  })
  @IsString()
  @IsOptional()
  @Matches(/^(male|female|other)$/i, { message: 'Gender must be either "male", "female", or "other"' })
  gender?: string;

  @ApiPropertyOptional({ 
    description: 'National ID number of the client',
    example: '9001015009087',
    minLength: 10,
    maxLength: 20
  })
  @IsString()
  @IsOptional()
  @Length(10, 20, { message: 'National ID number must be between 10 and 20 characters' })
  @Matches(/^[0-9]+$/, { message: 'National ID number must contain only numbers' })
  nationalIdNumber?: string;

  @ApiPropertyOptional({ 
    description: 'Mobile number of the client',
    example: '0961234567',
    minLength: 8,
    maxLength: 20
  })
  @IsString()
  @IsOptional()
  @Length(8, 20, { message: 'Mobile number must be between 8 and 20 characters' })
  @Matches(/^[+]?[0-9\s\-()]+$/, { message: 'Mobile number format is invalid' })
  mobileNumber?: string;

  @ApiPropertyOptional({ 
    description: 'Email address of the client',
    example: 'client@example.com'
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsOptional()
  emailAddress?: string;

  @ApiPropertyOptional({ 
    description: 'Proof of address file link or upload new file',
    type: 'string',
    format: 'binary'
  })
  @IsString()
  @IsOptional()
  proofOfAddress?: string;

  @ApiPropertyOptional({ 
    description: 'National ID file link or upload new file',
    type: 'string',
    format: 'binary'
  })
  @IsString()
  @IsOptional()
  nationalId?: string;

  @ApiPropertyOptional({ description: 'Whether the client is active' })
  @IsBoolean()
  @IsOptional()
  active?: boolean;

  @ApiPropertyOptional({ description: 'Whether the client is blacklisted' })
  @IsBoolean()
  @IsOptional()
  blacklisted?: boolean;

  @ApiPropertyOptional({ description: 'Province ID of the client' })
  @IsUUID()
  @IsOptional()
  provinceId?: string;

  @ApiPropertyOptional({ description: 'Town ID of the client' })
  @IsUUID()
  @IsOptional()
  townId?: string;
  
  @ApiPropertyOptional({ description: 'Language ID of the client' })
  @IsUUID()
  @IsOptional()
  languageId?: string;

  @ApiPropertyOptional({ description: 'Bank ID of the client' })
  @IsUUID()
  @IsOptional()
  bankId?: string;

  @ApiPropertyOptional({ description: 'Group ID of the client' })
  @IsUUID()
  @IsOptional()
  groupId?: string;

  @ApiPropertyOptional({ description: 'Center ID of the client' })
  @IsUUID()
  @IsOptional()
  centerId?: string;

  @ApiPropertyOptional({ 
    description: 'Bank account number of the client',
    example: '1234567890',
    minLength: 5,
    maxLength: 20
  })
  @IsString()
  @IsOptional()
  @Length(5, 20, { message: 'Bank account number must be between 5 and 20 characters' })
  @Matches(/^[0-9]+$/, { message: 'Bank account number must contain only numbers' })
  bankAccountNumber?: string;

  @ApiPropertyOptional({ description: 'Audit data as JSON object' })
  @IsObject()
  @IsOptional()
  auditData?: object;
}

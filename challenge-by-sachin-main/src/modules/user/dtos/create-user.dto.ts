import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsPhoneNumber,
  IsString,
  MinLength,
} from 'class-validator';
import { Column } from 'typeorm';

import { Trim } from '../../../decorators/transform.decorators';
import { RoleType } from 'src/constants';
import { OfficeEntity } from 'src/modules/office/entities/office.entity';

export class CreateUserDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty({
    message: 'First name is required',
  })
  @Trim()
  readonly firstName: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty({
    message: 'Last name is required',
  })
  @Trim()
  readonly lastName: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty({
    message: 'Username is required',
  })
  @Trim()
  readonly username: string;

  @ApiProperty()
  @IsEmail(
    {},
    {
      message: 'Invalid email address',
    },
  )
  @IsNotEmpty({
    message: 'Email is required',
  })
  readonly email: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty({
    message: 'Office is required',
  })
  readonly office: OfficeEntity;

  @ApiProperty()
  @IsPhoneNumber('ZM', {
    message: 'Invalid phone number',
  })
  readonly phone: string;

  @ApiProperty({
    enum: RoleType,
    description: 'User role',
  })
  @IsString()
  @IsNotEmpty({
    message: 'Role is required',
  })
  readonly role: RoleType;

  @ApiProperty({ minLength: 6 })
  @IsString()
  @MinLength(6, {
    message: 'Password must be at least 6 characters',
  })
  @IsNotEmpty({
    message: 'Password is required',
  })
  readonly password: string;
}

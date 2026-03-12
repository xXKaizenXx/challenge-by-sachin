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

export class UserRegisterDto {
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
  @Column()
  @IsPhoneNumber('ZM', {
    message: 'Invalid phone number',
  })
  phone: string;

  @ApiProperty()
  @Column({ default: RoleType.SUPER_USER, nullable: false })
  @IsString()
  role: RoleType;

  @ApiProperty({ minLength: 6 })
  @IsString()
  @MinLength(6)
  @IsNotEmpty({
    message: 'Password is required',
  })
  readonly password: string;
}

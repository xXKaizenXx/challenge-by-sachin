import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { AbstractDto, BaseResponseDto } from 'src/common/dtos';

import { RoleType } from '../../../constants';

// TODO, remove this class and use constructor's second argument's type

export class UserDto extends AbstractDto {
  @ApiPropertyOptional()
  @Expose()
  firstName?: string;

  @ApiPropertyOptional()
  @Expose()
  lastName?: string;

  @ApiPropertyOptional({ enum: RoleType })
  @Expose()
  role: RoleType;

  @ApiPropertyOptional()
  @Expose()
  email?: string;

  @ApiPropertyOptional()
  @Expose()
  avatar?: string;

  @Expose()
  @ApiProperty()
  token: string;

  @Expose()
  @ApiPropertyOptional()
  office: {
    name: string;
    id: string;
  };

  @ApiPropertyOptional()
  @Expose()
  phone?: string;
  constructor(entity: any) {
    super(entity);
    this.id = entity.id;
    this.firstName = entity.firstName;
    this.lastName = entity.lastName;
    this.role = entity.role;
    this.email = entity.email;
    this.avatar = entity.avatar;
    this.phone = entity.phone;
    this.createdAt = entity.createdAt;
    this.office = entity.office ? {
      id: entity.office.id,
      name: entity.office.name,
    } : undefined;
  }
}

export class UserResponseDto extends BaseResponseDto<UserDto> {
  @Type(() => UserDto)
  data: UserDto;
}
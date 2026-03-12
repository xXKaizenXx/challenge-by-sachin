import { ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { AbstractDto, BaseResponseDto } from 'src/common/dtos';
import { OfficeEntity } from '../entities/office.entity';

export class ParentDto {
  @ApiPropertyOptional()
  @Expose()
  parentId: string;

  @ApiPropertyOptional()
  @Expose()
  parentName: string;

  constructor(entity: any) {
    this.parentId = entity.id;
    this.parentName = entity.name;
  }
}

export class OfficeDto extends AbstractDto {
  @ApiPropertyOptional()
  @Expose()
  name: string;

  @ApiPropertyOptional()
  @Expose()
  nameDecorated: string;

  @ApiPropertyOptional()
  @Expose()
  externalId: string;

  @ApiPropertyOptional()
  @Expose()
  openingDate: Date;

  @ApiPropertyOptional()
  @Expose()
  parentId: string;

  @ApiPropertyOptional()
  @Expose()
  parentName: string;

  constructor(entity: any) {
    console.log('entity passed', entity);

    super(entity);
    this.id = entity.id;
    this.openingDate = entity.openingDate;
    this.name = entity.name;
    this.parentId = entity?.parent?.id;
    this.parentName = entity?.parent?.name;
  }
}

export class OfficeResponseDto extends BaseResponseDto<OfficeDto> {
  @Type(() => OfficeDto)
  data: OfficeDto;
}

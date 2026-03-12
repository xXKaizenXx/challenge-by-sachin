import { ApiProperty } from '@nestjs/swagger';
import { AbstractDto } from '../../../common/dtos/abstract.dto';

export class StatusDto extends AbstractDto {
  @ApiProperty()
  name: string;

  constructor(status: any) {
    super(status);
    this.id = status.id;
    this.name = status.name;
    this.createdAt = status.createdAt;
    this.updatedAt = status.updatedAt;
  }
}

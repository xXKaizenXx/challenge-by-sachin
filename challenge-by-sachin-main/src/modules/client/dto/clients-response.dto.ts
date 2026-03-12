import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { PageResponseDto } from '../../../common/dtos/page-response.dto';
import { ClientDto } from './client.dto';

export class ClientsResponseDto extends PageResponseDto<ClientDto> {
  @ApiProperty({ type: [ClientDto] })
  @Type(() => ClientDto)
  data: ClientDto[];
}

import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { BaseResponseDto } from '../../../common/dtos/base-response.dto';
import { ClientDto } from './client.dto';

export class ClientResponseDto extends BaseResponseDto<ClientDto> {
  @ApiProperty({ type: ClientDto })
  @Type(() => ClientDto)
  data: ClientDto;
}

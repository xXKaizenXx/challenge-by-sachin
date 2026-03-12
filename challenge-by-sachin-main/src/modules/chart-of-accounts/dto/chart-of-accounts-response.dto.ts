import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { BaseResponseDto } from '../../../common/dtos/base-response.dto';
import { ChartOfAccountsDto } from './chart-of-accounts.dto';

export class ChartOfAccountsResponseDto extends BaseResponseDto<ChartOfAccountsDto> {
  @Type(() => ChartOfAccountsDto)
  @ApiProperty({ type: ChartOfAccountsDto })
  data: ChartOfAccountsDto;
}

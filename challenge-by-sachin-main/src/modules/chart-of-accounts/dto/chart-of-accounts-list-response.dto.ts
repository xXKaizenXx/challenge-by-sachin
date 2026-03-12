import { Type } from 'class-transformer';
import { PageResponseDto } from '../../../common/dtos/page-response.dto';
import { ChartOfAccountsDto } from './chart-of-accounts.dto';

export class ChartOfAccountsListResponseDto extends PageResponseDto<ChartOfAccountsDto> {
  @Type(() => ChartOfAccountsDto)
  data: ChartOfAccountsDto[];
}

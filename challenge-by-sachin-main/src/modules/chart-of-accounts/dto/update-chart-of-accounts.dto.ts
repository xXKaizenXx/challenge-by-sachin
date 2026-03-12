import { PartialType } from '@nestjs/swagger';
import { CreateChartOfAccountsDto } from './create-chart-of-accounts.dto';

export class UpdateChartOfAccountsDto extends PartialType(
  CreateChartOfAccountsDto,
) {}

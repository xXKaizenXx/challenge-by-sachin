import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { PageResponseDto } from '../../../common/dtos/page-response.dto';
import { LoanTransactionDto } from './loan-transaction.dto';

export class LoanTransactionsResponseDto extends PageResponseDto<LoanTransactionDto> {
  @ApiProperty({ type: [LoanTransactionDto] })
  @Type(() => LoanTransactionDto)
  data: LoanTransactionDto[];
}

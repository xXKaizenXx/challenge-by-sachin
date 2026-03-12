import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { BaseResponseDto } from '../../../common/dtos/base-response.dto';
import { LoanTransactionDto } from './loan-transaction.dto';

export class LoanTransactionResponseDto extends BaseResponseDto<LoanTransactionDto> {
  @ApiProperty({ type: LoanTransactionDto })
  @Type(() => LoanTransactionDto)
  data: LoanTransactionDto;
}

import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { PageResponseDto } from '../../../common/dtos/page-response.dto';
import { LoanDto } from './loan.dto';

export class LoansResponseDto extends PageResponseDto<LoanDto> {
  @ApiProperty({ type: [LoanDto] })
  @Type(() => LoanDto)
  data: LoanDto[];

  @ApiProperty({ type: Number, required: false })
  itemCount?: number;
}

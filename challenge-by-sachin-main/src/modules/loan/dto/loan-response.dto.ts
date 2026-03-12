import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { BaseResponseDto } from '../../../common/dtos/base-response.dto';
import { LoanDto } from './loan.dto';

export class LoanResponseDto extends BaseResponseDto<LoanDto> {
  @ApiProperty({ type: LoanDto })
  @Type(() => LoanDto)
  data: LoanDto;
}

import { BaseResponseDto } from '../../../common/dtos/base-response.dto';
import { CenterDto } from './center.dto';

export class CenterResponseDto extends BaseResponseDto<CenterDto> {
  static fromCenter(center: CenterDto | null, message = ''): CenterResponseDto {
    return BaseResponseDto.from(center, !!center, message) as CenterResponseDto;
  }
}

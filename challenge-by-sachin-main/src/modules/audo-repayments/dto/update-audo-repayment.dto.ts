import { PartialType } from '@nestjs/mapped-types';
import { CreateAudoRepaymentDto } from './create-audo-repayment.dto';

export class UpdateAudoRepaymentDto extends PartialType(CreateAudoRepaymentDto) {}

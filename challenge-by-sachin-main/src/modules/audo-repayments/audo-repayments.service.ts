import { Injectable } from '@nestjs/common';
import { CreateAudoRepaymentDto } from './dto/create-audo-repayment.dto';
import { UpdateAudoRepaymentDto } from './dto/update-audo-repayment.dto';

@Injectable()
export class AudoRepaymentsService {
  create(createAudoRepaymentDto: CreateAudoRepaymentDto) {
    return 'This action adds a new audoRepayment';
  }

  findAll() {
    return `This action returns all audoRepayments`;
  }

  findOne(id: number) {
    return `This action returns a #${id} audoRepayment`;
  }

  update(id: number, updateAudoRepaymentDto: UpdateAudoRepaymentDto) {
    return `This action updates a #${id} audoRepayment`;
  }

  remove(id: number) {
    return `This action removes a #${id} audoRepayment`;
  }
}

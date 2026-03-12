import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LoanTable } from './entities/loan-table.entity';
import { LoanTableDto } from './dto/loan-table.dto';

@Injectable()
export class LoanTableService {
  constructor(
    @InjectRepository(LoanTable)
    private readonly loanTableRepository: Repository<LoanTable>,
  ) {}

  async findAll(): Promise<LoanTableDto[]> {
    const records = await this.loanTableRepository.find();
    return records.map((entity) => new LoanTableDto(entity));
  }

  async findOne(id: string): Promise<LoanTableDto> {
    const entity = await this.loanTableRepository.findOne({ where: { id } });
    if (!entity) {
      throw new NotFoundException('LoanTable record not found');
    }
    return new LoanTableDto(entity);
  }
}

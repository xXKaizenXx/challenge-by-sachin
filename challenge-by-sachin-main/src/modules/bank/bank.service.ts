import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { PageMetaDto } from 'src/common/dtos/page-meta.dto';
import { PageOptionsDto } from 'src/common/dtos/page-options.dto';
import { CreateBankDto } from './dto/create-bank.dto';
import { UpdateBankDto } from './dto/update-bank.dto';
import { BankEntity } from './entities/bank.entity';

@Injectable()
export class BankService {
  constructor(
    @InjectRepository(BankEntity)
    private bankRepository: Repository<BankEntity>,
  ) { }

  async create(createBankDto: CreateBankDto): Promise<BankEntity> {
    const bank = this.bankRepository.create(createBankDto);
    return await this.bankRepository.save(bank);
  }

  async findAll(pageOptionsDto: PageOptionsDto) {
    const queryBuilder = this.bankRepository.createQueryBuilder('bank');

    queryBuilder
      .orderBy('bank.createdAt', pageOptionsDto.order)
      .skip(pageOptionsDto.skip)
      .take(pageOptionsDto.take);

    const itemCount = await queryBuilder.getCount();
    const entities = await queryBuilder.getMany();

    const pageMetaDto = new PageMetaDto({ itemCount, pageOptionsDto });

    return { data: entities, meta: pageMetaDto };
  }

  async findOne(id: string): Promise<BankEntity> {
    const bank = await this.bankRepository.findOne({ where: { id } });
    if (!bank) {
      throw new NotFoundException(`Bank with ID ${id} not found`);
    }
    return bank;
  }

  async update(id: string, updateBankDto: UpdateBankDto): Promise<BankEntity> {
    const bank = await this.findOne(id);
    Object.assign(bank, updateBankDto);
    return await this.bankRepository.save(bank);
  }

  async remove(id: string): Promise<void> {
    await this.bankRepository.delete(id);
  }
  
  async softDelete(id: string): Promise<void> {
    await this.bankRepository.softDelete(id);
  }

  async restore(id: string): Promise<void> {
    await this.bankRepository.restore(id);
  }


async findDeleted(pageOptionsDto: PageOptionsDto): Promise<{ data: BankEntity[]; meta: PageMetaDto }> {
  const queryBuilder = this.bankRepository.createQueryBuilder('bank')
    .withDeleted()
    .where('bank.deletedAt IS NOT NULL')
    .orderBy('bank.createdAt', pageOptionsDto.order ?? 'DESC')
    .skip(pageOptionsDto.skip)
    .take(pageOptionsDto.take);

  const [data, itemCount] = await queryBuilder.getManyAndCount();
  const meta = new PageMetaDto({ itemCount, pageOptionsDto });
  return { data, meta };
  }
}

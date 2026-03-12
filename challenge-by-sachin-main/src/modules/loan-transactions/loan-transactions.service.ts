import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { LoanTransactionEntity } from './entities/loan-transaction.entity';
import { CreateLoanTransactionDto } from './dto/create-loan-transaction.dto';
import { UpdateLoanTransactionDto } from './dto/update-loan-transaction.dto';
import { PageOptionsDto } from 'src/common/dtos/page-options.dto';

@Injectable()
export class LoanTransactionsService {
  constructor(
    @InjectRepository(LoanTransactionEntity)
    private loanTransactionRepository: Repository<LoanTransactionEntity>,
  ) { }

  async create(
    createDto: CreateLoanTransactionDto,
  ): Promise<LoanTransactionEntity> {
    const entity = this.loanTransactionRepository.create(createDto);
    return this.loanTransactionRepository.save(entity);
  }

  async findAll(
    pageOptionsDto: PageOptionsDto,
    filters: any = {},
  ): Promise<[number, LoanTransactionEntity[]]> {
    const queryBuilder =
      this.loanTransactionRepository.createQueryBuilder('tx');

    // Apply filters dynamically
    if (filters.loanId) {
      queryBuilder.andWhere('tx.loanId = :loanId', { loanId: filters.loanId });
    }
    if (filters.scheduleId) {
      queryBuilder.andWhere('tx.scheduleId = :scheduleId', {
        scheduleId: filters.scheduleId,
      });
    }
    if (filters.transactionType) {
      queryBuilder.andWhere('tx.transactionType = :transactionType', {
        transactionType: filters.transactionType,
      });
    }
    if (filters.transactionDate) {
      queryBuilder.andWhere('tx.transactionDate = :transactionDate', {
        transactionDate: filters.transactionDate,
      });
    }
    if (filters.paymentMethod) {
      queryBuilder.andWhere('tx.paymentMethod = :paymentMethod', {
        paymentMethod: filters.paymentMethod,
      });
    }
    if (filters.receiptNumber) {
      queryBuilder.andWhere('tx.receiptNumber = :receiptNumber', {
        receiptNumber: filters.receiptNumber,
      });
    }
    if (filters.collectedBy) {
      queryBuilder.andWhere('tx.collectedBy = :collectedBy', {
        collectedBy: filters.collectedBy,
      });
    }
    if (filters.reversalRef) {
      queryBuilder.andWhere('tx.reversalRef = :reversalRef', {
        reversalRef: filters.reversalRef,
      });
    }
    if (filters.amountMin) {
      queryBuilder.andWhere('tx.amount >= :amountMin', {
        amountMin: filters.amountMin,
      });
    }
    if (filters.amountMax) {
      queryBuilder.andWhere('tx.amount <= :amountMax', {
        amountMax: filters.amountMax,
      });
    }
    if (filters.dateFrom) {
      queryBuilder.andWhere('tx.transactionDate >= :dateFrom', {
        dateFrom: filters.dateFrom,
      });
    }
    if (filters.dateTo) {
      queryBuilder.andWhere('tx.transactionDate <= :dateTo', {
        dateTo: filters.dateTo,
      });
    }

    queryBuilder
      .orderBy('tx.createdAt', pageOptionsDto.order)
      .skip(pageOptionsDto.skip)
      .take(pageOptionsDto.take);

    const [data, itemCount] = await queryBuilder.getManyAndCount();
    return [itemCount, data];
  }

  async findOne(id: string): Promise<LoanTransactionEntity> {
    const entity = await this.loanTransactionRepository.findOne({
      where: { id },
    });
    if (!entity) throw new NotFoundException('Loan transaction not found');
    return entity;
  }

  async update(
    id: string,
    updateDto: UpdateLoanTransactionDto,
  ): Promise<LoanTransactionEntity> {
    const entity = await this.findOne(id);
    Object.assign(entity, updateDto);
    return this.loanTransactionRepository.save(entity);
  }

  async remove(id: string): Promise<void> {
    await this.loanTransactionRepository.delete(id);
  }

  async softDelete(id: string): Promise<void> {
    await this.loanTransactionRepository.softDelete(id);
  }

  async restore(id: string): Promise<void> {
    await this.loanTransactionRepository.restore(id);
  }

  async findDeleted(pageOptionsDto: any): Promise<{ data: LoanTransactionEntity[]; meta: any }> {
    const queryBuilder = this.loanTransactionRepository.createQueryBuilder('tx')
      .withDeleted()
      .where('tx.deletedAt IS NOT NULL')
      .orderBy('tx.createdAt', pageOptionsDto.order ?? 'DESC')
      .skip(pageOptionsDto.skip)
      .take(pageOptionsDto.take);

    const [data, itemCount] = await queryBuilder.getManyAndCount();
    const meta = { itemCount, pageOptionsDto };
    return { data, meta };
  }
}

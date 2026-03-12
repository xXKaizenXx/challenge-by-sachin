import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { AccrualEntity } from './entities/accrual.entity';
import { CreateAccrualDto } from './dto/create-accrual.dto';
import { UpdateAccrualDto } from './dto/update-accrual.dto';
import { AccrualStatus } from '../../constants/accrual-status';

@Injectable()
export class AccrualsService {
  constructor(
    @InjectRepository(AccrualEntity)
    private readonly accrualRepository: Repository<AccrualEntity>,
  ) { }

  async create(createDto: CreateAccrualDto): Promise<AccrualEntity> {
    const entity = this.accrualRepository.create(createDto);
    return this.accrualRepository.save(entity);
  }

  async findAll(filters: any = {}): Promise<AccrualEntity[]> {
    const query = this.accrualRepository
      .createQueryBuilder('accrual')
      .leftJoinAndSelect('accrual.loan', 'loan')
      .leftJoinAndSelect('accrual.schedule', 'schedule');

    if (filters.loanId) {
      query.andWhere('accrual.loanId = :loanId', { loanId: filters.loanId });
    }
    if (filters.scheduleId) {
      query.andWhere('accrual.scheduleId = :scheduleId', {
        scheduleId: filters.scheduleId,
      });
    }
    if (filters.status) {
      query.andWhere('accrual.status = :status', { status: filters.status });
    }
    if (filters.accrualDateFrom) {
      query.andWhere('accrual.accrualDate >= :accrualDateFrom', {
        accrualDateFrom: filters.accrualDateFrom,
      });
    }
    if (filters.accrualDateTo) {
      query.andWhere('accrual.accrualDate <= :accrualDateTo', {
        accrualDateTo: filters.accrualDateTo,
      });
    }
    if (filters.glPosted !== undefined) {
      query.andWhere('accrual.glPosted = :glPosted', {
        glPosted: filters.glPosted,
      });
    }

    return query.getMany();
  }

  async findOne(id: string): Promise<AccrualEntity> {
    const entity = await this.accrualRepository.findOne({
      where: { id },
      relations: ['loan', 'schedule'],
    });
    if (!entity) {
      throw new NotFoundException('Accrual not found');
    }
    return entity;
  }

  async update(
    id: string,
    updateDto: UpdateAccrualDto,
  ): Promise<AccrualEntity> {
    const entity = await this.findOne(id);
    Object.assign(entity, updateDto);
    return this.accrualRepository.save(entity);
  }

  async remove(id: string): Promise<void> {
    await this.accrualRepository.delete(id);
  }

  async softDelete(id: string): Promise<void> {
    await this.accrualRepository.softDelete(id);
  }

  async restore(id: string): Promise<void> {
    await this.accrualRepository.restore(id);
  }


async findDeleted(pageOptionsDto: any): Promise<{ data: AccrualEntity[]; meta: any }> {
  const queryBuilder = this.accrualRepository.createQueryBuilder('accrual')
    .withDeleted()
    .where('accrual.deletedAt IS NOT NULL')
    .orderBy('accrual.createdAt', pageOptionsDto.order ?? 'DESC')
    .skip(pageOptionsDto.skip)
    .take(pageOptionsDto.take);

  const [data, itemCount] = await queryBuilder.getManyAndCount();
  // You should use PageMetaDto here if available
  const meta = { itemCount, pageOptionsDto };
  return { data, meta };
  }
  async findByLoanId(loanId: string): Promise<AccrualEntity[]> {
    return this.accrualRepository.find({
      where: { loanId },
      relations: ['loan', 'schedule'],
      order: { accrualDate: 'DESC' },
    });
  }

  async findByScheduleId(scheduleId: string): Promise<AccrualEntity[]> {
    return this.accrualRepository.find({
      where: { scheduleId },
      relations: ['loan', 'schedule'],
      order: { accrualDate: 'DESC' },
    });
  }

  async findByDateRange(
    fromDate: Date,
    toDate: Date,
    status?: AccrualStatus,
  ): Promise<AccrualEntity[]> {
    const query = this.accrualRepository
      .createQueryBuilder('accrual')
      .leftJoinAndSelect('accrual.loan', 'loan')
      .leftJoinAndSelect('accrual.schedule', 'schedule')
      .where('accrual.accrualDate >= :fromDate', { fromDate })
      .andWhere('accrual.accrualDate <= :toDate', { toDate });

    if (status) {
      query.andWhere('accrual.status = :status', { status });
    }

    return query.getMany();
  }

  async markAsPosted(id: string, glReference?: string): Promise<AccrualEntity> {
    const entity = await this.findOne(id);
    entity.status = AccrualStatus.POSTED;
    entity.glPosted = true;
    if (glReference) {
      entity.glReference = glReference;
    }
    return this.accrualRepository.save(entity);
  }

  async reverse(id: string): Promise<AccrualEntity> {
    const entity = await this.findOne(id);
    entity.status = AccrualStatus.REVERSED;
    return this.accrualRepository.save(entity);
  }
}

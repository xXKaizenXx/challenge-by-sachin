import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { LoanScheduleEntity } from './entities/loan-schedule.entity';
import { CreateLoanScheduleDto } from './dto/create-loan-schedule.dto';
import { UpdateLoanScheduleDto } from './dto/update-loan-schedule.dto';
import { LoanScheduleStatus } from '../../constants/loan-schedule-status';

@Injectable()
export class LoanScheduleService {
  constructor(
    @InjectRepository(LoanScheduleEntity)
    private readonly loanScheduleRepository: Repository<LoanScheduleEntity>,
  ) { }

  async create(createDto: CreateLoanScheduleDto): Promise<LoanScheduleEntity> {
    // Resolve staffId, centerId, officeId from LoanEntity
    const { groupPackage, loanId, ...rest } = createDto;
    // Fetch loan
    const loanRepo = this.loanScheduleRepository.manager.getRepository('LoanEntity');
    const loan = await loanRepo.findOne({ where: { id: loanId } });
    if (!loan) throw new Error('Loan not found');
    const entity = this.loanScheduleRepository.create({
      ...rest,
      loanId,
      staffId: loan.staffId,
      centerId: loan.centerId, // Assuming groupId is centerId, adjust if needed
      officeId: loan.officeId,
      groupPackage: { id: groupPackage },
    });
    return this.loanScheduleRepository.save(entity);
  }

  async findAll(filters: any = {}): Promise<LoanScheduleEntity[]> {
    const query = this.loanScheduleRepository.createQueryBuilder('schedule');
    if (filters.loanId)
      query.andWhere('schedule.loanId = :loanId', { loanId: filters.loanId });
    if (filters.status)
      query.andWhere('schedule.status = :status', { status: filters.status });
    if (filters.dueDateFrom)
      query.andWhere('schedule.dueDate >= :dueDateFrom', {
        dueDateFrom: filters.dueDateFrom,
      });
    if (filters.dueDateTo)
      query.andWhere('schedule.dueDate <= :dueDateTo', {
        dueDateTo: filters.dueDateTo,
      });
    if (filters.installmentNumber)
      query.andWhere('schedule.installmentNumber = :installmentNumber', {
        installmentNumber: filters.installmentNumber,
      });
    if (filters.skip !== undefined) query.skip(filters.skip);
    if (filters.take !== undefined) query.take(filters.take);
    if (filters.order) query.orderBy('schedule.createdAt', filters.order);
    return await query.getMany();
  }

  async findOne(id: string): Promise<LoanScheduleEntity> {
    const entity = await this.loanScheduleRepository.findOne({ where: { id } });
    if (!entity) throw new NotFoundException('Loan schedule not found');
    return entity;
  }

  async update(
    id: string,
    updateDto: Partial<LoanScheduleEntity>,
  ): Promise<LoanScheduleEntity> {
    const entity = await this.findOne(id);
    Object.assign(entity, updateDto);
    return this.loanScheduleRepository.save(entity);
  }

  async remove(id: string): Promise<void> {
    await this.loanScheduleRepository.delete(id);
  }

  async softDelete(id: string): Promise<void> {
    await this.loanScheduleRepository.softDelete(id);
  }

  async restore(id: string): Promise<void> {
    await this.loanScheduleRepository.restore(id);
  }

  async findDeleted(pageOptionsDto: any): Promise<{ data: LoanScheduleEntity[]; meta: any }> {
    const queryBuilder = this.loanScheduleRepository.createQueryBuilder('schedule')
      .withDeleted()
      .where('schedule.deletedAt IS NOT NULL')
      .orderBy('schedule.createdAt', pageOptionsDto.order ?? 'DESC')
      .skip(pageOptionsDto.skip)
      .take(pageOptionsDto.take);

    const [data, itemCount] = await queryBuilder.getManyAndCount();
    const meta = { itemCount, pageOptionsDto };
    return { data, meta };
  }
}

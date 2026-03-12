import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { CenterMeetingDates } from './entities/center-meeting-dates.entity';
import { PageOptionsDto, PageMetaDto } from 'src/common/dtos';
import { CreateCenterMeetingDatesDto } from './dto/create-center-meeting-dates.dto';
import { UpdateCenterMeetingDatesDto } from './dto/update-center-meeting-dates.dto';

@Injectable()
export class CenterMeetingDatesService {
  constructor(
    @InjectRepository(CenterMeetingDates)
    private readonly centerMeetingDatesRepository: Repository<CenterMeetingDates>,
  ) {}

  async create(dto: CreateCenterMeetingDatesDto): Promise<CenterMeetingDates> {
    const entity = this.centerMeetingDatesRepository.create(dto);
    return this.centerMeetingDatesRepository.save(entity);
  }

  async findAll(): Promise<CenterMeetingDates[]> {
    return this.centerMeetingDatesRepository.find();
  }

  async findOne(id: string): Promise<CenterMeetingDates | null> {
    return this.centerMeetingDatesRepository.findOne({ where: { id } });
  }

  async update(
    id: string,
    dto: UpdateCenterMeetingDatesDto,
  ): Promise<CenterMeetingDates> {
    await this.centerMeetingDatesRepository.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.centerMeetingDatesRepository.delete(id);
  }
  async softDeleted(id: string): Promise<void> {
    await this.centerMeetingDatesRepository.softDelete(id);
  }

    async restore(id: string): Promise<void> {
      await this.centerMeetingDatesRepository.restore(id);
    }

    async findDeleted(pageOptionsDto: PageOptionsDto): Promise<{ data: CenterMeetingDates[]; meta: PageMetaDto }> {
      const queryBuilder = this.centerMeetingDatesRepository.createQueryBuilder('centerMeetingDates')
        .withDeleted()
        .where('centerMeetingDates.deletedAt IS NOT NULL')
        .orderBy('centerMeetingDates.createdAt', pageOptionsDto.order)
        .skip(pageOptionsDto.skip)
        .take(pageOptionsDto.take);

      const result = await queryBuilder.getMany();
      const meta = new PageMetaDto({ pageOptionsDto, itemCount: result.length });
      return { data: result, meta };
    }
}

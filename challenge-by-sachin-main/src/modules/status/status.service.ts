import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, SelectQueryBuilder, Not } from 'typeorm';
import { PageMetaDto } from 'src/common/dtos/page-meta.dto';
import { PageOptionsDto } from 'src/common/dtos/page-options.dto';
import { CreateStatusDto } from './dto/create-status.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { StatusEntity } from './entities/status.entity';

@Injectable()
export class StatusService {
  constructor(
    @InjectRepository(StatusEntity)
    private statusRepository: Repository<StatusEntity>,
  ) { }

  async create(createStatusDto: CreateStatusDto): Promise<StatusEntity> {
    const status = this.statusRepository.create(createStatusDto);
    return await this.statusRepository.save(status);
  }

  async findAll(pageOptionsDto: PageOptionsDto) {
    const queryBuilder = this.statusRepository.createQueryBuilder('status');

    queryBuilder
      .orderBy('status.createdAt', pageOptionsDto.order)
      .skip(pageOptionsDto.skip)
      .take(pageOptionsDto.take);

    const itemCount = await queryBuilder.getCount();
    const entities = await queryBuilder.getMany();

    const pageMetaDto = new PageMetaDto({ itemCount, pageOptionsDto });

    return { data: entities, meta: pageMetaDto };
  }

  async findOne(id: string): Promise<StatusEntity> {
    const status = await this.statusRepository.findOne({ where: { id } });
    if (!status) {
      throw new NotFoundException(`Status with ID ${id} not found`);
    }
    return status;
  }

  async findByName(name: string): Promise<StatusEntity | null> {
    return await this.statusRepository.findOne({ where: { name } });
  }

  async update(
    id: string,
    updateStatusDto: UpdateStatusDto,
  ): Promise<StatusEntity> {
    const status = await this.findOne(id);
    Object.assign(status, updateStatusDto);
    return await this.statusRepository.save(status);
  }

  async remove(id: string): Promise<void> {
    await this.statusRepository.delete(id);
  }

  async softDelete(id: string): Promise<void> {
    await this.statusRepository.softDelete(id);
  }

  async restore(id: string): Promise<void> {
    await this.statusRepository.restore(id);
  }

  async findDeleted(pageOptionsDto: PageOptionsDto): Promise<{ data: StatusEntity[]; meta: PageMetaDto }> {
    const queryBuilder = this.statusRepository.createQueryBuilder('status')
      .withDeleted()
      .where('status.deletedAt IS NOT NULL')
      .orderBy('status.createdAt', pageOptionsDto.order)
      .skip(pageOptionsDto.skip)
      .take(pageOptionsDto.take);

    const result = await queryBuilder.getMany();
    const meta = new PageMetaDto({ pageOptionsDto, itemCount: result.length });
    return { data: result, meta };
  }
}

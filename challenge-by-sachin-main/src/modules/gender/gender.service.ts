import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { PageMetaDto } from 'src/common/dtos/page-meta.dto';
import { PageOptionsDto } from 'src/common/dtos/page-options.dto';
import { CreateGenderDto } from './dto/create-gender.dto';
import { UpdateGenderDto } from './dto/update-gender.dto';
import { GenderEntity } from './entities/gender.entity';

@Injectable()
export class GenderService {
  constructor(
    @InjectRepository(GenderEntity)
    private genderRepository: Repository<GenderEntity>,
  ) { }

  async create(createGenderDto: CreateGenderDto): Promise<GenderEntity> {
    const gender = this.genderRepository.create(createGenderDto);
    return await this.genderRepository.save(gender);
  }

  async findAll(pageOptionsDto: PageOptionsDto) {
    const queryBuilder = this.genderRepository.createQueryBuilder('gender');

    queryBuilder
      .orderBy('gender.createdAt', pageOptionsDto.order)
      .skip(pageOptionsDto.skip)
      .take(pageOptionsDto.take);

    const itemCount = await queryBuilder.getCount();
    const entities = await queryBuilder.getMany();

    const pageMetaDto = new PageMetaDto({ itemCount, pageOptionsDto });

    return { data: entities, meta: pageMetaDto };
  }

  async findOne(id: string): Promise<GenderEntity> {
    const gender = await this.genderRepository.findOne({ where: { id } });
    if (!gender) {
      throw new NotFoundException(`Gender with ID ${id} not found`);
    }
    return gender;
  }

  async update(
    id: string,
    updateGenderDto: UpdateGenderDto,
  ): Promise<GenderEntity> {
    const gender = await this.findOne(id);
    Object.assign(gender, updateGenderDto);
    return await this.genderRepository.save(gender);
  }

  async softDelete(id: string): Promise<void> {
    await this.genderRepository.softDelete(id);
  }

  async remove(id: string): Promise<void> {
    const gender = await this.findOne(id);
    await this.genderRepository.delete(id);
  }

  async restore(id: string): Promise<void> {
    await this.genderRepository.restore(id);
  }

  async findDeleted(pageOptionsDto: PageOptionsDto): Promise<{ data: GenderEntity[]; meta: PageMetaDto }> {
    const queryBuilder = this.genderRepository.createQueryBuilder('gender')
      .withDeleted()
      .where('gender.deletedAt IS NOT NULL')
      .orderBy('gender.createdAt', pageOptionsDto.order)
      .skip(pageOptionsDto.skip)
      .take(pageOptionsDto.take);

    const result = await queryBuilder.getMany();
    const meta = new PageMetaDto({ pageOptionsDto, itemCount: result.length });
    return { data: result, meta };
  }
}

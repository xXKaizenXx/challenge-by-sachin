import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateProvinceDto } from './dto/create-province.dto';
import { UpdateProvinceDto } from './dto/update-province.dto';
import { Province } from './entities/province.entity';

@Injectable()
export class ProvincesService {
  constructor(
    @InjectRepository(Province)
    private readonly provinceRepository: Repository<Province>,
  ) {}

  async create(createProvinceDto: CreateProvinceDto): Promise<Province> {
    const province = this.provinceRepository.create(createProvinceDto);
    return this.provinceRepository.save(province);
  }

  async findAll(): Promise<Province[]> {
    return this.provinceRepository.find();
  }

  async findOne(id: string): Promise<Province> {
    return this.provinceRepository.findOneBy({ id });
  }

  async update(
    id: string,
    updateProvinceDto: UpdateProvinceDto,
  ): Promise<Province> {
    await this.provinceRepository.update(id, updateProvinceDto);
    return this.provinceRepository.findOneBy({ id });
  }

  async remove(id: string): Promise<void> {
    await this.provinceRepository.delete(id);
  }
}

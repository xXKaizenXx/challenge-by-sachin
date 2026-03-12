import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateTownDto } from './dto/create-town.dto';
import { UpdateTownDto } from './dto/update-town.dto';
import { Town } from './entities/town.entity';

@Injectable()
export class TownService {
  constructor(
    @InjectRepository(Town)
    private readonly townRepository: Repository<Town>,
  ) {}

  async create(createTownDto: CreateTownDto): Promise<Town> {
    const town = this.townRepository.create(createTownDto);
    return this.townRepository.save(town);
  }

  async findAll(): Promise<Town[]> {
    return this.townRepository.find();
  }

  async findOne(id: string): Promise<Town> {
    return this.townRepository.findOneBy({ id });
  }

  async update(id: string, updateTownDto: UpdateTownDto): Promise<Town> {
    await this.townRepository.update(id, updateTownDto);
    return this.townRepository.findOneBy({ id });
  }

  async remove(id: string): Promise<void> {
    await this.townRepository.delete(id);
  }
}

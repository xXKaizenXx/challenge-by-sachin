import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateLanguageDto } from './dto/create-language.dto';
import { UpdateLanguageDto } from './dto/update-language.dto';
import { Language } from './entities/language.entity';

@Injectable()
export class LanguageService {
  constructor(
    @InjectRepository(Language)
    private readonly languageRepository: Repository<Language>,
  ) {}

  async create(createLanguageDto: CreateLanguageDto): Promise<Language> {
    const language = this.languageRepository.create(createLanguageDto);
    return this.languageRepository.save(language);
  }

  async findAll(): Promise<Language[]> {
    return this.languageRepository.find();
  }

  async findOne(id: string): Promise<Language> {
    return this.languageRepository.findOneBy({ id });
  }

  async update(
    id: string,
    updateLanguageDto: UpdateLanguageDto,
  ): Promise<Language> {
    await this.languageRepository.update(id, updateLanguageDto);
    return this.languageRepository.findOneBy({ id });
  }

  async remove(id: string): Promise<void> {
    await this.languageRepository.delete(id);
  }
}

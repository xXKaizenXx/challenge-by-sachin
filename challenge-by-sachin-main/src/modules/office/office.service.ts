import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateOfficeDto } from './dto/create-office.dto';
import { UpdateOfficeDto } from './dto/update-office.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { OfficeEntity } from './entities/office.entity';
import { DeepPartial, Not, Repository } from 'typeorm';
import { PageOptionsDto, PageMetaDto } from 'src/common/dtos';
import { UserEntity } from '../user/user.entity';
import { checkIfSubmittedIsHeadOffice } from './dto/utils';

@Injectable()
export class OfficeService {
  constructor(
    @InjectRepository(OfficeEntity)
    private officeRepo: Repository<OfficeEntity>,
  ) { }

  async create(createOfficeDto: CreateOfficeDto) {
    const doesHeadOfficeExist = await this.officeRepo.findOne({
      where: { parent: null },
    });

    checkIfSubmittedIsHeadOffice(createOfficeDto, doesHeadOfficeExist);

    const newOffice: DeepPartial<OfficeEntity> = {
      ...createOfficeDto,
    };
    const office = await this.officeRepo.create(newOffice);
    const savedOffice = await this.officeRepo.save(office);

    return await this.findOne(savedOffice.id);
  }

  async findAll(user: UserEntity) {
    if (!user.office?.parent) {
      return await this.officeRepo.find({ relations: ['parent'] });
    }

    const offices = await this.officeRepo
      .createQueryBuilder('offices')
      .innerJoinAndSelect('offices.parent', 'parent')
      .select()
      .where('offices.parentId = :parentId', { parrentId: user.office })
      .getMany();

    return offices;
  }

  async findOne(id: string) {
    return await this.officeRepo.findOne({
      where: { id },
      relations: ['parent'],
    });
  }

  async findOfficesByParent(id: string) {
    const parent = await this.officeRepo.findOne({ where: { id } });
    console.log('PARENTING', parent);

    if (!parent) {
      throw new BadRequestException('Parent not found');
    }

    const offices = await this.officeRepo
      .createQueryBuilder('offices')
      .innerJoinAndSelect('offices.parent', 'parent')
      .where('offices.parent = :parentId', { parentId: id })
      .getMany();

    return offices;
  }

  async update(id: string, updateOfficeDto: UpdateOfficeDto) {
    const office = await this.findOne(id);
    if (!office) {
      throw new NotFoundException('Office with given id not found');
    }
    Object.assign(office, updateOfficeDto);

    const updatedOffice = await this.officeRepo.save(office);
    return updatedOffice;
  }

  async delete(id: string) {
    await this.officeRepo.softDelete(id);
    return { id, deleted: true };
  }


  async softDelete(id: string): Promise<void> {
    await this.officeRepo.softDelete(id);
  }

  async restore(id: string): Promise<void> {
    await this.officeRepo.restore(id);
  }

  async findDeleted(pageOptionsDto: PageOptionsDto): Promise<{ data: OfficeEntity[]; meta: PageMetaDto }> {
      const queryBuilder = this.officeRepo.createQueryBuilder('office')
        .withDeleted()
        .where('office.deletedAt IS NOT NULL')
        .orderBy('office.createdAt', pageOptionsDto.order)
        .skip(pageOptionsDto.skip)
        .take(pageOptionsDto.take);

      const result = await queryBuilder.getMany();
      const meta = new PageMetaDto({ pageOptionsDto, itemCount: result.length });
      return { data: result, meta };
  }
  
  async getAllOfficeIds(): Promise<string[]> {
    const offices = await this.officeRepo.find();
    return offices.map((office) => office.id);
  }
}

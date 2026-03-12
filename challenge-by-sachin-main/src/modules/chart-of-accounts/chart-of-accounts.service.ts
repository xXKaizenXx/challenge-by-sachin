import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, Not } from 'typeorm';
import { PageMetaDto } from '../../common/dtos/page-meta.dto';
import { PageOptionsDto } from '../../common/dtos/page-options.dto';
import { ChartOfAccountsEntity } from './entities/chart-of-accounts.entity';
import { CreateChartOfAccountsDto } from './dto/create-chart-of-accounts.dto';
import { UpdateChartOfAccountsDto } from './dto/update-chart-of-accounts.dto';

@Injectable()
export class ChartOfAccountsService {
  constructor(
    @InjectRepository(ChartOfAccountsEntity)
    private chartOfAccountsRepository: Repository<ChartOfAccountsEntity>,
  ) { }

  async createChartOfAccounts(
    createChartOfAccountsDto: CreateChartOfAccountsDto,
  ): Promise<ChartOfAccountsEntity> {
    const account = this.chartOfAccountsRepository.create(
      createChartOfAccountsDto,
    );
    await this.chartOfAccountsRepository.save(account);
    return account;
  }

  async updateChartOfAccounts(
    id: string,
    updateChartOfAccountsDto: UpdateChartOfAccountsDto,
  ): Promise<ChartOfAccountsEntity> {
    const account = await this.chartOfAccountsRepository.findOneBy({ id });
    if (!account) {
      throw new NotFoundException('Chart of accounts not found');
    }
    Object.assign(account, updateChartOfAccountsDto);
    return this.chartOfAccountsRepository.save(account);
  }

  async getChartOfAccounts(id: string): Promise<ChartOfAccountsEntity> {
    const account = await this.chartOfAccountsRepository.findOne({
      where: { id },
      relations: ['parentAccount', 'childAccounts'],
    });
    if (!account) {
      throw new NotFoundException('Chart of accounts not found');
    }
    return account;
  }

  async deleteChartOfAccounts(id: string): Promise<void> {
    await this.chartOfAccountsRepository.delete(id);
  }

    async softDelete(id: string): Promise<void> {
    await this.chartOfAccountsRepository.softDelete(id);
  }

  async restore(id: string): Promise<void> {
    await this.chartOfAccountsRepository.restore(id);
  }

  async findDeleted(pageOptionsDto: PageOptionsDto): Promise<{ data: ChartOfAccountsEntity[]; meta: PageMetaDto }> {
    const [result, total] = await this.chartOfAccountsRepository.findAndCount({
      withDeleted: true,
      where: { deletedAt: Not(null) },
      skip: pageOptionsDto.skip,
      take: pageOptionsDto.take,
      order: { createdAt: pageOptionsDto.order },
    });
    const meta = new PageMetaDto({ pageOptionsDto, itemCount: total });
    return { data: result, meta };
  }
  async getChartOfAccountsList(
    pageOptionsDto: PageOptionsDto,
  ): Promise<[number, ChartOfAccountsEntity[]]> {
    const queryBuilder =
      this.chartOfAccountsRepository.createQueryBuilder('account');

    // Add relations for hierarchical data
    queryBuilder.leftJoinAndSelect('account.parentAccount', 'parentAccount');
    queryBuilder.leftJoinAndSelect('account.childAccounts', 'childAccounts');

    queryBuilder
      .orderBy('account.accountCode', pageOptionsDto.order)
      .skip(pageOptionsDto.skip)
      .take(pageOptionsDto.take);

    const [data, itemCount] = await queryBuilder.getManyAndCount();
    return [itemCount, data];
  }

  async getChartOfAccountsHierarchy(): Promise<ChartOfAccountsEntity[]> {
    return this.chartOfAccountsRepository.find({
      where: { parentAccountId: null, isActive: true },
      relations: ['childAccounts'],
      order: { accountCode: 'ASC' },
    });
  }

  async getAccountsByType(
    accountType: string,
  ): Promise<ChartOfAccountsEntity[]> {
    return this.chartOfAccountsRepository.find({
      where: { accountType: accountType as any, isActive: true },
      order: { accountCode: 'ASC' },
    });
  }

  async findOne(
    findData: FindOptionsWhere<ChartOfAccountsEntity>,
  ): Promise<ChartOfAccountsEntity | null> {
    return this.chartOfAccountsRepository.findOneBy(findData);
  }

  async save(account: ChartOfAccountsEntity): Promise<ChartOfAccountsEntity> {
    return this.chartOfAccountsRepository.save(account);
  }
}

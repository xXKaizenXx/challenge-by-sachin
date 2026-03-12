import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChartOfAccountsService } from './chart-of-accounts.service';
import {
  ChartOfAccountsEntity,
  AccountType,
} from './entities/chart-of-accounts.entity';
import { CreateChartOfAccountsDto } from './dto/create-chart-of-accounts.dto';
import { UpdateChartOfAccountsDto } from './dto/update-chart-of-accounts.dto';
import { NotFoundException } from '@nestjs/common';

describe('ChartOfAccountsService', () => {
  let service: ChartOfAccountsService;
  let repository: Repository<ChartOfAccountsEntity>;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOneBy: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn(),
    find: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChartOfAccountsService,
        {
          provide: getRepositoryToken(ChartOfAccountsEntity),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<ChartOfAccountsService>(ChartOfAccountsService);
    repository = module.get<Repository<ChartOfAccountsEntity>>(
      getRepositoryToken(ChartOfAccountsEntity),
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createChartOfAccounts', () => {
    it('should create a new chart of accounts', async () => {
      const createDto: CreateChartOfAccountsDto = {
        accountCode: '1001',
        accountName: 'Cash',
        accountType: AccountType.ASSET,
        accountSubtype: 'current_asset',
        isActive: true,
        description: 'Cash on hand',
      };

      const expectedAccount = {
        id: 'test-id',
        ...createDto,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRepository.create.mockReturnValue(expectedAccount);
      mockRepository.save.mockResolvedValue(expectedAccount);

      const result = await service.createChartOfAccounts(createDto);

      expect(mockRepository.create).toHaveBeenCalledWith(createDto);
      expect(mockRepository.save).toHaveBeenCalledWith(expectedAccount);
      expect(result).toEqual(expectedAccount);
    });
  });

  describe('getChartOfAccounts', () => {
    it('should return a chart of accounts by id', async () => {
      const accountId = 'test-id';
      const expectedAccount = {
        id: accountId,
        accountCode: '1001',
        accountName: 'Cash',
        accountType: AccountType.ASSET,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRepository.findOne.mockResolvedValue(expectedAccount);

      const result = await service.getChartOfAccounts(accountId);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: accountId },
        relations: ['parentAccount', 'childAccounts'],
      });
      expect(result).toEqual(expectedAccount);
    });

    it('should throw NotFoundException when account not found', async () => {
      const accountId = 'non-existent-id';

      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.getChartOfAccounts(accountId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateChartOfAccounts', () => {
    it('should update a chart of accounts', async () => {
      const accountId = 'test-id';
      const updateDto: UpdateChartOfAccountsDto = {
        accountName: 'Updated Cash Account',
      };

      const existingAccount = {
        id: accountId,
        accountCode: '1001',
        accountName: 'Cash',
        accountType: AccountType.ASSET,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedAccount = {
        ...existingAccount,
        ...updateDto,
      };

      mockRepository.findOneBy.mockResolvedValue(existingAccount);
      mockRepository.save.mockResolvedValue(updatedAccount);

      const result = await service.updateChartOfAccounts(accountId, updateDto);

      expect(mockRepository.findOneBy).toHaveBeenCalledWith({ id: accountId });
      expect(mockRepository.save).toHaveBeenCalledWith(updatedAccount);
      expect(result).toEqual(updatedAccount);
    });

    it('should throw NotFoundException when account not found', async () => {
      const accountId = 'non-existent-id';
      const updateDto: UpdateChartOfAccountsDto = {
        accountName: 'Updated Cash Account',
      };

      mockRepository.findOneBy.mockResolvedValue(null);

      await expect(
        service.updateChartOfAccounts(accountId, updateDto),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteChartOfAccounts', () => {
    it('should delete a chart of accounts', async () => {
      const accountId = 'test-id';
      const existingAccount = {
        id: accountId,
        accountCode: '1001',
        accountName: 'Cash',
        accountType: AccountType.ASSET,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRepository.findOneBy.mockResolvedValue(existingAccount);
      mockRepository.remove.mockResolvedValue(existingAccount);

      await service.deleteChartOfAccounts(accountId);

      expect(mockRepository.findOneBy).toHaveBeenCalledWith({ id: accountId });
      expect(mockRepository.remove).toHaveBeenCalledWith(existingAccount);
    });

    it('should throw NotFoundException when account not found', async () => {
      const accountId = 'non-existent-id';

      mockRepository.findOneBy.mockResolvedValue(null);

      await expect(service.deleteChartOfAccounts(accountId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});

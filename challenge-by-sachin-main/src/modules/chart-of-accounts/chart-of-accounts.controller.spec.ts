import { Test, TestingModule } from '@nestjs/testing';
import { ChartOfAccountsController } from './chart-of-accounts.controller';
import { ChartOfAccountsService } from './chart-of-accounts.service';
import {
  ChartOfAccountsEntity,
  AccountType,
} from './entities/chart-of-accounts.entity';
import { CreateChartOfAccountsDto } from './dto/create-chart-of-accounts.dto';
import { UpdateChartOfAccountsDto } from './dto/update-chart-of-accounts.dto';
import { NotFoundException } from '@nestjs/common';

describe('ChartOfAccountsController', () => {
  let controller: ChartOfAccountsController;
  let service: ChartOfAccountsService;

  const mockService = {
    createChartOfAccounts: jest.fn(),
    getChartOfAccounts: jest.fn(),
    updateChartOfAccounts: jest.fn(),
    deleteChartOfAccounts: jest.fn(),
    getChartOfAccountsList: jest.fn(),
    getChartOfAccountsHierarchy: jest.fn(),
    getAccountsByType: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChartOfAccountsController],
      providers: [
        {
          provide: ChartOfAccountsService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<ChartOfAccountsController>(
      ChartOfAccountsController,
    );
    service = module.get<ChartOfAccountsService>(ChartOfAccountsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
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

      mockService.createChartOfAccounts.mockResolvedValue(expectedAccount);

      const result = await controller.createChartOfAccounts(createDto);

      expect(mockService.createChartOfAccounts).toHaveBeenCalledWith(createDto);
      expect(result.data).toBeDefined();
      expect(result.message).toBe('Chart of accounts created successfully');
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

      mockService.getChartOfAccounts.mockResolvedValue(expectedAccount);

      const result = await controller.getChartOfAccounts(accountId);

      expect(mockService.getChartOfAccounts).toHaveBeenCalledWith(accountId);
      expect(result.data).toBeDefined();
      expect(result.message).toBe('Chart of accounts retrieved successfully');
    });

    it('should throw NotFoundException when account not found', async () => {
      const accountId = 'non-existent-id';

      mockService.getChartOfAccounts.mockRejectedValue(
        new NotFoundException('Chart of accounts not found'),
      );

      await expect(controller.getChartOfAccounts(accountId)).rejects.toThrow(
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

      const updatedAccount = {
        id: accountId,
        accountCode: '1001',
        accountName: 'Updated Cash Account',
        accountType: AccountType.ASSET,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockService.updateChartOfAccounts.mockResolvedValue(updatedAccount);

      const result = await controller.updateChartOfAccounts(
        accountId,
        updateDto,
      );

      expect(mockService.updateChartOfAccounts).toHaveBeenCalledWith(
        accountId,
        updateDto,
      );
      expect(result.data).toBeDefined();
      expect(result.message).toBe('Chart of accounts updated successfully');
    });
  });

  describe('deleteChartOfAccounts', () => {
    it('should delete a chart of accounts', async () => {
      const accountId = 'test-id';

      mockService.deleteChartOfAccounts.mockResolvedValue(undefined);

      await controller.deleteChartOfAccounts(accountId);

      expect(mockService.deleteChartOfAccounts).toHaveBeenCalledWith(accountId);
    });
  });

  describe('getChartOfAccountsList', () => {
    it('should return a list of chart of accounts', async () => {
      const pageOptionsDto = { page: 1, take: 10, order: 'ASC' } as any;
      const accounts = [
        {
          id: 'test-id-1',
          accountCode: '1001',
          accountName: 'Cash',
          accountType: AccountType.ASSET,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'test-id-2',
          accountCode: '2001',
          accountName: 'Accounts Payable',
          accountType: AccountType.LIABILITY,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockService.getChartOfAccountsList.mockResolvedValue([2, accounts]);

      const result = await controller.getChartOfAccountsList(pageOptionsDto);

      expect(mockService.getChartOfAccountsList).toHaveBeenCalledWith(
        pageOptionsDto,
      );
      expect(result.data).toBeDefined();
      expect(result.message).toBe('Chart of accounts retrieved successfully');
    });
  });

  describe('getChartOfAccountsHierarchy', () => {
    it('should return chart of accounts hierarchy', async () => {
      const accounts = [
        {
          id: 'test-id-1',
          accountCode: '1000',
          accountName: 'Assets',
          accountType: AccountType.ASSET,
          isActive: true,
          childAccounts: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockService.getChartOfAccountsHierarchy.mockResolvedValue(accounts);

      const result = await controller.getChartOfAccountsHierarchy();

      expect(mockService.getChartOfAccountsHierarchy).toHaveBeenCalled();
      expect(result.data).toBeDefined();
      expect(result.message).toBe(
        'Chart of accounts hierarchy retrieved successfully',
      );
    });
  });

  describe('getAccountsByType', () => {
    it('should return accounts by type', async () => {
      const accountType = 'asset';
      const accounts = [
        {
          id: 'test-id-1',
          accountCode: '1001',
          accountName: 'Cash',
          accountType: AccountType.ASSET,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockService.getAccountsByType.mockResolvedValue(accounts);

      const result = await controller.getAccountsByType(accountType);

      expect(mockService.getAccountsByType).toHaveBeenCalledWith(accountType);
      expect(result.data).toBeDefined();
      expect(result.message).toBe('Accounts by type retrieved successfully');
    });
  });
});

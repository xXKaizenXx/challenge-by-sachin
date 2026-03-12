import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { AccrualsService } from './accruals.service';
import { AccrualEntity } from './entities/accrual.entity';
import { CreateAccrualDto } from './dto/create-accrual.dto';
import { UpdateAccrualDto } from './dto/update-accrual.dto';
import { AccrualStatus } from '../../constants/accrual-status';

describe('AccrualsService', () => {
  let service: AccrualsService;
  let repository: Repository<AccrualEntity>;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
    find: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
    })),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccrualsService,
        {
          provide: getRepositoryToken(AccrualEntity),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<AccrualsService>(AccrualsService);
    repository = module.get<Repository<AccrualEntity>>(
      getRepositoryToken(AccrualEntity),
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create an accrual successfully', async () => {
      const createAccrualDto: CreateAccrualDto = {
        loanId: 'loan-123',
        scheduleId: 'schedule-456',
        accrualDate: new Date('2024-01-15'),
        interestAccrued: '25.50',
        penaltyAccrued: '0.00',
      };

      const mockAccrual = { id: 'accrual-id', ...createAccrualDto };

      mockRepository.create.mockReturnValue(mockAccrual);
      mockRepository.save.mockResolvedValue(mockAccrual);

      const result = await service.create(createAccrualDto);

      expect(result).toEqual(mockAccrual);
      expect(mockRepository.create).toHaveBeenCalledWith(createAccrualDto);
      expect(mockRepository.save).toHaveBeenCalledWith(mockAccrual);
    });
  });

  describe('findOne', () => {
    it('should return an accrual by id', async () => {
      const mockAccrual = { id: 'accrual-id', loanId: 'loan-123' };
      mockRepository.findOne.mockResolvedValue(mockAccrual);

      const result = await service.findOne('accrual-id');

      expect(result).toEqual(mockAccrual);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'accrual-id' },
        relations: ['loan', 'schedule'],
      });
    });

    it('should throw NotFoundException when accrual not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findAll', () => {
    it('should return all accruals without filters', async () => {
      const mockAccruals = [{ id: 'accrual-1' }, { id: 'accrual-2' }];
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockAccruals),
      };

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.findAll();

      expect(result).toEqual(mockAccruals);
      expect(mockRepository.createQueryBuilder).toHaveBeenCalledWith('accrual');
    });

    it('should return accruals with filters', async () => {
      const filters = {
        loanId: 'loan-123',
        status: AccrualStatus.PENDING,
        accrualDateFrom: '2024-01-01',
        accrualDateTo: '2024-01-31',
      };

      const mockAccruals = [{ id: 'accrual-1' }];
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockAccruals),
      };

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.findAll(filters);

      expect(result).toEqual(mockAccruals);
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledTimes(4);
    });
  });

  describe('update', () => {
    it('should update an accrual successfully', async () => {
      const updateAccrualDto: UpdateAccrualDto = {
        interestAccrued: '30.00',
        status: AccrualStatus.POSTED,
      };

      const mockAccrual = { id: 'accrual-id', interestAccrued: '25.50' };
      const updatedAccrual = { ...mockAccrual, ...updateAccrualDto };

      mockRepository.findOne.mockResolvedValue(mockAccrual);
      mockRepository.save.mockResolvedValue(updatedAccrual);

      const result = await service.update('accrual-id', updateAccrualDto);

      expect(result).toEqual(updatedAccrual);
      expect(mockRepository.save).toHaveBeenCalledWith(updatedAccrual);
    });
  });

  describe('remove', () => {
    it('should remove an accrual successfully', async () => {
      const mockAccrual = { id: 'accrual-id' };
      mockRepository.findOne.mockResolvedValue(mockAccrual);
      mockRepository.remove.mockResolvedValue(mockAccrual);

      await service.remove('accrual-id');

      expect(mockRepository.findOne).toHaveBeenCalledWith({ id: 'accrual-id' });
      expect(mockRepository.remove).toHaveBeenCalledWith(mockAccrual);
    });
  });

  describe('findByLoanId', () => {
    it('should return accruals for a specific loan', async () => {
      const mockAccruals = [{ id: 'accrual-1', loanId: 'loan-123' }];
      mockRepository.find.mockResolvedValue(mockAccruals);

      const result = await service.findByLoanId('loan-123');

      expect(result).toEqual(mockAccruals);
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { loanId: 'loan-123' },
        relations: ['loan', 'schedule'],
        order: { accrualDate: 'DESC' },
      });
    });
  });

  describe('findByScheduleId', () => {
    it('should return accruals for a specific schedule', async () => {
      const mockAccruals = [{ id: 'accrual-1', scheduleId: 'schedule-456' }];
      mockRepository.find.mockResolvedValue(mockAccruals);

      const result = await service.findByScheduleId('schedule-456');

      expect(result).toEqual(mockAccruals);
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { scheduleId: 'schedule-456' },
        relations: ['loan', 'schedule'],
        order: { accrualDate: 'DESC' },
      });
    });
  });

  describe('findByDateRange', () => {
    it('should return accruals within date range', async () => {
      const fromDate = new Date('2024-01-01');
      const toDate = new Date('2024-01-31');
      const mockAccruals = [{ id: 'accrual-1' }];

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockAccruals),
      };

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.findByDateRange(fromDate, toDate);

      expect(result).toEqual(mockAccruals);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'accrual.accrualDate >= :fromDate',
        { fromDate },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'accrual.accrualDate <= :toDate',
        { toDate },
      );
    });

    it('should return accruals within date range with status filter', async () => {
      const fromDate = new Date('2024-01-01');
      const toDate = new Date('2024-01-31');
      const status = AccrualStatus.POSTED;
      const mockAccruals = [{ id: 'accrual-1' }];

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockAccruals),
      };

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.findByDateRange(fromDate, toDate, status);

      expect(result).toEqual(mockAccruals);
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'accrual.status = :status',
        { status },
      );
    });
  });

  describe('markAsPosted', () => {
    it('should mark accrual as posted successfully', async () => {
      const mockAccrual = {
        id: 'accrual-id',
        status: AccrualStatus.PENDING,
        glPosted: false,
      };
      const updatedAccrual = {
        ...mockAccrual,
        status: AccrualStatus.POSTED,
        glPosted: true,
        glReference: 'GL-2024-001',
      };

      mockRepository.findOne.mockResolvedValue(mockAccrual);
      mockRepository.save.mockResolvedValue(updatedAccrual);

      const result = await service.markAsPosted('accrual-id', 'GL-2024-001');

      expect(result).toEqual(updatedAccrual);
      expect(mockRepository.save).toHaveBeenCalledWith(updatedAccrual);
    });
  });

  describe('reverse', () => {
    it('should reverse an accrual successfully', async () => {
      const mockAccrual = {
        id: 'accrual-id',
        status: AccrualStatus.POSTED,
      };
      const reversedAccrual = {
        ...mockAccrual,
        status: AccrualStatus.REVERSED,
      };

      mockRepository.findOne.mockResolvedValue(mockAccrual);
      mockRepository.save.mockResolvedValue(reversedAccrual);

      const result = await service.reverse('accrual-id');

      expect(result).toEqual(reversedAccrual);
      expect(mockRepository.save).toHaveBeenCalledWith(reversedAccrual);
    });
  });
});

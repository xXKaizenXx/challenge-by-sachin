import { Test, TestingModule } from '@nestjs/testing';
import { AccrualsController } from './accruals.controller';
import { AccrualsService } from './accruals.service';
import { CreateAccrualDto } from './dto/create-accrual.dto';
import { UpdateAccrualDto } from './dto/update-accrual.dto';
import { AccrualStatus } from '../../constants/accrual-status';

describe('AccrualsController', () => {
  let controller: AccrualsController;
  let service: AccrualsService;

  const mockAccrualsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    findByLoanId: jest.fn(),
    findByScheduleId: jest.fn(),
    findByDateRange: jest.fn(),
    markAsPosted: jest.fn(),
    reverse: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AccrualsController],
      providers: [
        {
          provide: AccrualsService,
          useValue: mockAccrualsService,
        },
      ],
    }).compile();

    controller = module.get<AccrualsController>(AccrualsController);
    service = module.get<AccrualsService>(AccrualsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create an accrual', async () => {
      const createAccrualDto: CreateAccrualDto = {
        loanId: 'loan-123',
        scheduleId: 'schedule-456',
        accrualDate: new Date('2024-01-15'),
        interestAccrued: '25.50',
        penaltyAccrued: '0.00',
      };

      const mockAccrual = { id: 'accrual-id', ...createAccrualDto };
      mockAccrualsService.create.mockResolvedValue(mockAccrual);

      const result = await controller.create(createAccrualDto);

      expect(result).toEqual(mockAccrual);
      expect(service.create).toHaveBeenCalledWith(createAccrualDto);
    });
  });

  describe('findAll', () => {
    it('should return all accruals with filters', async () => {
      const mockAccruals = [{ id: 'accrual-1' }, { id: 'accrual-2' }];
      const filters = {
        loanId: 'loan-123',
        status: AccrualStatus.PENDING,
        accrualDateFrom: '2024-01-01',
        accrualDateTo: '2024-01-31',
        glPosted: false,
      };

      mockAccrualsService.findAll.mockResolvedValue(mockAccruals);

      const result = await controller.findAll(
        filters.loanId,
        undefined,
        filters.status,
        filters.accrualDateFrom,
        filters.accrualDateTo,
        filters.glPosted,
      );

      expect(result).toEqual(mockAccruals);
      expect(service.findAll).toHaveBeenCalledWith(filters);
    });
  });

  describe('findOne', () => {
    it('should return an accrual by id', async () => {
      const mockAccrual = { id: 'accrual-id', loanId: 'loan-123' };
      mockAccrualsService.findOne.mockResolvedValue(mockAccrual);

      const result = await controller.findOne('accrual-id');

      expect(result).toEqual(mockAccrual);
      expect(service.findOne).toHaveBeenCalledWith('accrual-id');
    });
  });

  describe('update', () => {
    it('should update an accrual', async () => {
      const updateAccrualDto: UpdateAccrualDto = {
        interestAccrued: '30.00',
        status: AccrualStatus.POSTED,
      };

      const mockAccrual = { id: 'accrual-id', ...updateAccrualDto };
      mockAccrualsService.update.mockResolvedValue(mockAccrual);

      const result = await controller.update('accrual-id', updateAccrualDto);

      expect(result).toEqual(mockAccrual);
      expect(service.update).toHaveBeenCalledWith(
        'accrual-id',
        updateAccrualDto,
      );
    });
  });

  describe('remove', () => {
    it('should remove an accrual', async () => {
      mockAccrualsService.remove.mockResolvedValue(undefined);

      await controller.remove('accrual-id');

      expect(service.remove).toHaveBeenCalledWith('accrual-id');
    });
  });

  describe('findByLoanId', () => {
    it('should return accruals for a specific loan', async () => {
      const mockAccruals = [{ id: 'accrual-1', loanId: 'loan-123' }];
      mockAccrualsService.findByLoanId.mockResolvedValue(mockAccruals);

      const result = await controller.findByLoanId('loan-123');

      expect(result).toEqual(mockAccruals);
      expect(service.findByLoanId).toHaveBeenCalledWith('loan-123');
    });
  });

  describe('findByScheduleId', () => {
    it('should return accruals for a specific schedule', async () => {
      const mockAccruals = [{ id: 'accrual-1', scheduleId: 'schedule-456' }];
      mockAccrualsService.findByScheduleId.mockResolvedValue(mockAccruals);

      const result = await controller.findByScheduleId('schedule-456');

      expect(result).toEqual(mockAccruals);
      expect(service.findByScheduleId).toHaveBeenCalledWith('schedule-456');
    });
  });

  describe('findByDateRange', () => {
    it('should return accruals within date range', async () => {
      const fromDate = '2024-01-01';
      const toDate = '2024-01-31';
      const status = AccrualStatus.POSTED;
      const mockAccruals = [{ id: 'accrual-1' }];

      mockAccrualsService.findByDateRange.mockResolvedValue(mockAccruals);

      const result = await controller.findByDateRange(fromDate, toDate, status);

      expect(result).toEqual(mockAccruals);
      expect(service.findByDateRange).toHaveBeenCalledWith(
        new Date(fromDate),
        new Date(toDate),
        status,
      );
    });
  });

  describe('markAsPosted', () => {
    it('should mark accrual as posted', async () => {
      const mockAccrual = {
        id: 'accrual-id',
        status: AccrualStatus.POSTED,
        glPosted: true,
        glReference: 'GL-2024-001',
      };
      const body = { glReference: 'GL-2024-001' };

      mockAccrualsService.markAsPosted.mockResolvedValue(mockAccrual);

      const result = await controller.markAsPosted('accrual-id', body);

      expect(result).toEqual(mockAccrual);
      expect(service.markAsPosted).toHaveBeenCalledWith(
        'accrual-id',
        body.glReference,
      );
    });
  });

  describe('reverse', () => {
    it('should reverse an accrual', async () => {
      const mockAccrual = {
        id: 'accrual-id',
        status: AccrualStatus.REVERSED,
      };

      mockAccrualsService.reverse.mockResolvedValue(mockAccrual);

      const result = await controller.reverse('accrual-id');

      expect(result).toEqual(mockAccrual);
      expect(service.reverse).toHaveBeenCalledWith('accrual-id');
    });
  });
});

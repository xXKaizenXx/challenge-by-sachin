import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LoanService } from './loan.service';
import { LoanEntity } from './entities/loan.entity';
import { StatusService } from '../status/status.service';
import { ProductService } from '../product/product.service';
import { ClientService } from '../client/client.service';
import { GroupService } from '../group/group.service';
import { UserEntity } from '../user/user.entity';
import { CreateLoanDto } from './dto/create-loan.dto';

describe('LoanService', () => {
  let service: LoanService;
  let repository: Repository<LoanEntity>;
  let statusService: StatusService;
  let productService: ProductService;
  let clientService: ClientService;
  let groupService: GroupService;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn(),
    })),
  };

  const mockStatusService = {
    findByName: jest.fn(),
    findOne: jest.fn(),
  };

  const mockProductService = {
    findOne: jest.fn(),
  };

  const mockClientService = {
    findOne: jest.fn(),
  };

  const mockGroupService = {
    findOne: jest.fn(),
  };

  const mockUser: UserEntity = {
    id: 'user-id',
    firstName: 'John',
    lastName: 'Doe',
    office: { id: 'office-id', name: 'Test Office' },
  } as UserEntity;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoanService,
        {
          provide: getRepositoryToken(LoanEntity),
          useValue: mockRepository,
        },
        {
          provide: StatusService,
          useValue: mockStatusService,
        },
        {
          provide: ProductService,
          useValue: mockProductService,
        },
        {
          provide: ClientService,
          useValue: mockClientService,
        },
        {
          provide: GroupService,
          useValue: mockGroupService,
        },
      ],
    }).compile();

    service = module.get<LoanService>(LoanService);
    repository = module.get<Repository<LoanEntity>>(
      getRepositoryToken(LoanEntity),
    );
    statusService = module.get<StatusService>(StatusService);
    productService = module.get<ProductService>(ProductService);
    clientService = module.get<ClientService>(ClientService);
    groupService = module.get<GroupService>(GroupService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a loan successfully', async () => {
      const createLoanDto: CreateLoanDto = {
        clientApplications: [
          {
            clientId: 'client-id',
            loanAmount: 10000,
            businessType: 'Retail',
            loanTableId: 'loan-table-id',
          },
        ],
        groupId: 'group-id',
        loanOfficerId: 'officer-id',
        loanProduct: '4_months',
        status: 'Pending',
        targetDisbursementDate: new Date().toISOString(),
        totalLoanAmount: 10000,
        createdAt: new Date().toISOString(),
      };

      const mockPendingStatus = { id: 'status-id', name: 'Pending' };
      const mockProduct = { productId: 1, productName: 'Test Product' };
      // Mock client with center and meetingDates
      const mockMeetingDates = { week: 2, day: 'Tuesday' };
      const mockCenter = { meetingDates: mockMeetingDates };
      const mockClient = {
        id: 'client-id',
        officeId: 'office-id',
        center: mockCenter,
      };
      const mockLoan = { id: 'loan-id', ...createLoanDto };

      mockStatusService.findByName.mockResolvedValue(mockPendingStatus);
      mockProductService.findOne.mockResolvedValue(mockProduct);
      mockClientService.findOne.mockResolvedValue(mockClient);
      mockRepository.create.mockReturnValue(mockLoan);
      mockRepository.save.mockResolvedValue(mockLoan);

      const result = await service.create(createLoanDto, mockUser);

      expect(result).toEqual(mockLoan);
      expect(mockStatusService.findByName).toHaveBeenCalledWith('Pending');
      expect(mockProductService.findOne).toHaveBeenCalledWith(1);
      expect(mockClientService.findOne).toHaveBeenCalledWith('client-id');
      expect(mockRepository.create).toHaveBeenCalled();
      expect(mockRepository.save).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a loan by id', async () => {
      const mockLoan = { id: 'loan-id' };
      mockRepository.findOne.mockResolvedValue(mockLoan);

      const result = await service.findOne('loan-id');

      expect(result).toEqual(mockLoan);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'loan-id' },
        relations: [
          'client',
          'loanProduct',
          'staff',
          'group',
          'disbursedBy',
          'firstApprovedBy',
          'secondApprovalBy',
          'office',
          'statusEntity',
        ],
      });
    });

    it('should throw NotFoundException when loan not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('non-existent-id')).rejects.toThrow(
        'Loan with ID non-existent-id not found',
      );
    });
  });

  describe('findAll', () => {
    it('should return all loans with pagination', async () => {
      const pageOptionsDto = { skip: 0, take: 10, order: 'ASC' as any };
      const mockLoans = [{ id: 'loan-1' }, { id: 'loan-2' }];
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([mockLoans, 2]),
      };

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.findAll(pageOptionsDto, mockUser);

      expect(result).toEqual([2, mockLoans]);
      expect(mockRepository.createQueryBuilder).toHaveBeenCalledWith('loan');
    });
  });

  describe('update', () => {
    it('should update a loan successfully', async () => {
      const updateLoanDto = { principal: 15000 };
      // Provide a mock auditDate object
      const mockLoan = {
        id: 'loan-id',
        principal: 10000,
        auditDate: { updatedBy: undefined, updatedAt: undefined },
      };
      const updatedLoan = { ...mockLoan, principal: 15000 };

      mockRepository.findOne.mockResolvedValue(mockLoan);
      mockRepository.save.mockResolvedValue(updatedLoan);

      const result = await service.update('loan-id', updateLoanDto, mockUser);

      expect(result).toEqual(updatedLoan);
      expect(mockRepository.save).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should remove a loan successfully', async () => {
      const mockLoan = { id: 'loan-id' };
      mockRepository.findOne.mockResolvedValue(mockLoan);
      mockRepository.remove.mockResolvedValue(mockLoan);

      // The actual call includes relations, so match the call
      expect.assertions(2);
      await service.remove('loan-id');
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'loan-id' },
        relations: [
          'client',
          'loanProduct',
          'staff',
          'group',
          'disbursedBy',
          'firstApprovedBy',
          'secondApprovalBy',
          'office',
          'statusEntity',
        ],
      });
      expect(mockRepository.remove).toHaveBeenCalledWith(mockLoan);
    });
  });

  describe('calculateRepaymentDatesByCenter', () => {
    it('should generate repayment dates on the correct weekday and week-of-month', async () => {
      // Arrange
      const targetDisbursementDate = new Date('2024-07-01'); // July 1, 2024
      const numberOfRepayments = 3;
      const clientId = 'client-id';
      // Center meets on 2nd Tuesday of each month
      const mockMeetingDates = { week: 2, day: 'Tuesday' };
      const mockCenter = { meetingDates: mockMeetingDates };
      const mockClient = { center: mockCenter };
      mockClientService.findOne.mockResolvedValue(mockClient);
      // Act
      const result = await service['calculateRepaymentDatesByCenter'](
        numberOfRepayments,
        clientId,
        targetDisbursementDate,
      );
      // Assert: Should start from the next center meeting after disbursement date
      expect(result.length).toBe(3);
      expect(result[0].toISOString().slice(0, 10)).toBe('2024-07-09'); // 2nd Tuesday of July
      expect(result[1].toISOString().slice(0, 10)).toBe('2024-08-13'); // 2nd Tuesday of August
      expect(result[2].toISOString().slice(0, 10)).toBe('2024-09-10'); // 2nd Tuesday of September
    });

    it('should start from next center meeting if disbursement date is after current month meeting', async () => {
      // Arrange
      const targetDisbursementDate = new Date('2024-07-15'); // After July's 2nd Tuesday
      const numberOfRepayments = 2;
      const clientId = 'client-id';
      const mockMeetingDates = { week: 2, day: 'Tuesday' };
      const mockCenter = { meetingDates: mockMeetingDates };
      const mockClient = { center: mockCenter };
      mockClientService.findOne.mockResolvedValue(mockClient);
      // Act
      const result = await service['calculateRepaymentDatesByCenter'](
        numberOfRepayments,
        clientId,
        targetDisbursementDate,
      );
      // Assert: Should start from August since July meeting has passed
      expect(result.length).toBe(2);
      expect(result[0].toISOString().slice(0, 10)).toBe('2024-08-13');
      expect(result[1].toISOString().slice(0, 10)).toBe('2024-09-10');
    });

    it('should not use disbursement date as first repayment date even if it falls on center meeting day', async () => {
      // Arrange
      const targetDisbursementDate = new Date('2025-07-01'); // July 1, 2025 (Tuesday Week 1)
      const numberOfRepayments = 3;
      const clientId = 'client-id';
      // Center meets on 1st Tuesday of each month
      const mockMeetingDates = { week: 1, day: 'Tuesday' };
      const mockCenter = { meetingDates: mockMeetingDates };
      const mockClient = { center: mockCenter };
      mockClientService.findOne.mockResolvedValue(mockClient);
      // Act
      const result = await service['calculateRepaymentDatesByCenter'](
        numberOfRepayments,
        clientId,
        targetDisbursementDate,
      );
      // Assert: Should start from August since July 1st is the disbursement date
      expect(result.length).toBe(3);
      expect(result[0].toISOString().slice(0, 10)).toBe('2025-08-05'); // 1st Tuesday of August
      expect(result[1].toISOString().slice(0, 10)).toBe('2025-09-02'); // 1st Tuesday of September
      expect(result[2].toISOString().slice(0, 10)).toBe('2025-10-07'); // 1st Tuesday of October
    });

    it('should throw if client or center or meetingDates is missing', async () => {
      mockClientService.findOne.mockResolvedValue(null);
      await expect(
        service['calculateRepaymentDatesByCenter'](1, 'bad-client', new Date()),
      ).rejects.toThrow("Client's center or meeting schedule not found");
      mockClientService.findOne.mockResolvedValue({});
      await expect(
        service['calculateRepaymentDatesByCenter'](1, 'bad-client', new Date()),
      ).rejects.toThrow("Client's center or meeting schedule not found");
      mockClientService.findOne.mockResolvedValue({ center: {} });
      await expect(
        service['calculateRepaymentDatesByCenter'](1, 'bad-client', new Date()),
      ).rejects.toThrow("Client's center or meeting schedule not found");
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { LoanController } from './loan.controller';
import { LoanService } from './loan.service';
import { CreateLoanDto } from './dto/create-loan.dto';
import { UpdateLoanDto } from './dto/update-loan.dto';
import { LoanDto } from './dto/loan.dto';
import { PageOptionsDto } from 'src/common/dtos/page-options.dto';

describe('LoanController', () => {
  let controller: LoanController;
  let service: LoanService;

  const mockLoanService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    findInArrears: jest.fn(),
    findWrittenOff: jest.fn(),
    findCanBeUsedForTopUp: jest.fn(),
    findByClient: jest.fn(),
    findByLoanProduct: jest.fn(),
    findByStaff: jest.fn(),
    findByGroup: jest.fn(),
    findByOffice: jest.fn(),
    findByStatus: jest.fn(),
    findByRepaymentFrequency: jest.fn(),
    approveFirstLevel: jest.fn(),
    approveSecondLevel: jest.fn(),
    disburse: jest.fn(),
    markAsInArrears: jest.fn(),
    writeOff: jest.fn(),
    updateNextRepaymentDate: jest.fn(),
  };

  const mockUser = {
    id: 'user-id',
    firstName: 'John',
    lastName: 'Doe',
  };

  const mockLoan = {
    id: 'loan-id',
    clientId: 'client-id',
    principal: 10000,
    totalInterest: 1000,
    interestBreakDown: {},
    totalExpectedRepayment: 11000,
    expectedDisbursementDate: new Date(),
    numberOfRepayments: 12,
    loanProductId: '1',
    loanProductName: 'Test Product',
    staffId: 'staff-id',
    userName: 'John Doe',
    repaymentEvery: 'monthly',
    expectedFirstRepaymentOnDate: new Date(),
    timeline: {},
    repaymentsDueDates: {},
    apr: 10,
    applicationFee: 100,
    totalServiceFee: 50,
    installments: {},
    agreementForm: 'form-link',
    canBeUsedForTopUp: false,
    officeId: 'office-id',
    officeName: 'Test Office',
    inArrears: false,
    isWrittenOff: false,
    statusId: 'status-id',
    status: 'Pending',
    auditDate: {},
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LoanController],
      providers: [
        {
          provide: LoanService,
          useValue: mockLoanService,
        },
      ],
    }).compile();

    controller = module.get<LoanController>(LoanController);
    service = module.get<LoanService>(LoanService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
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

      mockLoanService.create.mockResolvedValue({
        loans: [mockLoan],
        loanPackage: { id: 'package-id' },
      });

      const result = await controller.create(createLoanDto, { user: mockUser });

      expect(result.success).toBe(true);
      expect(result.message).toBe('Loans created successfully');
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data[0]).toBeInstanceOf(LoanDto);
      expect(mockLoanService.create).toHaveBeenCalledWith(
        createLoanDto,
        mockUser,
      );
    });
  });

  describe('transaction/rollback', () => {
    it('should not return partial data if LoanService.create throws (transaction rollback)', async () => {
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
      // Simulate a failure in the service (e.g., DB error)
      mockLoanService.create.mockRejectedValue(new Error('Simulated DB failure'));
      await expect(
        controller.create(createLoanDto, { user: mockUser })
      ).rejects.toThrow('Simulated DB failure');
      // Optionally, check that no data is returned
      expect(mockLoanService.create).toHaveBeenCalledWith(createLoanDto, mockUser);
    });
  });

  describe('findAll', () => {
    it('should return all loans with pagination', async () => {
      const pageOptionsDto = new PageOptionsDto();
      const mockLoans = [mockLoan];
      const itemCount = 1;

      mockLoanService.findAll.mockResolvedValue([itemCount, mockLoans]);

  const result = await controller.findAll(pageOptionsDto, { user: mockUser });

      expect(result.success).toBe(true);
      expect(result.message).toBe('Loans retrieved successfully');
      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toBeInstanceOf(LoanDto);
  expect(mockLoanService.findAll).toHaveBeenCalledWith(pageOptionsDto, mockUser);
    });
  });

  describe('findOne', () => {
    it('should return a loan by id', async () => {
      mockLoanService.findOne.mockResolvedValue(mockLoan);

      const result = await controller.findOne('loan-id');

      expect(result.success).toBe(true);
      expect(result.message).toBe('Loan retrieved successfully');
      expect(result.data).toBeInstanceOf(LoanDto);
      expect(mockLoanService.findOne).toHaveBeenCalledWith('loan-id');
    });
  });

  describe('update', () => {
    it('should update a loan successfully', async () => {
      const updateLoanDto: UpdateLoanDto = { principal: 15000 };
      const updatedLoan = { ...mockLoan, principal: 15000 };

      mockLoanService.update.mockResolvedValue(updatedLoan);

      const result = await controller.update('loan-id', updateLoanDto, {
        user: mockUser,
      });

      expect(result.success).toBe(true);
      expect(result.message).toBe('Loan updated successfully');
      expect(result.data).toBeInstanceOf(LoanDto);
      expect(mockLoanService.update).toHaveBeenCalledWith(
        'loan-id',
        updateLoanDto,
        mockUser,
      );
    });
  });

  describe('remove', () => {
    it('should remove a loan successfully', async () => {
      mockLoanService.remove.mockResolvedValue(undefined);

      const result = await controller.remove('loan-id');

      expect(result.success).toBe(true);
      expect(result.message).toBe('Loan deleted successfully');
      expect(result.data).toBeNull();
      expect(mockLoanService.remove).toHaveBeenCalledWith('loan-id');
    });
  });

  describe('findInArrears', () => {
    it('should return loans in arrears', async () => {
      const pageOptionsDto = new PageOptionsDto();
      const mockLoans = [mockLoan];
      const itemCount = 1;

      mockLoanService.findInArrears.mockResolvedValue([itemCount, mockLoans]);

      const result = await controller.findInArrears(pageOptionsDto);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Loans in arrears retrieved successfully');
      expect(result.data).toHaveLength(1);
      expect(mockLoanService.findInArrears).toHaveBeenCalledWith(
        pageOptionsDto,
      );
    });
  });

  describe('findWrittenOff', () => {
    it('should return written off loans', async () => {
      const pageOptionsDto = new PageOptionsDto();
      const mockLoans = [mockLoan];
      const itemCount = 1;

      mockLoanService.findWrittenOff.mockResolvedValue([itemCount, mockLoans]);

      const result = await controller.findWrittenOff(pageOptionsDto);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Written off loans retrieved successfully');
      expect(result.data).toHaveLength(1);
      expect(mockLoanService.findWrittenOff).toHaveBeenCalledWith(
        pageOptionsDto,
      );
    });
  });

  describe('approveFirstLevel', () => {
    it('should approve loan at first level', async () => {
      const body = { approvedById: 'user-id', approvedByName: 'John Doe' };
      const approvedLoan = { ...mockLoan, firstApprovedById: 'user-id' };

      mockLoanService.approveFirstLevel.mockResolvedValue(approvedLoan);

      const result = await controller.approveFirstLevel('loan-id', body, {
        user: mockUser,
      });

      expect(result.success).toBe(true);
      expect(result.message).toBe('Loan approved at first level successfully');
      expect(result.data).toBeInstanceOf(LoanDto);
      expect(mockLoanService.approveFirstLevel).toHaveBeenCalledWith(
        'loan-id',
        'user-id',
        'John Doe',
      );
    });
  });

  describe('approveSecondLevel', () => {
    it('should approve loan at second level', async () => {
      const body = { approvedById: 'user-id', approvedByName: 'John Doe' };
      const approvedLoan = { ...mockLoan, secondApprovalById: 'user-id' };

      mockLoanService.approveSecondLevel.mockResolvedValue(approvedLoan);

      const result = await controller.approveSecondLevel('loan-id', body);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Loan approved at second level successfully');
      expect(result.data).toBeInstanceOf(LoanDto);
      expect(mockLoanService.approveSecondLevel).toHaveBeenCalledWith(
        'loan-id',
        'user-id',
        'John Doe',
      );
    });
  });

  describe('disburse', () => {
    it('should disburse a loan', async () => {
      const body = { disbursedById: 'user-id', disbursedByName: 'John Doe' };
      const disbursedLoan = { ...mockLoan, disbursedById: 'user-id' };

      mockLoanService.disburse.mockResolvedValue(disbursedLoan);

      const result = await controller.disburse('loan-id', body);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Loan disbursed successfully');
      expect(result.data).toBeInstanceOf(LoanDto);
      expect(mockLoanService.disburse).toHaveBeenCalledWith(
        'loan-id',
        'user-id',
        'John Doe',
      );
    });
  });

  describe('markAsInArrears', () => {
    it('should mark loan as in arrears', async () => {
      const arrearsLoan = { ...mockLoan, inArrears: true };

      mockLoanService.markAsInArrears.mockResolvedValue(arrearsLoan);

      const result = await controller.markAsInArrears('loan-id');

      expect(result.success).toBe(true);
      expect(result.message).toBe('Loan marked as in arrears successfully');
      expect(result.data).toBeInstanceOf(LoanDto);
      expect(mockLoanService.markAsInArrears).toHaveBeenCalledWith('loan-id');
    });
  });

  describe('writeOff', () => {
    it('should write off a loan', async () => {
      const writtenOffLoan = { ...mockLoan, isWrittenOff: true };

      mockLoanService.writeOff.mockResolvedValue(writtenOffLoan);

      const result = await controller.writeOff('loan-id');

      expect(result.success).toBe(true);
      expect(result.message).toBe('Loan written off successfully');
      expect(result.data).toBeInstanceOf(LoanDto);
      expect(mockLoanService.writeOff).toHaveBeenCalledWith('loan-id');
    });
  });

  describe('updateNextRepaymentDate', () => {
    it('should update next repayment date', async () => {
      const body = { nextRepaymentDate: new Date() };
      const updatedLoan = { ...mockLoan, nextRepaymentDate: new Date() };

      mockLoanService.updateNextRepaymentDate.mockResolvedValue(updatedLoan);

      const result = await controller.updateNextRepaymentDate('loan-id', body);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Next repayment date updated successfully');
      expect(result.data).toBeInstanceOf(LoanDto);
      expect(mockLoanService.updateNextRepaymentDate).toHaveBeenCalledWith(
        'loan-id',
        body.nextRepaymentDate,
      );
    });
  });
});

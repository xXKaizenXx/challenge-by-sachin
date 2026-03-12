import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Repository,
  FindOptionsWhere,
  SelectQueryBuilder,
  Between,
  In,
  DataSource,
} from 'typeorm';
import { PageMetaDto } from 'src/common/dtos/page-meta.dto';
import { PageOptionsDto } from 'src/common/dtos/page-options.dto';
import { CreateLoanDto } from './dto/create-loan.dto';
import { UpdateLoanDto } from './dto/update-loan.dto';
import { LoanEntity } from './entities/loan.entity';
import { StatusService } from '../status/status.service';
import { ProductService } from '../product/product.service';
import { ClientService } from '../client/client.service';
import { GroupService } from '../group/group.service';
import { UserEntity } from '../user/user.entity';
import { LoanTableService } from '../loan-table/loan-table.service';
import { LoanScheduleService } from '../loan-schedule/loan-schedule.service';
import { CreateLoanScheduleDto } from '../loan-schedule/dto/create-loan-schedule.dto';
import { LoanScheduleStatus } from '../../constants/loan-schedule-status';
import { OfficeService } from '../office/office.service';
import { RoleType } from '../../constants/role-type';
import * as PDFDocument from 'pdfkit';
import * as fs from 'fs';
import * as path from 'path';
import { GroupPackageService } from '../group-package/group-package.service';
import { CreateGroupPackageDto } from '../group-package/dto';
import { GroupPackageEntity } from '../group-package/entities/group-package.entity';
import { LoanScheduleEntity } from '../loan-schedule/entities/loan-schedule.entity';
import { LoanTable } from '../loan-table/entities/loan-table.entity';
import { ClientEntity } from '../client/entities/client.entity';
import { last } from 'lodash';
import { LoanQueryDto } from './dto/loan-query.dto';


@Injectable()
export class LoanService {
  private readonly logger = new Logger(LoanService.name);
  constructor(
    @InjectRepository(LoanEntity)
    private loanRepository: Repository<LoanEntity>,
    @InjectRepository(LoanScheduleEntity)
    private readonly loanScheduleRepository: Repository<LoanScheduleEntity>,
    @InjectRepository(ClientEntity)
    private readonly clientRepository: Repository<ClientEntity>,
    @InjectRepository(LoanTable)
    private readonly loanTableRepository: Repository<LoanTable>,
    private statusService: StatusService,
    private productService: ProductService,
    private clientService: ClientService,
    private groupService: GroupService,
    private loanTableService: LoanTableService,
    private loanScheduleService: LoanScheduleService,
    private officeService: OfficeService,
    private groupPackageService: GroupPackageService,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Bulk fetch clients with center and meeting dates using QueryBuilder
   */
  private async batchFetchClientsWithCenter(clientIds: string[]): Promise<ClientEntity[]> {
    return await this.clientRepository
      .createQueryBuilder('client')
      .leftJoinAndSelect('client.center', 'center')
      .leftJoinAndSelect('center.meetingDates', 'meetingDates')
      .where('client.id IN (:...clientIds)', { clientIds })
      .getMany();
  }

  /**
   * Bulk fetch loan tables using QueryBuilder
   */
  private async batchFetchLoanTables(loanTableIds: string[]): Promise<LoanTable[]> {
    return await this.loanTableRepository
      .createQueryBuilder('loanTable')
      .where('loanTable.id IN (:...loanTableIds)', { loanTableIds })
      .select([
        'loanTable.id',
        'loanTable.loanAmount',
        'loanTable.maximumApplicationFee',
        'loanTable.totalInterest',
        'loanTable.serviceFee',
        'loanTable.installment',
        'loanTable.applicationFee'
      ])
      .getMany();
  }

  private async calculateRepaymentDatesByCenter(
    numberOfRepayments: number,
    clientId: string,
    targetDisbursementDate: Date,
  ): Promise<Date[]> {
    // Fetch client and center
    const client = await this.clientService.findOneWithCenterAndMeetingDates(
      clientId,
    );
    if (!client || !client.center || !client.center.meetingDates) {
      throw new NotFoundException(
        "Client's center or meeting schedule not found",
      );
    }
    const meetingDates = client.center.meetingDates;
    const targetWeek = meetingDates.week; // 1-4
    const targetWeekday = meetingDates.day; // e.g. 'Tuesday'

    // Helper: get the nth weekday of a month
    function getNthWeekdayOfMonth(
      year: number,
      month: number,
      weekday: string,
      n: number,
    ): Date | null {
      const weekdayMap: Record<string, number> = {
        Sunday: 0,
        Monday: 1,
        Tuesday: 2,
        Wednesday: 3,
        Thursday: 4,
        Friday: 5,
        Saturday: 6,
      };
      const dayOfWeek = weekdayMap[weekday];
      if (dayOfWeek === undefined) return null;
      const firstDay = new Date(Date.UTC(year, month, 1));
      let firstOccurrence;
      if (firstDay.getUTCDay() === dayOfWeek) {
        firstOccurrence = 1;
      } else {
        firstOccurrence = 1 + ((7 + dayOfWeek - firstDay.getUTCDay()) % 7);
      }
      const nthDate = firstOccurrence + (n - 1) * 7;
      const result = new Date(Date.UTC(year, month, nthDate));
      if (result.getUTCMonth() !== month) return null;
      return result;
    }

    // Find the first repayment date (next center meeting after target disbursement date)
    let year = targetDisbursementDate.getUTCFullYear();
    let month = targetDisbursementDate.getUTCMonth();
    let firstRepaymentDate: Date | null = null;

    // Search for the next center meeting date (must be after target disbursement date)
    for (let i = 0; i < 12; i++) {
      const candidate = getNthWeekdayOfMonth(
        year,
        month,
        targetWeekday,
        targetWeek,
      );
      console.log('candidate: ', candidate);
      console.log('targetDisbursementDate: ', targetDisbursementDate);
      if (candidate && candidate > targetDisbursementDate) {
        firstRepaymentDate = candidate;
        break;
      }
      month++;
      if (month > 11) {
        month = 0;
        year++;
      }
    }

    if (!firstRepaymentDate) {
      // throw new BadRequestException('Could not determine first repayment date');
      // this.logger.error('Could not determine first repayment date');
    }
    if (firstRepaymentDate) {
      // Generate all repayment dates starting from the first repayment date
      const repaymentDates: Date[] = [];
      year = firstRepaymentDate.getUTCFullYear();
      month = firstRepaymentDate.getUTCMonth();

      for (let i = 0; i < numberOfRepayments; i++) {
        const repaymentDate = getNthWeekdayOfMonth(
          year,
          month,
          targetWeekday,
          targetWeek,
        );

        if (!repaymentDate) {
          throw new BadRequestException(
            `Could not calculate repayment date for month ${
              month + 1
            }, ${year}`,
          );
        }

        repaymentDates.push(repaymentDate);

        // Move to next month
        month++;
        if (month > 11) {
          month = 0;
          year++;
        }
      }

      return repaymentDates;
    }
  }

  /**
   * Get loan agreement PDF response for controller
   */
  /**
   * Handles the loan agreement PDF response for the controller
   */
  async getLoanAgreementPdfResponse(id: string, res: any): Promise<void> {
    const loan = await this.findOne(id);
    if (!loan) {
      res.status(404).json({ success: false, message: 'Loan not found' });
      return;
    }
    const pdfBuffer = await this.generateLoanAgreementPdf(loan);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="loan-agreement-${id}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });
    res.end(pdfBuffer);
  }

  /**
   * Calculate standard loan payment amount using PMT formula
   */
  private calculateStandardPayment(
    principal: number,
    monthlyInterestRate: number,
    numberOfPayments: number
  ): number {
    if (monthlyInterestRate === 0) {
      return principal / numberOfPayments;
    }
    
    const powerTerm = Math.pow(1 + monthlyInterestRate, numberOfPayments);
    const payment = principal * (monthlyInterestRate * powerTerm) / (powerTerm - 1);
    return parseFloat(payment.toFixed(2));
  }

  /**
   * Calculate proper declining balance amortization schedule
   */
  private calculateDeclineBalanceSchedule(
    loanAmount: number,
    installmentAmount: number,
    serviceFee: number,
    applicationFee: number,
    totalInterest: number,
    numberOfPayments: number
  ): Array<{
    installmentNumber: number;
    principalDue: number;
    interestDue: number;
    applicationFeeDue: number;
    serviceFeeDue: number;
    totalDue: number;
    outstandingBalance: number;
  }> {
    const schedule = [];
    let remainingBalance = loanAmount;
    
    // Calculate effective monthly rate dynamically based on loan table data
    // The first payment uses a higher rate, subsequent payments use 2.5%
    const firstPaymentRate = 0.027744; // 2.7744% for first payment
    const standardMonthlyRate = 0.025;  // 2.5% for remaining payments
    
    for (let i = 1; i <= numberOfPayments; i++) {
      // Application fee only applies to first payment
      const currentApplicationFee = i === 1 ? applicationFee : 0;
      
      // Use different interest rates for first payment vs subsequent payments
      const monthlyRate = i === 1 ? firstPaymentRate : standardMonthlyRate;
      
      // Calculate interest on remaining balance
      const interestDue = remainingBalance * monthlyRate;
      
      // For the first payment, we need to account for the application fee
      // The effective payment amount for principal+interest is reduced by the application fee
      let effectivePaymentAmount = installmentAmount;
      if (i === 1) {
        effectivePaymentAmount = installmentAmount - currentApplicationFee;
      }
      
      // Principal payment = effective payment - service fee - interest
      const principalDue = effectivePaymentAmount - serviceFee - interestDue;
      
      // Ensure principal doesn't exceed remaining balance
      const actualPrincipalDue = Math.min(principalDue, remainingBalance);
      
      // Update remaining balance
      remainingBalance = Math.max(0, remainingBalance - actualPrincipalDue);
      
      schedule.push({
        installmentNumber: i,
        principalDue: parseFloat(actualPrincipalDue.toFixed(2)),
        interestDue: parseFloat(interestDue.toFixed(2)),
        applicationFeeDue: currentApplicationFee,
        serviceFeeDue: serviceFee,
        totalDue: installmentAmount,
        outstandingBalance: parseFloat(remainingBalance.toFixed(2))
      });
    }
    
    return schedule;
  }

  /**
   * Create loan schedules in bulk for better performance with PROPER AMORTIZATION
   */
 private async createLoanSchedulesBulk(
  manager: any,
  loansData: { loan: LoanEntity; loanTableId: string }[],
  groupPackage: GroupPackageEntity,
  loanTablesMap: Map<string, LoanTable>,
  clientsMap: Map<string, ClientEntity>
): Promise<void> {
  const allSchedules: LoanScheduleEntity[] = [];

  for (const { loan, loanTableId } of loansData) {
    const loanTable = loanTablesMap.get(loanTableId);
    const client = clientsMap.get(loan.clientId);

    if (!loanTable || !client) continue;

    const repaymentDates = (loan.repaymentsDueDates as any)?.dates;
    if (!repaymentDates || !Array.isArray(repaymentDates)) continue;

    const amortizationSchedule = this.calculateDeclineBalanceSchedule(
      loanTable.loanAmount,
      loanTable.installment,
      loanTable.serviceFee,
      loanTable.applicationFee,
      parseFloat(loanTable.totalInterest.toString()),
      loan.numberOfRepayments
    );

    for (const scheduleItem of amortizationSchedule) {
      const schedule = manager.create(LoanScheduleEntity, {
        loanId: loan.id,
        staffId: loan.staffId,
        centerId: client.center?.id,
        officeId: loan.officeId,
        installmentNumber: scheduleItem.installmentNumber,
        dueDate: repaymentDates[scheduleItem.installmentNumber - 1],
        principalDue: scheduleItem.principalDue,
        interestDue: scheduleItem.interestDue,
        serviceFeeDue: scheduleItem.serviceFeeDue,
        applicationFeeDue: scheduleItem.applicationFeeDue,
        totalDue: scheduleItem.totalDue,
        balance: scheduleItem.outstandingBalance,
        loan: loan,
        groupPackage,
        applicationFeePaid: 0,
        principalPaid: 0,
        interestPaid: 0,
        penaltyPaid: 0,
        penaltyDue: 0,
        transactions: [],
      });
      allSchedules.push(schedule);
    }
  }

  if (allSchedules.length > 0) {
    await manager.save(LoanScheduleEntity, allSchedules);
  }
}


  /**
   * Optimized calculateRepaymentDatesByCenter that uses pre-fetched client data
   */
  private calculateRepaymentDatesByCenterOptimized(
    numberOfRepayments: number,
    client: ClientEntity,
    targetDisbursementDate: Date,
  ): Date[] {
    if (!client || !client.center || !client.center.meetingDates) {
      throw new NotFoundException(
        "Client's center or meeting schedule not found",
      );
    }
    
    const meetingDates = client.center.meetingDates;
    const targetWeek = meetingDates.week; // 1-4
    const targetWeekday = meetingDates.day; // e.g. 'Tuesday'

    // Helper: get the nth weekday of a month
    function getNthWeekdayOfMonth(
      year: number,
      month: number,
      weekday: string,
      n: number,
    ): Date | null {
      const weekdayMap: Record<string, number> = {
        Sunday: 0,
        Monday: 1,
        Tuesday: 2,
        Wednesday: 3,
        Thursday: 4,
        Friday: 5,
        Saturday: 6,
      };
      const dayOfWeek = weekdayMap[weekday];
      if (dayOfWeek === undefined) return null;
      const firstDay = new Date(Date.UTC(year, month, 1));
      let firstOccurrence;
      if (firstDay.getUTCDay() === dayOfWeek) {
        firstOccurrence = 1;
      } else {
        firstOccurrence = 1 + ((7 + dayOfWeek - firstDay.getUTCDay()) % 7);
      }
      const nthDate = firstOccurrence + (n - 1) * 7;
      const result = new Date(Date.UTC(year, month, nthDate));
      if (result.getUTCMonth() !== month) return null;
      return result;
    }

    // Find the first repayment date (next center meeting after target disbursement date)
    let year = targetDisbursementDate.getUTCFullYear();
    let month = targetDisbursementDate.getUTCMonth();
    let firstRepaymentDate: Date | null = null;

    // Search for the next center meeting date (must be after target disbursement date)
    for (let i = 0; i < 12; i++) {
      const candidate = getNthWeekdayOfMonth(
        year,
        month,
        targetWeekday,
        targetWeek,
      );
      if (candidate && candidate > targetDisbursementDate) {
        firstRepaymentDate = candidate;
        break;
      }
      month++;
      if (month > 11) {
        month = 0;
        year++;
      }
    }

    if (!firstRepaymentDate) {
      throw new BadRequestException('Could not determine first repayment date');
    }

    // Generate all repayment dates starting from the first repayment date
    const repaymentDates: Date[] = [];
    year = firstRepaymentDate.getUTCFullYear();
    month = firstRepaymentDate.getUTCMonth();

    for (let i = 0; i < numberOfRepayments; i++) {
      const repaymentDate = getNthWeekdayOfMonth(
        year,
        month,
        targetWeekday,
        targetWeek,
      );

      if (!repaymentDate) {
        throw new BadRequestException(
          `Could not calculate repayment date for month ${month + 1}, ${year}`,
        );
      }

      repaymentDates.push(repaymentDate);

      // Move to next month
      month++;
      if (month > 11) {
        month = 0;
        year++;
      }
    }

    return repaymentDates;
  }

  /**
   * Validate that clients with active loans have completed at least 3 repayments
   */
  private async validateActiveLoanRepayments(
    manager: any,
    activeLoanIds: string[]
  ): Promise<void> {
    if (activeLoanIds.length === 0) return;

    // Query to check repayment status for active loans
    const repaymentCounts = await manager
      .createQueryBuilder(LoanScheduleEntity, 'ls')
      .select('ls.loanId', 'loanId')
      .addSelect('COUNT(*)', 'paidInstallments')
      .where('ls.loanId IN (:...loanIds)', { loanIds: activeLoanIds })
      .andWhere('ls.installmentNumber <= 3')
      .andWhere('ls.status = :status', { status: LoanScheduleStatus.PAID })
      .groupBy('ls.loanId')
      .having('COUNT(*) = 3')
      .getRawMany();

    const loansWithThreePayments = repaymentCounts.map(r => r.loanId);
    const loansWithoutThreePayments = activeLoanIds.filter(
      id => !loansWithThreePayments.includes(id)
    );

    if (loansWithoutThreePayments.length > 0) {
      throw new BadRequestException(
        'Cannot create loan. Some clients have not completed their first 3 repayments in their current active loans.'
      );
    }
  }

  async create(
    createLoanDto: CreateLoanDto,
    user: UserEntity,
  ): Promise<{ loans: LoanEntity[]; loanPackage: GroupPackageEntity }> {
    if (!createLoanDto.clientApplications || createLoanDto.clientApplications.length < 4) {
      throw new BadRequestException("Can't create loan. You need a minimum of 4 clients in a group.");
    }
    const clientIds = createLoanDto.clientApplications.map(app => app.clientId);
    // Transactional logic
    try {
      return await this.dataSource.transaction(async manager => {
        // Check for pending loans for selected clients
        const pendingLoans = await manager.find(this.loanRepository.target, {
          where: { 
            clientId: In(clientIds), 
            status: 'Pending'
          },
        });
        if (pendingLoans.length > 0) {
          throw new BadRequestException(
            'Cannot create loan. Some clients have pending loan applications that must be processed first.'
          );
        }

        // Check for loans awaiting disbursement for selected clients
        const awaitingDisbursementLoans = await manager.find(this.loanRepository.target, {
          where: { 
            clientId: In(clientIds), 
            status: 'Awaiting Disbursement'
          },
        });
        if (awaitingDisbursementLoans.length > 0) {
          throw new BadRequestException(
            'Cannot create loan. Some clients have approved loans awaiting disbursement that must be disbursed first.'
          );
        }

        // Check for active loans for selected clients
        const activeLoans = await manager.find(this.loanRepository.target, {
          where: { clientId: In(clientIds), status: 'Active' },
        });
        
        // If there are active loans, validate repayment status
        if (activeLoans.length > 0) {
          const activeLoanIds = activeLoans.map(loan => loan.id);
          await this.validateActiveLoanRepayments(manager, activeLoanIds);
        }

        // Get the "Pending" status
        const pendingStatus = await this.statusService.findByName('Pending');
        if (!pendingStatus) {
          throw new NotFoundException('Pending status not found. Please create it first.');
        }

        // Get group information
        const group = await this.groupService.findOne(createLoanDto.groupId, user);
        if (!group) {
          throw new NotFoundException('Group not found');
        }

        // Extract unique IDs for bulk fetching
        const loanTableIds = createLoanDto.clientApplications.map(app => app.loanTableId);
        // Bulk fetch all required data using QueryBuilder
        const [clients, loanTables] = await Promise.all([
          this.batchFetchClientsWithCenter(clientIds),
          this.batchFetchLoanTables(loanTableIds)
        ]);

        // Create lookup maps for O(1) access
        const clientsMap = new Map(clients.map(client => [client.id, client]));
        const loanTablesMap = new Map(loanTables.map(table => [table.id, table]));

        // Validate all clients and loan tables exist
        for (const app of createLoanDto.clientApplications) {
          const client = clientsMap.get(app.clientId);
          const loanTable = loanTablesMap.get(app.loanTableId);
          if (!client) {
            throw new NotFoundException(`Client ${app.clientId} not found`);
          }
          if (!loanTable) {
            throw new NotFoundException(`Loan table ${app.loanTableId} not found`);
          }
          if (client.officeId !== user.office.id) {
            throw new BadRequestException('Client and staff must belong to the same office');
          }
        }

        // Create group package
        const groupPackageDto: CreateGroupPackageDto = {
          groupName: group.name,
          userId: user?.id,
          username: user?.username,
          loans: createLoanDto?.clientApplications,
          officeId: user?.office?.id,
          groupId: createLoanDto?.groupId,
        };
        // Use manager for groupPackageService if it supports custom manager, else fallback
        const groupPackage = await this.groupPackageService.create(groupPackageDto);

        // Prepare all loans for bulk creation
        const loansToCreate: LoanEntity[] = [];
        const loansWithTableIds: { loan: LoanEntity; loanTableId: string }[] = [];
        const numberOfRepayments = 4;
        const disbursementDate = new Date(createLoanDto.targetDisbursementDate);

        for (const app of createLoanDto.clientApplications) {
          const client = clientsMap.get(app.clientId);
          const loanTable = loanTablesMap.get(app.loanTableId);
          // Calculate repayment dates using optimized method
          const repaymentsDueDates = this.calculateRepaymentDatesByCenterOptimized(
            numberOfRepayments,
            client,
            disbursementDate,
          );
          const totalExpectedRepayment = loanTable.installment * numberOfRepayments;
          const installments = {
            count: numberOfRepayments,
            amount: loanTable.installment,
          };
          const loan = this.loanRepository.create({
            clientId: app.clientId,
            principal: loanTable.loanAmount,
            maximumApplicationFee: loanTable.maximumApplicationFee,
            applicationFee: loanTable.applicationFee,
            totalInterest: loanTable.totalInterest,
            serviceFee: loanTable.serviceFee,
            installments,
            totalExpectedRepayment,
            numberOfRepayments,
            groupPackage: groupPackage,
            loanProductName: '4 months business loan',
            repaymentsDueDates: { dates: repaymentsDueDates },
            expectedFirstRepaymentOnDate: repaymentsDueDates[0],
            expectedDisbursementDate: createLoanDto.targetDisbursementDate,
            repaymentEvery: 'monthly',
            timeline: {
              disbursementDate: createLoanDto.targetDisbursementDate,
              firstRepaymentDate: repaymentsDueDates[0],
              lastRepaymentDate: repaymentsDueDates[repaymentsDueDates.length - 1],
              createdBy: user.id,
              createdAt: new Date(),
            },
            apr: 83.6,
            staffId: user.id,
            userName: `${user.firstName} ${user.lastName}`,
            officeId: user.office.id,
            officeName: user.office.name,
            statusId: pendingStatus.id,
            status: pendingStatus.name,
            statusEntity: pendingStatus,
            interestBreakDown: { interest: '30%' },
            inArrears: false,
            isWrittenOff: false,
            canBeUsedForTopUp: false,
            auditDate: {
              createdBy: user.id,
              createdAt: new Date(),
            },
            groupId: group.id,
            groupName: group.name,
            businessType: app.businessType,
            disbursementDate: createLoanDto.targetDisbursementDate,
            createdAt: createLoanDto.createdAt,
          });
          loansToCreate.push(loan);
          loansWithTableIds.push({ loan, loanTableId: app.loanTableId });
        }

        // BULK SAVE ALL LOANS AT ONCE (transactional)
        const savedLoans = await manager.save(this.loanRepository.target, loansToCreate);
        for (let i = 0; i < savedLoans.length; i++) {
          loansWithTableIds[i].loan = savedLoans[i];
        }

        // BULK CREATE ALL LOAN SCHEDULES (not transactional if not supported, but should be)
       await this.createLoanSchedulesBulk(
        manager, // pass manager
        loansWithTableIds,
        groupPackage,
        loanTablesMap,
        clientsMap
      );


        // Update group package with repayment dates
        const loanPackage = await this.groupPackageService.findOne(groupPackage.id, user);
        const updatedPack = await this.groupPackageService.update(
          loanPackage.id,
          {
            repaymentDates: { dates: savedLoans[0].repaymentsDueDates },
          },
          user,
        );
        return { loans: savedLoans, loanPackage: updatedPack };
      });
    } catch (error) {
      this.logger.error('Loan creation transaction failed', error.stack || error.message);
      throw new BadRequestException(error.message);
    }
  }

  async findAll(
    query: LoanQueryDto,
    user: UserEntity,
  ): Promise<[number, LoanEntity[]]> {
    const queryBuilder = this.loanRepository.createQueryBuilder('loan');
    queryBuilder
      .leftJoinAndSelect('loan.client', 'client')
      .leftJoinAndSelect('loan.staff', 'staff')
      .leftJoinAndSelect('loan.group', 'group')
      .leftJoinAndSelect('loan.disbursedBy', 'disbursedBy')
      .leftJoinAndSelect('loan.firstApprovedBy', 'firstApprovedBy')
      .leftJoinAndSelect('loan.secondApprovalBy', 'secondApprovalBy')
      .leftJoinAndSelect('loan.office', 'office')
      .leftJoinAndSelect('loan.groupPackage', 'groupPackage');

    // Filtering logic based on user role
    if (user.role === RoleType.LOAN_OFFICER) {
      queryBuilder.andWhere('client.staffId = :staffId', { staffId: user.id });
    } else {
      // Get all offices (head office + branches)
      if (!user.office?.parent) {
        const officeIds = await this.officeService.getAllOfficeIds();
        queryBuilder.andWhere('loan.officeId IN (:...officeIds)', {
          officeIds,
        });
      } else {
        queryBuilder.andWhere('loan.officeId = :officeId', {
          officeId: user.office.id,
        });
      }
    }

    // Status filter
    if (query.status) {
      queryBuilder.andWhere('LOWER(loan.status) = :status', {
        status: query.status.toLocaleLowerCase().trim(),
      });
    }
    // BM Approved filter
    if (query.bmApproved !== undefined) {
      if (String(query.bmApproved) === 'true') {
        queryBuilder.andWhere('loan.firstApprovedById IS NOT NULL');
      } else if (String(query.bmApproved) === 'false') {
        queryBuilder.andWhere('loan.firstApprovedById IS NULL');
      }
    }
    // CM Approved filter
    if (query.cmApproved !== undefined) {
      if (String(query.cmApproved) === 'true') {
        queryBuilder.andWhere('loan.secondApprovalById IS NOT NULL');
      } else if (String(query.cmApproved) === 'false') {
        queryBuilder.andWhere('loan.secondApprovalById IS NULL');
      }
    }

    queryBuilder
      .orderBy('loan.createdAt', query.order)
      .skip(query.skip)
      .take(query.take);

    const [data, itemCount] = await queryBuilder.getManyAndCount();
    return [itemCount, data];
  }

  async findOne(id: string): Promise<LoanEntity> {
    const loan = await this.loanRepository.findOne({
      where: { id },
      relations: [
        'client',
        'staff',
        'group',
        'disbursedBy',
        'firstApprovedBy',
        'secondApprovalBy',
        'office',
        'statusEntity',
      ],
    });

    if (!loan) {
      throw new NotFoundException(`Loan with ID ${id} not found`);
    }

    return loan;
  }

  async update(
    id: string,
    updateLoanDto: UpdateLoanDto,
    user: UserEntity,
  ): Promise<LoanEntity> {
    const loan = await this.findOne(id);

    // Handle status update if statusId is provided
    if (updateLoanDto.statusId) {
      const status = await this.statusService.findOne(updateLoanDto.statusId);
      loan.statusId = status.id;
      loan.status = status.name;
      delete updateLoanDto.statusId; // Remove statusId from the DTO to avoid conflicts
      delete updateLoanDto.status; // Remove status from the DTO to avoid conflicts
    }

    // Handle loan product update if loanProductId is provided
    if (updateLoanDto.loanProductId) {
      const loanProduct = await this.productService.findOne(
        parseInt(updateLoanDto.loanProductId),
      );
      loan.loanProductName = loanProduct.productName;
      delete updateLoanDto.loanProductId; // Remove loanProductId from the DTO to avoid conflicts
      delete updateLoanDto.loanProductName; // Remove loanProductName from the DTO to avoid conflicts
    }

    // Handle group update if groupId is provided
    if (updateLoanDto.groupId) {
      const group = await this.groupService.findOne(
        updateLoanDto.groupId,
        user,
      );
      loan.groupId = group.id;
      loan.groupName = group.name;
      delete updateLoanDto.groupId; // Remove groupId from the DTO to avoid conflicts
      delete updateLoanDto.groupName; // Remove groupName from the DTO to avoid conflicts
    }

    // Update audit data
    const auditData = loan.auditDate as any;
    auditData.updatedBy = user.id;
    auditData.updatedAt = new Date();
    loan.auditDate = auditData;

    Object.assign(loan, updateLoanDto);

    return await this.loanRepository.save(loan);
  }

  async remove(id: string): Promise<void> {
    await this.loanRepository.delete(id);
  }

   async softDelete(id: string): Promise<void> {
    await this.loanRepository.softDelete(id);
  }

    async restore(id: string): Promise<void> {
      await this.loanRepository.restore(id);
    }


async findDeleted(pageOptionsDto: PageOptionsDto): Promise<{ data: LoanEntity[]; meta: PageMetaDto }> {
  const queryBuilder = this.loanRepository.createQueryBuilder('loan')
    .withDeleted()
    .where('loan.deletedAt IS NOT NULL')
    .orderBy('loan.createdAt', pageOptionsDto.order ?? 'DESC')
    .skip(pageOptionsDto.skip)
    .take(pageOptionsDto.take);

  const [data, itemCount] = await queryBuilder.getManyAndCount();
  const meta = new PageMetaDto({ itemCount, pageOptionsDto });
  return { data, meta };
    }
  // Filter methods
  async findByClient(
    clientId: string,
    pageOptionsDto: PageOptionsDto,
  ): Promise<[number, LoanEntity[]]> {
    const qb = this.loanRepository
      .createQueryBuilder('loan')
      .leftJoinAndSelect('loan.client', 'client')
      .leftJoinAndSelect('loan.staff', 'staff')
      .leftJoinAndSelect('loan.group', 'group')
      .leftJoinAndSelect('loan.disbursedBy', 'disbursedBy')
      .leftJoinAndSelect('loan.firstApprovedBy', 'firstApprovedBy')
      .leftJoinAndSelect('loan.secondApprovalBy', 'secondApprovalBy')
      .leftJoinAndSelect('loan.office', 'office')
      .leftJoinAndSelect('loan.statusEntity', 'status')
      .where('loan.clientId = :clientId', { clientId })
      .orderBy('loan.createdAt', 'DESC') // optional: order by most recent
      .skip(pageOptionsDto.skip)
      .take(pageOptionsDto.take);

    const [data, itemCount] = await qb.getManyAndCount();
    return [itemCount, data];
  }

  async findByStaff(
    staffId: string,
    pageOptionsDto: PageOptionsDto,
  ): Promise<[number, LoanEntity[]]> {
    const [data, itemCount] = await this.loanRepository.findAndCount({
      where: { staffId },
      relations: [
        'client',
        'staff',
        'group',
        'disbursedBy',
        'firstApprovedBy',
        'secondApprovalBy',
        'office',
        'statusEntity',
      ],
      skip: pageOptionsDto.skip,
      take: pageOptionsDto.take,
    });
    return [itemCount, data];
  }

  async findByGroup(
    groupId: string,
    pageOptionsDto: PageOptionsDto,
    status: string = 'Active',
  ): Promise<[number, LoanEntity[]]> {
    const [data, itemCount] = await this.loanRepository
      .createQueryBuilder('loan')
      .leftJoinAndSelect('loan.client', 'client')
      .leftJoinAndSelect('loan.staff', 'staff')
      .leftJoinAndSelect('loan.group', 'group')
      .leftJoinAndSelect('loan.statusEntity', 'statusEntity')
      .where('loan.groupId = :groupId', { groupId })
      .andWhere('loan.status = :status', { status })
      .skip(pageOptionsDto.skip)
      .take(pageOptionsDto.take)
      .groupBy('groupPackage')
      .getManyAndCount();
    return [itemCount, data];
  }

  async findByOffice(
    officeId: string,
    pageOptionsDto: PageOptionsDto,
  ): Promise<[number, LoanEntity[]]> {
    const [data, itemCount] = await this.loanRepository.findAndCount({
      where: { officeId },
      relations: [
        'client',
        'staff',
        'group',
        'disbursedBy',
        'firstApprovedBy',
        'secondApprovalBy',
        'office',
        'statusEntity',
      ],
      skip: pageOptionsDto.skip,
      take: pageOptionsDto.take,
    });
    return [itemCount, data];
  }

  async findByStatus(
    statusId: string,
    pageOptionsDto: PageOptionsDto,
  ): Promise<[number, LoanEntity[]]> {
    const [data, itemCount] = await this.loanRepository.findAndCount({
      where: { statusId },
      relations: [
        'client',
        'staff',
        'group',
        'disbursedBy',
        'firstApprovedBy',
        'secondApprovalBy',
        'office',
        'statusEntity',
      ],
      skip: pageOptionsDto.skip,
      take: pageOptionsDto.take,
    });
    return [itemCount, data];
  }

  async findInArrears(
    pageOptionsDto: PageOptionsDto,
  ): Promise<[number, LoanEntity[]]> {
    const [data, itemCount] = await this.loanRepository.findAndCount({
      where: { inArrears: true },
      relations: [
        'client',
        'staff',
        'group',
        'disbursedBy',
        'firstApprovedBy',
        'secondApprovalBy',
        'office',
        'statusEntity',
      ],
      skip: pageOptionsDto.skip,
      take: pageOptionsDto.take,
    });
    return [itemCount, data];
  }

  async findByPackageId(
    packageId: string,
    pageOptionsDto: PageOptionsDto,
  ): Promise<[number, LoanEntity[]]> {
    const queryBuilder = this.loanRepository
      .createQueryBuilder('loan')
      .leftJoinAndSelect('loan.client', 'client')
      .leftJoinAndSelect('loan.staff', 'staff')
      .leftJoinAndSelect('loan.group', 'group')
      .leftJoinAndSelect('loan.office', 'office')
      .leftJoinAndSelect('loan.groupPackage', 'groupPackage')
      .leftJoinAndSelect('loan.statusEntity', 'status')
      .where('loan.group_package_id = :packageId', { packageId });

    queryBuilder
      .orderBy('loan.createdAt', pageOptionsDto.order)
      .skip(pageOptionsDto.skip)
      .take(pageOptionsDto.take);

    const [data, itemCount] = await queryBuilder.getManyAndCount();

    return [itemCount, data];
  }

  async findWrittenOff(
    pageOptionsDto: PageOptionsDto,
  ): Promise<[number, LoanEntity[]]> {
    const [data, itemCount] = await this.loanRepository.findAndCount({
      where: { isWrittenOff: true },
      relations: [
        'client',
        'staff',
        'group',
        'disbursedBy',
        'firstApprovedBy',
        'secondApprovalBy',
        'office',
        'statusEntity',
      ],
      skip: pageOptionsDto.skip,
      take: pageOptionsDto.take,
    });
    return [itemCount, data];
  }

  async findCanBeUsedForTopUp(
    pageOptionsDto: PageOptionsDto,
  ): Promise<[number, LoanEntity[]]> {
    const [data, itemCount] = await this.loanRepository.findAndCount({
      where: { canBeUsedForTopUp: true },
      relations: [
        'client',
        'staff',
        'group',
        'disbursedBy',
        'firstApprovedBy',
        'secondApprovalBy',
        'office',
        'statusEntity',
      ],
      skip: pageOptionsDto.skip,
      take: pageOptionsDto.take,
    });
    return [itemCount, data];
  }

  async findByRepaymentFrequency(
    repaymentEvery: string,
    pageOptionsDto: PageOptionsDto,
  ): Promise<[number, LoanEntity[]]> {
    const [data, itemCount] = await this.loanRepository.findAndCount({
      where: { repaymentEvery },
      relations: [
        'client',
        'staff',
        'group',
        'disbursedBy',
        'firstApprovedBy',
        'secondApprovalBy',
        'office',
        'statusEntity',
      ],
      skip: pageOptionsDto.skip,
      take: pageOptionsDto.take,
    });
    return [itemCount, data];
  }

  async findByPrincipalRange(
    minPrincipal: number,
    maxPrincipal: number,
    pageOptionsDto: PageOptionsDto,
  ): Promise<[number, LoanEntity[]]> {
    const [data, itemCount] = await this.loanRepository.findAndCount({
      where: { principal: Between(minPrincipal, maxPrincipal) },
      relations: [
        'client',
        'staff',
        'group',
        'disbursedBy',
        'firstApprovedBy',
        'secondApprovalBy',
        'office',
        'statusEntity',
      ],
      skip: pageOptionsDto.skip,
      take: pageOptionsDto.take,
    });
    return [itemCount, data];
  }

  async findByAprRange(
    minApr: number,
    maxApr: number,
    pageOptionsDto: PageOptionsDto,
  ): Promise<[number, LoanEntity[]]> {
    const [data, itemCount] = await this.loanRepository.findAndCount({
      where: { apr: Between(minApr, maxApr) },
      relations: [
        'client',
        'staff',
        'group',
        'disbursedBy',
        'firstApprovedBy',
        'secondApprovalBy',
        'office',
        'statusEntity',
      ],
      skip: pageOptionsDto.skip,
      take: pageOptionsDto.take,
    });
    return [itemCount, data];
  }

  async findByDisbursementDateRange(
    disbursementDateFrom: Date,
    disbursementDateTo: Date,
    pageOptionsDto: PageOptionsDto,
  ): Promise<[number, LoanEntity[]]> {
    const [data, itemCount] = await this.loanRepository.findAndCount({
      where: {
        disbursementDate: Between(disbursementDateFrom, disbursementDateTo),
      },
      relations: [
        'client',
        'staff',
        'group',
        'disbursedBy',
        'firstApprovedBy',
        'secondApprovalBy',
        'office',
        'statusEntity',
      ],
      skip: pageOptionsDto.skip,
      take: pageOptionsDto.take,
    });

    return [itemCount, data];
  }

  async findByExpectedDisbursementDateRange(
    expectedDisbursementDateFrom: Date,
    expectedDisbursementDateTo: Date,
    pageOptionsDto: PageOptionsDto,
  ): Promise<[number, LoanEntity[]]> {
    const [data, itemCount] = await this.loanRepository.findAndCount({
      where: {
        expectedDisbursementDate: Between(
          expectedDisbursementDateFrom,
          expectedDisbursementDateTo,
        ),
      },
      relations: [
        'client',
        'staff',
        'group',
        'disbursedBy',
        'firstApprovedBy',
        'secondApprovalBy',
        'office',
        'statusEntity',
      ],
      skip: pageOptionsDto.skip,
      take: pageOptionsDto.take,
    });

    return [itemCount, data];
  }

  // Business logic methods
  async approveFirstLevel(
    id: string,
    approvedById: string,
    approvedByName: string,
  ): Promise<LoanEntity> {
    const loan = await this.findOne(id);

    loan.firstApprovedById = approvedById;
    loan.firstApprovedByName = approvedByName;
    loan.firstApprovedOn = new Date();
    // Set status to 'Pending Disbursement'
    let awaitingDisbursementStatus = await this.statusService.findByName(
      'Awaiting Disbursement',
    );
    if (!awaitingDisbursementStatus) {
      // Upsert: create the status if it doesn't exist
      awaitingDisbursementStatus = await this.statusService.create({
        name: 'Awaiting Disbursement',
      });
    }
    loan.statusId = awaitingDisbursementStatus.id;
    loan.status = awaitingDisbursementStatus.name;
    loan.statusEntity = awaitingDisbursementStatus;

    const auditData = loan.auditDate as any;
    auditData.firstApprovedBy = approvedById;
    auditData.firstApprovedAt = new Date();
    loan.auditDate = auditData;

    return await this.loanRepository.save(loan);
  }

  async approveSecondLevel(
    id: string,
    approvedById: string,
    approvedByName: string,
  ): Promise<LoanEntity> {
    const loan = await this.findOne(id);

    loan.secondApprovalById = approvedById;
    loan.secondApprovalByName = approvedByName;
    loan.secondApprovalOnDate = new Date();

    const auditData = loan.auditDate as any;
    auditData.secondApprovedBy = approvedById;
    auditData.secondApprovedAt = new Date();
    loan.auditDate = auditData;

    return await this.loanRepository.save(loan);
  }

  async disburse(
    id: string,
    disbursedById: string,
    disbursedByName: string,
  ): Promise<LoanEntity> {
    const loan = await this.findOne(id);

    loan.disbursedById = disbursedById;
    loan.disbursedByName = disbursedByName;
    loan.disbursementDate = new Date();

    const auditData = loan.auditDate as any;
    auditData.disbursedBy = disbursedById;
    auditData.disbursedAt = new Date();
    loan.auditDate = auditData;

    return await this.loanRepository.save(loan);
  }

  async markAsInArrears(id: string): Promise<LoanEntity> {
    const loan = await this.findOne(id);

    loan.inArrears = true;
    loan.arrearsStartDate = new Date();

    const auditData = loan.auditDate as any;
    auditData.markedInArrearsAt = new Date();
    loan.auditDate = auditData;

    return await this.loanRepository.save(loan);
  }

  async writeOff(id: string): Promise<LoanEntity> {
    const loan = await this.findOne(id);

    loan.isWrittenOff = true;

    const auditData = loan.auditDate as any;
    auditData.writtenOffAt = new Date();
    loan.auditDate = auditData;

    return await this.loanRepository.save(loan);
  }

  async rejectLoan(
    id: string,
    rejectedById: string,
    rejectedByName: string,
    user: any,
  ): Promise<LoanEntity> {
    const loan = await this.findOne(id);
    if (!loan) {
      throw new NotFoundException('Loan not found');
    }

    // Check if 'Rejected' status exists, otherwise create it
    let rejectedStatus = await this.statusService.findByName('Rejected');
    if (!rejectedStatus) {
      rejectedStatus = await this.statusService.create({ name: 'Rejected' });
    }

    loan.status = rejectedStatus.name;
    loan.statusId = rejectedStatus.id;
    loan.statusEntity = rejectedStatus;

    // Optionally update audit trail
    const auditData = (loan.auditDate as any) || {};
    auditData.rejectedAt = new Date();
    auditData.rejectedById = rejectedById;
    auditData.rejectedByName = rejectedByName;
    loan.auditDate = auditData;

    return await this.loanRepository.save(loan);
  }

  async updateNextRepaymentDate(
    id: string,
    nextRepaymentDate: Date,
  ): Promise<LoanEntity> {
    const loan = await this.findOne(id);

    loan.nextRepaymentDate = nextRepaymentDate;

    const auditData = loan.auditDate as any;
    auditData.nextRepaymentDateUpdatedAt = new Date();
    loan.auditDate = auditData;

    return await this.loanRepository.save(loan);
  }

  /**
   * Generate a loan agreement PDF for a given loan
   * @param loan LoanEntity
   * @returns Buffer (PDF file content)
   */
  async generateLoanAgreementPdf(loan: LoanEntity): Promise<Buffer> {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const buffers: Buffer[] = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => {});

    // Header
    doc.fontSize(20).text('Loan Agreement', { align: 'center' });
    doc.moveDown();

    // Parties
    doc
      .fontSize(12)
      .text(
        `Borrower: ${loan.client?.firstName || ''} ${
          loan.client?.lastName || ''
        }`,
      );
    doc.text(`Loan Officer: ${loan.userName}`);
    doc.text(`Office: ${loan.officeName}`);
    doc.text(`Loan ID: ${loan.id}`);
    doc.moveDown();

    // Loan Details
    doc.text(`Principal Amount: ${loan.principal}`);
    doc.text(`Interest: ${loan.totalInterest}`);
    doc.text(`Number of Repayments: ${loan.numberOfRepayments}`);
    doc.text(`Installment Amount: ${(loan.installments as any)?.amount}`);
    doc.text(`Expected Disbursement Date: ${loan.expectedDisbursementDate}`);
    doc.text(
      `Expected First Repayment Date: ${loan.expectedFirstRepaymentOnDate}`,
    );
    doc.text(`Repayment Frequency: ${loan.repaymentEvery}`);
    doc.moveDown();

    // Terms (simplified)
    doc.text('Terms and Conditions:', { underline: true });
    doc.text(
      '1. The borrower agrees to repay the loan according to the schedule.',
    );
    doc.text('2. Late payments may incur penalties.');
    doc.text(
      '3. The loan is subject to the terms agreed upon by both parties.',
    );
    doc.moveDown();

    // Signatures
    doc
      .text('__________________________', { continued: true })
      .text('        ', { continued: true })
      .text('__________________________');
    doc
      .text('Borrower Signature', { continued: true })
      .text('        ', { continued: true })
      .text('Loan Officer Signature');
    doc.moveDown();
    doc.text(`Date: ______________________`);

    doc.end();
    return await new Promise<Buffer>((resolve) => {
      doc.on('end', () => {
        resolve(Buffer.concat(buffers));
      });
    });
  }
}

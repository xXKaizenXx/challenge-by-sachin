import { DashboardMetricsDto } from './dto/dashboard-metrics.dto';

import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Inject,
  forwardRef,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, DataSource, Not } from 'typeorm';
import {
  GroupPackageEntity,
  GroupPackageStatus,
} from './entities/group-package.entity';
import { LoanEntity } from '../loan/entities/loan.entity';
import { UserEntity } from '../user/user.entity';
import { OfficeEntity } from '../office/entities/office.entity';
import { Center } from '../center/entities/center.entity';
import { CreateGroupPackageDto } from './dto/create-group-package.dto';
import { LoanTable } from '../loan-table/entities/loan-table.entity';
import { GroupEntity } from '../group/entities/group.entity';
import { PageOptionsDto } from '../../common/dtos/page-options.dto';
import { PageMetaDto } from '../../common/dtos/page-meta.dto';
import {
  CenterDto,
  OfficeDto,
  PaginatedGroupPackageDto,
} from './dto/paginated-group-package.dto';
import { GroupPackageFilterDto } from './dto/group-package-filter.dto';
import { LoanService } from '../loan/loan.service';
import { BulkDisburseGroupPackagesDto } from './dto';
import { StatusEntity } from '../status/entities/status.entity';
import { LoanScheduleEntity } from '../loan-schedule/entities/loan-schedule.entity';
import { LoanScheduleStatus } from 'src/constants/loan-schedule-status';
import { TransactionEntity, TransactionType } from '../transaction/entities/transaction.entity';
import { RoleType, StatusEnum } from 'src/constants';
import { GeneratorProvider } from '../../providers/generator.provider';

export interface GroupPackageWithDetails {
  groupName: string;
  systemName: string;
  groupId: string;
  installments: object;
  repaymentsDueDates: object;
  nationalIdNumber: string;
  firstName: string;
  lastName: string;
  installmentNumber: number;
  dueDate: Date;
  status: string;
  principalDue: string;
  interestDue: string;
  totalDue: string;
  principalPaid: string;
  interestPaid: string;
  totalPaid: string;
  principalOutstanding: string;
  interestOutstanding: string;
  totalOutstanding: string;
  paymentDate: Date;
  notes: string;
}

// Add this interface for group packages with loan schedules
export interface GroupPackageWithLoanSchedules {
  groupPackageId: string;
  groupName: string;
  groupId: string;
  loanId: string;
  clientId: string;
  clientFirstName: string;
  clientLastName: string;
  installmentNumber: number;
  dueDate: Date;
  principalDue: string;
  interestDue: string;
  totalDue: string;
  status: string;
}

@Injectable()
export class GroupPackageService {
  constructor(
    @InjectRepository(GroupPackageEntity)
    private readonly groupPackageRepository: Repository<GroupPackageEntity>,
    @InjectRepository(LoanEntity)
    private readonly loanRepository: Repository<LoanEntity>,
    @InjectRepository(OfficeEntity)
    private readonly officeRepository: Repository<OfficeEntity>,
    @InjectRepository(LoanTable)
    private readonly loanTableRepository: Repository<LoanTable>,
    @InjectRepository(GroupEntity)
    private readonly groupRepository: Repository<GroupEntity>,
    @InjectRepository(Center)
    private readonly centerRepository: Repository<Center>,
    @Inject(forwardRef(() => LoanService))
    private readonly loanService: LoanService,
    @InjectRepository(StatusEntity)
    private readonly statusRepository: Repository<StatusEntity>,
    @InjectRepository(LoanScheduleEntity)
    private readonly loanScheduleRepository: Repository<LoanScheduleEntity>,
    private readonly dataSource: DataSource,
  ) { }

  /**
    * Migrate base64 agreementForm files to DigitalOcean Spaces for all GroupPackages and Loans
    * - Only migrates if agreementForm is base64 (not already a URL)
    * - Updates agreementForm to URL after upload
    * - Logs successes and failures
    * - Idempotent: skips if already a URL
    */
  async migrateAgreementFormsToSpaces(): Promise<{ migrated: any[]; failed: any[] }> {
    const logger = new Logger('AgreementFormMigration');
    const migrated = [];
    const failed = [];
    // Use query builder to get all loans with base64 agreementForm (not already a URL)
    // Get all group packages with at least one loan having a base64 agreementForm
    const groupPackages = await this.groupPackageRepository
      .createQueryBuilder('gp')
      .leftJoinAndSelect('gp.loans', 'loan')
      .where('loan.agreementForm IS NOT NULL')
      .andWhere("loan.agreementForm NOT LIKE 'http%'")
      .getMany();

    for (const groupPackage of groupPackages) {
      // Find the first loan with a base64 agreementForm
      const base64Loan = groupPackage.loans.find(
        (l) => l.agreementForm && !l.agreementForm.startsWith('http')
      );
      if (!base64Loan) continue;
      try {
        // Try to parse base64 header
        const match = base64Loan.agreementForm.match(/^data:(.+);base64,(.+)$/);
        if (!match) {
          logger.warn(`GroupPackage ${groupPackage.id}: agreementForm is not valid base64, skipping.`);
          continue;
        }
        const mimeType = match[1];
        const base64Data = match[2];
        const buffer = Buffer.from(base64Data, 'base64');
        // Generate a fake Multer file object for GeneratorProvider
        const ext = mimeType.split('/')[1] ? `.${mimeType.split('/')[1]}` : '';
        const file: any = {
          originalname: `agreementForm_${groupPackage.id}${ext}`,
          buffer,
          mimetype: mimeType,
          size: buffer.length,
        };
        // Upload to Spaces
        const uploadResult = await GeneratorProvider.s3FileUpload(file, 'agreement-forms');
        // Update all loans in this package with the same base64 agreementForm
        const loansToUpdate = groupPackage.loans.filter(
          (l) => l.agreementForm === base64Loan.agreementForm
        );
        for (const loan of loansToUpdate) {
          loan.agreementForm = uploadResult.Location;
          await this.loanRepository.save(loan);
          migrated.push({ loanId: loan.id, url: uploadResult.Location });
          logger.log(`Loan ${loan.id}: agreementForm migrated to ${uploadResult.Location}`);
        }
      } catch (err) {
        // Mark all loans in this package as failed for this base64
        const loansToUpdate = groupPackage.loans.filter(
          (l) => l.agreementForm === base64Loan.agreementForm
        );
        for (const loan of loansToUpdate) {
          failed.push({ loanId: loan.id, error: err.message });
          logger.error(`Loan ${loan.id}: Migration failed: ${err.message}`);
        }
      }
    }
    return { migrated, failed };
  }

  /**
* Calculate dashboard metrics for Super User Dashboard
*/
  async getSuperUserDashboardMetrics(): Promise<DashboardMetricsDto> {
    const activeStatus = await this.statusRepository.findOne({
      where: { name: "Active" },
    });

    // 1. Total Amount (pending + partially paid)
    const totalAmountRow = await this.loanScheduleRepository
      .createQueryBuilder("ls")
      .select("COALESCE(SUM(ls.balance), 0)", "total")
      .where("ls.status IN (:...statuses)", {
        statuses: [LoanScheduleStatus.PENDING],
      })
      .getRawOne();

    const totalAmount = parseFloat(totalAmountRow?.total ?? "0");

    // 2. Amount in Arrears (principal overdue)
    const arrearsRow = await this.loanScheduleRepository
      .createQueryBuilder("ls")
      .select(
        "COALESCE(SUM(ls.principalDue) - SUM(ls.principalPaid), 0)",
        "amountInArrears"
      )
      .where("ls.dueDate < CURRENT_DATE")
      .andWhere("ls.status = :status", {
        status: LoanScheduleStatus.OVERDUE,
      })
      .getRawOne();

    const amountInArrears = parseFloat(arrearsRow?.amountInArrears || "0");

    // 3. Portfolio Value (principalDue - principalPaid for active loans)
    const portfolioRow = await this.loanScheduleRepository
      .createQueryBuilder("ls")
      .innerJoin("ls.loan", "l")
      .select(
        "COALESCE(SUM(ls.principalDue) - SUM(ls.principalPaid), 0)",
        "portfolioValue"
      )
      .where("l.status = :statusName", { statusName: activeStatus.name })
      .getRawOne();

    const portfolioValue = parseFloat(portfolioRow?.portfolioValue || "0");

    // 4. PAR(1) – overdue *yesterday*
    const par1Row = await this.loanScheduleRepository
      .createQueryBuilder("ls")
      .innerJoin("ls.loan", "l")
      .select(
        "COALESCE(SUM(ls.principalDue) - SUM(ls.principalPaid), 0)",
        "par1Value"
      )
      .where("l.status = :statusName", { statusName: activeStatus.name })
      .andWhere((qb) => {
        const sub = qb
          .subQuery()
          .select("ls2.loanId")
          .from(LoanScheduleEntity, "ls2")
          .where("ls2.dueDate <= CURRENT_DATE")
          .andWhere("ls2.status = :overdueStatus", {
            overdueStatus: LoanScheduleStatus.OVERDUE,
          })
          .getQuery();

        return "ls.loanId IN " + sub;
      })
      .getRawOne();

    const par1Value = parseFloat(par1Row?.par1Value || "0");
    const par1Percentage =
      portfolioValue > 0 ? (par1Value / portfolioValue) * 100 : 0;

    // 5. PAR(30) – overdue ≥ 30 days
    const par30Row = await this.loanScheduleRepository
      .createQueryBuilder("ls")
      .innerJoin("ls.loan", "l")
      .select(
        "COALESCE(SUM(ls.principalDue) - SUM(ls.principalPaid), 0)",
        "par30Value"
      )
      .where("l.status = :statusName", { statusName: activeStatus.name })
      .andWhere((qb) => {
        const sub = qb
          .subQuery()
          .select("ls2.loanId")
          .from(LoanScheduleEntity, "ls2")
          .where("ls2.dueDate <= CURRENT_DATE - INTERVAL '30 day'")
          .andWhere("ls2.status = :overdueStatus", {
            overdueStatus: LoanScheduleStatus.OVERDUE,
          })
          .getQuery();

        return "ls.loanId IN " + sub;
      })
      .getRawOne();

    const par30Value = parseFloat(par30Row?.par30Value || "0");
    const par30Percentage =
      portfolioValue > 0 ? parseFloat(((par30Value / portfolioValue) * 100).toFixed(1)) : 0;

    return {
      totalExpected: totalAmount,
      amountInArrears,
      portfolioValue,
      par1Ratio: par1Percentage,
      par1Value,
      par30Ratio: par30Percentage,
      par30Value,
    };
  }


  async create(dto: CreateGroupPackageDto): Promise<GroupPackageEntity> {
    if (!dto?.loans?.length)
      throw new NotFoundException('No loans found for the provided IDs');
    const amount = dto.loans.reduce((sum, l) => sum + Number(l.loanAmount), 0);
    let totalExpectedRepayment = 0;

    for (const loan of dto.loans) {
      const loanTable = await this.loanTableRepository.findOne({
        where: { id: loan.loanTableId },
      });
      totalExpectedRepayment += loanTable.installment * 4;
    }

    const entity = this.groupPackageRepository.create({
      ...dto,
      amount,
      totalExpectedRepayment,
      status: GroupPackageStatus.PENDING,
    });

    // Save group package
    const savedEntity = await this.groupPackageRepository.save(entity);

    return savedEntity;
  }

  async findAll(
    user: UserEntity,
    filterDto: GroupPackageFilterDto,
  ): Promise<GroupPackageEntity[]> {
    const where: any = {};
    if (user.role === 'loan_officer') {
      where.userId = user.id;
    } else {
      const officeIds = await this.getOfficeAndChildrenIds(user.office?.id);
      where.officeId = In(officeIds);
    }
    if (filterDto.status) {
      where.status = filterDto.status;
    }
    return this.groupPackageRepository.find({
      where,
      relations: ['loans', 'schedule'],
      skip: filterDto.skip,
      take: filterDto.take,
      order: { createdAt: 'DESC' },
    });
  }

  async findAllPaginated(
    user: UserEntity,
    filterDto: GroupPackageFilterDto,
  ): Promise<{ data: PaginatedGroupPackageDto[]; meta: PageMetaDto }> {
    // Step 1: Get all matching group package IDs (filtered, no skip/take)
    const idQueryBuilder = this.groupPackageRepository.createQueryBuilder('gp');

    if (user.role === 'loan_officer') {
      idQueryBuilder.andWhere('gp.userId = :userId', { userId: user.id });
    } else {
      const officeIds = await this.getOfficeAndChildrenIds(user.office?.id);
      idQueryBuilder.andWhere('gp.officeId IN (:...officeIds)', { officeIds });
    }
    if (filterDto.status) {
      idQueryBuilder.andWhere('gp.status = :status', {
        status: filterDto.status,
      });
    }
    if (filterDto.groupId) {
      // Check if group exists
      const groupExists = await this.groupRepository.findOne({
        where: { id: filterDto.groupId },
      });
      if (!groupExists) {
        throw new NotFoundException('Group not found');
      }
      idQueryBuilder.andWhere('gp.groupId = :groupId', {
        groupId: filterDto.groupId,
      });
    }
    console.log('filterDto', filterDto);
    if (filterDto.centerId) {
      // Check if center exists
      const center = await this.centerRepository.findOne({
        where: { id: filterDto.centerId },
      });
      if (!center) {
        throw new NotFoundException('Center not found');
      }
      // Use double quotes for reserved word "groups"
      idQueryBuilder.andWhere(
        'gp.groupId IN (SELECT g.id FROM "groups" g WHERE g.center_id = :centerId)',
        { centerId: filterDto.centerId },
      );
    }

    idQueryBuilder.orderBy('gp.createdAt', filterDto.order);
    const allIds = (await idQueryBuilder.select('gp.id').getRawMany()).map(
      (row) => row.gp_id || row.id,
    );
    const totalCount = allIds.length;

    // Step 2: Paginate IDs
    const pagedIds = allIds.slice(
      filterDto.skip,
      filterDto.skip + filterDto.take,
    );

    if (pagedIds.length === 0) {
      return {
        data: [],
        meta: new PageMetaDto({
          pageOptionsDto: filterDto,
          itemCount: totalCount,
        }),
      };
    }

    // Step 3: Get paginated results by IDs

    const queryBuilder = this.groupPackageRepository
      .createQueryBuilder('gp')
      .leftJoin('gp.loans', 'loans')
      .leftJoin('gp.user', 'user')
      .leftJoin('gp.office', 'office')
      .leftJoin('groups', 'g', 'g.id = gp.groupId')
      .leftJoin('center', 'c', 'c.id = g.center_id')
      .addSelect('COUNT(loans.id)', 'loanCount')
      .addSelect(
        'COALESCE(SUM(loans.totalExpectedRepayment), 0)',
        'totalExpectedRepayment',
      )
      .addSelect('user.username', 'username')
      .addSelect('office.id', 'officeId')
      .addSelect('office.name', 'officeName')
      .addSelect('c.id', 'centerId')
      .addSelect('c.name', 'centerName')
      .addSelect('c.centerCode', 'centerCode')
      .groupBy('gp.id')
      .addSelect('gp.groupId', 'gp_groupId')
      .addSelect('gp.groupName', 'gp_groupName')
      .addSelect('gp.createdAt', 'gp_createdAt')
      .addSelect('gp.updatedAt', 'gp_updatedAt')
      .addGroupBy('user.username')
      .addGroupBy('office.id')
      .addGroupBy('office.name')
      .addGroupBy('c.id')
      .addGroupBy('c.name')
      .addGroupBy('c.centerCode')
      .where('gp.id IN (:...ids)', { ids: pagedIds });

    if (filterDto.groupId) {
      queryBuilder.andWhere('gp.groupId = :groupId', {
        groupId: filterDto.groupId,
      });
    }
    if (filterDto.centerId) {
      queryBuilder.andWhere(
        'gp.groupId IN (SELECT g.id FROM "groups" g WHERE g.center_id = :centerId)',
        { centerId: filterDto.centerId },
      );
    }

    queryBuilder.orderBy('gp.createdAt', filterDto.order);
    const groupPackages = await queryBuilder.getRawMany();

    // Transform results
    const data: PaginatedGroupPackageDto[] = groupPackages.map(
      (pkg) =>
        new PaginatedGroupPackageDto({
          id: pkg.gp_id,
          groupId: pkg.gp_groupId,
          groupName: pkg.gp_groupName,
          userId: pkg.gp_userId,
          username: pkg.username,
          status: pkg.gp_status,
          createdAt: pkg.gp_createdAt,
          updatedAt: pkg.gp_updatedAt,
          totalExpectedRepayment: Number(pkg.totalExpectedRepayment) || 0,
          amount: pkg.gp_amount,
          loanCount: Number(pkg.loanCount) || 0,
          office: new OfficeDto({
            id: pkg.officeId,
            name: pkg.officeName,
          }),
          center: pkg.centerId ? new CenterDto({
            id: pkg.centerId,
            name: pkg.centerName,
            centerCode: pkg.centerCode,
          }) : null,
        }),
    );

    console.log('filterDto', filterDto);

    const meta = new PageMetaDto({
      pageOptionsDto: filterDto,
      itemCount: totalCount,
    });

    return { data, meta };
  }

  async findOne(id: string, user: UserEntity): Promise<GroupPackageEntity> {
    const entity = await this.groupPackageRepository.findOne({
      where: { id },
      relations: ['schedule'],
    });
    if (!entity) throw new NotFoundException('Group package not found');
    if (user.role === 'loan_officer' && entity.userId !== user.id) {
      throw new ForbiddenException(
        'You can only access your own group packages',
      );
    }
    if (user.role !== 'loan_officer') {
      const officeIds = await this.getOfficeAndChildrenIds(user.office?.id);
      if (!officeIds.includes(entity.officeId)) {
        throw new ForbiddenException(
          'You can only access group packages in your office or child offices',
        );
      }
    }
    return entity;
  }

  async update(
    id: string,
    dto: Partial<GroupPackageEntity>,
    user: UserEntity,
  ): Promise<GroupPackageEntity> {
    const entity = await this.findOne(id, user);
    Object.assign(entity, dto);
    return this.groupPackageRepository.save(entity);
  }

  /**
   * Upload group package agreement form to S3 and update package and all associated loans
   * @param packageId string - group package ID
   * @param file Express.Multer.File - uploaded file
   * @param user UserEntity - current user
   * @returns Promise<GroupPackageEntity>
   */
  async uploadAgreementForm(
    packageId: string,
    file: Express.Multer.File,
    user: UserEntity,
  ): Promise<GroupPackageEntity> {
    // Validate file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'];
    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`
      );
    }

    // Check if package exists and user has access (minimal query)
    const packageCheck = await this.groupPackageRepository
      .createQueryBuilder('gp')
      .select(['gp.id', 'gp.userId', 'gp.officeId'])
      .where('gp.id = :packageId', { packageId })
      .getOne();

    if (!packageCheck) {
      throw new NotFoundException('Group package not found');
    }

    // Check user permissions
    if (user.role === 'loan_officer' && packageCheck.userId !== user.id) {
      throw new ForbiddenException('You can only access your own group packages');
    }

    if (user.role !== 'loan_officer') {
      const officeIds = await this.getOfficeAndChildrenIds(user.office?.id);
      if (!officeIds.includes(packageCheck.officeId)) {
        throw new ForbiddenException(
          'You can only access group packages in your office or child offices',
        );
      }
    }

    // Upload file to S3
    const uploadResult = await GeneratorProvider.s3FileUpload(
      file,
      'loan-agreements',
    );

    // Update all loans with the agreement form URL
    await this.loanRepository
      .createQueryBuilder()
      .update(LoanEntity)
      .set({
        agreementForm: uploadResult.Location,
        auditDate: () => `jsonb_set(audit_date, '{agreementFormUploadedBy}', '"${user.id}"') || jsonb_set(audit_date, '{agreementFormUploadedAt}', '"${new Date().toISOString()}"')`
      })
      .where('group_package_id = :packageId', { packageId })
      .execute();

    // Return updated group package with fresh data using query builder
    return this.groupPackageRepository
      .createQueryBuilder('gp')
      .where('gp.id = :packageId', { packageId })
      .getOne();
  }

  async remove(id: string, user: UserEntity): Promise<void> {
    const entity = await this.findOne(id, user);
    // Unlink loans
    for (const loan of entity.loans) {
      loan.groupPackage = null;
      await this.loanRepository.softDelete(loan);
    }
    await this.groupPackageRepository.softDelete(id);
  }

  async softDelete(id: string): Promise<void> {
    await this.groupPackageRepository.softDelete(id);
  }

  async restore(id: string): Promise<void> {
    await this.groupPackageRepository.restore(id);
  }

  async findDeleted(pageOptionsDto: PageOptionsDto): Promise<{ data: GroupPackageEntity[]; meta: PageMetaDto }> {
    const queryBuilder = this.groupPackageRepository.createQueryBuilder('gp')
      .withDeleted()
      .where('gp.deletedAt IS NOT NULL')
      .orderBy('gp.createdAt', pageOptionsDto.order)
      .skip(pageOptionsDto.skip)
      .take(pageOptionsDto.take);

    const result = await queryBuilder.getMany();
    const meta = new PageMetaDto({ pageOptionsDto, itemCount: result.length });
    return { data: result, meta };
  }

  async approve(id: string, user: UserEntity): Promise<GroupPackageEntity> {
    if (user.role !== RoleType.BRANCH_MANAGER) {
      throw new ForbiddenException('Only branch managers can approve group packages');
    }

    const entity = this.groupPackageRepository
      .createQueryBuilder('pkg')
      .where('pkg.id = :id', { id })
      .getOne();

    if (!entity) throw new NotFoundException('Group package not found');

    // Start a transaction for atomic updates
    await this.groupPackageRepository.manager.transaction(async (manager) => {
      // Update package status
      await manager
        .createQueryBuilder()
        .update(GroupPackageEntity)
        .set({ status: GroupPackageStatus.AWAITING_DISBURSEMENT })
        .where('id = :id', { id })
        .execute();

      // Approve all related loans in one query
      await manager
        .createQueryBuilder()
        .update(LoanEntity)
        .set({
          status: StatusEnum.AWAITING_DISBURSEMENT,
          firstApprovedByName: user.username,
          firstApprovedById: user.id,
          firstApprovedOn: () => 'CURRENT_TIMESTAMP',
        })
        .where('group_package_id = :id', { id })
        .execute();
    });

    // Re-fetch updated entity if needed
    // Return the updated package details only
    return this.groupPackageRepository
      .createQueryBuilder('pkg')
      .where('pkg.id = :id', { id })
      .getOne();
  }


  async bulkDisburse(dto: BulkDisburseGroupPackagesDto, user: UserEntity) {
    // Validate user permissions (already handled by guards, but double-check if needed)
    // Fetch group packages
    const groupPackages = await this.groupPackageRepository.find({
      where: { id: In(dto.groupPackageIds) },
      relations: ['loans'],
    });
    const summary = [];
    for (const pkg of groupPackages) {
      let packageResult = {
        groupPackageId: pkg.id,
        groupName: pkg.groupName,
        success: true,
        errors: [],
        disbursedLoanIds: [],
      };
      if (!pkg.loans || pkg.loans.length === 0) {
        packageResult.success = false;
        packageResult.errors.push('No loans found in group package');
        summary.push(packageResult);
        continue;
      }
      try {
        for (const loan of pkg.loans) {
          if (loan.status !== GroupPackageStatus.AWAITING_DISBURSEMENT) {
            packageResult.errors.push(`Loan ${loan.id} not approved`);
            continue;
          }
          // Mark loan as disbursed
          loan.status = GroupPackageStatus.ACTIVE;
          loan.disbursementDate = new Date(dto.details.disbursementDate);
          loan.disbursedById = user.id;
          loan.disbursedByName = user.username;
          await this.loanRepository.save(loan);
          packageResult.disbursedLoanIds.push(loan.id);
        }
        // Update group package status if all loans are disbursed
        const allDisbursed = pkg.loans.every((l) => l.status === GroupPackageStatus.ACTIVE);
        if (allDisbursed) {
          pkg.status = GroupPackageStatus.ACTIVE;
          await this.groupPackageRepository.save(pkg);
          // Also update all loans to match package status
          for (const loan of pkg.loans) {
            loan.status = pkg.status;
            await this.loanRepository.save(loan);
          }
        }
        // Log audit (simple console log, replace with actual audit service if available)
        console.log(
          `Bulk disbursement by ${user.username} for group package ${pkg.id}`,
        );
      } catch (err) {
        packageResult.success = false;
        packageResult.errors.push(err.message);
      }
      summary.push(packageResult);
    }
    return summary;
  }


  async reject(id: string, user: UserEntity): Promise<GroupPackageEntity> {
    // Only branch managers can reject
    if (user.role !== 'branch_manager') {
      throw new ForbiddenException(
        'Only branch managers can reject group packages',
      );
    }
    const entity = await this.groupPackageRepository.findOne({
      where: { id },
      relations: ['loans'],
    });
    if (!entity) throw new NotFoundException('Group package not found');

    entity.status = GroupPackageStatus.REJECTED;
    entity.approvedBy = user.username;
    await this.groupPackageRepository.save(entity);
    // Update all loans in the package to match package status
    if (entity.loans && entity.loans.length) {
      for (const loan of entity.loans) {
        loan.status = entity.status;
        await this.loanRepository.save(loan);
      }
    }
    return entity;
  }

  async findByGroupId(groupId: string): Promise<GroupPackageEntity[]> {
    return this.groupPackageRepository.find({
      where: { groupId },
      relations: ['loans'],
    });
  }

  private async getOfficeAndChildrenIds(officeId: string): Promise<string[]> {
    if (!officeId) return [];
    const office = await this.officeRepository.findOne({
      where: { id: officeId },
      relations: ['children'],
    });
    if (!office) return [];
    const ids = [office.id];
    if (office.children && office.children.length) {
      for (const child of office.children) {
        ids.push(child.id);
        // Recursively get all descendants
        const childIds = await this.getOfficeAndChildrenIds(child.id);
        ids.push(...childIds);
      }
    }
    return ids;
  }

  async findByGroup(id: string, user: UserEntity): Promise<any> {
    const officeIds = await this.getOfficeAndChildrenIds(user.office?.id);

    const queryBuilder = this.groupPackageRepository
      .createQueryBuilder('gp')
      .innerJoin('gp.loans', 'l')
      .innerJoin('l.group', 'g')
      .innerJoin('l.client', 'c')
      .innerJoin('l.schedule', 'ls')
      .select([
        'l.installments as installments',
        'l.repaymentsDueDates as repaymentsDueDates',
        'c.nationalIdNumber as nationalIdNumber',
        'c.firstName as firstName',
        'c.lastName as lastName',
        'ls.installmentNumber as installmentNumber',
        'ls.dueDate as dueDate',
        'ls.status as status',
        'ls.principalDue as principalDue',
        'ls.interestDue as interestDue',
        'ls.totalDue as totalDue',
        'ls.id as loanScheduleId',
      ])
      .andWhere('gp.groupId = :groupId', { groupId: id })
      .andWhere('ls.status IN (:...unpaidStatuses)', {
        unpaidStatuses: ['Pending', 'Partially Paid', 'Overdue'],
      })
      .andWhere((qb) => {
        const subQuery = qb
          .subQuery()
          .select('ls2.installmentNumber')
          .from('loan_schedule', 'ls2')
          .where('ls2.loanId = l.id')
          .andWhere('ls2.status IN (:...unpaidStatuses)', {
            unpaidStatuses: ['Pending', 'Partially Paid', 'Overdue'],
          })
          .orderBy('ls2.dueDate', 'ASC')
          .limit(1)
          .getQuery();
        return 'ls.installmentNumber = (' + subQuery + ')';
      });

    // Add office filter for non-loan officer roles
    if (user.role !== 'loan_officer') {
      queryBuilder.andWhere('gp.officeId IN (:...officeIds)', { officeIds });
    }

    const result = await queryBuilder.getRawMany();
    const group = await this.groupRepository.findOne({
      where: { id },
      relations: ['center', 'staff'],
    });

    return {
      center: group.center?.name,
      groupId: group.id,
      groupName: group.name,
      staff: group.staff?.firstName + ' ' + group.staff?.lastName,
      systemName: group.systemName,
      members: result.length,
      schedules: result,
    };
  }

  async findByGroupWithLoanSchedules(
    groupId: string,
    user: UserEntity,
  ): Promise<GroupPackageWithLoanSchedules[]> {
    const officeIds = await this.getOfficeAndChildrenIds(user.office?.id);

    const queryBuilder = this.groupPackageRepository
      .createQueryBuilder('gp')
      .innerJoin('gp.loans', 'l')
      .innerJoin('l.schedule', 'ls')
      .innerJoin('l.client', 'c')
      .innerJoin('l.office', 'o')
      .select([
        'o.id as officeId',
        'o.name as officeName',
        'gp.id as groupPackageId',
        'gp.groupName as groupName',
        'gp.groupId as groupId',
        'l.id as loanId',
        'c.id as clientId',
        'c.firstName as clientFirstName',
        'c.lastName as clientLastName',
        'ls.installmentNumber as installmentNumber',
        'ls.dueDate as dueDate',
        'ls.principalDue as principalDue',
        'ls.interestDue as interestDue',
        'ls.totalDue as totalDue',
        'ls.status as status',
      ])
      .where('gp.status = :status', { status: GroupPackageStatus.ACTIVE })
      .andWhere('gp.groupId = :groupId', { groupId })
      .andWhere('ls.status IN (:...unpaidStatuses)', {
        unpaidStatuses: ['Pending', 'Partially Paid', 'Overdue'],
      })
      .andWhere((qb) => {
        const subQuery = qb
          .subQuery()
          .select('ls2.installmentNumber')
          .from('loan_schedule', 'ls2')
          .where('ls2.loanId = l.id')
          .andWhere('ls2.status IN (:...unpaidStatuses)', {
            unpaidStatuses: ['Pending', 'Partially Paid', 'Overdue'],
          })
          .orderBy('ls2.installmentNumber', 'ASC')
          .limit(1)
          .getQuery();
        return 'ls.installmentNumber = (' + subQuery + ')';
      })
      .orderBy('gp.id', 'ASC')
      .addOrderBy('l.id', 'ASC');

    // Add office filter for non-loan officer roles
    if (user.role !== 'loan_officer') {
      queryBuilder.andWhere('gp.officeId IN (:...officeIds)', { officeIds });
    }

    return await queryBuilder.getRawMany();
  }

  async getSummary(user: UserEntity): Promise<any> {
    const logger = console;
    logger.log('getSummary called for user:', user.id, 'role:', user.role);

    // Active count
    const activeQB = this.groupPackageRepository.createQueryBuilder('gp');
    if (user.role === 'loan_officer') {
      activeQB.andWhere('gp.userId = :userId', { userId: user.id });
    } else {
      const officeIds = await this.getOfficeAndChildrenIds(user.office?.id);
      activeQB.andWhere('gp.officeId IN (:...officeIds)', { officeIds });
    }
    const active = await activeQB
      .andWhere('gp.status = :status', { status: GroupPackageStatus.ACTIVE })
      .getCount();
    logger.log('Active count:', active);

    // Pending count
    const pendingQB = this.groupPackageRepository.createQueryBuilder('gp');
    if (user.role === 'loan_officer') {
      pendingQB.andWhere('gp.userId = :userId', { userId: user.id });
    } else {
      const officeIds = await this.getOfficeAndChildrenIds(user.office?.id);
      pendingQB.andWhere('gp.officeId IN (:...officeIds)', { officeIds });
    }
    const pending = await pendingQB
      .andWhere('gp.status = :status', { status: GroupPackageStatus.PENDING })
      .getCount();
    logger.log('Pending count:', pending);

    // Approved count
    const approvedQB = this.groupPackageRepository.createQueryBuilder('gp');
    if (user.role === 'loan_officer') {
      approvedQB.andWhere('gp.userId = :userId', { userId: user.id });
    } else {
      const officeIds = await this.getOfficeAndChildrenIds(user.office?.id);
      approvedQB.andWhere('gp.officeId IN (:...officeIds)', { officeIds });
    }
    const approved = await approvedQB
      .andWhere('gp.status = :status', {
        status: GroupPackageStatus.AWAITING_DISBURSEMENT,
      })
      .getCount();
    logger.log('Approved count:', approved);
    // Overdue count
    // const overdueQB = this.groupPackageRepository.createQueryBuilder('gp');
    // if (user.role === 'loan_officer') {
    //   overdueQB.andWhere('gp.userId = :userId', { userId: user.id });
    // } else {
    //   const officeIds = await this.getOfficeAndChildrenIds(user.office?.id);
    //   overdueQB.andWhere('gp.officeId IN (:...officeIds)', { officeIds });
    // }
    // const overdue = await overdueQB
    //   .andWhere('gp.status = :status', { status: 'overdue' })
    //   .getCount();
    // logger.log('Overdue count:', overdue);

    const amounts = await this.getTotalAmounts(user, logger);
    logger.log('Amounts:', amounts);

    return {
      activeGroupPackagesCount: active,
      pendingGroupPackagesCount: pending,
      awaitingDisbursementGroupPackagesCount: approved,
      // overdueGroupPackagesCount: overdue,
      ...amounts,
    };
  }

  async getTotalAmounts(user: UserEntity, logger: any = console): Promise<any> {
    const activeStatus = await this.statusRepository.findOne({
      where: { name: "Active" },
    });

    // 1. Total Amount (pending + partially paid)
    const totalAmountRow = await this.loanScheduleRepository
      .createQueryBuilder("ls")
      .select("COALESCE(SUM(ls.balance), 0)", "total")
      .where("ls.status IN (:...statuses)", {
        statuses: [LoanScheduleStatus.PENDING],
      })
      .getRawOne();

    const totalAmount = parseFloat(totalAmountRow?.total ?? "0");

    // 2. Amount in Arrears (principal overdue)
    const arrearsRow = await this.loanScheduleRepository
      .createQueryBuilder("ls")
      .select(
        "COALESCE(SUM(ls.principalDue) - SUM(ls.principalPaid), 0)",
        "amountInArrears"
      )
      .where("ls.dueDate < CURRENT_DATE")
      .andWhere("ls.status = :status", {
        status: LoanScheduleStatus.OVERDUE,
      })
      .getRawOne();

    const amountInArrears = parseFloat(arrearsRow?.amountInArrears || "0");

    // 3. Portfolio Value (principalDue - principalPaid for active loans)
    const portfolioRow = await this.loanScheduleRepository
      .createQueryBuilder("ls")
      .innerJoin("ls.loan", "l")
      .select(
        "COALESCE(SUM(ls.principalDue) - SUM(ls.principalPaid), 0)",
        "portfolioValue"
      )
      .where("l.status = :statusName", { statusName: activeStatus.name })
      .getRawOne();

    const portfolioValue = parseFloat(portfolioRow?.portfolioValue || "0");

    // 4. PAR(1) – overdue *yesterday*
    const par1Row = await this.loanScheduleRepository
      .createQueryBuilder("ls")
      .innerJoin("ls.loan", "l")
      .select(
        "COALESCE(SUM(ls.principalDue) - SUM(ls.principalPaid), 0)",
        "par1Value"
      )
      .where("l.status = :statusName", { statusName: activeStatus.name })
      .andWhere((qb) => {
        const sub = qb
          .subQuery()
          .select("ls2.loanId")
          .from(LoanScheduleEntity, "ls2")
          .where("ls2.dueDate <= CURRENT_DATE")
          .andWhere("ls2.status = :overdueStatus", {
            overdueStatus: LoanScheduleStatus.OVERDUE,
          })
          .getQuery();

        return "ls.loanId IN " + sub;
      })
      .getRawOne();

    const par1Value = parseFloat(par1Row?.par1Value || "0");
    const par1Percentage =
      portfolioValue > 0 ? (par1Value / portfolioValue) * 100 : 0;

    // 5. PAR(30) – overdue ≥ 30 days
    const par30Row = await this.loanScheduleRepository
      .createQueryBuilder("ls")
      .innerJoin("ls.loan", "l")
      .select(
        "COALESCE(SUM(ls.principalDue) - SUM(ls.principalPaid), 0)",
        "par30Value"
      )
      .where("l.status = :statusName", { statusName: activeStatus.name })
      .andWhere((qb) => {
        const sub = qb
          .subQuery()
          .select("ls2.loanId")
          .from(LoanScheduleEntity, "ls2")
          .where("ls2.dueDate <= CURRENT_DATE - INTERVAL '30 day'")
          .andWhere("ls2.status = :overdueStatus", {
            overdueStatus: LoanScheduleStatus.OVERDUE,
          })
          .getQuery();

        return "ls.loanId IN " + sub;
      })
      .getRawOne();

    const par30Value = parseFloat(par30Row?.par30Value || "0");
    const par30Percentage =
      portfolioValue > 0 ? parseFloat(((par30Value / portfolioValue) * 100).toFixed(1)) : 0;

    return {
      totalExpected: totalAmount,
      amountInArrears,
      portfolioValue,
      par1Ratio: par1Percentage,
      par1Value,
      par30Ratio: par30Percentage,
      par30Value,
    };
  }

  async getPackageDetails(id: string, user: UserEntity): Promise<GroupPackageEntity> {
    const entity = await this.groupPackageRepository
      .createQueryBuilder('gp')
      .select([
        'gp.id',
        'gp.groupId',
        'gp.groupName',
        'gp.userId',
        'gp.username',
        'gp.status',
        'gp.createdAt',
        'gp.updatedAt',
        'gp.approvedBy',
        'gp.amount',
        'gp.totalExpectedRepayment',
        'gp.officeId',
        'gp.repaymentDates'
      ])
      .leftJoinAndSelect('gp.user', 'user', 'user.id = gp.userId')
      .addSelect([
        'user.id',
        'user.username',
        'user.firstName',
        'user.lastName',
        'user.role',
        'user.phone',
        'user.email'
      ])
      .leftJoinAndSelect('gp.office', 'office', 'office.id = gp.officeId')
      .addSelect([
        'office.id',
        'office.name'
      ])
      .leftJoinAndSelect('gp.loans', 'loans')
      .addSelect([
        'loans.id',
        'loans.principal',
        'loans.expectedDisbursementDate',
        'loans.status',
        'loans.loanProductName',
        'loans.apr',
        'loans.applicationFee',
        'loans.serviceFee',
        'loans.totalInterest',
        'loans.interestBreakDown',
        'loans.numberOfRepayments',
        'loans.repaymentEvery',
        'loans.repaymentsDueDates',
        'loans.businessType'
      ])
      .leftJoinAndSelect('loans.client', 'client')
      .addSelect([
        'client.id',
        'client.firstName',
        'client.lastName',
        'client.gender',
        'client.emailAddress',
        'client.nationalIdNumber',
        'client.mobileNumber'
      ])
      .leftJoinAndSelect('loans.group', 'group')
      .addSelect([
        'group.id',
        'group.name',
        'group.systemName',
        'group.groupLeader',
        'group.createdAt'
      ])
      .leftJoinAndSelect('group.center', 'center')
      .addSelect([
        'center.id',
        'center.name',
        'center.centerCode'
      ])
      .leftJoinAndSelect('center.meetingDates', 'meetingDates')
      .addSelect([
        'meetingDates.day'
      ])
      .where('gp.id = :id', { id })
      .getOne();

    if (!entity) {
      throw new NotFoundException('Group package not found');
    }

    // Check user permissions
    if (user.role === 'loan_officer' && entity.userId !== user.id) {
      throw new ForbiddenException(
        'You can only access your own group packages',
      );
    }

    if (user.role !== 'loan_officer') {
      const officeIds = await this.getOfficeAndChildrenIds(user.office?.id);
      if (!officeIds.includes(entity.officeId)) {
        throw new ForbiddenException(
          'You can only access group packages in your office or child offices',
        );
      }
    }

    return entity;
  }

  async getPackageLoanSchedules(id: string, pageOptionsDto: PageOptionsDto): Promise<{ data: LoanScheduleEntity[]; meta: PageMetaDto }> {
    // Get the total count first
    const totalCount = await this.loanScheduleRepository
      .createQueryBuilder('schedule')
      .innerJoin('schedule.loan', 'loan')
      .where('loan.groupPackage = :packageId', { packageId: id })
      .getCount();

    // Get paginated schedules for loans in the package
    const schedules = await this.loanScheduleRepository
      .createQueryBuilder('schedule')
      .innerJoin('schedule.loan', 'loan')
      .where('loan.groupPackage = :packageId', { packageId: id })
      .orderBy('schedule.loanId', pageOptionsDto.order)
      .addOrderBy('schedule.installmentNumber', 'ASC')
      .skip(pageOptionsDto.skip)
      .take(pageOptionsDto.take)
      .getMany();

    const meta = new PageMetaDto({
      pageOptionsDto,
      itemCount: totalCount,
    });

    return { data: schedules, meta };
  }

  async getLoanAgreement(packageId: string): Promise<string> {
    // Get only the agreementForm field from the loan
    const loan = await this.loanRepository
      .createQueryBuilder('loan')
      .select('loan.agreementForm')
      .andWhere('loan.groupPackage = :packageId', { packageId })
      .getOne();

    if (!loan) {
      throw new NotFoundException('Loan not found in the specified package');
    }

    return loan.agreementForm;
  }

  async disburse(user: UserEntity) {
    const loansQueryBuilder = this.loanRepository.createQueryBuilder('loans');

    const awaitingDisbursementStatus = await this.statusRepository.findOne({
      where: { name: 'Awaiting Disbursement' },
    });

    const activeStatus = await this.statusRepository.findOne({
      where: { name: 'Active' },
    });

    //fetch all loans that are awaiting disbursement and have a target disbursement date that is today or in the past
    const loanToDisburse = await loansQueryBuilder
      .where('loans.statusId = :statusId', {
        statusId: awaitingDisbursementStatus.id,
      })
      .andWhere(`"loans"."targetDisbursementDate"::date <= CURRENT_DATE`)
      .getMany();

    //get unique group package ids
    const groupPackageIds = loanToDisburse.map((loan) => loan.groupPackage.id);
    const uniqueGroupPackageIds = [...new Set(groupPackageIds)];

    //get group packages by ids
    const groupPackages = await this.groupPackageRepository.find({
      where: { id: In(uniqueGroupPackageIds) },
    });

    //update group packages status to active
    const disbursedPackages = await loansQueryBuilder
      .update()
      .set({
        status: 'Active',
        disbursementDate: new Date(),
        disbursedById: user.id,
        disbursedByName: user.firstName + ' ' + user.lastName,
        statusId: activeStatus.id,
      })
      .where('loans.statusId = :statusId', {
        statusId: awaitingDisbursementStatus.id,
      })
      .andWhere(`"loans"."target_disbursement_date"::date <= CURRENT_DATE`)
      .execute();

    const updatedPackages = await this.groupPackageRepository
      .createQueryBuilder('packages')
      .update()
      .set({ status: GroupPackageStatus.ACTIVE })
      .where('packages.id IN (:...groupPackageIds)', {
        groupPackageIds: uniqueGroupPackageIds,
      })
      .execute();

    //create csv of loans disbursed with headers:   'Disbursement Date','Name', 'Bank Account','Bank Name', 'Branch Code', 'Amount',
    const ids = loanToDisburse.map((loan) => loan.id);
    const rows = await this.loanRepository
      .createQueryBuilder('l')
      .innerJoin('l.client', 'c')
      .innerJoin('c.bank', 'b')
      .select('CAST(l.disbursement_date AS date)', 'disbursement_date')
      .addSelect("concat(c.first_name, ' ', c.last_name)", 'names')
      .addSelect('c.bank_account_number', 'bank_account_number')
      .addSelect('b.name', 'bank')
      .addSelect('b.branch_code', 'branch_code')
      .addSelect('l.principal', 'principal')
      .where('l.id IN (:...ids)', { ids })
      .getRawMany();

    //send email of loans disbursed as csv to mateo.zanetic@mlfafrica.org
    // const email = 'mateo.zanetic@mlfafrica.org';
    // const subject = 'Loans Disbursed';
    // const message = 'Loans have been disbursed successfully';
    // await this.emailService.sendEmail(email, subject, message);

    return rows;
  }


  async getPackageTransactions(
    packageId: string,
    pageOptionsDto: PageOptionsDto
  ): Promise<{ data: TransactionEntity[]; meta: PageMetaDto }> {
    // Verify package exists
    const packageExists = await this.groupPackageRepository
      .createQueryBuilder('gp')
      .where('gp.id = :packageId', { packageId })
      .getOne();

    if (!packageExists) {
      throw new NotFoundException('Group package not found');
    }

    // Get total count
    const totalCount = await this.dataSource
      .getRepository(TransactionEntity)
      .createQueryBuilder('transaction')
      .innerJoin('transaction.loan', 'loan')
      .where('loan.groupPackage = :packageId', { packageId })
      .andWhere('transaction.transactionType IN (:...types)', {
        types: [TransactionType.DISBURSEMENT, TransactionType.REPAYMENT]
      })
      .getCount();

    // Get paginated transactions
    const transactions = await this.dataSource
      .getRepository(TransactionEntity)
      .createQueryBuilder('transaction')
      .innerJoin('transaction.loan', 'loan')
      .innerJoin('loan.client', 'client')
      .where('loan.groupPackage = :packageId', { packageId })
      .andWhere('transaction.transactionType IN (:...types)', {
        types: [TransactionType.DISBURSEMENT, TransactionType.REPAYMENT]
      })
      .orderBy('transaction.transactionDate', pageOptionsDto.order)
      .addOrderBy('transaction.createdAt', 'DESC')
      .skip(pageOptionsDto.skip)
      .take(pageOptionsDto.take)
      .getMany();

    const meta = new PageMetaDto({ pageOptionsDto, itemCount: totalCount });
    return { data: transactions, meta };
  }

  async getPackageTransactionsByLoanId(
    loanId: string,
    pageOptionsDto: PageOptionsDto
  ): Promise<{ data: TransactionEntity[]; meta: PageMetaDto }> {
    // Verify package exists
    const loanExists = await this.loanRepository
      .createQueryBuilder('l')
      .where('l.id = :loanId', { loanId })
      .getOne();

    if (!loanExists) {
      throw new NotFoundException('Loan not found');
    }

    // Get total count
    const totalCount = await this.dataSource
      .getRepository(TransactionEntity)
      .createQueryBuilder('transaction')
      .innerJoin('transaction.loan', 'loan')
      .where('loan.id = :loanId', { loanId })
      .andWhere('transaction.transactionType IN (:...types)', {
        types: [TransactionType.DISBURSEMENT, TransactionType.REPAYMENT]
      })
      .getCount();

    // Get paginated transactions
    const transactions = await this.dataSource
      .getRepository(TransactionEntity)
      .createQueryBuilder('transaction')
      .innerJoin('transaction.loan', 'loan')
      .innerJoin('loan.client', 'client')
      .where('loan.id = :loanId', { loanId })
      .andWhere('transaction.transactionType IN (:...types)', {
        types: [TransactionType.DISBURSEMENT, TransactionType.REPAYMENT]
      })
      .orderBy('transaction.transactionDate', pageOptionsDto.order)
      .addOrderBy('transaction.createdAt', 'DESC')
      .skip(pageOptionsDto.skip)
      .take(pageOptionsDto.take)
      .getMany();

    const meta = new PageMetaDto({ pageOptionsDto, itemCount: totalCount });
    return { data: transactions, meta };
  }

  async getPackageBalance(
    packageId: string,
    user: UserEntity,
  ): Promise<{
    groupPackageId: string;
    groupName: string;
    totalBalance: number;
    principalOutstanding: number;
    interestOutstanding: number;
    penaltyOutstanding: number;
    applicationFeeOutstanding: number;
    serviceFeeOutstanding: number;
    lastUpdated: Date;
    status: string;
  }> {
    // First verify the package exists (minimal select) so we can return 404 vs 403 correctly
    const exists = await this.groupPackageRepository
      .createQueryBuilder('gp')
      .select('gp.id')
      .where('gp.id = :packageId', { packageId })
      .getOne();

    if (!exists) throw new NotFoundException('Group package not found');

    // Fetch only the required fields and enforce access control using the query builder
    const qb = this.groupPackageRepository
      .createQueryBuilder('gp')
      .select([
        'gp.id',
        'gp.groupName',
        'gp.officeId',
        'gp.status',
        'gp.updatedAt',
        'gp.userId',
      ])
      .where('gp.id = :packageId', { packageId });

    if (user.role === 'loan_officer') {
      qb.andWhere('gp.userId = :userId', { userId: user.id });
    } else {
      const officeIds = await this.getOfficeAndChildrenIds(user.office?.id);
      qb.andWhere('gp.officeId IN (:...officeIds)', { officeIds });
    }

    const groupPackage = await qb.getOne();
    if (!groupPackage) {
      // Package exists but user has no access
      throw new ForbiddenException('You can only access this group package');
    }

    // Calculate balance from loan schedules
    const balanceQuery = await this.loanScheduleRepository
      .createQueryBuilder('ls')
      .innerJoin('ls.loan', 'l')
      .select([
        'COALESCE(SUM(ls.principalDue - ls.principalPaid), 0) as principalOutstanding',
        'COALESCE(SUM(ls.interestDue - ls.interestPaid), 0) as interestOutstanding',
        'COALESCE(SUM(ls.penaltyDue - ls.penaltyPaid), 0) as penaltyOutstanding',
        'COALESCE(SUM(ls.applicationFeeDue - COALESCE(ls.applicationFeePaid, 0)), 0) as applicationFeeOutstanding',
        'COALESCE(SUM(ls.serviceFeeDue - COALESCE(ls.serviceFeePaid, 0)), 0) as serviceFeeOutstanding',
        'COALESCE(SUM(ls.balance), 0) as totalBalance',
        'MAX(ls.updatedAt) as lastUpdated',
      ])
      .where('l.groupPackage = :packageId', { packageId })
      .andWhere('ls.status IN (:...statuses)', {
        statuses: [
          LoanScheduleStatus.PENDING,
          LoanScheduleStatus.PARTIALLY_PAID,
          LoanScheduleStatus.OVERDUE,
        ],
      })
      .getRawOne();

    return {
      groupPackageId: groupPackage.id,
      groupName: groupPackage.groupName,
      totalBalance: parseFloat(balanceQuery?.totalBalance || '0'),
      principalOutstanding: parseFloat(balanceQuery?.principalOutstanding || '0'),
      interestOutstanding: parseFloat(balanceQuery?.interestOutstanding || '0'),
      penaltyOutstanding: parseFloat(balanceQuery?.penaltyOutstanding || '0'),
      applicationFeeOutstanding: parseFloat(balanceQuery?.applicationFeeOutstanding || '0'),
      serviceFeeOutstanding: parseFloat(balanceQuery?.serviceFeeOutstanding || '0'),
      lastUpdated: balanceQuery?.lastUpdated || groupPackage.updatedAt,
      status: groupPackage.status,
    };
  }
}

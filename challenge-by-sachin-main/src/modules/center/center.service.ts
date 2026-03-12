import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Not, Repository, In } from 'typeorm';
import { Center } from './entities/center.entity';
import { CreateCenterDto } from './dto/create-center.dto';
import { UpdateCenterDto } from './dto/update-center.dto';
import { UserService } from '../user/user.service';
import { RoleType } from '../../constants/role-type';
import { BadRequestException } from '@nestjs/common';
import { OfficeService } from '../office/office.service';
import { UserEntity } from '../user/user.entity';
import { CenterMeetingDatesService } from '../center-meeting-dates/center-meeting-dates.service';
import { CenterDto } from './dto/center.dto';
import { PageMetaDto, PageOptionsDto } from 'src/common/dtos';
import { CenterSummaryDto } from './dto/center-summary.dto';
import { ClientEntity } from '../client/entities/client.entity';
import { GroupEntity } from '../group/entities/group.entity';
import { LoanScheduleEntity } from '../loan-schedule/entities/loan-schedule.entity';
import { LoanEntity } from '../loan/entities/loan.entity';
import { GroupPackageEntity } from '../group-package/entities/group-package.entity';

@Injectable()
export class CenterService {
  constructor(
    @InjectRepository(Center)
    private readonly centerRepository: Repository<Center>,
    private readonly userService: UserService,
    private readonly officeService: OfficeService,
    private readonly centerMeetingDatesService: CenterMeetingDatesService,
    @InjectRepository(ClientEntity)
    private readonly clientRepository: Repository<ClientEntity>,
    @InjectRepository(GroupEntity)
    private readonly groupRepository: Repository<GroupEntity>,
  ) { }

  /**
   * Generate the next available 3-letter uppercase code in lexicographical order (AAA, AAB, ... ZZZ)
   */
  async generateNextCenterCode(): Promise<string> {
    // Get all existing centerCodes
    const centers = await this.centerRepository.find({
      select: ['centerCode'],
    });
    const codes = centers.map((c) => c.centerCode).filter(Boolean);
    if (codes.length === 0) return 'AAA';
    // Find the max code
    let maxCode = codes[0];
    for (const code of codes) {
      if (code > maxCode) maxCode = code;
    }
    // Increment the code
    const nextCode = this.incrementCode(maxCode);
    // Ensure uniqueness (in case of gaps)
    let candidate = nextCode;
    while (codes.includes(candidate)) {
      candidate = this.incrementCode(candidate);
    }
    return candidate;
  }

  /**
   * Increment a 3-letter uppercase code (e.g., AAA -> AAB, ... ZZZ wraps to AAA)
   */
  incrementCode(code: string): string {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const arr = code.split('').map((c) => letters.indexOf(c));
    for (let i = 2; i >= 0; i--) {
      if (arr[i] < 25) {
        arr[i]++;
        for (let j = i + 1; j < 3; j++) arr[j] = 0;
        break;
      }
    }
    return arr.map((i) => letters[i]).join('');
  }

  async create(createCenterDto: CreateCenterDto): Promise<CenterDto> {
    // Validate userId is a loan officer
    const staff = await this.userService.findOne({
      id: createCenterDto.userId,
    });
    if (!staff) {
      throw new BadRequestException('Staff (loan officer) not found');
    }
    if (staff.role !== RoleType.LOAN_OFFICER) {
      throw new BadRequestException('Assigned staff must be a loan officer');
    }
    if (!staff.office) {
      throw new BadRequestException(
        'Loan officer must be assigned to an office',
      );
    }

    // Fetch the meeting date entity
    const meetingDates = await this.centerMeetingDatesService.findOne(
      createCenterDto.meetingDateId,
    );
    if (!meetingDates) {
      throw new BadRequestException('Meeting date not found');
    }

    // Generate next available centerCode
    const centerCode = await this.generateNextCenterCode();

    // Create the center entity, assigning the relation and required fields
    const center = this.centerRepository.create({
      name: createCenterDto.name,
      user: staff.id,
      staffName: `${staff.firstName || ''} ${staff.lastName || ''}`.trim(),
      office: staff.office.id,
      officeName: staff.office.name,
      createdBy: new Date(),
      meetingDates: meetingDates,
      meetingTime: createCenterDto.meetingTime,
      centerCode: centerCode,
    });
    return new CenterDto(await this.centerRepository.save(center));
  }


  /**
    * Transfer a center from one loan officer to another
    */
  //  
  async transferCenter(centerId: string, fromLoanOfficerId: string, toLoanOfficerId: string, req: any): Promise<CenterDto> {
    return await this.centerRepository.manager.transaction(async (manager) => {
      // Find the center
      const center = await manager.findOne(Center, { where: { id: centerId } });
      if (!center) {
        throw new NotFoundException('Center not found');
      }
      // Check current loan officer
      if (center.user !== fromLoanOfficerId) {
        throw new BadRequestException('Center is not assigned to the specified current loan officer');
      }
      // Find new loan officer
      const newOfficer = await this.userService.findOne({ id: toLoanOfficerId });
      if (!newOfficer) {
        throw new NotFoundException('New loan officer not found');
      }
      if (newOfficer.role !== RoleType.LOAN_OFFICER) {
        throw new BadRequestException('New user is not a loan officer');
      }
      if (!newOfficer.office) {
        throw new BadRequestException('New loan officer must be assigned to an office');
      }

      // Transfer all clients in the center (direct and via groups)
      const clientRepo = manager.getRepository(ClientEntity);
      const groupRepo = manager.getRepository(GroupEntity);
      const groups = await groupRepo.find({ where: { center: { id: centerId } } });
      const groupIds = groups.map(g => g.id);

      // Update all clients whose group is in these groups
      if (groupIds.length > 0) {
        await clientRepo
          .createQueryBuilder()
          .update(ClientEntity)
          .set({ staffId: newOfficer.id })
          .where('group_id IN (:...groupIds)', { groupIds })
          .execute();
        // Audit log for each client in those groups
        const groupClients = await clientRepo.find({ where: { group: { id: In(groupIds) } } });
        for (const client of groupClients) {
          let auditData = Array.isArray(client.auditData) ? client.auditData : [];
          auditData.push({
            action: 'TRANSFER_CLIENT',
            entityType: 'Client',
            entityId: client.id,
            details: {
              fromLoanOfficerId,
              toLoanOfficerId,
              transferredBy: 'system', // Replace with actual user if available
              transferredAt: new Date().toISOString(),
            },
          });
          await clientRepo.update(client.id, { auditData });
        }
      }
      // Optionally, also update clients directly linked to the center (if any)
      const directClients = await clientRepo.find({ where: { center: { id: centerId } } });
      if (directClients.length > 0) {
        await clientRepo
          .createQueryBuilder()
          .update(ClientEntity)
          .set({ staffId: newOfficer.id })
          .where('center = :centerId', { centerId })
          .execute();
        for (const client of directClients) {
          let auditData = Array.isArray(client.auditData) ? client.auditData : [];
          auditData.push({
            action: 'TRANSFER_CLIENT',
            entityType: 'Client',
            entityId: client.id,
            details: {
              fromLoanOfficerId,
              toLoanOfficerId,
              transferredBy: 'system', // Replace with actual user if available
              transferredAt: new Date().toISOString(),
            },
          });
          await clientRepo.update(client.id, { auditData });
        }
      }

      // Transfer all groups in the center
      // groupRepo already declared above if present, so do not redeclare
      await groupRepo
        .createQueryBuilder()
        .update(GroupEntity)
        .set({ staff: newOfficer, staffName: `${newOfficer.firstName || ''} ${newOfficer.lastName || ''}`.trim() })
        .set({ staff: newOfficer, staffName: `${newOfficer.firstName || ''} ${newOfficer.lastName || ''}`.trim() })
        .where('center = :centerId', { centerId })
        .execute();

      // --- Update all group packages under the center ---
      // groups and groupIds already declared above
      if (groupIds.length > 0) {
        // 2. Update all group packages for these groups
        const groupPackageRepo = manager.getRepository(GroupPackageEntity);
        const groupPackages = await groupPackageRepo.find({ where: { groupId: In(groupIds) } });
        const groupPackageIds = groupPackages.map(pkg => pkg.id);
        await groupPackageRepo
          .createQueryBuilder()
          .update()
          .set({ userId: newOfficer.id, username: `${newOfficer.firstName || ''} ${newOfficer.lastName || ''}`.trim() })
          .where('groupId IN (:...groupIds)', { groupIds })
          .execute();

        // --- Update all loans in those group packages ---
        if (groupPackageIds.length > 0) {
          const loanRepo = manager.getRepository(LoanEntity);
          const loans = await loanRepo.find({ where: { groupPackage: { id: In(groupPackageIds) } } });
          const loanIds = loans.map(loan => loan.id);
          await loanRepo
            .createQueryBuilder()
            .update()
            .set({ staffId: newOfficer.id, userName: `${newOfficer.firstName || ''} ${newOfficer.lastName || ''}`.trim() })
            .where('group_package_id IN (:...groupPackageIds)', { groupPackageIds })
            .execute();

          // --- Update all loan schedules for those loans ---
          if (loanIds.length > 0) {
            const loanScheduleRepo = manager.getRepository(LoanScheduleEntity);
            await loanScheduleRepo
              .createQueryBuilder()
              .update()
              .set({ staffId: newOfficer.id })
              .where('loanId IN (:...loanIds)', { loanIds })
              .execute();
          }
        }
      }

      // Update center assignment
      center.user = newOfficer.id;
      center.staffName = `${newOfficer.firstName || ''} ${newOfficer.lastName || ''}`.trim();
      center.office = newOfficer.office.id;
      center.officeName = newOfficer.office.name;
      await manager.save(center);
      return new CenterDto(center);
    });
  }

  async findAll(
    user: UserEntity,
    pageOptionsDto: PageOptionsDto,
  ): Promise<[number, any[]]> {
    let queryBuilder = this.centerRepository
      .createQueryBuilder('center')
      .leftJoinAndSelect('center.meetingDates', 'meetingDates');

    if (user.role === RoleType.LOAN_OFFICER) {
      queryBuilder = queryBuilder.where('center.user = :userId', { userId: user.id });
    } else {
      const officeIds = await this.getAllDescendantOfficeIds(user.office.id);
      queryBuilder = queryBuilder.where('center.office IN (:...officeIds)', { officeIds });
    }

    // Name filter (case-insensitive, partial match)
    if (pageOptionsDto.name) {
      queryBuilder = queryBuilder.andWhere('LOWER(center.name) LIKE LOWER(:name)', {
        name: `%${pageOptionsDto.name}%`,
      });
    }

    if (pageOptionsDto.userId) {
      queryBuilder = queryBuilder.andWhere('center.user = :userId', { userId: pageOptionsDto.userId });
    }

    queryBuilder
      .orderBy('center.createdAt', pageOptionsDto.order ?? 'DESC')
      .skip(pageOptionsDto.skip)
      .take(pageOptionsDto.take);

    const [centers, itemCount] = await queryBuilder.getManyAndCount();
    return [itemCount, centers];
  }

  async findOne(id: string): Promise<CenterDto | null> {
    const results = await this.centerRepository
      .createQueryBuilder('center')
      .leftJoinAndSelect('center.meetingDates', 'meetingDates')
      .where('center.id = :centerId', { centerId: id })
      .getOne();

    console.log('RESULTS', results);
    return results;
  }

  async update(
    id: string,
    updateCenterDto: UpdateCenterDto,
  ): Promise<CenterDto | null> {
    await this.centerRepository.update(id, updateCenterDto);
    const center = await this.centerRepository.findOne({ where: { id } });
    return center ? new CenterDto(center) : null;
  }

  // Helper to get all descendant office IDs (including the given office)
  private async getAllDescendantOfficeIds(officeId: string): Promise<string[]> {
    const office = await this.officeService.findOne(officeId);
    if (!office) return [];
    const ids = [office.id];
    if (office.children && office.children.length > 0) {
      for (const child of office.children) {
        const childIds = await this.getAllDescendantOfficeIds(child.id);
        ids.push(...childIds);
      }
    } else {
      // Fetch children if not loaded
      const children = await this.officeService.findOfficesByParent(officeId);
      for (const child of children) {
        const childIds = await this.getAllDescendantOfficeIds(child.id);
        ids.push(...childIds);
      }
    }
    return ids;
  }

  async getSummary(id: string): Promise<CenterSummaryDto> {
    const center = await this.centerRepository.findOne({ where: { id } });
    if (!center) {
      throw new NotFoundException('Center not found');
    }

    const totalGroups = await this.groupRepository
      .createQueryBuilder('group')
      .where('group.center = :centerId', { centerId: id })
      .getCount();

    const row = await this.clientRepository
      .createQueryBuilder('c')
      .select('COUNT(*)', 'totalClients')
      .addSelect(
        'COUNT(*) FILTER (WHERE c."group_id" IS NULL)',
        'ungroupedClients',
      )
      .addSelect(
        'COUNT(*) FILTER (WHERE c."group_id" IS NOT NULL)',
        'groupedClients',
      )
      .where('c."center_id" = :centerId', { centerId: id })
      .getRawOne();

    const { totalClients, ungroupedClients, groupedClients } = row;

    return new CenterSummaryDto({
      id,
      totalClients,
      totalGroups,
      ungroupedClients,
      groupedClients,
    });
  }

  async softDelete(id: string): Promise<void> {
    await this.centerRepository.softDelete(id);
  }

  async restore(id: string): Promise<void> {
    await this.centerRepository.restore(id);
  }


  async findDeleted(pageOptionsDto: PageOptionsDto): Promise<{ data: Center[]; meta: PageMetaDto }> {
    const queryBuilder = this.centerRepository.createQueryBuilder('center')
      .withDeleted()
      .where('center.deletedAt IS NOT NULL')
      .orderBy('center.createdAt', pageOptionsDto.order ?? 'DESC')
      .skip(pageOptionsDto.skip)
      .take(pageOptionsDto.take);

    const [data, itemCount] = await queryBuilder.getManyAndCount();
    const meta = new PageMetaDto({ pageOptionsDto, itemCount });
    return { data, meta };
  }

  async remove(id: string): Promise<void> {
    await this.centerRepository.delete(id);
  }

}

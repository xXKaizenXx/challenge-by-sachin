import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LoanScheduleEntity } from '../loan-schedule/entities/loan-schedule.entity';
import { CreateCollectionSheetDto } from './dto/create-collection-sheet.dto';
import { UpdateCollectionSheetDto } from './dto/update-collection-sheet.dto';
import { PageMetaDto, PageOptionsDto } from 'src/common/dtos';
import { CollectionSheetRowDto } from './dto/collection-sheet-row.dto';
import { RoleType } from 'src/constants';

@Injectable()
export class CollectionSheetService {
  constructor(
    @InjectRepository(LoanScheduleEntity)
    private readonly loanScheduleRepository: Repository<LoanScheduleEntity>,
  ) { }

  // Logging utility for service
  private log(message: string, data?: any) {
    console.log(`[CollectionSheetService] ${message}`, data ?? '');
  }

async getCollectionSheet(
  filters: any,
  pageOptionsDto: PageOptionsDto,
  req: any
): Promise<{ itemCount: number; data: any[]; pageMeta: PageMetaDto }> {
  let { startDate, endDate, centerId, staffId, groupId, grouping = 'center' } = filters;

  const today = new Date().toISOString().slice(0, 10);
  // startDate = startDate ?? today;
  // endDate = endDate ?? today;

  const queryBuilder = this.loanScheduleRepository.createQueryBuilder('schedule')
    .leftJoinAndSelect('schedule.loan', 'loan')
    .leftJoinAndSelect('loan.staff', 'staff')
    .leftJoinAndSelect('loan.group', 'group')
    .leftJoinAndSelect('group.center', 'center')
    .leftJoinAndSelect('loan.client', 'client');

  // Role-based filter
  const userRole = req.user.role;
  const userId = req.user.id;

  console.log('User role:', req.user?.role);
console.log('User ID:', req.user?.id);
console.log('Original staffId filter:', staffId);


  if (userRole === RoleType.LOAN_OFFICER) {
    // Loan officers see only their own schedules
    queryBuilder.andWhere('schedule.staffId = :userId', { userId });
  } else {
    // For branch manager, IT, super user: optional staffId filter
    if (staffId) queryBuilder.andWhere('schedule.staffId = :staffId', { staffId });
  }

  if (startDate) queryBuilder.andWhere('schedule.dueDate >= :startDate', { startDate });
  if (endDate) queryBuilder.andWhere('schedule.dueDate <= :endDate', { endDate });
  if (centerId) queryBuilder.andWhere('center.id = :centerId', { centerId });
  if (groupId) queryBuilder.andWhere('group.id = :groupId', { groupId });

  queryBuilder
    .orderBy('schedule.createdAt', filters.orderBy)
    .skip(pageOptionsDto.skip)
    .take(pageOptionsDto.take);

  const [schedules, itemCount] = await queryBuilder.getManyAndCount();

  const rows = schedules.map(schedule => ({
    loanId: schedule.loanId,
    dueDate: schedule.dueDate,
    principalDue: Number(schedule.principalDue),
    totalDue: Number(schedule.totalDue),
    status: schedule.status,
    client: schedule.loan?.client
      ? {
          id: schedule.loan.client.id,
          name: `${schedule.loan.client.firstName} ${schedule.loan.client.lastName}`.trim(),
          mobileNumber: schedule.loan.client.mobileNumber,
          bankAccountNumber: schedule.loan.client.bankAccountNumber,
        }
      : null,
    staff: schedule.loan?.staff
      ? { id: schedule.loan.staff.id, name: schedule.loan.staff.username }
      : { id: schedule.staffId, name: null },
    group: schedule.loan?.group
      ? { id: schedule.loan.group.id, name: schedule.loan.group.name, systemName: schedule.loan.group.systemName }
      : null,
    center: schedule.loan?.group?.center
      ? { id: schedule.loan.group.center.id, name: schedule.loan.group.center.name, centerCode: schedule.loan.group.center.centerCode }
      : { id: schedule.centerId, name: null },
    office: schedule.officeId
      ? { id: schedule.officeId, name: schedule.loan?.group.officeName }
      : null,
  }));

  const grouped = this.groupData(rows, grouping);
  const pageMeta = new PageMetaDto({ itemCount, pageOptionsDto });

  return { itemCount, data: grouped, pageMeta };
}


  private groupData(rows: any[], grouping: string): any[] {
    const groupKeyFn: Record<string, (row: any) => { id: string; name: string } | null> = {
      center: row => row.center,
      staff: row => row.staff,
      group: row => row.group,
      client: row => row.client,
      office: row => row.office,
    };

    const keyFn = groupKeyFn[grouping];
    if (!keyFn) return rows;

    const grouped = rows.reduce((acc, row) => {
      const key = keyFn(row);
      if (!key || !key.id) return acc;
      if (!acc[key.id]) {
        acc[key.id] = { id: key.id, name: key.name, children: [] };
      }
      acc[key.id].children.push(row);
      return acc;
    }, {} as Record<string, any>);

    return Object.values(grouped);
  }


  create(createCollectionSheetDto: CreateCollectionSheetDto) {
    this.log('Creating a new collection sheet', createCollectionSheetDto);
    return 'This action adds a new collectionSheet';
  }

  findAll() {
    this.log('Fetching all collection sheets');
    return `This action returns all collectionSheet`;
  }

  findOne(id: number) {
    this.log(`Fetching collection sheet with id ${id}`);
    return `This action returns a #${id} collectionSheet`;
  }

  update(id: number, updateCollectionSheetDto: UpdateCollectionSheetDto) {
    this.log(`Updating collection sheet with id ${id}`, updateCollectionSheetDto);
    return `This action updates a #${id} collectionSheet`;
  }

  remove(id: number) {
    this.log(`Removing collection sheet with id ${id}`);
    return `This action removes a #${id} collectionSheet`;
  }
}

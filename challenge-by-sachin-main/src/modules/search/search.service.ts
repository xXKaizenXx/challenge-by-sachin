import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Center } from '../center/entities/center.entity';
import { GroupEntity } from '../group/entities/group.entity';
import { UserEntity } from '../user/user.entity';
import { OfficeEntity } from '../office/entities/office.entity';
import { 
  SearchQueryDto, 
  SearchResponseDto, 
  SearchResultDto, 
  SearchEntityType 
} from './dto';
import { CenterDto } from '../center/dto/center.dto';
import { GroupDto } from '../group/dto/group.dto';
import { UserDto } from '../user/dtos/user.dto';
import { RoleType } from '../../constants/role-type';
import { ClientEntity } from '../client/entities/client.entity';
import { MiniClientDto } from '../client/dto/client.dto';
@Injectable()
export class SearchService {
  constructor(
    @InjectRepository(Center)
    private readonly centerRepository: Repository<Center>,
    @InjectRepository(GroupEntity)
    private readonly groupRepository: Repository<GroupEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(OfficeEntity)
    private readonly officeRepository: Repository<OfficeEntity>,
    @InjectRepository(ClientEntity)
    private readonly clientRepository: Repository<ClientEntity>
  ) {}

  async search(
    searchQuery: SearchQueryDto,
    currentUser: UserEntity,
  ): Promise<SearchResponseDto> {
    const startTime = Date.now();
    
    // Get office IDs that the user can access
    const accessibleOfficeIds = await this.getAccessibleOfficeIds(currentUser);
    
    const { query, entityType, take, skip, order } = searchQuery;

  let centers: SearchResultDto<{ id: string; name: string }> = new SearchResultDto(0, []);
  let groups: SearchResultDto<{ id: string; name: string }> = new SearchResultDto(0, []);
  let staff: SearchResultDto<{ id: string; name: string }> = new SearchResultDto(0, []);
  let clients: SearchResultDto<{ id: string; firstName: string; nationalIdNumber: string }> = new SearchResultDto(0, []);


    // Search centers
    if (entityType === SearchEntityType.ALL || entityType === SearchEntityType.CENTERS) {
      centers = await this.searchCenters(query, accessibleOfficeIds, currentUser, take, skip, order);
    }

    // Search groups
    if (entityType === SearchEntityType.ALL || entityType === SearchEntityType.GROUPS) {
      groups = await this.searchGroups(query, accessibleOfficeIds, currentUser, take, skip, order);
    }

    // Search staff
    if (entityType === SearchEntityType.ALL || entityType === SearchEntityType.STAFF) {
      staff = await this.searchStaff(query, accessibleOfficeIds, take, skip, order);
    }

       // Search client
    if (entityType === SearchEntityType.ALL || entityType === SearchEntityType.CLIENT) {
      clients = await this.searchClient(query, accessibleOfficeIds, take, skip, order);
    }

    // const searchTime = Date.now() - startTime;

  return new SearchResponseDto(centers, groups, staff, clients, query);
  }

  private async getAccessibleOfficeIds(user: UserEntity): Promise<string[]> {
    if (user.role === RoleType.SUPER_USER) {
      // Super users can access all offices
      const offices = await this.officeRepository.find();
      return offices.map(office => office.id);
    }

    if (user.role === RoleType.LOAN_OFFICER) {
      // Loan officers can only access their own office
      return user.office ? [user.office.id] : [];
    }

    // For other roles (BRANCH_MANAGER, etc.), get their office and descendants
    return await this.getDescendantOfficeIds(user.office?.id);
  }

  private async getDescendantOfficeIds(parentOfficeId: string): Promise<string[]> {
    if (!parentOfficeId) return [];

    const officeIds = [parentOfficeId];
    const children = await this.officeRepository.find({
      where: { parent: { id: parentOfficeId } },
    });

    for (const child of children) {
      const descendantIds = await this.getDescendantOfficeIds(child.id);
      officeIds.push(...descendantIds);
    }

    return officeIds;
  }

  private async searchCenters(
    query: string,
    officeIds: string[],
    currentUser: UserEntity,
    take: number,
    skip: number,
    order: string,
  ): Promise<SearchResultDto<{ id: string; name: string }>> {
    const queryBuilder = this.centerRepository
      .createQueryBuilder('center')
      .leftJoinAndSelect('center.meetingDates', 'meetingDates')
      .where('center.office IN (:...officeIds)', { officeIds });

    // Role-based filtering
    if (currentUser.role === RoleType.LOAN_OFFICER) {
      queryBuilder.andWhere('center.user = :userId', { userId: currentUser.id });
    }

    // Search conditions
    queryBuilder.andWhere(
      '(LOWER(center.name) ILIKE LOWER(:query) OR ' +
      'LOWER(center.centerCode) ILIKE LOWER(:query) OR ' +
      'LOWER(center.staffName) ILIKE LOWER(:query) OR ' +
      'LOWER(center.officeName) ILIKE LOWER(:query))',
      { query: `%${query}%` }
    );

    queryBuilder
      .orderBy('center.createdAt', order as 'ASC' | 'DESC')
      .skip(skip)
      .take(take);

    const [centers, count] = await queryBuilder.getManyAndCount();
  // Return only minimal data: id and name
  const minimalCenters = centers.map(center => ({ id: center.id, name: center.name }));
  return new SearchResultDto(count, minimalCenters);
  }

  private async searchGroups(
    query: string,
    officeIds: string[],
    currentUser: UserEntity,
    take: number,
    skip: number,
    order: string,
  ): Promise<SearchResultDto<{ id: string; name: string }>> {
    const queryBuilder = this.groupRepository
      .createQueryBuilder('group')
      .leftJoinAndSelect('group.status', 'status')
      .leftJoinAndSelect('group.center', 'center')
      .leftJoinAndSelect('group.staff', 'staff')
      .leftJoinAndSelect('staff.office', 'staffOffice')
      .leftJoinAndSelect('center.meetingDates', 'meetingDates')
      .leftJoinAndSelect('group.clients', 'clients');

    // Role-based filtering
    if (currentUser.role === RoleType.LOAN_OFFICER) {
      queryBuilder.where('staff.id = :staffId', { staffId: currentUser.id });
    } else {
      queryBuilder.where('staffOffice.id IN (:...officeIds)', { officeIds });
    }

    // Search conditions
    queryBuilder.andWhere(
      '(LOWER(group.name) ILIKE LOWER(:query) OR ' +
      'LOWER(group.systemName) ILIKE LOWER(:query) OR ' +
      'LOWER(group.staffName) ILIKE LOWER(:query) OR ' +
      'LOWER(group.officeName) ILIKE LOWER(:query) OR ' +
      'LOWER(center.name) ILIKE LOWER(:query))',
      { query: `%${query}%` }
    );

    queryBuilder
      .orderBy('group.createdAt', order as 'ASC' | 'DESC')
      .skip(skip)
      .take(take);

    const [groups, count] = await queryBuilder.getManyAndCount();
  // Return only minimal data: id and name
  const minimalGroups = groups.map(group => ({ id: group.id, name: group.name, systemName: group.systemName }));
  return new SearchResultDto(count, minimalGroups);
  }

  private async searchStaff(
    query: string,
    officeIds: string[],
    take: number,
    skip: number,
    order: string,
  ): Promise<SearchResultDto<{ id: string; name: string }>> {
    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.office', 'office')
      .where('office.id IN (:...officeIds)', { officeIds });

    // Search conditions
    queryBuilder.andWhere(
      '(LOWER(user.firstName) ILIKE LOWER(:query) OR ' +
      'LOWER(user.lastName) ILIKE LOWER(:query) OR ' +
      'LOWER(user.username) ILIKE LOWER(:query) OR ' +
      'LOWER(user.email) ILIKE LOWER(:query) OR ' +
      'LOWER(user.phone) ILIKE LOWER(:query) OR ' +
      'LOWER(office.name) ILIKE LOWER(:query))',
      { query: `%${query}%` }
    );

    queryBuilder
      .orderBy('user.createdAt', order as 'ASC' | 'DESC')
      .skip(skip)
      .take(take);

    const [users, count] = await queryBuilder.getManyAndCount();
  // Return only minimal data: id and name
  const minimalStaff = users.map(user => ({ id: user.id, name: `${user.firstName} ${user.lastName}`.trim() }));
  return new SearchResultDto(count, minimalStaff);
  }

  private async searchClient(
    query: string,
    officeIds: string[],
    take: number,
    skip: number,
    order: string,
  ): Promise<SearchResultDto<{ id: string; firstName: string; nationalIdNumber: string }>> {
    const queryBuilder = this.clientRepository
      .createQueryBuilder('client')
      .leftJoinAndSelect('client.office', 'office')
      .where('office.id IN (:...officeIds)', { officeIds });

    // Search conditions: name, national_id_number, client_number, phone_number, email
    queryBuilder.andWhere(
      '(LOWER(client.firstName) ILIKE LOWER(:query) OR ' +
      'LOWER(client.lastName) ILIKE LOWER(:query) OR ' +
      'LOWER(client.nationalIdNumber) ILIKE LOWER(:query) OR ' +
      // 'LOWER(client.bankAccountNumber) ILIKE LOWER(:query) OR ' +
      'LOWER(client.mobileNumber) ILIKE LOWER(:query) OR ' +
      'LOWER(client.emailAddress) ILIKE LOWER(:query))',
      { query: `%${query}%` }
    );

    queryBuilder
      .orderBy('client.createdAt', order as 'ASC' | 'DESC')
      .skip(skip)
      .take(take);

  const [clients, count] = await queryBuilder.getManyAndCount();
  // Return only id, firstName, emailAddress, and nationalIdNumber
  const minimalClients = clients.map(client => ({
    id: client.id,
    firstName: client.firstName,
    nationalIdNumber: client.nationalIdNumber
  }));
  return new SearchResultDto(count, minimalClients);
  }
}
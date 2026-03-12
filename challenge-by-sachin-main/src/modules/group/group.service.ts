import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, DataSource, Not } from 'typeorm';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { UpdateGroupSystemNameDto } from './dto/update-group-system-name.dto';
import { GroupResponseDto } from './dto/group-response.dto';
import { GroupEntity } from './entities/group.entity';
import { UserEntity } from '../user/user.entity';
import { ClientEntity } from '../client/entities/client.entity';
import { Center } from '../center/entities/center.entity';
import { OneToOne, getRepository } from 'typeorm';
import { StatusService } from '../status/status.service';
import { GroupSummaryDto } from './dto/group.dto';
import { PageOptionsDto } from 'src/common/dtos';
import { RoleType } from 'src/constants';
import { GroupFiltersDto } from './dto/group-filters.dto';
import { GroupsResponseDto } from './dto/groups-response.dto';
import { GroupWithRelationsDto } from './dto/group-with-relations.dto';

type getGroupsArgs = {
  filters?: GroupFiltersDto;
  pageOptionsDto: PageOptionsDto;
  user: UserEntity;
};

@Injectable()
export class GroupService {
  constructor(
    @InjectRepository(GroupEntity)
    private readonly groupRepository: Repository<GroupEntity>,
    @InjectRepository(ClientEntity)
    private readonly clientRepository: Repository<ClientEntity>,
    @InjectRepository(Center)
    private readonly centerRepository: Repository<Center>,
    private readonly dataSource: DataSource,
    private statusService: StatusService,
  ) {}

  /**
   * Add one or more clients to an existing group
   */
  async addClientsToGroup(
    groupId: string,
    clientIds: string[],
    user: UserEntity,
  ): Promise<GroupWithRelationsDto[]> {
    // Find the group with center using queryBuilder
    const group = await this.groupRepository
      .createQueryBuilder('group')
      .leftJoinAndSelect('group.clients', 'clients')
      .leftJoinAndSelect('group.staff', 'staff')
      .leftJoinAndSelect('group.center', 'center')
      .where('group.id = :groupId', { groupId })
      .getOne();
    if (!group) throw new NotFoundException('Group not found');
    // Only the staff assigned to the group can add clients
    if (user.role === 'loan_officer' && group.staff.id !== user.id) {
      throw new ForbiddenException('You can only add clients to your own groups');
    }
    // Find all clients by IDs, including their group and center relation
    const clients = await this.clientRepository
      .createQueryBuilder('client')
      .leftJoinAndSelect('client.group', 'group')
      .leftJoinAndSelect('client.center', 'center')
      .leftJoinAndSelect('client.office', 'office')
      .where('client.id IN (:...clientIds)', { clientIds })
      .getMany();

    if (clients.length !== clientIds.length) {
      const foundIds = clients.map((c) => c.id);
      const notFound = clientIds.filter((id) => !foundIds.includes(id));
      throw new NotFoundException(`Clients not found or not owned by user: ${notFound.join(', ')}`);
    }

    // Check if any client is already in this group
    const alreadyInGroup = clients.filter((c) => c.group && c.group.id === groupId);
    if (alreadyInGroup.length > 0) {
      throw new ForbiddenException(
        `Clients already exist in this group: ${alreadyInGroup.map((c) => c.id).join(', ')}`,
      );
    }

    // Check if each client belongs to the same center and office as the group and loan officer
    for (const client of clients) {
      // Logging for center check
      console.log(`Validating client ${client.id}: client.center.id=${client.center?.id}, group.center.id=${group.center.id}`);
      if (!client.center || client.center.id !== group.center.id) {
        console.warn(`Client ${client.id} failed center check.`);
        throw new ForbiddenException(
          `Client ${client.id} does not belong to the same center as the group.`
        );
      }
      // Logging for office check
      if (user.office && client.office) {
        console.log(`Validating client ${client.id}: client.office.id=${client.office.id}, user.office.id=${user.office.id}`);
        if (client.office.id !== user.office.id) {
          console.warn(`Client ${client.id} failed office check.`);
          throw new ForbiddenException(
            `Client ${client.id} does not belong to the same office as the loan officer.`
          );
        }
      }
    }

    // Check if any client is already in another group
    const alreadyGrouped = clients.filter((c) => c.group && c.group.id !== groupId);
    if (alreadyGrouped.length > 0) {
      throw new ForbiddenException(
        `Clients already in another group: ${alreadyGrouped.map((c) => c.id).join(', ')}`,
      );
    }

    // Assign group and staff to each client, collect response DTOs
    const addedAt = new Date();
    const response: GroupWithRelationsDto[] = [];
    for (const client of clients) {
      client.group = group;
      client.staff = group.staff;
      await this.clientRepository.save(client);
      response.push({
        clientId: client.id,
        clientName: `${client.firstName || ''} ${client.lastName || ''}`.trim(),
        mobileNumber: client.mobileNumber,
        emailAddress: client.emailAddress,
        groupId: group.id,
        addedAt,
      });
    }
    // Update group's client list
    group.clients = await this.clientRepository.find({ where: { group: { id: groupId } } });
    await this.groupRepository.save(group);
    return response;
  }

  /**
   * Helper method to add timeline events to a group
   */
  private addTimelineEvent(
    timeline: any,
    action: string,
    description: string,
    user: UserEntity,
    details?: any,
  ): any {
    const event = {
      action,
      description,
      userId: user.id,
      userName: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
      datetime: new Date().toISOString(),
      details: details || {},
    };

    return {
      events: [...(timeline?.events || []), event],
    };
  }

  /**
   * Helper to generate the next available systemName for a group in a center
   * Format: {centerCode}{N}, where N = number of groups the center has + 1
   */
  private async generateSystemNameForCenter(
    center: Center,
    manager: Repository<GroupEntity>,
  ): Promise<string> {
    // Find all groups for this center
    const groupCount = await manager.count({
      where: { center: { id: center.id } },
    });
    // systemName = {centerCode}{N}
    return `${center.centerCode}${groupCount + 1}`;
  }

  async create(
    createGroupDto: CreateGroupDto,
    user: UserEntity,
  ): Promise<GroupEntity> {
    if (user.role !== 'loan_officer') {
      throw new ForbiddenException('Only loan officers can create groups');
    }
    return this.dataSource.transaction(async (manager) => {
      const clients = await manager
        .getRepository(ClientEntity)
        .find({ where: { id: In(createGroupDto.clients) } });
      const centerRepo = manager.getRepository(Center);
      const clientRepo = manager.getRepository(ClientEntity);
      const groupLeader = await clientRepo.findOne({
        where: { id: createGroupDto.groupLeaderId },
      });
      if (!groupLeader)
        throw new NotFoundException('Group leader client not found');
      // Ensure groupLeader is not already a leader of another group
      if (
        await manager
          .getRepository(GroupEntity)
          .findOne({ where: { groupLeader: { id: groupLeader.id } } })
      ) {
        throw new ForbiddenException(
          'This client is already a group leader of another group',
        );
      }
      // Ensure groupLeader is in clients
      if (!clients.find((c) => c.id === groupLeader.id)) {
        throw new ForbiddenException(
          'Group leader must be one of the group clients',
        );
      }
      // Ensure none of the clients are already in another group
      for (const client of clients) {
        if (client.group) {
          throw new ForbiddenException(
            `Client ${client.id} already belongs to a group`,
          );
        }
      }
      const center = await centerRepo.findOne({
        where: { id: createGroupDto.centerId },
      });
      if (!center) throw new NotFoundException('Center not found');
      center.user = user.id;
      center.staffName = `${user.firstName || ''} ${
        user.lastName || ''
      }`.trim();
      await centerRepo.save(center);
      // Generate systemName: {centerCode}{N}, where N = number of groups the center has + 1
      const systemName = await this.generateSystemNameForCenter(
        center,
        manager.getRepository(GroupEntity),
      );
      // Prepare auditData
      const auditData = {
        createdAt: new Date().toISOString(),
        createdBy: user.id,
      };
      // Prepare timeline data
      const timeline = {
        events: [
          {
            action: 'group_created',
            description: `Group "${createGroupDto.name}" was created`,
            userId: user.id,
            userName: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
            datetime: new Date().toISOString(),
            details: {
              groupName: createGroupDto.name,
              systemName,
              centerId: center.id,
              centerName: center.name,
              clientCount: clients.length,
              groupLeaderId: groupLeader.id,
              groupLeaderName: `${groupLeader.firstName} ${groupLeader.lastName}`,
            },
          },
        ],
      };
      // Get the "Pending" status
      const pendingStatus = await this.statusService.findByName('Active');
      if (!pendingStatus) {
        throw new NotFoundException(
          'Pending status not found. Please create it first.',
        );
      }
      const group = manager.getRepository(GroupEntity).create({
        ...createGroupDto,
        systemName,
        active: false,
        status: pendingStatus,
        staff: user,
        staffName: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        createdBy: user,
        clients,
        groupLeader,
        center,
        auditData,
        timeline,
        officeName: user.office?.name || '',
      });
      const savedGroup = await manager.getRepository(GroupEntity).save(group);
      // Update clients to reference this group
      for (const client of clients) {
        const checkClientLog = Object.assign(client, {
          group: savedGroup,
        });

        // console.log('checkClientLog', checkClientLog);
        const savedClient = await manager
          .getRepository(ClientEntity)
          .save(checkClientLog);
        // console.log('savedClient', savedClient);
      }
      // Update groupLeader to reference this group as led
      Object.assign(groupLeader, {
        groupLed: savedGroup,
      });
      await clientRepo.save(groupLeader);
      return savedGroup;
    });
  }

  async getGroups(
    args: getGroupsArgs,
  ): Promise<{ itemCount: number; data: GroupEntity[] }> {
    const { filters, pageOptionsDto, user } = args;
    const queryBuilder = this.groupRepository.createQueryBuilder('group');

    // Relations
    queryBuilder
      .leftJoinAndSelect('group.status', 'status')
      .leftJoinAndSelect('group.center', 'center')
      .leftJoinAndSelect('group.clients', 'clients')
      .leftJoinAndSelect('group.staff', 'staff')
      .leftJoinAndSelect('staff.office', 'staffOffice')
      .leftJoinAndSelect('group.createdBy', 'createdBy')
      .leftJoinAndSelect('createdBy.office', 'createdByOffice')
      .leftJoinAndSelect('center.meetingDates', 'meetingDates');

    // Role-based filtering
    if (user.role === RoleType.LOAN_OFFICER) {
      queryBuilder.where('staff.id = :staffId', { staffId: user.id });
    } else {
      // For other users, filter by office
      if (user.office?.name) {
        queryBuilder.where('group.officeName = :officeName', {
          officeName: user.office.name,
        });
      }
    }

    // Status filter
    if (filters?.status?.trim()) {
      const normalizedStatus = filters.status.trim();
      queryBuilder.andWhere('status.name ILIKE :statusName', {
        statusName: normalizedStatus,
      });
    }

    // Search term filter
    if (filters?.searchTerm?.trim()) {
      const term = filters.searchTerm.trim();
      queryBuilder.andWhere('"group"."name" ILIKE :search', {
        search: `%${term}%`,
      });
      // If users might type % or _ and you want literal matching, use:
      // const safe = term.replace(/[\\%_]/g, '\\$&');
      // qb.andWhere(`grp.name ILIKE :search ESCAPE '\\'`, { search: `%${safe}%` });
    }

    // Pagination
    queryBuilder
      .orderBy('group.createdAt', pageOptionsDto.order)
      .skip(pageOptionsDto.skip)
      .take(pageOptionsDto.take);

    const [groups, itemCount] = await queryBuilder.getManyAndCount();

    // Map meetingDates for each group
    const data = groups.map((group) => {
      let meetingDatesObj = null;
      // Defensive: center.meetingDates may be array or object
      if (group.center && group.center.meetingDates) {
        // console.log('Raw meetingDates:', group.center.meetingDates);
        // If array, take first; if object, use directly
        const meeting = Array.isArray(group.center.meetingDates)
          ? group.center.meetingDates[0]
          : group.center.meetingDates;
        // console.log('Processed meeting:', meeting);
        meetingDatesObj = {
          week: Number(meeting.week) || null,
          day: typeof meeting.day === 'string' ? meeting.day : null,
        };
        // console.log('meetingDatesObj:', meetingDatesObj);
      } else {
        // console.log('No meetingDates found for group:', group.id);
      }
      return {
        ...group,
        meetingDates: meetingDatesObj,
        memberCount: Array.isArray(group.clients) ? group.clients.length : 0,
      };
    });
    return { itemCount, data };
  }

  async findAllSummary(user: UserEntity): Promise<GroupSummaryDto[]> {
    const groups = await this.groupRepository.find({
      select: ['id', 'name', 'systemName'],
    });

    const groupsWithLoans = await this.groupRepository
      .createQueryBuilder('group')
      .leftJoinAndSelect('group.center', 'center')
      .leftJoinAndSelect('group.clients', 'clients')
      .leftJoinAndSelect('clients.loans', 'loans')
      .select(['group.id', 'group.name', 'group.systemName', 'center.name'])
      .where('group.staff.id = :userId', { userId: user.id })
      .andWhere('loans.id IS NOT NULL')
      .getMany();

    return groupsWithLoans.map((g) => new GroupSummaryDto(g));
  }

  async getGroupsByCenter(
    centerId: string,
    pageOptionsDto: PageOptionsDto,
  ): Promise<[number, any[]]> {
    const queryBuilder = this.groupRepository.createQueryBuilder('group');

    queryBuilder
      .leftJoinAndSelect('group.status', 'status')
      .leftJoinAndSelect('group.staff', 'staff')
      .leftJoinAndSelect('staff.office', 'staffOffice')
      .leftJoinAndSelect('group.createdBy', 'createdBy')
      .leftJoinAndSelect('createdBy.office', 'createdByOffice')
      .where('group.center.id = :centerId', { centerId })
      .orderBy('group.createdAt', pageOptionsDto.order)
      .skip(pageOptionsDto.skip)
      .take(pageOptionsDto.take);

    const [data, itemCount] = await queryBuilder.getManyAndCount();

    console.log('GGGGGRRROUPPSSSS', data);

    return [itemCount, data];
  }

  async findOne(id: string, user: UserEntity): Promise<GroupEntity> {
    const group = await this.groupRepository
      .createQueryBuilder('group')
      .select([
        'group.id',
        'group.createdAt',
        'group.updatedAt',
        'group.systemName',
        'group.name',
        'group.active',
        'group.officeName',
      ])
      .leftJoin('group.groupLeader', 'groupLeader')
      .addSelect(['groupLeader.id'])
      .leftJoin('group.clients', 'clients')
      .addSelect([
        'clients.id',
        'clients.firstName',
        'clients.middleName',
        'clients.lastName',
        'clients.dateOfBirth',
        'clients.gender',
        'clients.mobileNumber',
        'clients.emailAddress',
        'clients.active',
        'clients.status',
      ])
      .leftJoin('clients.status', 'status')
      .addSelect(['status.id', 'status.name'])
      .leftJoin('group.center', 'center')
      .addSelect(['center.id', 'center.name', 'center.centerCode','center.meetingTime'])
      .leftJoin('center.meetingDates', 'meetingDates')
      .addSelect(['meetingDates.id', 'meetingDates.week', 'meetingDates.day'])
      .leftJoin('group.staff', 'staff')
      .addSelect(['staff.id', 'staff.firstName', 'staff.lastName'])
      .leftJoin('staff.office', 'office')
      .addSelect(['office.id', 'office.name'])
      .where('group.id = :id', { id })
      .getOne();

    if (!group) {
      throw new NotFoundException(`Group with ID ${id} not found`);
    }

    if (user.role === 'loan_officer' && group.staff.id !== user.id) {
      throw new ForbiddenException('You can only access your own groups');
    }

    if (
      user.role !== 'loan_officer' &&
      group.officeName !== user.office?.name
    ) {
      throw new ForbiddenException('You can only access groups in your office');
    }

       const groupWithLeaderId = {
      ...group,
      groupLeaderId: group.groupLeader?.id || null,
    };

    return groupWithLeaderId;
  }

 async update(
  id: string,
  updateGroupDto: UpdateGroupDto,
  user: UserEntity,
): Promise<GroupResponseDto> {
  const group = await this.groupRepository.createQueryBuilder('group')
    .leftJoinAndSelect('group.staff', 'staff')
    .leftJoinAndSelect('staff.office', 'staffOffice')
    .leftJoinAndSelect('group.clients', 'clients')
    .leftJoinAndSelect('group.groupLeader', 'groupLeader')
    .leftJoinAndSelect('group.createdBy', 'createdBy')
    .leftJoinAndSelect('createdBy.office', 'createdByOffice')
    .leftJoinAndSelect('group.center', 'center')
    .leftJoinAndSelect('center.meetingDates', 'meetingDates')
    .where('group.id = :id', { id })
    .getOne();

  if (!group) throw new NotFoundException('Group not found');
  if (user.role === 'loan_officer' && group.staff.id !== user.id) {
    throw new ForbiddenException('You can only update your own groups');
  }

  // Update name
  if (updateGroupDto.name) {
    group.name = updateGroupDto.name;
  }

  // Remove clients (treat clientIds as "to remove")
  if (updateGroupDto.clientIds && updateGroupDto.clientIds.length > 0) {
    const clientsToRemove = await this.clientRepository.find({
      where: { id: In(updateGroupDto.clientIds) },
      relations: ['group'],
    });

    if (clientsToRemove.length !== updateGroupDto.clientIds.length) {
      throw new NotFoundException('One or more clients not found');
    }

    // Ensure all clients actually belong to this group
    for (const client of clientsToRemove) {
      if (!client.group || client.group.id !== group.id) {
        throw new ForbiddenException(
          `Client ${client.id} does not belong to this group`,
        );
      }
    }

    // Null out group reference for removed clients
    for (const client of clientsToRemove) {
      client.group = null;
      await this.clientRepository.save(client);
    }

    // Remove from group's client list
    group.clients = group.clients.filter(
      (c) => !updateGroupDto.clientIds.includes(c.id),
    );

    group.timeline = this.addTimelineEvent(
      group.timeline,
      'clients_removed',
      `Removed clients from group`,
      user,
      { removedClientIds: updateGroupDto.clientIds },
    );
  }

  // Update group leader
  if (updateGroupDto.groupLeaderId) {
    const newLeader = await this.clientRepository.findOne({
      where: { id: updateGroupDto.groupLeaderId },
    });

    if (!newLeader) {
      throw new NotFoundException('New group leader client not found');
    }

    // Ensure not already leader of another group
    const conflict = await this.groupRepository.findOne({
      where: { groupLeader: { id: newLeader.id }, id: Not(id) },
    });
    if (conflict) {
      throw new ForbiddenException(
        'This client is already a group leader of another group',
      );
    }

    // Ensure leader is in current group
    if (!group.clients.find((c) => c.id === newLeader.id)) {
      throw new ForbiddenException(
        'Group leader must be one of the group clients',
      );
    }

    const previousLeader = group.groupLeader;

    // Clear old leader
    if (previousLeader) {
      previousLeader.groupLed = null;
      await this.clientRepository.save(previousLeader);
    }

    // Assign new leader
    group.groupLeader = newLeader;
    newLeader.groupLed = group;
    await this.clientRepository.save(newLeader);

    group.timeline = this.addTimelineEvent(
      group.timeline,
      'group_leader_changed',
      `Group leader changed from "${previousLeader?.firstName} ${previousLeader?.lastName}" to "${newLeader.firstName} ${newLeader.lastName}"`,
      user,
      {
        previousLeaderId: previousLeader?.id,
        previousLeaderName: previousLeader
          ? `${previousLeader.firstName} ${previousLeader.lastName}`
          : 'None',
        newLeaderId: newLeader.id,
        newLeaderName: `${newLeader.firstName} ${newLeader.lastName}`,
      },
    );
  }

  const savedGroup = await this.groupRepository.save(group);
  return new GroupResponseDto(savedGroup);
}


  async remove(id: string, user: UserEntity): Promise<void> {
    const group = await this.groupRepository.findOne({
      where: { id },
      relations: [
        'staff',
        'staff.office',
        'clients',
        'groupLeader',
        'createdBy',
        'createdBy.office',
      ],
    });
    if (!group) throw new NotFoundException('Group not found');
    if (user.role === 'loan_officer' && group.staff.id !== user.id) {
      throw new ForbiddenException('You can only delete your own groups');
    }

    // Add timeline event for group deletion
    group.timeline = this.addTimelineEvent(
      group.timeline,
      'group_deleted',
      `Group "${group.name}" was deleted`,
      user,
      {
        groupName: group.name,
        systemName: group.systemName,
        clientCount: group.clients?.length || 0,
        groupLeaderId: group.groupLeader?.id,
        groupLeaderName: group.groupLeader
          ? `${group.groupLeader.firstName} ${group.groupLeader.lastName}`
          : 'None',
      },
    );

    // Save the timeline update before deletion
    await this.groupRepository.save(group);

  await this.groupRepository.softDelete(id);
  }

  async activate(id: string, user: UserEntity): Promise<GroupEntity> {
    const group = await this.groupRepository.findOne({
      where: { id },
      relations: [
        'staff',
        'staff.office',
        'clients',
        'groupLeader',
        'createdBy',
        'createdBy.office',
      ],
    });
    if (!group) throw new NotFoundException('Group not found');
    if (
      user.role === 'branch_manager' &&
      group.officeName !== user.office?.name
    ) {
      throw new ForbiddenException(
        'You can only activate groups in your office',
      );
    }

    group.active = true;

    group.status = await this.statusService.findByName('Active');

    // Add timeline event for group activation
    group.timeline = this.addTimelineEvent(
      group.timeline,
      'group_activated',
      `Group "${group.name}" was activated`,
      user,
      {
        groupName: group.name,
        systemName: group.systemName,
        clientCount: group.clients?.length || 0,
        groupLeaderId: group.groupLeader?.id,
        groupLeaderName: group.groupLeader
          ? `${group.groupLeader.firstName} ${group.groupLeader.lastName}`
          : 'None',
      },
    );

    return this.groupRepository.save(group);
  }

  async deactivate(id: string, user: UserEntity): Promise<GroupEntity> {
    const group = await this.groupRepository.findOne({
      where: { id },
      relations: [
        'staff',
        'staff.office',
        'clients',
        'groupLeader',
        'createdBy',
        'createdBy.office',
      ],
    });
    if (!group) throw new NotFoundException('Group not found');
    if (user.role === 'loan_officer' && group.staff.id !== user.id) {
      throw new ForbiddenException('You can only deactivate your own groups');
    }

    group.active = false;

    // Add timeline event for group deactivation
    group.timeline = this.addTimelineEvent(
      group.timeline,
      'group_deactivated',
      `Group "${group.name}" was deactivated`,
      user,
      {
        groupName: group.name,
        systemName: group.systemName,
        clientCount: group.clients?.length || 0,
        groupLeaderId: group.groupLeader?.id,
        groupLeaderName: group.groupLeader
          ? `${group.groupLeader.firstName} ${group.groupLeader.lastName}`
          : 'None',
      },
    );

    return this.groupRepository.save(group);
  }

  /**
   * Validate that a new system name is valid for a group
   * @param groupId - The ID of the group being updated
   * @param newSystemName - The proposed new system name
   * @throws BadRequestException if validation fails
   */
  private async validateSystemName(groupId: string, newSystemName: string): Promise<void> {
    // Get only the group ID and center code using QueryBuilder for efficiency
    const group = await this.groupRepository
      .createQueryBuilder('group')
      .leftJoin('group.center', 'center')
      .select(['group.id'])
      .addSelect(['center.centerCode'])
      .where('group.id = :groupId', { groupId })
      .getOne();

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    const centerCode = group.center.centerCode;

    // Validate that system name follows the exact pattern: {centerCode}{Number}
    const systemNamePattern = new RegExp(`^${centerCode}\\d+$`);
    
    if (!systemNamePattern.test(newSystemName)) {
      throw new BadRequestException(
        `System name must follow the pattern '${centerCode}[Number]' (e.g., ${centerCode}1, ${centerCode}2, etc.)`
      );
    }

    // Extract the number part to ensure it's valid
    const numberPart = newSystemName.substring(centerCode.length);
    const number = parseInt(numberPart, 10);
    
    if (isNaN(number) || number <= 0 || numberPart !== number.toString()) {
      throw new BadRequestException(
        `System name must have a valid positive number after the center code '${centerCode}'`
      );
    }

    // Check uniqueness using QueryBuilder - only select ID for efficiency
    const existingGroup = await this.groupRepository
      .createQueryBuilder('group')
      .select(['group.id'])
      .where('group.systemName = :systemName', { systemName: newSystemName })
      .andWhere('group.id != :groupId', { groupId })
      .getOne();

    if (existingGroup) {
      throw new BadRequestException(
        `System name '${newSystemName}' is already in use by another group`
      );
    }
  }

  /**
   * Update the system name of a group (Super User only)
   * @param groupId - The ID of the group to update
   * @param updateDto - DTO containing the new system name
   * @param user - The user making the change (must be super user)
   * @returns The updated group
   */
  async updateSystemName(
    groupId: string, 
    updateDto: UpdateGroupSystemNameDto, 
    user: UserEntity
  ): Promise<any> {
    // Additional authorization check (controller should already handle this)
    // if (user.role !== RoleType.SUPER_USER) {
    //   throw new ForbiddenException('Only super users can update system names');
    // }

    // Validate the new system name
    await this.validateSystemName(groupId, updateDto.systemName);

    // First, get minimal group data to check if it exists and get current system name
    const groupCheck = await this.groupRepository
      .createQueryBuilder('group')
      .leftJoin('group.center', 'center')
      .select(['group.id', 'group.systemName'])
      .addSelect(['center.centerCode', 'center.name'])
      .where('group.id = :groupId', { groupId })
      .getOne();

    if (!groupCheck) {
      throw new NotFoundException('Group not found');
    }

    const oldSystemName = groupCheck.systemName;

    // Check if the new system name is the same as current
    if (oldSystemName === updateDto.systemName) {
      throw new BadRequestException(`System name '${updateDto.systemName}' is already the current system name. No update needed.`);
    }

    // Now get the full group with all necessary relations for updating
    const group = await this.groupRepository.findOne({
      where: { id: groupId },
      relations: [
        'center',     
      ],
    });

    // Update the system name
    group.systemName = updateDto.systemName;

    // Update audit data
    const auditData = Array.isArray(group.auditData) ? group.auditData : [];
    auditData.push({
      action: 'SYSTEM_NAME_UPDATED',
      entityType: 'Group',
      entityId: group.id,
      details: {
        oldSystemName,
        newSystemName: updateDto.systemName,
        updatedBy: user.id,
        updatedByName: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        updatedAt: new Date().toISOString(),
      },
    });
    group.auditData = auditData;

    // Add timeline event
    group.timeline = this.addTimelineEvent(
      group.timeline,
      'system_name_updated',
      `System name changed from "${oldSystemName}" to "${updateDto.systemName}"`,
      user,
      {
        oldSystemName,
        newSystemName: updateDto.systemName,
        centerCode: group.center.centerCode,
        centerName: group.center.name,
      },
    );

    // Save the group with updated data
    await this.groupRepository.save(group);

    // Return clean response with only essential data
    return {
      id: group.id,
      systemName: updateDto.systemName,
      name: group.name,
      message: 'System name updated successfully',
      updatedAt: new Date(),
      center: {
        id: group.center.id,
        name: group.center.name,
        centerCode: group.center.centerCode,
      },
    } as any;
  }
}

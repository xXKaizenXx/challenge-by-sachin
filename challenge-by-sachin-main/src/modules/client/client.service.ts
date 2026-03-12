import { BulkClientCenterTransferDto } from './dto/bulk-client-center-transfer.dto';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, SelectQueryBuilder, Not } from 'typeorm';
import { PageMetaDto } from 'src/common/dtos/page-meta.dto';
import { PageOptionsDto } from 'src/common/dtos/page-options.dto';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { ClientDto } from './dto/client.dto';
import { RunCommandDto } from './dto/run-command.dto';
import { ClientEntity } from './entities/client.entity';
import { StatusService } from '../status/status.service';
import { BankService } from '../bank/bank.service';
import { UserEntity } from '../user/user.entity';
import { CenterService } from '../center/center.service';
import { LanguageService } from '../language/language.service';
import { LanguageModule } from '../language/language.module';
import { ProvincesService } from '../provinces/provinces.service';
import { RoleType } from 'src/constants';
import { GroupEntity } from '../group/entities/group.entity';
import { Center } from '../center/entities/center.entity';
import { Language } from '../language/entities/language.entity';
import { Province } from '../provinces/entities/province.entity';
import { ClientResponseDto } from './dto/client-response.dto';

@Injectable()
export class ClientService {
  constructor(
    @InjectRepository(ClientEntity)
    private clientRepository: Repository<ClientEntity>,
    @InjectRepository(GroupEntity)
    private groupRepository: Repository<GroupEntity>,
    @InjectRepository(Center)
    private centerRepository: Repository<Center>,
    @InjectRepository(Language)
    private languageRepository: Repository<Language>,
    @InjectRepository(Province)
    private provinceRepository: Repository<Province>,
    private statusService: StatusService,
    private bankService: BankService,
    private centerService: CenterService,
    private languageService: LanguageService,
    private provinceService: ProvincesService,
  ) { }

  async create(
    createClientDto: CreateClientDto,
    user: UserEntity,
  ): Promise<ClientEntity> {
    // cGet the "Pending" status
    console.log('object 1');
    const activeStatus = await this.statusService.findByName('Active');
    console.log('object 2');
    if (!activeStatus) {
      throw new NotFoundException(
        'Pending status not found. Please create it first.',
      );
    }
    console.log('object 3');
    // Get the bank
    const bank = await this.bankService.findOne(createClientDto.bankId);
    console.log('object 4');
    // Get the center and validate office consistency
    const center = await this.centerService.findOne(createClientDto.centerId);
    if (!center) {
      throw new NotFoundException('Center not found');
    }
    console.log('object 5');
    // Validate that client, center, and staff have the same office
    if (center.office !== user.office.id) {
      throw new NotFoundException(
        'Client, center, and staff must belong to the same office',
      );
    }
    console.log('object 6');
    // Remove centerId from the DTO to avoid setting it directly
    const { centerId, ...rest } = createClientDto;
    console.log('object 7');
    const language = await this.languageService.findOne(
      createClientDto.languageId,
    );
    console.log('object 8');
    const province = await this.provinceService.findOne(
      createClientDto.province,
    );
    console.log('object 9');
    if (!province) {
      throw new NotFoundException('Province not found');
    }
    console.log('object 10');
    const client: ClientEntity = await this.clientRepository.create({
      ...rest,
      status: activeStatus,
      bank: bank,
      staffId: user.id,
      officeId: user.office.id,
      center: center,
      active: true,
      blacklisted: false,
      language: language,
      province: province,
      auditData: {
        createdBy: user.id,
        createdAt: new Date(),
      },
    });
    console.log('object 11');
    const savedClient = await this.clientRepository.save(client);
    console.log('object 12');
    return savedClient;
  }

  async findAll(
    user: UserEntity,
    pageOptionsDto: PageOptionsDto,
  ): Promise<[number, ClientEntity[]]> {
    const queryBuilder = this.clientRepository.createQueryBuilder('client');

    queryBuilder
      .leftJoinAndSelect('client.staff', 'staff')
      .leftJoinAndSelect('client.center', 'center')
      .leftJoinAndSelect('client.group', 'group')
      .leftJoinAndSelect('client.bank', 'bank')
      .leftJoinAndSelect('client.status', 'status');

    if ((user.role = RoleType.LOAN_OFFICER)) {
      queryBuilder.where('client.staffId = :staffId', { staffId: user.id });
    }

    queryBuilder
      .orderBy('client.createdAt', pageOptionsDto.order)
      .skip(pageOptionsDto.skip)
      .take(pageOptionsDto.take);

    const [data, itemCount] = await queryBuilder.getManyAndCount();
    console.log('data', data[0]);
    return [itemCount, data];
  }



  async findOneWithCenterAndMeetingDates(id: string): Promise<ClientEntity | null> {
    return await this.clientRepository.findOne({
      where: { id },
      relations: ['center', 'center.meetingDates'],
    });
  }

  /**
  * Bulk transfer clients to another center (and optionally group).
  * Loan officers can only transfer their own clients; branch managers and IT can transfer any clients.
  * Only clients with no active or pending loans can be transferred.
  */
  async bulkTransferClientsToCenter(user: UserEntity, dto: BulkClientCenterTransferDto) {
    const { clientIds, targetCenterId, targetGroupId, reason } = dto;
    return await this.clientRepository.manager.transaction(async (manager) => {
      // Fetch target center
      const targetCenter = await manager.findOne(Center, { where: { id: targetCenterId } });
      if (!targetCenter) throw new NotFoundException('Target center not found');

      // If group specified, check it belongs to the target center
      let targetGroup = null;
      if (targetGroupId) {
        targetGroup = await manager.findOne(GroupEntity, { where: { id: targetGroupId }, relations: ['center'] });
        if (!targetGroup) throw new NotFoundException('Target group not found');
        if (targetGroup.center.id !== targetCenterId) throw new BadRequestException('Target group does not belong to the target center');
      }

      // Fetch all clients using query builder, selecting only needed fields from relations
      const clients = await manager.createQueryBuilder(ClientEntity, 'client')
        .leftJoin('client.center', 'center')
        .addSelect(['center.id', 'center.name'])
        .leftJoin('client.group', 'group')
        .addSelect(['group.id', 'group.name'])
        .leftJoin('client.loans', 'loans')
        .addSelect(['loans.id', 'loans.status'])
        .leftJoin('loans.schedule', 'schedule')
        .addSelect(['schedule.id', 'schedule.installmentNumber', 'schedule.status'])
        .leftJoin('client.staff', 'staff')
        .addSelect(['staff.id'])
        .where('client.id IN (:...clientIds)', { clientIds })
        .getMany();
      if (clients.length !== clientIds.length) throw new NotFoundException('One or more clients not found');

      // Role-based access: loan officers can only transfer their own clients
      if (user.role === RoleType.LOAN_OFFICER) {
        const unauthorized = clients.filter(c => c.staffId !== user.id);
        if (unauthorized.length > 0) throw new BadRequestException('Loan officers can only transfer their own clients');
      }

      // Branch managers, IT, super users can transfer any clients

      // Validate all clients
      const errors = [];

      for (const client of clients) {
        // Blacklist
        if (client.blacklisted) {
          errors.push({ clientId: client.id, error: 'Client is blacklisted' });
          continue;
        }

        // Loan checks (Active or Pending)
        if (client.loans && client.loans.length > 0) {
          const activeOrPendingLoans = client.loans.filter(loan =>
            ['Active', 'Pending'].includes(loan.status)
          );

          if (activeOrPendingLoans.length > 0) {

            // Check 3rd repayment schedule for each loan
            const unpaidThirdRepayments = activeOrPendingLoans.filter(loan => {
              if (!loan.schedule || !Array.isArray(loan.schedule)) return true;
              const third = loan.schedule.find(s => s.installmentNumber === 3);
              console.log('loan',loan);
              return !(third && third.status === 'Paid');
            });

            if (unpaidThirdRepayments.length > 0) {
              errors.push({
                clientId: client.id,
                error:
                  'Client has an active/pending loan where the 3rd repayment is not marked as Paid',
              });
              continue;
            }
          }
        }
      }

      if (errors.length > 0) {
        return {
          success: false,
          statusCode: 400,
          error: 'Some clients could not be transferred',
          errors,
          timestamp: new Date().toISOString(),
          path: '/api/v1/clients/bulk-transfer-center',
        };
      }

      // Perform transfer
      const now = new Date();
      for (const client of clients) {
        const transferAudit = {
          fromCenterId: client.center.id,
          fromCenterName: client.center.name,
          toCenterId: targetCenter.id,
          toCenterName: targetCenter.name,
          fromGroupId: client.group?.id,
          fromGroupName: client.group?.name,
          toGroupId: targetGroup?.id,
          toGroupName: targetGroup?.name,
          timestamp: now,
          performedBy: user.username || 'system',
          reason: reason || 'No reason provided',
        };
        client.center = targetCenter;
        if (targetGroup) {
          client.group = targetGroup;
        } else {
          client.group = null;
        }
        client.auditData = { ...client.auditData, lastCenterTransfer: transferAudit };
      }
      await manager.save(clients);
      return { success: true, message: 'Clients transferred successfully', count: clients.length };
    });
  }

  async findOne(id: string): Promise<ClientEntity> {
    const client = await this.clientRepository
      .createQueryBuilder('client')
      .leftJoinAndSelect('client.staff', 'staff')
      .leftJoinAndSelect('client.office', 'office')
      .leftJoin('client.center', 'center') // just join, don't select everything
      .addSelect(['center.id', 'center.name']) // select only id and name
      .leftJoin('client.group', 'group') // just join
      .addSelect(['group.id', 'group.name']) // select only id and name
      .leftJoinAndSelect('client.activatedBy', 'activatedBy')
      .leftJoinAndSelect('client.bank', 'bank')
      .leftJoinAndSelect('client.status', 'status')
      .leftJoinAndSelect('client.province', 'province')
      .leftJoinAndSelect('client.language', 'language')
      .where('client.id = :id', { id })
      .getOne();

    if (!client) {
      throw new NotFoundException(`Client with ID ${id} not found`);
    }

    return client;
  }



  async findByNationalId(
    nationalIdNumber: string,
  ): Promise<ClientEntity | null> {
    return await this.clientRepository.findOne({
      where: { nationalIdNumber },
      relations: ['staff', 'office', 'center', 'group', 'bank', 'status'],
    });
  }

  async findByMobileNumber(mobileNumber: string): Promise<ClientEntity | null> {
    return await this.clientRepository.findOne({
      where: { mobileNumber },
      relations: ['staff', 'office', 'center', 'group', 'bank', 'status'],
    });
  }

  async findByEmail(emailAddress: string): Promise<ClientEntity | null> {
    return await this.clientRepository.findOne({
      where: { emailAddress },
      relations: ['staff', 'office', 'center', 'group', 'bank', 'status'],
    });
  }

  async findByBankAccountNumber(bankAccountNumber: string): Promise<ClientEntity | null> {
    return await this.clientRepository.findOne({
      where: { bankAccountNumber },
      relations: ['staff', 'office', 'center', 'group', 'bank', 'status'],
    });
  }

  async transferToGroup(
    user: UserEntity,
    clientId: string,
    newGroupId: string,
    auditData: Partial<{ reason: string }> = {}
  ): Promise<ClientResponseDto> {

    // Fetch client with center, group, and loans
    const client = await this.clientRepository
      .createQueryBuilder('client')
      .select(['client.id', 'client.firstName', 'client.lastName', 'client.blacklisted', 'client.status'])
      .leftJoin('client.center', 'center')
      .addSelect(['center.id', 'center.name'])
      .leftJoinAndSelect('client.group', 'group')
      .addSelect(['group.id', 'group.name'])
      .leftJoinAndSelect('client.loans', 'loans')
      .leftJoin('loans.schedule', 'schedule')
      .addSelect(['schedule.id', 'schedule.installmentNumber', 'schedule.status'])
      .addSelect(['loans.id', 'loans.status'])
      .where('client.id = :clientId', { clientId })
      .getOne();

    if (!client) {
      throw new NotFoundException(`Client with ID ${clientId} not found`);
    }

    // Check for Active or Pending loans
    if (client.loans && client.loans.length > 0) {
      // Filter active or pending loans
      const activeOrPendingLoans = client.loans.filter(loan => ['Active', 'Pending'].includes(loan.status));
      if (activeOrPendingLoans.length > 0) {
        // For each such loan, check if the third repayment schedule has status 'Paid'
        const notPaidThirdRepayment = activeOrPendingLoans.filter(loan => {
          if (!loan.schedule || !Array.isArray(loan.schedule)) return true;
          const thirdSchedule = loan.schedule.find(sch => sch.installmentNumber === 3);
          return !(thirdSchedule && thirdSchedule.status === 'Paid');
        });
        if (notPaidThirdRepayment.length > 0) {
          throw new BadRequestException('Client cannot be transferred: one or more active/pending loans have not paid the third repayment.');
        }
        // If all active/pending loans have paid the third repayment, allow transfer
      }
    }

    // Fetch target group
    const newGroup = await this.groupRepository.findOne({
      where: { id: newGroupId },
      relations: ['center'],
    });

    if (!newGroup) {
      throw new NotFoundException(`Group with ID ${newGroupId} not found`);
    }

    // Same center check
    if (client.center.id !== newGroup.center.id) {
      throw new BadRequestException('The new group must be under the same center as the client');
    }

    // Blacklist check
    if (client.blacklisted) {
      throw new BadRequestException('Cannot transfer a blacklisted client');
    }

    // Status check (optional, e.g., only active clients can transfer)
    // if (client.status?.name !== 'active') {
    //   throw new BadRequestException('Only active clients can be transferred');
    // }

    // Redundant transfer check
    if (client.group.id === newGroup.id) {
      throw new BadRequestException('Client is already in the target group');
    }

    // Prepare audit entry
    const now = new Date();
    const transferAudit = {
      fromGroupId: client.group.id,
      fromGroupName: client.group.name,
      toGroupId: newGroup.id,
      toGroupName: newGroup.name,
      timestamp: now,
      performedBy: user.username || 'system',
      reason: auditData.reason || 'No reason provided',
    };

    // Merge into client auditData
    client.auditData = {
      ...client.auditData,
      lastTransfer: transferAudit,
    };

    // Update client group
    client.group = newGroup;

    // Save updated client
    const updatedClient = await this.clientRepository.save(client);
    return ClientResponseDto.from(
      new ClientDto(updatedClient),
      true,
      'Client transferred successfully'
    );
  }


  async update(
    id: string,
    updateClientDto: UpdateClientDto,
  ): Promise<ClientEntity> {
    const client = await this.findOne(id);

    // Validate unique fields before updating
    await this.validateUniqueFieldsForUpdate(id, updateClientDto);

    // Handle bank update if bankId is provided
    if (updateClientDto.bankId) {
      const bank = await this.bankService.findOne(updateClientDto.bankId);
      client.bank = bank;
      delete updateClientDto.bankId; // Remove bankId from the DTO to avoid conflicts
    }

    // Handle center update if centerId is provided
    if (updateClientDto.centerId) {
      const center = await this.centerRepository.findOne({
        where: { id: updateClientDto.centerId }
      });
      if (!center) {
        throw new NotFoundException('Center not found');
      }
      client.center = center;
      delete updateClientDto.centerId; // Remove centerId from the DTO to avoid conflicts
    }

    // Handle language update if languageId is provided
    if (updateClientDto.languageId) {
      const language = await this.languageRepository.findOne({
        where: { id: updateClientDto.languageId }
      });
      if (!language) {
        throw new NotFoundException('Language not found');
      }
      client.language = language;
      delete updateClientDto.languageId; // Remove languageId from the DTO to avoid conflicts
    }

    // Handle province update if provinceId is provided
    if (updateClientDto.provinceId) {
      const province = await this.provinceRepository.findOne({
        where: { id: updateClientDto.provinceId }
      });
      if (!province) {
        throw new NotFoundException('Province not found');
      }
      client.province = province;
      delete updateClientDto.provinceId; // Remove provinceId from the DTO to avoid conflicts
    }

    Object.assign(client, updateClientDto);

    return await this.clientRepository.save(client);
  }

  private async validateUniqueFieldsForUpdate(
    clientId: string,
    updateClientDto: UpdateClientDto,
  ): Promise<void> {
    const errors: string[] = [];

    // Validate National ID Number
    if (updateClientDto.nationalIdNumber) {
      const existingClient = await this.findByNationalId(updateClientDto.nationalIdNumber);
      if (existingClient && existingClient.id !== clientId) {
        errors.push('National ID number already exists. Please use a different value.');
      }
    }

    // Validate Mobile Number
    if (updateClientDto.mobileNumber) {
      const existingClient = await this.findByMobileNumber(updateClientDto.mobileNumber);
      if (existingClient && existingClient.id !== clientId) {
        errors.push('Mobile number already exists. Please use a different value.');
      }
    }

    // Validate Email Address
    if (updateClientDto.emailAddress) {
      const existingClient = await this.findByEmail(updateClientDto.emailAddress);
      if (existingClient && existingClient.id !== clientId) {
        errors.push('Email address already exists. Please use a different value.');
      }
    }

    // Validate Bank Account Number
    if (updateClientDto.bankAccountNumber) {
      const existingClient = await this.findByBankAccountNumber(updateClientDto.bankAccountNumber);
      if (existingClient && existingClient.id !== clientId) {
        errors.push('Bank account number already exists. Please use a different value.');
      }
    }

    if (errors.length > 0) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors: errors,
        statusCode: 400,
      });
    }
  }

  async activate(id: string, activatedById: string): Promise<ClientEntity> {
    const client = await this.findOne(id);

    client.active = true;
    client.activatedById = activatedById;
    client.activatedOn = new Date();

    return await this.clientRepository.save(client);
  }

  async deactivate(id: string): Promise<ClientEntity> {
    const client = await this.findOne(id);

    client.active = false;
    client.activatedById = null;
    client.activatedOn = null;

    return await this.clientRepository.save(client);
  }

  async blacklist(id: string): Promise<ClientEntity> {
    const client = await this.findOne(id);

    client.blacklisted = true;

    return await this.clientRepository.save(client);
  }

  async removeFromBlacklist(id: string): Promise<ClientEntity> {
    const client = await this.findOne(id);

    client.blacklisted = false;

    return await this.clientRepository.save(client);
  }

  async remove(id: string): Promise<void> {
    const client = await this.findOne(id);
    await this.clientRepository.remove(client);
  }


  async softDelete(id: string): Promise<void> {
    await this.clientRepository.softDelete(id);
  }

  async restore(id: string): Promise<void> {
    await this.clientRepository.restore(id);
  }

  async findDeleted(pageOptionsDto: PageOptionsDto): Promise<{ data: ClientEntity[]; meta: PageMetaDto }> {
    const queryBuilder = this.clientRepository.createQueryBuilder('client')
      .withDeleted()
      .where('client.deletedAt IS NOT NULL')
      .orderBy('client.createdAt', pageOptionsDto.order)
      .skip(pageOptionsDto.skip)
      .take(pageOptionsDto.take);

    const result = await queryBuilder.getMany();
    const meta = new PageMetaDto({ pageOptionsDto, itemCount: result.length });
    return { data: result, meta };
  }

  async findByStaff(
    staffId: string,
    pageOptionsDto: PageOptionsDto,
  ): Promise<[number, ClientEntity[]]> {
    const queryBuilder = this.clientRepository.createQueryBuilder('client');

    queryBuilder
      .leftJoinAndSelect('client.staff', 'staff')
      .leftJoinAndSelect('client.office', 'office')
      .leftJoinAndSelect('client.center', 'center')
      .leftJoinAndSelect('client.group', 'group')
      .leftJoinAndSelect('client.bank', 'bank')
      .leftJoinAndSelect('client.status', 'status')
      .where('client.staffId = :staffId', { staffId })
      .orderBy('client.createdAt', pageOptionsDto.order)
      .skip(pageOptionsDto.skip)
      .take(pageOptionsDto.take);

    const [data, itemCount] = await queryBuilder.getManyAndCount();
    return [itemCount, data];
  }

  async findByOffice(
    officeId: string,
    pageOptionsDto: PageOptionsDto,
  ): Promise<[number, ClientEntity[]]> {
    const queryBuilder = this.clientRepository.createQueryBuilder('client');

    queryBuilder
      .leftJoinAndSelect('client.staff', 'staff')
      .leftJoinAndSelect('client.office', 'office')
      .leftJoinAndSelect('client.center', 'center')
      .leftJoinAndSelect('client.group', 'group')
      .leftJoinAndSelect('client.bank', 'bank')
      .leftJoinAndSelect('client.status', 'status')
      .where('client.officeId = :officeId', { officeId })
      .orderBy('client.createdAt', pageOptionsDto.order)
      .skip(pageOptionsDto.skip)
      .take(pageOptionsDto.take);

    const [data, itemCount] = await queryBuilder.getManyAndCount();
    return [itemCount, data];
  }

  async findByCenter(
    centerId: string,
    pageOptionsDto: PageOptionsDto,
  ): Promise<[number, ClientEntity[]]> {
    const queryBuilder = this.clientRepository.createQueryBuilder('client');

    queryBuilder
      .leftJoinAndSelect('client.staff', 'staff')
      .leftJoinAndSelect('client.group', 'group')
      .leftJoinAndSelect('client.bank', 'bank')
      .leftJoinAndSelect('client.status', 'status')
      .where('client.center.id = :centerId', { centerId })
      .orderBy('client.createdAt', pageOptionsDto.order)
      .skip(pageOptionsDto.skip)
      .take(pageOptionsDto.take);

    const [data, itemCount] = await queryBuilder.getManyAndCount();

    console.log('objesfsct', data);
    return [itemCount, data];
  }

  async findByGroup(
    groupId: string,
    pageOptionsDto: PageOptionsDto,
  ): Promise<[number, ClientEntity[]]> {
    const queryBuilder = this.clientRepository.createQueryBuilder('client');

    queryBuilder
      .leftJoinAndSelect('client.staff', 'staff')
      .leftJoinAndSelect('client.office', 'office')
      .leftJoinAndSelect('client.center', 'center')
      .leftJoinAndSelect('client.group', 'group')
      .leftJoinAndSelect('client.bank', 'bank')
      .leftJoinAndSelect('client.status', 'status')
      .leftJoinAndSelect('client.loans', 'loans')
      .where('client.group.id = :groupId', { groupId: groupId })
      .orderBy('client.createdAt', pageOptionsDto.order)
      .skip(pageOptionsDto.skip)
      .take(pageOptionsDto.take);

    const [data, itemCount] = await queryBuilder.getManyAndCount();
    return [itemCount, data];
  }

  async findActive(
    pageOptionsDto: PageOptionsDto,
  ): Promise<[number, ClientEntity[]]> {
    const queryBuilder = this.clientRepository.createQueryBuilder('client');

    queryBuilder
      .leftJoinAndSelect('client.staff', 'staff')
      .leftJoinAndSelect('client.office', 'office')
      .leftJoinAndSelect('client.center', 'center')
      .leftJoinAndSelect('client.group', 'group')
      .leftJoinAndSelect('client.bank', 'bank')
      .leftJoinAndSelect('client.status', 'status')
      .where('client.active = :active', { active: true })
      .orderBy('client.createdAt', pageOptionsDto.order)
      .skip(pageOptionsDto.skip)
      .take(pageOptionsDto.take);

    const [data, itemCount] = await queryBuilder.getManyAndCount();
    return [itemCount, data];
  }

  async findBlacklisted(
    pageOptionsDto: PageOptionsDto,
  ): Promise<[number, ClientEntity[]]> {
    const queryBuilder = this.clientRepository.createQueryBuilder('client');

    queryBuilder
      .leftJoinAndSelect('client.staff', 'staff')
      .leftJoinAndSelect('client.office', 'office')
      .leftJoinAndSelect('client.center', 'center')
      .leftJoinAndSelect('client.group', 'group')
      .leftJoinAndSelect('client.bank', 'bank')
      .leftJoinAndSelect('client.status', 'status')
      .where('client.blacklisted = :blacklisted', { blacklisted: true })
      .orderBy('client.createdAt', pageOptionsDto.order)
      .skip(pageOptionsDto.skip)
      .take(pageOptionsDto.take);

    const [data, itemCount] = await queryBuilder.getManyAndCount();
    return [itemCount, data];
  }

  async findByBank(
    bankId: string,
    pageOptionsDto: PageOptionsDto,
  ): Promise<[number, ClientEntity[]]> {
    const queryBuilder = this.clientRepository.createQueryBuilder('client');

    queryBuilder
      .leftJoinAndSelect('client.staff', 'staff')
      .leftJoinAndSelect('client.office', 'office')
      .leftJoinAndSelect('client.center', 'center')
      .leftJoinAndSelect('client.group', 'group')
      .leftJoinAndSelect('client.bank', 'bank')
      .leftJoinAndSelect('client.status', 'status')
      .where('client.bank.id = :bankId', { bankId })
      .orderBy('client.createdAt', pageOptionsDto.order)
      .skip(pageOptionsDto.skip)
      .take(pageOptionsDto.take);

    const [data, itemCount] = await queryBuilder.getManyAndCount();
    return [itemCount, data];
  }

  async runCommand(
    runCommandDto: RunCommandDto,
    user: UserEntity,
  ): Promise<ClientEntity> {
    const client = await this.findOne(runCommandDto.client);
    let status: any;

    switch (runCommandDto.command) {
      case 'activate':
        status = await this.statusService.findByName('Active');
        if (!status) {
          throw new NotFoundException('Active status not found');
        }
        client.active = true;
        client.activatedById = user.id;
        client.activatedOn = new Date();
        break;

      case 'reactivate':
        status = await this.statusService.findByName('Active');
        if (!status) {
          throw new NotFoundException('Active status not found');
        }
        client.active = true;
        client.blacklisted = false;
        client.activatedById = user.id;
        client.activatedOn = new Date();
        break;

      case 'close':
        status = await this.statusService.findByName('Closed');
        if (!status) {
          throw new NotFoundException('Closed status not found');
        }
        client.active = false;
        break;

      case 'reject':
        status = await this.statusService.findByName('Suspended');
        if (!status) {
          throw new NotFoundException('Suspended status not found');
        }
        client.active = false;
        break;

      case 'blacklist':
        status = await this.statusService.findByName('Suspended');
        if (!status) {
          throw new NotFoundException('Suspended status not found');
        }
        client.active = false;
        client.blacklisted = true;
        break;

      default:
        throw new BadRequestException(
          `Invalid command: ${runCommandDto.command}`,
        );
    }

    // Update the client status
    client.status = status;

    // Update audit data
    client.auditData = {
      ...client.auditData,
      updatedBy: user.id,
      updatedAt: new Date(),
      lastCommand: {
        command: runCommandDto.command,
        note: runCommandDto.note,
        executedBy: user.id,
        executedAt: new Date(),
      },
    };

    return await this.clientRepository.save(client);
  }
}
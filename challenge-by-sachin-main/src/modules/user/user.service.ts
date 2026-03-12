import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PageMetaDto } from 'src/common/dtos/page-meta.dto';
import { PageOptionsDto } from 'src/common/dtos/page-options.dto';
import { PageResponseDto } from 'src/common/dtos/page-response.dto';
import {
  FindManyOptions,
  FindOptionsWhere,
  Repository,
  SelectQueryBuilder,
  Not,
} from 'typeorm';
import { SocialAuthRegisterDto } from '../auth/dtos/social-auth.dto';
import { UserRegisterDto } from '../auth/dtos/user-register.dto';
import { UserDto } from './dtos/user.dto';
import { UserEntity } from './user.entity';
import { CreateUserDto } from './dtos/create-user.dto';
import { sendWelcomeEmail } from '../auth/email/email.service';
import { Center } from '../center/entities/center.entity';
import { GroupEntity } from '../group/entities/group.entity';
import { ClientEntity } from '../client/entities/client.entity';
import { LoanEntity } from '../loan/entities/loan.entity';
import { GroupPackageEntity, GroupPackageStatus } from '../group-package/entities/group-package.entity';
import { LoanOfficerMetricsDto } from './dtos/loan-officer-metrics.dto';
import { RoleType } from '../../constants/role-type';
import { StatusEnum } from '../../constants/constants';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    @InjectRepository(Center)
    private readonly centerRepository: Repository<Center>,
    @InjectRepository(GroupEntity)
    private readonly groupRepository: Repository<GroupEntity>,
    @InjectRepository(ClientEntity)
    private readonly clientRepository: Repository<ClientEntity>,
    @InjectRepository(LoanEntity)
    private readonly loanRepository: Repository<LoanEntity>,
    @InjectRepository(GroupPackageEntity)
    private readonly groupPackageRepository: Repository<GroupPackageEntity>,
  ) {}

  async createUser(createUserDto: CreateUserDto): Promise<UserEntity> {
    try {
      const user = this.userRepository.create(createUserDto);
      await this.userRepository.save(user);
      // Send credentials email after user is created
      if (user.email && createUserDto.password && user.username) {
        await sendWelcomeEmail(
          user.email,
          user.username,
          createUserDto.password,
          user
        );
      }
      return user;
    } catch (error) {
      console.log('error: ', error);
      throw new BadRequestException(error.message);
    }
  }

  async updateUser(
    id: string,
    updateUserDto: Partial<CreateUserDto>,
  ): Promise<UserEntity> {
    const user = await this.userRepository.findOneBy({ id });
    if (!user) {
      throw new Error('User not found');
    }
    Object.assign(user, updateUserDto);
    return this.userRepository.save(user);
  }

  async getUser(id: string): Promise<UserEntity> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['office'],
    });
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }

  async createSociallAuthUser(
    socialAuthDto: SocialAuthRegisterDto,
  ): Promise<UserEntity> {
    const user = this.userRepository.create(socialAuthDto);
    await this.userRepository.save(user);
    return user;
  }
  /**
   * Find single user
   */
  findOne(findData: FindOptionsWhere<UserEntity>): Promise<UserEntity | null> {
    return this.userRepository.findOne({
      where: findData,
      relations: ['office'],
    });
  }

  public async getUsers(
    pageOptionsDto: PageOptionsDto,
  ): Promise<[number, UserEntity[]]> {
    console.log(pageOptionsDto);
    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.office', 'office');

    if (pageOptionsDto.role) {
      queryBuilder.andWhere('user.role = :role', { role: pageOptionsDto.role });
    }

    queryBuilder
      .orderBy('user.createdAt', pageOptionsDto.order)
      .skip(pageOptionsDto.skip)
      .take(pageOptionsDto.take);

    const [data, itemCount] = await queryBuilder.getManyAndCount();
    console.log('user', data);
    return [itemCount, data];
  }

  save(user: UserEntity): Promise<UserEntity> {
    return this.userRepository.save(user);
  }
    async softDeleteUser(id: string): Promise<UserEntity> {
      const user = await this.userRepository.findOneBy({ id });
      if (!user) throw new Error('User not found');
      user.deletedAt = new Date();
      return this.userRepository.save(user);
    }

    async restoreUser(id: string): Promise<UserEntity> {
      const user = await this.userRepository.findOne({ where: { id }, withDeleted: true });
      if (!user) throw new Error('User not found');
      user.deletedAt = null;
      return this.userRepository.save(user);
    }

  async getDeletedUsers(pageOptionsDto: PageOptionsDto): Promise<{ data: UserEntity[]; meta: PageMetaDto }> {
      // Paginated deleted users
      const queryBuilder = this.userRepository.createQueryBuilder('user')
        .withDeleted()
        .where('user.deletedAt IS NOT NULL')
        .orderBy('user.createdAt', pageOptionsDto.order)
        .skip(pageOptionsDto.skip)
        .take(pageOptionsDto.take);

      const result = await queryBuilder.getMany();
      const meta = new PageMetaDto({ pageOptionsDto, itemCount: result.length });
      return { data: result, meta };
    }

  async getLoanOfficerMetrics(loanOfficerId: string): Promise<LoanOfficerMetricsDto> {
    // Validate loan officer exists and has correct role
    const loanOfficer = await this.userRepository.findOne({
      where: { id: loanOfficerId, role: RoleType.LOAN_OFFICER },
    });

    if (!loanOfficer) {
      throw new NotFoundException('Loan officer not found or user is not a loan officer');
    }

    // Get centers count
    const centersCount = await this.centerRepository.count({
      where: { user: loanOfficerId },
    });

    // Get groups with active loans count
    const activeGroupsResult = await this.groupRepository
      .createQueryBuilder('group')
      .select('COUNT(DISTINCT group.id)', 'count')
      .innerJoin('group.loans', 'loan')
      .innerJoin('group.staff', 'staff')
      .where('staff.id = :loanOfficerId', { loanOfficerId })
      .andWhere('loan.status = :activeStatus', {
        activeStatus: StatusEnum.ACTIVE,
      })
      .getRawOne();
    
    const activeGroupsCount = parseInt(activeGroupsResult.count) || 0;

    // Get total groups for this loan officer
    const totalGroupsCount = await this.groupRepository.count({
      where: { staff: { id: loanOfficerId } },
    });

    // Dormant groups = total groups - active groups
    const dormantGroupsCount = totalGroupsCount - activeGroupsCount;

    // Get clients with active loans count
    const activeClientsResult = await this.clientRepository
      .createQueryBuilder('client')
      .select('COUNT(DISTINCT client.id)', 'count')
      .innerJoin('client.loans', 'loan')
      .where('client.staffId = :loanOfficerId', { loanOfficerId })
      .andWhere('loan.status = :activeStatus', {
        activeStatus: StatusEnum.ACTIVE,
      })
      .getRawOne();
    
    const activeClientsCount = parseInt(activeClientsResult.count) || 0;

    // Get total clients for this loan officer
    const totalClientsCount = await this.clientRepository.count({
      where: { staffId: loanOfficerId },
    });

    // Dormant clients = total clients - active clients
    const dormantClientsCount = totalClientsCount - activeClientsCount;

    // Get active loan packages count
    const activeLoanPackagesCount = await this.groupPackageRepository.count({
      where: {
        userId: loanOfficerId,
        status: GroupPackageStatus.ACTIVE,
      },
    });

    // Get principal amount of active loan packages
    const activeLoanPackagesSum = await this.groupPackageRepository
      .createQueryBuilder('groupPackage')
      .select('COALESCE(SUM(groupPackage.amount), 0)', 'totalAmount')
      .where('groupPackage.userId = :loanOfficerId', { loanOfficerId })
      .andWhere('groupPackage.status = :status', { status: GroupPackageStatus.ACTIVE })
      .getRawOne();

    const principalAmountOfActiveLoanPackages = parseFloat(
      activeLoanPackagesSum.totalAmount || '0',
    );

    return new LoanOfficerMetricsDto({
      centersCount,
      activeGroupsCount,
      dormantGroupsCount,
      activeClientsCount,
      dormantClientsCount,
      activeLoanPackagesCount,
      principalAmountOfActiveLoanPackages,
    });
  }


}
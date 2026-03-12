import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Audit } from './entities/audit.entity';
import { AuditContextService } from './audit-context.service';
import { PageOptionsDto } from '../../common/dtos/page-options.dto';
import { PageResponseDto } from '../../common/dtos/page-response.dto';
import { PageMetaDto } from '../../common/dtos/page-meta.dto';
import { AuditStatus } from '../../constants/audit-status';
import { Order } from 'src/constants';

export class AuditQueryOptions {
  auditableType?: string;
  auditableId?: string;
  userId?: string;
  event?: string;
  status?: AuditStatus;
  startDate?: Date;
  endDate?: Date;
  ipAddress?: string;
  order: Order.DESC;
  page: number = 1;
  take: number = 20;
  
  get skip(): number {
    return ((this.page || 1) - 1) * (this.take || 20);
  }
}

export interface AuditStatistics {
  totalAudits: number;
  auditsByEvent: Record<string, number>;
  auditsByEntity: Record<string, number>;
  auditsByUser: Record<string, number>;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    @InjectRepository(Audit)
    private auditRepository: Repository<Audit>,
    private auditContextService: AuditContextService,
  ) {}

  /**
   * Create a manual audit entry
   */
  async createAuditEntry(
    auditableType: string,
    auditableId: string,
    event: string,
    data: {
      oldValues?: Record<string, any>;
      newValues?: Record<string, any>;
      status?: AuditStatus;
    },
  ): Promise<Audit> {
    const context = this.auditContextService.getContext();

    const auditRecord = this.auditRepository.create({
      auditableType,
      auditableId,
      event,
      status: data.status || AuditStatus.SUCCESS,
      oldValues: data.oldValues || null,
      newValues: data.newValues || null,
      userId: context?.userId || null,
      url: context?.url || null,
      ipAddress: context?.ipAddress || null,
      userAgent: context?.userAgent || null,
    });

    return this.auditRepository.save(auditRecord);
  }

  /**
   * Find audit trails with pagination and filtering
   */
  async findAuditTrails(options: AuditQueryOptions): Promise<PageResponseDto<Audit>> {
    const queryBuilder = this.auditRepository.createQueryBuilder('audit');

     // Enforce default pagination values and prevent fetching all records
  let page = Number(options.page);
  let take = Number(options.take);
  if (!page || page < 1) page = 1;
  if (!take || take < 1 || take > 100) take = 20; // max 100 per page
  options.page = page;
  options.take = take;

    // Apply filters
    if (options.auditableType) {
      queryBuilder.andWhere('audit.auditableType = :auditableType', {
        auditableType: options.auditableType,
      });
    }

    if (options.auditableId) {
      queryBuilder.andWhere('audit.auditableId = :auditableId', {
        auditableId: options.auditableId,
      });
    }

    if (options.userId) {
      queryBuilder.andWhere('audit.userId = :userId', {
        userId: options.userId,
      });
    }

    if (options.event) {
      queryBuilder.andWhere('audit.event = :event', {
        event: options.event,
      });
    }

    if (options.status) {
      queryBuilder.andWhere('audit.status = :status', {
        status: options.status,
      });
    }

    if (options.ipAddress) {
      queryBuilder.andWhere('audit.ipAddress = :ipAddress', {
        ipAddress: options.ipAddress,
      });
    }

    if (options.startDate || options.endDate) {
      const startDate = options.startDate;
      const endDate = options.endDate;
      queryBuilder.andWhere('audit.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });
    }

    // Apply pagination and ordering
    queryBuilder
      .orderBy('audit.createdAt', options.order ||  Order.DESC)
      .skip((page - 1) * take)
      .take(take);

    const [entities, totalCount] = await queryBuilder.getManyAndCount();

    const pageMetaDto = new PageMetaDto({
      itemCount: totalCount,
      pageOptionsDto: {
        page: options.page || 1,
        take: options.take || 20,
        order: options.order || Order.DESC,
      } as PageOptionsDto,
    });

    return PageResponseDto.from(entities, pageMetaDto, 'Audit trails retrieved successfully');
  }

  /**
   * Get audit trail for a specific entity
   */
  async getEntityAuditTrail(
    auditableType: string,
    auditableId: string,
    options?: PageOptionsDto,
  ): Promise<PageResponseDto<Audit>> {
    const queryOptions = new AuditQueryOptions();
    queryOptions.auditableType = auditableType;
    queryOptions.auditableId = auditableId;
    queryOptions.page = options?.page;
    queryOptions.take = options?.take;
    queryOptions.order = options?.order as Order.DESC;
    
    // Get the result and update the message
    const result = await this.findAuditTrails(queryOptions);
    result.message = `Audit trail for ${auditableType} retrieved successfully`;
    return result;
  }

  /**
   * Get audit statistics
   */
  async getAuditStatistics(
    startDate?: Date,
    endDate?: Date,
  ): Promise<AuditStatistics> {
    const queryBuilder = this.auditRepository.createQueryBuilder('audit');

    if (startDate || endDate) {
      const start = startDate || new Date('1970-01-01');
      const end = endDate || new Date();
      queryBuilder.where('audit.createdAt BETWEEN :start AND :end', {
        start,
        end,
      });
    }

    // Get total count
    const totalAudits = await queryBuilder.getCount();

    // Get counts by event type
    const eventStats = await queryBuilder
      .select('audit.event, COUNT(*) as count')
      .groupBy('audit.event')
      .getRawMany();

    const auditsByEvent = eventStats.reduce(
      (acc, stat) => {
        acc[stat.event] = parseInt(stat.count);
        return acc;
      },
      {} as Record<string, number>,
    );

    // Get counts by entity
    const entityStats = await queryBuilder
      .select('audit.auditableType, COUNT(*) as count')
      .groupBy('audit.auditableType')
      .orderBy('count', Order.DESC)
      .limit(10)
      .getRawMany();

    const auditsByEntity = entityStats.reduce(
      (acc, stat) => {
        acc[stat.auditableType] = parseInt(stat.count);
        return acc;
      },
      {} as Record<string, number>,
    );

    // Get counts by user
    const userStats = await queryBuilder
      .select('audit.userId, COUNT(*) as count')
      .where('audit.userId IS NOT NULL')
      .groupBy('audit.userId')
      .orderBy('count', Order.DESC)
      .limit(10)
      .getRawMany();

    const auditsByUser = userStats.reduce(
      (acc, stat) => {
        acc[stat.userId] = parseInt(stat.count);
        return acc;
      },
      {} as Record<string, number>,
    );


      return {
        totalAudits,
        auditsByEvent,
        auditsByEntity,
        auditsByUser,
      };
  }

  /**
   * Get user activity
   */
  async getUserActivity(
    userId: string,
    options?: PageOptionsDto,
  ): Promise<PageResponseDto<Audit>> {
    const queryOptions = new AuditQueryOptions();
    queryOptions.userId = userId;
    queryOptions.page = options?.page;
    queryOptions.take = options?.take;
    queryOptions.order = options?.order as Order.DESC;
    
    // Get the result and update the message
    const result = await this.findAuditTrails(queryOptions);
    result.message = 'User activity retrieved successfully';
    return result;
  }

  /**
   * Cleanup old audit records
   */
  async cleanupOldAudits(olderThanDays: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const result = await this.auditRepository
      .createQueryBuilder()
      .delete()
      .where('eventTimestamp < :cutoffDate', { cutoffDate })
      .execute();

    this.logger.log(
      `Cleaned up ${result.affected} audit records older than ${olderThanDays} days`,
    );

    return result.affected || 0;
  }

  /**
   * Export audit data
   */
  async exportAuditData(options: AuditQueryOptions): Promise<Audit[]> {
    const queryBuilder = this.auditRepository.createQueryBuilder('audit');

    // Apply same filters as findAuditTrails but without pagination
    if (options.auditableType) {
      queryBuilder.andWhere('audit.auditableType = :auditableType', {
        auditableType: options.auditableType,
      });
    }

    if (options.auditableId) {
      queryBuilder.andWhere('audit.auditableId = :auditableId', {
        auditableId: options.auditableId,
      });
    }

    if (options.userId) {
      queryBuilder.andWhere('audit.userId = :userId', {
        userId: options.userId,
      });
    }

    if (options.event) {
      queryBuilder.andWhere('audit.event = :event', {
        event: options.event,
      });
    }

    if (options.status) {
      queryBuilder.andWhere('audit.status = :status', {
        status: options.status,
      });
    }

    if (options.startDate || options.endDate) {
      const startDate = options.startDate || new Date('2025-01-01');
      const endDate = options.endDate || new Date();
      queryBuilder.andWhere('audit.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });
    }

    return queryBuilder
      .orderBy('audit.createdAt', Order.DESC)
      .take(1000)
      .getMany();
  }
}

import {
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
  UpdateEvent,
  RemoveEvent,
  SoftRemoveEvent,
  Repository,
  DataSource,
} from 'typeorm';
import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { Audit } from '../modules/audit/entities/audit.entity';
import { AuditContextService } from '../modules/audit/audit-context.service';
import { AuditStatus } from '../constants/audit-status';

@Injectable()
@EventSubscriber()
export class AuditSubscriber implements EntitySubscriberInterface {
  private readonly logger = new Logger(AuditSubscriber.name);
  private auditRepository: Repository<Audit>;

  constructor(
    @InjectDataSource() private dataSource: DataSource,
    private auditContextService: AuditContextService,
  ) {
    this.auditRepository = this.dataSource.getRepository(Audit);
    dataSource.subscribers.push(this);
  }

  /**
   * Called after entity insertion.
   */
  async afterInsert(event: InsertEvent<any>): Promise<void> {
    await this.createAuditRecord(event.entity, 'created', event);
  }

  /**
   * Called after entity update.
   */
  async afterUpdate(event: UpdateEvent<any>): Promise<void> {
    if (!event.entity || !event.databaseEntity) {
      return;
    }

    const oldValues = this.cleanSensitiveData({ ...event.databaseEntity });
    const newValues = this.cleanSensitiveData({ ...event.entity });

    await this.createAuditRecord(
      event.entity,
      'updated',
      event,
      oldValues,
      newValues,
    );
  }

  /**
   * Called after entity removal.
   */
  async afterRemove(event: RemoveEvent<any>): Promise<void> {
    if (!event.entity && !event.databaseEntity) {
      return;
    }

    const entity = event.entity || event.databaseEntity;
    await this.createAuditRecord(entity, 'deleted', event);
  }
  /**
   * Called after entity deletion is committed.
   */
  async afterDelete(event: RemoveEvent<any>): Promise<void> {
    if (!event.entity && !event.databaseEntity) {
      return;
    }

    const entity = event.entity || event.databaseEntity;
    await this.createAuditRecord(entity, 'permanently_deleted', event);
  }

  /**
   * Called after entity soft removal.
   */
  async afterSoftRemove(event: SoftRemoveEvent<any>): Promise<void> {
    if (!event.entity) {
      return;
    }

    await this.createAuditRecord(event.entity, 'deleted', event);
  }

  /**
   * Robustly determine the auditable type of an entity
   */
  private getAuditableType(entity: any): string {
    if (!entity) return 'Unknown';
    // Use constructor name if not Object
    const ctorName = entity.constructor?.name;
    if (ctorName && ctorName !== 'Object') return ctorName;
    // Fallback: check for explicit type properties
    if (entity._entityType) return entity._entityType;
    if (entity.entityType) return entity.entityType;
    // Heuristic: check for known fields
    if ('loanId' in entity) return 'LoanScheduleEntity';
    if ('clientId' in entity) return 'ClientEntity';
    // Add more heuristics as needed
    return 'Unknown';
  }
  private async createAuditRecord(
    entity: any,
    eventType: string,
    event: any,
    oldValues?: Record<string, any>,
    newValues?: Record<string, any>,
  ): Promise<void> {
    try {
      // Check if entity should be audited
      if (!this.shouldAuditEntity(entity)) {
        return;
      }

      // Get audit context
      const context = this.auditContextService.getContext();

      // Get entity metadata
      const auditableType = this.getAuditableType(entity);
      this.logger.debug('auditableType: ', auditableType)
      const idField = this.getEntityIdField(entity);
      const auditableId = idField ? entity[idField] : null;

      // Debug logging in development only
      if (process.env.NODE_ENV === 'development') {
        this.logger.debug(
          `Audit context for ${auditableType}:${auditableId} - UserId: ${context?.userId || 'NULL'}, HasContext: ${!!context}`,
        );
      }

      // If no context available, log warning but continue
      if (!context) {
        this.logger.warn(
          `No audit context available for ${auditableType}:${auditableId} - ${eventType}. This might indicate the operation is happening outside HTTP request context.`,
        );
      }

      if (!auditableId) {
        this.logger.warn(`Cannot audit entity ${auditableType} without ID field`);
        return;
      }

      // Create audit record
      const auditRecord = this.auditRepository.create({
        auditableType,
        auditableId: String(auditableId),
        event: eventType,
        status: AuditStatus.SUCCESS,
        oldValues: oldValues || null,
        newValues: newValues || (eventType === 'created' ? this.cleanSensitiveData({ ...entity }) : null),
        userId: context?.userId || null,
        url: context?.url || null,
        ipAddress: context?.ipAddress || null,
        userAgent: context?.userAgent || null,
      });

      await this.auditRepository.save(auditRecord);

      this.logger.debug(
        `Audit record created for ${auditableType}:${auditableId} - ${eventType}`,
      );
    } catch (error) {
      const entityName = entity?.constructor?.name || 'Unknown';
      this.logger.error(
        `Failed to create audit record for ${entityName}: ${error.message}`,
        error.stack,
      );

      // Try to create a failed audit record with minimal data
      try {
        const context = this.auditContextService.getContext();
        const auditableType = entity?.constructor?.name || 'Unknown';
        const idField = this.getEntityIdField(entity);
        const auditableId = idField ? entity[idField] : 'unknown';

        const failedAuditRecord = this.auditRepository.create({
          auditableType,
          auditableId: String(auditableId || 'unknown'),
          event: eventType,
          status: AuditStatus.FAILED,
          oldValues: null,
          newValues: { error: error.message },
          userId: context?.userId || null,
          url: context?.url || null,
          ipAddress: context?.ipAddress || null,
          userAgent: context?.userAgent || null,
        });

        await this.auditRepository.save(failedAuditRecord);
      } catch (fallbackError) {
        this.logger.error(
          `Failed to create fallback audit record: ${fallbackError.message}`,
        );
      }
    }
  }



  private getEntityIdField(entity: any): string | null {
    // Try to get primary key from metadata first
    try {
      const metadata = this.dataSource.getMetadata(entity.constructor);
      if (metadata.primaryColumns.length > 0) {
        return metadata.primaryColumns[0].propertyName;
      }
    } catch (error) {
      this.logger.debug(`Could not get metadata for ${entity.constructor.name}`);
    }

    // Try common ID field names as fallback
    const idFields = ['id', 'uuid', '_id'];
    for (const field of idFields) {
      if (entity[field] !== undefined && entity[field] !== null) {
        return field;
      }
    }
    
    return null; // Return null if no ID field found
  }

  private shouldAuditEntity(entity: any): boolean {
    if (!entity) return false;
    
    const entityName = entity.constructor.name;
    
    // Skip auditing for certain entities
    const skipEntities = [
      'Audit',
      'AuditTrail', // Legacy name if it exists
      'Migration',
      'Session',
      'QueryRunner',
    ];
    
    return !skipEntities.includes(entityName);
  }

  private cleanSensitiveData(data?: Record<string, any>): Record<string, any> | undefined {
    if (!data) return data;

    const sensitiveFields = [
      'password',
      'passwordHash',
      'token',
      'accessToken',
      'refreshToken',
      'secret',
      'apiKey',
      'privateKey',
      'ssn',
      'socialSecurityNumber',
      'creditCard',
      'pin',
    ];

    const cleaned = { ...data };

    for (const field of sensitiveFields) {
      if (cleaned[field] !== undefined) {
        cleaned[field] = '[REDACTED]';
      }
    }

    return cleaned;
  }
}
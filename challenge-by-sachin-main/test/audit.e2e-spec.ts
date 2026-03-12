import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { AuditService, AuditQueryOptions } from '../src/modules/audit/audit.service';
import { AuditContextService } from '../src/modules/audit/audit-context.service';
import { Audit } from '../src/modules/audit/entities/audit.entity';
import { AuditSubscriber } from '../src/entity-subscribers/audit.subscriber';
import { UserEntity } from '../src/modules/user/user.entity';

describe('Audit System Integration Tests', () => {
  let module: TestingModule;
  let auditService: AuditService;
  let auditContextService: AuditContextService;
  let auditRepository: Repository<Audit>;
  let userRepository: Repository<UserEntity>;
  let dataSource: DataSource;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [Audit, UserEntity],
          synchronize: true,
          subscribers: [AuditSubscriber],
          dropSchema: true,
        }),
        TypeOrmModule.forFeature([Audit, UserEntity]),
      ],
      providers: [AuditService, AuditContextService, AuditSubscriber],
    }).compile();

    auditService = module.get<AuditService>(AuditService);
    auditContextService = module.get<AuditContextService>(AuditContextService);
    dataSource = module.get<DataSource>(DataSource);
    
    auditRepository = dataSource.getRepository(Audit);
    userRepository = dataSource.getRepository(UserEntity);
  });

  afterAll(async () => {
    await dataSource.destroy();
    await module.close();
  });

  beforeEach(async () => {
    // Clear audit trails before each test
    await auditRepository.clear();
    await userRepository.clear();
  });

  describe('Entity Lifecycle Auditing', () => {
    it('should create audit trail on entity creation', async () => {
      const auditContext = {
        userId: 'test-user-id',
        ipAddress: '127.0.0.1',
        url: '/api/users',
      };

      await auditContextService.run(auditContext, async () => {
        const user = userRepository.create({
          email: 'test@example.com',
          password: 'password',
          firstName: 'Test',
          lastName: 'User',
        });
        await userRepository.save(user);
      });

      // Check audit trail was created
      const auditTrails = await auditRepository.find({
        where: { auditableType: 'UserEntity' },
      });

      expect(auditTrails).toHaveLength(1);
      
      const auditTrail = auditTrails[0];
      expect(auditTrail.event).toBe('created');
      expect(auditTrail.userId).toBe('test-user-id');
      expect(auditTrail.ipAddress).toBe('127.0.0.1');
      expect(auditTrail.url).toBe('/api/users');
      expect(auditTrail.newValues).toBeTruthy();
      expect(auditTrail.oldValues).toBeNull();
    });

    it('should create audit trail on entity update', async () => {
      const auditContext = {
        userId: 'test-user-id',
        ipAddress: '127.0.0.1',
        url: '/api/users/test-user-id',
      };

      // First create a user
      const user = userRepository.create({
        email: 'test@example.com',
        password: 'password',
        firstName: 'Test',
        lastName: 'User',
      });
      const savedUser = await userRepository.save(user);

      // Clear initial audit records
      await auditRepository.clear();

      // Update the user within audit context
      await auditContextService.run(auditContext, async () => {
        await userRepository.update(savedUser.id, {
          firstName: 'Updated',
          lastName: 'Name',
        });
      });

      // Check audit trail was created for update
      const auditTrails = await auditRepository.find({
        where: { 
          auditableType: 'UserEntity',
          event: 'updated',
        },
      });

      expect(auditTrails).toHaveLength(1);
      
      const auditTrail = auditTrails[0];
      expect(auditTrail.event).toBe('updated');
      expect(auditTrail.auditableId).toBe(savedUser.id);
      expect(auditTrail.userId).toBe('test-user-id');
      expect(auditTrail.oldValues).toBeTruthy();
      expect(auditTrail.newValues).toBeTruthy();
    });

    it('should create audit trail on entity deletion', async () => {
      const auditContext = {
        userId: 'test-user-id',
        ipAddress: '127.0.0.1',
        url: '/api/users/test-user-id',
      };

      // Create a user first
      const user = userRepository.create({
        email: 'test@example.com',
        password: 'password',
        firstName: 'Test',
        lastName: 'User',
      });
      const savedUser = await userRepository.save(user);

      // Clear initial audit records
      await auditRepository.clear();

      // Soft delete the user within audit context
      await auditContextService.run(auditContext, async () => {
        await userRepository.softDelete(savedUser.id);
      });

      // Check audit trail was created for soft delete
      const auditTrails = await auditRepository.find({
        where: { 
          auditableType: 'UserEntity',
          event: 'deleted',
        },
      });

      expect(auditTrails).toHaveLength(1);
      
      const auditTrail = auditTrails[0];
      expect(auditTrail.event).toBe('deleted');
      expect(auditTrail.auditableId).toBe(savedUser.id);
      expect(auditTrail.userId).toBe('test-user-id');
    });
  });

  describe('Audit Context Service', () => {
    it('should correctly maintain context across async operations', async () => {
      const context1 = {
        userId: 'user-1',
        userName: 'User One',
        ipAddress: '192.168.1.1',
      };

      const context2 = {
        userId: 'user-2',
        userName: 'User Two',
        ipAddress: '192.168.1.2',
      };

      const results = await Promise.all([
        auditContextService.run(context1, async () => {
          // Simulate async operation
          await new Promise(resolve => setTimeout(resolve, 10));
          return auditContextService.getContext();
        }),
        auditContextService.run(context2, async () => {
          // Simulate async operation
          await new Promise(resolve => setTimeout(resolve, 15));
          return auditContextService.getContext();
        }),
      ]);

      expect(results[0]?.userId).toBe('user-1');
      expect(results[0]?.userName).toBe('User One');
      expect(results[1]?.userId).toBe('user-2');
      expect(results[1]?.userName).toBe('User Two');
    });

    it('should handle nested contexts correctly', async () => {
      const outerContext = {
        userId: 'outer-user',
        userName: 'Outer User',
      };

      const innerContext = {
        userId: 'inner-user',
        userName: 'Inner User',
        reason: 'Inner operation',
      };

      const result = await auditContextService.run(outerContext, async () => {
        const outerCtx = auditContextService.getContext();
        
        const innerResult = await auditContextService.run(innerContext, async () => {
          return auditContextService.getContext();
        });

        return { outer: outerCtx, inner: innerResult };
      });

      expect(result.outer?.userId).toBe('outer-user');
      expect(result.inner?.userId).toBe('inner-user');
      expect(result.inner?.reason).toBe('Inner operation');
    });
  });

  describe('Audit Service', () => {
    it('should create manual audit entries', async () => {
      const auditContext = {
        userId: 'test-user-id',
        userName: 'Test User',
        ipAddress: '127.0.0.1',
      };

      const auditEntry = await auditContextService.run(auditContext, () =>
        auditService.createAuditEntry(
          'TestEntity',
          'test-entity-id',
          'updated',
          {
            oldValues: { field1: 'old-value' },
            newValues: { field1: 'new-value' },
          },
        ),
      );

      expect(auditEntry).toBeDefined();
      expect(auditEntry.auditableType).toBe('TestEntity');
      expect(auditEntry.auditableId).toBe('test-entity-id');
      expect(auditEntry.event).toBe('updated');
      expect(auditEntry.userId).toBe('test-user-id');
    });

    it('should retrieve audit trails with pagination', async () => {
      // Create multiple audit entries
      for (let i = 0; i < 25; i++) {
        await auditRepository.save(
          auditRepository.create({
            auditableType: 'TestEntity',
            auditableId: `entity-${i}`,
            event: 'created',
            userId: 'test-user-id',
          }),
        );
      }

      const queryOptions = new AuditQueryOptions();
      queryOptions.page = 1;
      queryOptions.take = 10;
      queryOptions.auditableType = 'TestEntity';

      const result = await auditService.findAuditTrails(queryOptions);

      expect(result.data).toHaveLength(10);
      expect(result.metaData.itemCount).toBe(25);
      expect(result.metaData.pageCount).toBe(3);
    });

    it('should generate audit statistics', async () => {
      // Create sample audit data
      const eventTypes = [
        'created',
        'updated',
        'deleted',
      ];
      
      for (let i = 0; i < 30; i++) {
        await auditRepository.save(
          auditRepository.create({
            auditableType: i % 2 === 0 ? 'LoanEntity' : 'UserEntity',
            auditableId: `entity-${i}`,
            event: eventTypes[i % 3],
            userId: `user-${i % 5}`,
          }),
        );
      }

      const stats = await auditService.getAuditStatistics();

      expect(stats.totalAudits).toBe(30);
      expect(stats.auditsByEvent['created']).toBe(10);
      expect(stats.auditsByEvent['updated']).toBe(10);
      expect(stats.auditsByEvent['deleted']).toBe(10);
      expect(stats.auditsByEntity['LoanEntity']).toBe(15);
      expect(stats.auditsByEntity['UserEntity']).toBe(15);
      expect(stats.recentActivity).toHaveLength(20);
    });
  });

  describe('Data Security', () => {
    it('should redact sensitive data in audit logs', async () => {
      const auditContext = {
        userId: 'test-user-id',
        userName: 'Test User',
      };

      await auditContextService.run(auditContext, async () => {
        const user = userRepository.create({
          id: 'test-sensitive-user',
          email: 'sensitive@example.com',
          password: 'super-secret-password',
          firstName: 'Sensitive',
          lastName: 'User',
        });
        await userRepository.save(user);
      });

      const auditTrails = await auditRepository.find({
        where: { auditableType: 'UserEntity' },
      });

      expect(auditTrails).toHaveLength(1);
      expect(auditTrails[0].newValues.password).toBe('[REDACTED]');
      expect(auditTrails[0].newValues.email).toBe('sensitive@example.com'); // Email is not redacted
    });
  });
});
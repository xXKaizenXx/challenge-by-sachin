import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditService } from './audit.service';
import { AuditController } from './audit.controller';
import { Audit } from './entities/audit.entity';
import { AuditContextService } from './audit-context.service';
import { AuditSubscriber } from '../../entity-subscribers/audit.subscriber';
import { AuditAwareAuthGuard } from '../../guards/audit-aware-auth.guard';
import { UserContextInterceptor } from '../../interceptors/user-context.interceptor';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([Audit])],
  controllers: [AuditController],
  providers: [
    AuditService, 
    AuditContextService, 
    AuditSubscriber, 
    AuditAwareAuthGuard,
    UserContextInterceptor,
  ],
  exports: [AuditService, AuditContextService, AuditAwareAuthGuard, UserContextInterceptor],
})
export class AuditModule {}

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { AuditContextService } from '../modules/audit/audit-context.service';
import { AUDIT_REASON_KEY, AUDIT_METADATA_KEY } from '../decorators/audit.decorators';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private reflector: Reflector,
    private auditContextService: AuditContextService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const reason = this.reflector.get<string>(AUDIT_REASON_KEY, context.getHandler());
    const metadata = this.reflector.get<Record<string, any>>(
      AUDIT_METADATA_KEY,
      context.getHandler(),
    );

    if (reason || metadata) {
      // Update the current audit context with reason and metadata
      if (reason) {
        this.auditContextService.setValue('reason', reason);
      }
      
      if (metadata) {
        this.auditContextService.mergeContext({ metadata });
      }
    }

    return next.handle();
  }
}
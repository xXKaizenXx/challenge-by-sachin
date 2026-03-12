import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditContextService } from '../modules/audit/audit-context.service';
import { UserEntity } from '../modules/user/user.entity';

@Injectable()
export class UserContextInterceptor implements NestInterceptor {
  constructor(private auditContextService: AuditContextService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const user = request.user as UserEntity;

    // If we have a user and audit context, ensure user info is set
    if (user && this.auditContextService.hasContext()) {
      this.auditContextService.mergeContext({
        userId: user.id,
        userName: this.getUserDisplayName(user),
      });
    }

    return next.handle().pipe(
      tap(() => {
        // Optional: Log successful operations
        if (user) {
          console.log(`Operation completed by user: ${user.id}`);
        }
      }),
    );
  }

  private getUserDisplayName(user: UserEntity): string {
    if (user.username) return user.username;
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    if (user.email) return user.email;
    return `User-${user.id}`;
  }
}
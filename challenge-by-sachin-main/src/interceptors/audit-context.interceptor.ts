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
import { ConfigService } from '@nestjs/config';

export interface AuthenticatedRequest extends Request {
  user?: UserEntity;
  ip?: string;
  headers: any;
  originalUrl?: string;
  url: string;
  method: string;
}

@Injectable()
export class AuditContextInterceptor implements NestInterceptor {
  constructor(
    private auditContextService: AuditContextService,
    private configService: ConfigService
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;

    // Only set/update context if we have a user (after authentication)
    if (user && this.auditContextService.hasContext()) {
      // Update the existing context with user information
      this.auditContextService.mergeContext({
        userId: user.id,
        userName: this.getUserDisplayName(user),
      });

      const isDev = this.configService.get<string>('env') === 'development';
      if (isDev) {
        console.log('AuditContextInterceptor - Updated context with user:', user.id);
      }
    } else if (user && !this.auditContextService.hasContext()) {
      // If no context exists but we have a user, create new context
      const auditContext = {
        userId: user.id,
        userName: this.getUserDisplayName(user),
        ipAddress: this.getClientIp(request),
        userAgent: request.headers['user-agent'] || null,
        url: request.originalUrl || request.url,
        method: request.method,
      };

      // Run the request in the audit context
      return new Observable(observer => {
        this.auditContextService.run(auditContext, () => {
          next.handle().pipe(
            tap({
              next: (value) => observer.next(value),
              error: (error) => observer.error(error),
              complete: () => observer.complete(),
            })
          ).subscribe();
        });
      });
    }

    return next.handle();
  }

  private getUserDisplayName(user: UserEntity): string {
    if (user.username) return user.username;
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    if (user.email) return user.email;
    return `User-${user.id}`;
  }

  private getClientIp(req: AuthenticatedRequest): string {
    return (
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      (req.headers['x-real-ip'] as string) ||
      (req.headers['x-client-ip'] as string) ||
      req.ip ||
      'unknown'
    );
  }
}
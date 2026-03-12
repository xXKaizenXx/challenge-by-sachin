import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { AuditContextService } from '../modules/audit/audit-context.service';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    username?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
  };
}

@Injectable()
export class AuditMiddleware implements NestMiddleware {
  constructor(private auditContextService: AuditContextService) {}

  use(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
    // Create initial context without user (user will be added by interceptor after auth)
    const auditContext = {
      userId: null, // Will be set by interceptor after authentication
      userName: null,
      ipAddress: this.getClientIp(req),
      userAgent: req.get('User-Agent') || null,
      url: req.originalUrl || req.url,
      method: req.method,
    };

    // Debug logging to track context creation
    if (process.env.NODE_ENV === 'development') {
      console.log('Audit Middleware - Creating initial context (user will be added later)');
      console.log('Audit Middleware - Initial context:', auditContext);
    }

    // Run the request in the audit context
    this.auditContextService.run(auditContext, () => {
      next();
    });
  }

  private getUserDisplayName(user?: AuthenticatedRequest['user']): string | undefined {
    if (!user) return undefined;

    if (user.username) return user.username;
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    if (user.email) return user.email;
    return `User-${user.id}`;
  }

  private getClientIp(req: Request): string {
    return (
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      (req.headers['x-real-ip'] as string) ||
      (req.headers['x-client-ip'] as string) ||
      req.connection?.remoteAddress ||
      req.socket?.remoteAddress ||
      req.ip ||
      'unknown'
    );
  }
}
import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard as PassportAuthGuard } from '@nestjs/passport';
import { AuditContextService } from '../modules/audit/audit-context.service';
import { UserEntity } from '../modules/user/user.entity';

@Injectable()
export class AuditAwareAuthGuard extends PassportAuthGuard('jwt') {
  constructor(private auditContextService: AuditContextService) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // First, run the standard JWT authentication
    const result = await super.canActivate(context);
    
    if (!result) {
      return false;
    }

    // Get the request object
    const request = context.switchToHttp().getRequest();
    const user = request.user as UserEntity;

    // If we have a user, update the audit context with user information
    if (user && this.auditContextService.hasContext()) {
      this.auditContextService.mergeContext({
        userId: user.id,
        userName: this.getUserDisplayName(user),
      });
    }

    return true;
  }

  handleRequest<TUser = UserEntity>(
    err: any, 
    user: any, 
    info: any, 
    context: ExecutionContext,
    status?: any
  ): TUser {
    // Handle the authentication result
    if (err || !user) {
      throw err || new UnauthorizedException('Authentication failed');
    }

    // Get the HTTP request
    const request = context.switchToHttp().getRequest();
    
    // Ensure user is attached to request
    request.user = user;

    return user;
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
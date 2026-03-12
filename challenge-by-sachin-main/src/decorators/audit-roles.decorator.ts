import { SetMetadata } from '@nestjs/common';
import { RoleType } from '../constants/role-type';

export const AUDIT_ROLES_KEY = 'auditRoles';
export const AuditRoles = (...roles: RoleType[]) => SetMetadata(AUDIT_ROLES_KEY, roles);
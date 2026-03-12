import { SetMetadata } from '@nestjs/common';

export const AUDIT_REASON_KEY = 'audit_reason';
export const AUDIT_METADATA_KEY = 'audit_metadata';

/**
 * Decorator to set audit reason for controller actions
 */
export const AuditReason = (reason: string) => SetMetadata(AUDIT_REASON_KEY, reason);

/**
 * Decorator to set audit metadata for controller actions
 */
export const AuditMetadata = (metadata: Record<string, any>) => 
  SetMetadata(AUDIT_METADATA_KEY, metadata);

/**
 * Decorator to combine audit reason and metadata
 */
export const Audit = (reason: string, metadata?: Record<string, any>) => {
  return (target: any, propertyKey?: string, descriptor?: PropertyDescriptor) => {
    SetMetadata(AUDIT_REASON_KEY, reason)(target, propertyKey, descriptor);
    if (metadata) {
      SetMetadata(AUDIT_METADATA_KEY, metadata)(target, propertyKey, descriptor);
    }
  };
};
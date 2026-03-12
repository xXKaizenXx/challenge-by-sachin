export enum AuditStatus {
  SUCCESS = 'success',
  FAILED = 'failed',
  ERROR = 'error',
  PENDING = 'pending',
  PARTIAL = 'partial',
  CANCELLED = 'cancelled',
}

export const AuditStatusValues = Object.values(AuditStatus);

export const AuditStatusDescriptions = {
  [AuditStatus.SUCCESS]: 'Operation completed successfully',
  [AuditStatus.FAILED]: 'Operation failed but was captured',
  [AuditStatus.ERROR]: 'Error occurred during operation',
  [AuditStatus.PENDING]: 'Operation is in progress',
  [AuditStatus.PARTIAL]: 'Operation completed partially',
  [AuditStatus.CANCELLED]: 'Operation was cancelled by user',
} as const;
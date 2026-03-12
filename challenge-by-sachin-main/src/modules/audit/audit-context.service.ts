import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';

export interface AuditContext {
  userId?: string;
  userName?: string;
  ipAddress?: string;
  userAgent?: string;
  url?: string;
  method?: string;
  reason?: string;
  metadata?: Record<string, any>;
}

@Injectable()
export class AuditContextService {
  private readonly asyncLocalStorage = new AsyncLocalStorage<AuditContext>();

  /**
   * Run a function within an audit context
   */
  run<T>(context: AuditContext, callback: () => T): T {
    return this.asyncLocalStorage.run(context, callback);
  }

  /**
   * Get the current audit context
   */
  getContext(): AuditContext | undefined {
    return this.asyncLocalStorage.getStore();
  }

  /**
   * Set a specific value in the current context
   */
  setValue<K extends keyof AuditContext>(key: K, value: AuditContext[K]): void {
    const context = this.getContext();
    if (context) {
      context[key] = value;
    }
  }

  /**
   * Get a specific value from the current context
   */
  getValue<K extends keyof AuditContext>(key: K): AuditContext[K] | undefined {
    const context = this.getContext();
    return context?.[key];
  }

  /**
   * Check if we're currently in an audit context
   */
  hasContext(): boolean {
    return this.getContext() !== undefined;
  }

  /**
   * Merge additional context data
   */
  mergeContext(additionalContext: Partial<AuditContext>): void {
    const context = this.getContext();
    if (context) {
      Object.assign(context, additionalContext);
    }
  }
}
import { Injectable } from '@nestjs/common';

export interface PerformanceMetrics {
  operation: string;
  startTime: number;
  endTime: number;
  duration: number;
  queryCount?: number;
  memoryUsage?: {
    heapUsed: number;
    heapTotal: number;
    external: number;
    rss: number;
  };
  metadata?: Record<string, any>;
}

@Injectable()
export class PerformanceMonitorService {
  private metrics: PerformanceMetrics[] = [];
  private queryCounters = new Map<string, number>();

  startOperation(operation: string, metadata?: Record<string, any>): string {
    const operationId = `${operation}_${Date.now()}_${Math.random()}`;
    const startTime = Date.now();
    
    // Reset query counter for this operation
    this.queryCounters.set(operationId, 0);
    
    console.log(`[PERFORMANCE] ${operation} started at ${new Date().toISOString()}`);
    
    return operationId;
  }

  endOperation(operationId: string, operation: string, metadata?: Record<string, any>): PerformanceMetrics {
    const endTime = Date.now();
    const queryCount = this.queryCounters.get(operationId) || 0;
    const memoryUsage = process.memoryUsage();
    
    // Extract start time from operationId (hacky but works for our use case)
    const startTime = parseInt(operationId.split('_')[1]);
    const duration = endTime - startTime;
    
    const metrics: PerformanceMetrics = {
      operation,
      startTime,
      endTime,
      duration,
      queryCount,
      memoryUsage,
      metadata,
    };
    
    this.metrics.push(metrics);
    
    console.log(`[PERFORMANCE] ${operation} completed in ${duration}ms with ${queryCount} queries`);
    console.log(`[PERFORMANCE] Memory usage: ${(memoryUsage.heapUsed / 1024 / 1024).toFixed(2)} MB heap`);
    
    // Clean up
    this.queryCounters.delete(operationId);
    
    return metrics;
  }

  incrementQueryCount(operationId: string): void {
    const current = this.queryCounters.get(operationId) || 0;
    this.queryCounters.set(operationId, current + 1);
  }

  getMetrics(operation?: string): PerformanceMetrics[] {
    if (operation) {
      return this.metrics.filter(m => m.operation === operation);
    }
    return this.metrics;
  }

  getAverageMetrics(operation: string): {
    averageDuration: number;
    averageQueryCount: number;
    totalOperations: number;
    minDuration: number;
    maxDuration: number;
  } {
    const operationMetrics = this.getMetrics(operation);
    
    if (operationMetrics.length === 0) {
      return {
        averageDuration: 0,
        averageQueryCount: 0,
        totalOperations: 0,
        minDuration: 0,
        maxDuration: 0,
      };
    }

    const durations = operationMetrics.map(m => m.duration);
    const queryCounts = operationMetrics.map(m => m.queryCount || 0);
    
    return {
      averageDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
      averageQueryCount: queryCounts.reduce((a, b) => a + b, 0) / queryCounts.length,
      totalOperations: operationMetrics.length,
      minDuration: Math.min(...durations),
      maxDuration: Math.max(...durations),
    };
  }

  clearMetrics(): void {
    this.metrics = [];
    this.queryCounters.clear();
  }

  logSummary(operation: string): void {
    const summary = this.getAverageMetrics(operation);
    console.log(`[PERFORMANCE SUMMARY] ${operation}:`);
    console.log(`  Total operations: ${summary.totalOperations}`);
    console.log(`  Average duration: ${summary.averageDuration.toFixed(2)}ms`);
    console.log(`  Min duration: ${summary.minDuration}ms`);
    console.log(`  Max duration: ${summary.maxDuration}ms`);
    console.log(`  Average query count: ${summary.averageQueryCount.toFixed(2)}`);
  }

  // Target performance validation
  validatePerformanceTarget(
    operation: string, 
    targetDurationMs: number, 
    targetMaxQueries: number
  ): {
    passedDuration: boolean;
    passedQueryCount: boolean;
    actualDuration: number;
    actualQueryCount: number;
  } {
    const latest = this.getMetrics(operation).slice(-1)[0];
    
    if (!latest) {
      throw new Error(`No metrics found for operation: ${operation}`);
    }

    const passedDuration = latest.duration <= targetDurationMs;
    const passedQueryCount = (latest.queryCount || 0) <= targetMaxQueries;

    console.log(`[PERFORMANCE VALIDATION] ${operation}:`);
    console.log(`  Duration: ${latest.duration}ms (target: ≤${targetDurationMs}ms) - ${passedDuration ? 'PASS' : 'FAIL'}`);
    console.log(`  Query count: ${latest.queryCount} (target: ≤${targetMaxQueries}) - ${passedQueryCount ? 'PASS' : 'FAIL'}`);

    return {
      passedDuration,
      passedQueryCount,
      actualDuration: latest.duration,
      actualQueryCount: latest.queryCount || 0,
    };
  }
}
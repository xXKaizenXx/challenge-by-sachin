import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoanService } from '../src/modules/loan/loan.service';
import { PerformanceMonitorService } from '../src/common/performance-monitor.service';

/**
 * Loan Creation Performance Test Suite
 * 
 * This test suite validates that the loan creation optimizations
 * meet the target performance requirements:
 * - ≤5 seconds response time for 4+ clients
 * - ≤40 database queries per loan package
 * - Memory usage optimization
 * - Concurrent processing support
 */
describe('Loan Creation Performance Tests', () => {
  let app: INestApplication;
  let loanService: LoanService;
  let performanceMonitor: PerformanceMonitorService;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        // Add your TypeORM configuration here
        TypeOrmModule.forRoot({
          // Test database configuration
        }),
        // Add all necessary modules
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    loanService = moduleFixture.get<LoanService>(LoanService);
    performanceMonitor = moduleFixture.get<PerformanceMonitorService>(PerformanceMonitorService);

    // Setup authentication token for testing
    authToken = await getTestAuthToken();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    performanceMonitor.clearMetrics();
  });

  describe('Performance Requirements Validation', () => {
    it('should create loans for 4 clients in ≤5 seconds', async () => {
      const testLoanData = createTestLoanData(4);
      
      const startTime = Date.now();
      
      const response = await request(app.getHttpServer())
        .post('/performance/loans/create-optimized')
        .set('Authorization', `Bearer ${authToken}`)
        .send(testLoanData)
        .expect(201);

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Validate response time target
      expect(duration).toBeLessThanOrEqual(5000);
      
      // Validate API response includes performance metrics
      expect(response.body.performance).toBeDefined();
      expect(response.body.performance.duration).toBeLessThanOrEqual(5000);
      expect(response.body.performance.targetsMet.duration).toBe(true);
      
      console.log(`✅ Loan creation completed in ${duration}ms (target: ≤5000ms)`);
    });

    it('should use ≤40 database queries for loan package creation', async () => {
      const testLoanData = createTestLoanData(4);
      
      const response = await request(app.getHttpServer())
        .post('/performance/loans/create-optimized')
        .set('Authorization', `Bearer ${authToken}`)
        .send(testLoanData)
        .expect(201);

      // Validate query count target
      expect(response.body.performance.queryCount).toBeLessThanOrEqual(40);
      expect(response.body.performance.targetsMet.queryCount).toBe(true);
      
      console.log(`✅ Loan creation used ${response.body.performance.queryCount} queries (target: ≤40)`);
    });

    it('should demonstrate significant performance improvement over baseline', async () => {
      const testLoanData = createTestLoanData(4);
      
      // Run optimized version
      const optimizedResponse = await request(app.getHttpServer())
        .post('/performance/loans/create-optimized')
        .set('Authorization', `Bearer ${authToken}`)
        .send(testLoanData)
        .expect(201);

      const optimizedMetrics = optimizedResponse.body.performance;
      
      // Expected baseline performance (from requirements):
      // - Duration: >10 seconds
      // - Queries: ~80 per loan package
      const baselineDuration = 10000;
      const baselineQueries = 80;
      
      const durationImprovement = ((baselineDuration - optimizedMetrics.duration) / baselineDuration) * 100;
      const queryImprovement = ((baselineQueries - optimizedMetrics.queryCount) / baselineQueries) * 100;
      
      // Validate minimum 50% improvement in queries (as per requirements)
      expect(queryImprovement).toBeGreaterThanOrEqual(50);
      
      console.log(`✅ Performance improvements:`);
      console.log(`   Duration: ${durationImprovement.toFixed(1)}% faster`);
      console.log(`   Queries: ${queryImprovement.toFixed(1)}% reduction`);
    });

    it('should handle concurrent loan creation without performance degradation', async () => {
      const concurrentRequests = 3;
      const testLoanDataSets = Array.from({ length: concurrentRequests }, (_, i) => 
        createTestLoanData(4, `concurrent-test-${i}`)
      );
      
      const startTime = Date.now();
      
      // Execute concurrent loan creations
      const promises = testLoanDataSets.map(testData =>
        request(app.getHttpServer())
          .post('/performance/loans/create-optimized')
          .set('Authorization', `Bearer ${authToken}`)
          .send(testData)
      );
      
      const responses = await Promise.all(promises);
      const endTime = Date.now();
      
      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(201);
        expect(response.body.performance.duration).toBeLessThanOrEqual(5000);
        expect(response.body.performance.queryCount).toBeLessThanOrEqual(40);
      });
      
      const totalDuration = endTime - startTime;
      const averageDuration = responses.reduce((sum, r) => sum + r.body.performance.duration, 0) / responses.length;
      
      console.log(`✅ Concurrent processing (${concurrentRequests} requests):`);
      console.log(`   Total time: ${totalDuration}ms`);
      console.log(`   Average individual duration: ${averageDuration.toFixed(0)}ms`);
    });

    it('should maintain memory usage within acceptable limits', async () => {
      const testLoanData = createTestLoanData(4);
      
      const memoryBefore = process.memoryUsage();
      
      const response = await request(app.getHttpServer())
        .post('/performance/loans/create-optimized')
        .set('Authorization', `Bearer ${authToken}`)
        .send(testLoanData)
        .expect(201);
      
      const memoryAfter = process.memoryUsage();
      const memoryIncrease = memoryAfter.heapUsed - memoryBefore.heapUsed;
      
      // Memory increase should be reasonable (less than 50MB for 4 clients)
      const maxMemoryIncreaseMB = 50;
      const memoryIncreaseMB = memoryIncrease / 1024 / 1024;
      
      expect(memoryIncreaseMB).toBeLessThan(maxMemoryIncreaseMB);
      
      console.log(`✅ Memory usage increase: ${memoryIncreaseMB.toFixed(2)}MB (limit: ${maxMemoryIncreaseMB}MB)`);
    });
  });

  describe('Performance Monitoring and Metrics', () => {
    it('should provide comprehensive performance metrics', async () => {
      const testLoanData = createTestLoanData(4);
      
      await request(app.getHttpServer())
        .post('/performance/loans/create-optimized')
        .set('Authorization', `Bearer ${authToken}`)
        .send(testLoanData)
        .expect(201);
      
      const metricsResponse = await request(app.getHttpServer())
        .get('/performance/loans/performance-summary')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      const metrics = metricsResponse.body;
      
      expect(metrics.summary).toBeDefined();
      expect(metrics.summary.totalOperations).toBeGreaterThan(0);
      expect(metrics.summary.averageDuration).toBeDefined();
      expect(metrics.summary.averageQueryCount).toBeDefined();
      expect(metrics.targetCompliance).toBeDefined();
      
      console.log('✅ Performance metrics tracking working correctly');
    });

    it('should validate performance targets', async () => {
      const testLoanData = createTestLoanData(4);
      
      await request(app.getHttpServer())
        .post('/performance/loans/create-optimized')
        .set('Authorization', `Bearer ${authToken}`)
        .send(testLoanData)
        .expect(201);
      
      const validationResponse = await request(app.getHttpServer())
        .post('/performance/loans/validate-performance')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      const validation = validationResponse.body;
      
      expect(validation.success).toBe(true);
      expect(validation.validation.passedDuration).toBe(true);
      expect(validation.validation.passedQueryCount).toBe(true);
      
      console.log('✅ Performance target validation working correctly');
    });
  });

  describe('Error Handling and Rollback', () => {
    it('should rollback transaction on error without performance impact', async () => {
      const invalidLoanData = createInvalidTestLoanData();
      
      const startTime = Date.now();
      
      const response = await request(app.getHttpServer())
        .post('/performance/loans/create-optimized')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidLoanData)
        .expect(400);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Even failed operations should complete quickly
      expect(duration).toBeLessThan(2000);
      expect(response.body.message).toBeDefined();
      
      console.log(`✅ Error handling completed in ${duration}ms`);
    });
  });

  // Helper functions
  function createTestLoanData(clientCount: number, suffix: string = '') {
    return {
      groupId: `test-group-id-${suffix}`,
      targetDisbursementDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      clientApplications: Array.from({ length: clientCount }, (_, i) => ({
        clientId: `test-client-${i}-${suffix}`,
        loanTableId: `test-loan-table-${i}-${suffix}`,
        businessType: 'retail',
        loanAmount: 10000,
      })),
    };
  }

  function createInvalidTestLoanData() {
    return {
      groupId: 'invalid-group-id',
      targetDisbursementDate: new Date(),
      clientApplications: [], // Invalid: less than 4 clients
    };
  }

  async function getTestAuthToken(): Promise<string> {
    // Implementation depends on your authentication system
    // This should return a valid JWT token for testing
    return 'test-auth-token';
  }
});

/**
 * Performance Benchmarking Utility
 * 
 * Use this to run benchmarks and generate performance reports
 */
export class LoanPerformanceBenchmark {
  constructor(
    private app: INestApplication,
    private performanceMonitor: PerformanceMonitorService
  ) {}

  async runBenchmark(iterations: number = 10, clientCount: number = 4): Promise<void> {
    console.log(`\n🚀 Running Loan Creation Performance Benchmark`);
    console.log(`   Iterations: ${iterations}`);
    console.log(`   Clients per loan: ${clientCount}`);
    console.log(`   Target: ≤5000ms duration, ≤40 queries\n`);

    const results = [];

    for (let i = 0; i < iterations; i++) {
      const testData = this.createBenchmarkData(clientCount, i);
      
      try {
        const response = await request(this.app.getHttpServer())
          .post('/performance/loans/create-optimized')
          .send(testData);

        results.push({
          iteration: i + 1,
          duration: response.body.performance.duration,
          queryCount: response.body.performance.queryCount,
          memoryUsed: response.body.performance.memoryUsage.heapUsed,
          success: true,
        });

        process.stdout.write(`✓`);
      } catch (error) {
        results.push({
          iteration: i + 1,
          duration: null,
          queryCount: null,
          memoryUsed: null,
          success: false,
          error: error.message,
        });

        process.stdout.write(`✗`);
      }
    }

    console.log(`\n\n📊 Benchmark Results:`);
    this.generateBenchmarkReport(results);
  }

  private generateBenchmarkReport(results: any[]): void {
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    if (successful.length === 0) {
      console.log('❌ All operations failed');
      return;
    }

    const durations = successful.map(r => r.duration);
    const queryCounts = successful.map(r => r.queryCount);
    const memoryUsages = successful.map(r => r.memoryUsed);

    const stats = {
      successRate: (successful.length / results.length) * 100,
      avgDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
      minDuration: Math.min(...durations),
      maxDuration: Math.max(...durations),
      avgQueries: queryCounts.reduce((a, b) => a + b, 0) / queryCounts.length,
      minQueries: Math.min(...queryCounts),
      maxQueries: Math.max(...queryCounts),
      avgMemory: memoryUsages.reduce((a, b) => a + b, 0) / memoryUsages.length,
    };

    console.log(`   Success Rate: ${stats.successRate.toFixed(1)}%`);
    console.log(`   
   Duration (ms):`);
    console.log(`     Average: ${stats.avgDuration.toFixed(0)}ms`);
    console.log(`     Min: ${stats.minDuration}ms`);
    console.log(`     Max: ${stats.maxDuration}ms`);
    console.log(`     Target Met: ${stats.avgDuration <= 5000 ? '✅' : '❌'} (≤5000ms)`);
    
    console.log(`   
   Query Count:`);
    console.log(`     Average: ${stats.avgQueries.toFixed(1)}`);
    console.log(`     Min: ${stats.minQueries}`);
    console.log(`     Max: ${stats.maxQueries}`);
    console.log(`     Target Met: ${stats.avgQueries <= 40 ? '✅' : '❌'} (≤40 queries)`);
    
    console.log(`   
   Memory Usage:`);
    console.log(`     Average: ${(stats.avgMemory / 1024 / 1024).toFixed(2)}MB`);

    if (failed.length > 0) {
      console.log(`   
   Failed Operations: ${failed.length}`);
      failed.forEach(f => {
        console.log(`     Iteration ${f.iteration}: ${f.error}`);
      });
    }

    // Performance grade
    const durationGrade = stats.avgDuration <= 5000 ? 'A' : stats.avgDuration <= 7000 ? 'B' : 'C';
    const queryGrade = stats.avgQueries <= 40 ? 'A' : stats.avgQueries <= 60 ? 'B' : 'C';
    const overallGrade = durationGrade === 'A' && queryGrade === 'A' ? 'A' : 
                        durationGrade !== 'C' && queryGrade !== 'C' ? 'B' : 'C';

    console.log(`   
   Performance Grade: ${overallGrade}`);
    console.log(`     Duration: ${durationGrade}`);
    console.log(`     Queries: ${queryGrade}`);
  }

  private createBenchmarkData(clientCount: number, iteration: number) {
    return {
      groupId: `benchmark-group-${iteration}`,
      targetDisbursementDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      clientApplications: Array.from({ length: clientCount }, (_, i) => ({
        clientId: `benchmark-client-${iteration}-${i}`,
        loanTableId: `benchmark-loan-table-${iteration}-${i}`,
        businessType: 'retail',
        loanAmount: 10000,
      })),
    };
  }
}
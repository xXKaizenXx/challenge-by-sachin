import { Test, TestingModule } from '@nestjs/testing';
import { AudoRepaymentsService } from './audo-repayments.service';

describe('AudoRepaymentsService', () => {
  let service: AudoRepaymentsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AudoRepaymentsService],
    }).compile();

    service = module.get<AudoRepaymentsService>(AudoRepaymentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

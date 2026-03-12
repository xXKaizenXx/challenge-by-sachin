import { Test, TestingModule } from '@nestjs/testing';
import { AudoRepaymentsController } from './audo-repayments.controller';
import { AudoRepaymentsService } from './audo-repayments.service';

describe('AudoRepaymentsController', () => {
  let controller: AudoRepaymentsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AudoRepaymentsController],
      providers: [AudoRepaymentsService],
    }).compile();

    controller = module.get<AudoRepaymentsController>(AudoRepaymentsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

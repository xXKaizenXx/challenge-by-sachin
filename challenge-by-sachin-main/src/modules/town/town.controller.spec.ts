import { Test, TestingModule } from '@nestjs/testing';
import { TownController } from './town.controller';
import { TownService } from './town.service';

describe('TownController', () => {
  let controller: TownController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TownController],
      providers: [TownService],
    }).compile();

    controller = module.get<TownController>(TownController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

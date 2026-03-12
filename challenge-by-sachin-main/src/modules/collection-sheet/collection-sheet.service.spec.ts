import { Test, TestingModule } from '@nestjs/testing';
import { CollectionSheetService } from './collection-sheet.service';

describe('CollectionSheetService', () => {
  let service: CollectionSheetService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CollectionSheetService],
    }).compile();

    service = module.get<CollectionSheetService>(CollectionSheetService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

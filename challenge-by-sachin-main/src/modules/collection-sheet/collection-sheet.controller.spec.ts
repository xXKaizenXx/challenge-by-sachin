import { Test, TestingModule } from '@nestjs/testing';
import { CollectionSheetController } from './collection-sheet.controller';
import { CollectionSheetService } from './collection-sheet.service';

describe('CollectionSheetController', () => {
  let controller: CollectionSheetController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CollectionSheetController],
      providers: [CollectionSheetService],
    }).compile();

    controller = module.get<CollectionSheetController>(
      CollectionSheetController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { CenterController } from './center.controller';
import { CenterService } from './center.service';
import { CreateCenterDto } from './dto/create-center.dto';
import { UpdateCenterDto } from './dto/update-center.dto';
import { UserEntity } from '../user/user.entity';

describe('CenterController', () => {
  let controller: CenterController;
  let service: CenterService;

  const mockCenterService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CenterController],
      providers: [
        {
          provide: CenterService,
          useValue: mockCenterService,
        },
      ],
    }).compile();

    controller = module.get<CenterController>(CenterController);
    service = module.get<CenterService>(CenterService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should call service.create with dto and return result', async () => {
      const dto: CreateCenterDto = {
        name: 'Test Center',
        meetingDateId: 'meeting-date-id',
        meetingTime: '10:00:00',
        staffId: 'staff-id',
      };
      const result = { id: 'center-id', ...dto };
      mockCenterService.create.mockResolvedValue(result);
      expect(await controller.create(dto)).toBe(result);
      expect(service.create).toHaveBeenCalledWith(dto);
    });
  });

  describe('findAll', () => {
    it('should call service.findAll with user and return result', async () => {
      const user = { id: 'user-id' } as UserEntity;
      const req = { user };
      const result = [{ id: 'center1' }, { id: 'center2' }];
      mockCenterService.findAll.mockResolvedValue(result);
      expect(await controller.findAll(req)).toBe(result);
      expect(service.findAll).toHaveBeenCalledWith(user);
    });
  });

  describe('findOne', () => {
    it('should call service.findOne with id and return result', async () => {
      const id = 'center-id';
      const result = { id };
      mockCenterService.findOne.mockResolvedValue(result);
      expect(await controller.findOne(id)).toBe(result);
      expect(service.findOne).toHaveBeenCalledWith(id);
    });
  });

  describe('update', () => {
    it('should call service.update with id and dto and return result', async () => {
      const id = 'center-id';
      const dto: UpdateCenterDto = {
        name: 'Updated Center',
      } as UpdateCenterDto;
      const result = { id, ...dto };
      mockCenterService.update.mockResolvedValue(result);
      expect(await controller.update(id, dto)).toBe(result);
      expect(service.update).toHaveBeenCalledWith(id, dto);
    });
  });

  describe('remove', () => {
    it('should call service.remove with id and return result', async () => {
      const id = 'center-id';
      const result = undefined;
      mockCenterService.remove.mockResolvedValue(result);
      expect(await controller.remove(id)).toBe(result);
      expect(service.remove).toHaveBeenCalledWith(id);
    });
  });
});

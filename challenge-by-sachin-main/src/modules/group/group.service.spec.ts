import { Test, TestingModule } from '@nestjs/testing';
import { GroupService } from './group.service';

describe('GroupService', () => {
  let service: GroupService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GroupService],
    }).compile();

    service = module.get<GroupService>(GroupService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('addTimelineEvent', () => {
    it('should add a timeline event correctly', () => {
      const mockUser = {
        id: 'user-id',
        firstName: 'John',
        lastName: 'Doe',
      };

      const existingTimeline = {
        events: [
          {
            action: 'group_created',
            description: 'Group was created',
            userId: 'user-id',
            userName: 'John Doe',
            datetime: '2024-01-01T00:00:00.000Z',
            details: {},
          },
        ],
      };

      const result = (service as any).addTimelineEvent(
        existingTimeline,
        'test_action',
        'Test description',
        mockUser,
        { testDetail: 'value' },
      );

      expect(result.events).toHaveLength(2);
      expect(result.events[1].action).toBe('test_action');
      expect(result.events[1].description).toBe('Test description');
      expect(result.events[1].userId).toBe('user-id');
      expect(result.events[1].userName).toBe('John Doe');
      expect(result.events[1].details.testDetail).toBe('value');
    });

    it('should handle empty timeline', () => {
      const mockUser = {
        id: 'user-id',
        firstName: 'John',
        lastName: 'Doe',
      };

      const result = (service as any).addTimelineEvent(
        null,
        'test_action',
        'Test description',
        mockUser,
        { testDetail: 'value' },
      );

      expect(result.events).toHaveLength(1);
      expect(result.events[0].action).toBe('test_action');
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { CenterService } from './center.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Center } from './entities/center.entity';
import { UserService } from '../user/user.service';
import { OfficeService } from '../office/office.service';
import { Repository } from 'typeorm';
import { BadRequestException } from '@nestjs/common';
import { RoleType } from '../../constants/role-type';

const mockCenterRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  createQueryBuilder: jest.fn(),
});

const mockUserService = () => ({
  findOne: jest.fn(),
});

const mockOfficeService = () => ({
  findOne: jest.fn(),
  findOfficesByParent: jest.fn(),
});

describe('CenterService', () => {
  let service: CenterService;
  let centerRepository: ReturnType<typeof mockCenterRepository>;
  let userService: ReturnType<typeof mockUserService>;
  let officeService: ReturnType<typeof mockOfficeService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CenterService,
        {
          provide: getRepositoryToken(Center),
          useFactory: mockCenterRepository,
        },
        { provide: UserService, useFactory: mockUserService },
        { provide: OfficeService, useFactory: mockOfficeService },
      ],
    }).compile();

    service = module.get<CenterService>(CenterService);
    centerRepository = module.get(getRepositoryToken(Center));
    userService = module.get(UserService);
    officeService = module.get(OfficeService);
  });

  describe('create', () => {
    const createDto = {
      name: 'Test Center',
      meetingDateId: 'meeting-date-id',
      meetingTime: '10:00:00',
      staffId: 'staff-id',
    };
    it('should throw if staff not found', async () => {
      userService.findOne.mockResolvedValue(null);
      await expect(service.create(createDto as any)).rejects.toThrow(
        BadRequestException,
      );
    });
    it('should throw if staff is not a loan officer', async () => {
      userService.findOne.mockResolvedValue({
        id: 'staff-id',
        role: 'OTHER_ROLE',
      });
      await expect(service.create(createDto as any)).rejects.toThrow(
        BadRequestException,
      );
    });
    it('should create and save a center if valid', async () => {
      userService.findOne.mockResolvedValue({
        id: 'staff-id',
        role: RoleType.LOAN_OFFICER,
      });
      const center = { ...createDto, id: 'center-id' };
      centerRepository.create.mockReturnValue(center);
      centerRepository.save.mockResolvedValue(center);
      await expect(service.create(createDto as any)).resolves.toEqual(center);
      expect(centerRepository.create).toHaveBeenCalledWith(createDto);
      expect(centerRepository.save).toHaveBeenCalledWith(center);
    });
  });

  describe('findAll', () => {
    it('should return centers assigned to loan officer', async () => {
      const user = { id: 'user-id', role: RoleType.LOAN_OFFICER };
      const centers = [{ id: 'center1' }, { id: 'center2' }];
      centerRepository.find.mockResolvedValue(centers);
      await expect(service.findAll(user as any)).resolves.toEqual(centers);
      expect(centerRepository.find).toHaveBeenCalledWith({
        where: { staffId: user.id },
      });
    });
    it('should return centers for user office and descendants (non-loan officer)', async () => {
      const user = {
        id: 'user-id',
        role: 'OTHER_ROLE',
        office: { id: 'office-id' },
      };
      const officeIds = ['office-id', 'child-office-id'];
      const centers = [{ id: 'center3' }];
      jest
        .spyOn<any, any>(service, 'getAllDescendantOfficeIds')
        .mockResolvedValue(officeIds);
      const qb = {
        where: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(centers),
      };
      centerRepository.createQueryBuilder.mockReturnValue(qb);
      await expect(service.findAll(user as any)).resolves.toEqual(centers);
      expect(qb.where).toHaveBeenCalledWith(
        'center.officeId IN (:...officeIds)',
        { officeIds },
      );
      expect(qb.getMany).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return the center with the given id', async () => {
      const center = { id: 'center-id' };
      centerRepository.findOne.mockResolvedValue(center);
      await expect(service.findOne('center-id')).resolves.toEqual(center);
      expect(centerRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'center-id' },
      });
    });
    it('should return null if not found', async () => {
      centerRepository.findOne.mockResolvedValue(null);
      await expect(service.findOne('missing-id')).resolves.toBeNull();
    });
  });

  describe('update', () => {
    it('should update and return the center', async () => {
      const updateDto = { name: 'Updated Center' };
      const updatedCenter = { id: 'center-id', ...updateDto };
      centerRepository.update.mockResolvedValue(undefined);
      centerRepository.findOne.mockResolvedValue(updatedCenter);
      await expect(
        service.update('center-id', updateDto as any),
      ).resolves.toEqual(updatedCenter);
      expect(centerRepository.update).toHaveBeenCalledWith(
        'center-id',
        updateDto,
      );
      expect(centerRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'center-id' },
      });
    });
  });

  describe('remove', () => {
    it('should delete the center', async () => {
      centerRepository.delete.mockResolvedValue(undefined);
      await expect(service.remove('center-id')).resolves.toBeUndefined();
      expect(centerRepository.delete).toHaveBeenCalledWith('center-id');
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { Organization } from './entities/organization.entity';
import { Membership, Role } from './entities/membership.entity';
import { User } from '../users/entities/user.entity';

const mockOrgRepo = {
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  remove: jest.fn(),
};

const mockMembershipRepo = {
  findOne: jest.fn(),
  find: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
};

const mockUserRepo = {
  findOne: jest.fn(),
};

const mockCacheManager = {
  get: jest.fn().mockResolvedValue(null),
  set: jest.fn().mockResolvedValue(undefined),
  del: jest.fn().mockResolvedValue(undefined),
};

describe('OrganizationsService', () => {
  let service: OrganizationsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrganizationsService,
        { provide: getRepositoryToken(Organization), useValue: mockOrgRepo },
        { provide: getRepositoryToken(Membership), useValue: mockMembershipRepo },
        { provide: getRepositoryToken(User), useValue: mockUserRepo },
        { provide: CACHE_MANAGER, useValue: mockCacheManager },
      ],
    }).compile();

    service = module.get<OrganizationsService>(OrganizationsService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create an organization and assign creator as ADMIN', async () => {
      mockOrgRepo.findOne.mockResolvedValue(null);
      const org = { id: 'org-1', name: 'Test Org', slug: 'test-org' };
      mockOrgRepo.create.mockReturnValue(org);
      mockOrgRepo.save.mockResolvedValue(org);
      const membershipWithRole = { userId: 'user-1', organizationId: 'org-1', role: Role.ADMIN };
      mockMembershipRepo.create.mockReturnValue(membershipWithRole);
      mockMembershipRepo.save.mockResolvedValue(membershipWithRole);

      const result = await service.create({ name: 'Test Org', slug: 'test-org' }, 'user-1');

      expect(result.name).toBe('Test Org');
      expect(mockMembershipRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ role: Role.ADMIN }),
      );
    });

    it('should throw ConflictException for duplicate slug', async () => {
      mockOrgRepo.findOne.mockResolvedValue({ id: 'existing' });

      await expect(
        service.create({ name: 'Test', slug: 'existing-slug' }, 'user-1'),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('findOne', () => {
    it('should return an organization', async () => {
      const org = { id: 'org-1', name: 'Test Org' };
      mockOrgRepo.findOne.mockResolvedValue(org);

      const result = await service.findOne('org-1');
      expect(result).toEqual(org);
    });

    it('should throw NotFoundException for missing org', async () => {
      mockOrgRepo.findOne.mockResolvedValue(null);
      await expect(service.findOne('missing-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('inviteMember', () => {
    it('should invite a user to the organization', async () => {
      mockUserRepo.findOne.mockResolvedValue({ id: 'user-2', email: 'user2@test.com' });
      mockMembershipRepo.findOne.mockResolvedValue(null);
      mockMembershipRepo.create.mockReturnValue({});
      mockMembershipRepo.save.mockResolvedValue({ id: 'mem-1', role: Role.EDITOR });

      const result = await service.inviteMember('org-1', {
        email: 'user2@test.com',
        role: Role.EDITOR,
      });

      expect(mockMembershipRepo.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if user not found', async () => {
      mockUserRepo.findOne.mockResolvedValue(null);

      await expect(
        service.inviteMember('org-1', { email: 'notfound@test.com', role: Role.VIEWER }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { getQueueToken } from '@nestjs/bullmq';
import { NotFoundException } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { Project } from './entities/project.entity';
import { Membership } from '../organizations/entities/membership.entity';

const mockProjectRepo = {
  findOne: jest.fn(),
  find: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
  count: jest.fn(),
};

const mockMembershipRepo = {
  findOne: jest.fn(),
};

const mockCacheManager = {
  get: jest.fn().mockResolvedValue(null),
  set: jest.fn(),
  del: jest.fn(),
};

const mockQueue = {
  add: jest.fn().mockResolvedValue({}),
};

describe('ProjectsService', () => {
  let service: ProjectsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectsService,
        { provide: getRepositoryToken(Project), useValue: mockProjectRepo },
        { provide: getRepositoryToken(Membership), useValue: mockMembershipRepo },
        { provide: CACHE_MANAGER, useValue: mockCacheManager },
        { provide: getQueueToken('notifications'), useValue: mockQueue },
      ],
    }).compile();

    service = module.get<ProjectsService>(ProjectsService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a project and queue notification', async () => {
      const project = { id: 'proj-1', name: 'Test Project', organizationId: 'org-1' };
      mockProjectRepo.create.mockReturnValue(project);
      mockProjectRepo.save.mockResolvedValue(project);

      const result = await service.create('org-1', { name: 'Test Project' }, 'user-1');

      expect(result.name).toBe('Test Project');
      expect(mockQueue.add).toHaveBeenCalledWith(
        'project.created',
        expect.objectContaining({ projectName: 'Test Project' }),
      );
      expect(mockCacheManager.del).toHaveBeenCalledWith('projects:org:org-1');
    });
  });

  describe('findAll', () => {
    it('should return cached projects if available', async () => {
      const cached = [{ id: 'proj-1', name: 'Cached Project' }];
      mockCacheManager.get.mockResolvedValue(cached);

      const result = await service.findAll('org-1');
      expect(result).toEqual(cached);
      expect(mockProjectRepo.find).not.toHaveBeenCalled();
    });

    it('should fetch from DB and cache when no cache', async () => {
      mockCacheManager.get.mockResolvedValue(null);
      const projects = [{ id: 'proj-1', name: 'Project 1' }];
      mockProjectRepo.find.mockResolvedValue(projects);

      const result = await service.findAll('org-1');
      expect(result).toEqual(projects);
      expect(mockCacheManager.set).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a project by id', async () => {
      const project = { id: 'proj-1', name: 'Test', organizationId: 'org-1' };
      mockProjectRepo.findOne.mockResolvedValue(project);

      const result = await service.findOne('org-1', 'proj-1');
      expect(result).toEqual(project);
    });

    it('should throw NotFoundException for missing project', async () => {
      mockProjectRepo.findOne.mockResolvedValue(null);
      await expect(service.findOne('org-1', 'missing')).rejects.toThrow(NotFoundException);
    });
  });
});

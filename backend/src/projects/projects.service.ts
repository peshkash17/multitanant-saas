import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Project } from './entities/project.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { Membership } from '../organizations/entities/membership.entity';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private projectRepo: Repository<Project>,
    @InjectRepository(Membership)
    private membershipRepo: Repository<Membership>,
    @Inject(CACHE_MANAGER)
    private cacheManager: Cache,
    @InjectQueue('notifications')
    private notificationsQueue: Queue,
  ) {}

  private cacheKey(orgId: string) {
    return `projects:org:${orgId}`;
  }

  async create(orgId: string, dto: CreateProjectDto, userId: string) {
    const project = await this.projectRepo.save(
      this.projectRepo.create({
        ...dto,
        organizationId: orgId,
        createdById: userId,
      }),
    );

    await this.cacheManager.del(this.cacheKey(orgId));

    await this.notificationsQueue.add('project.created', {
      projectId: project.id,
      projectName: project.name,
      organizationId: orgId,
      userId,
    });

    return project;
  }

  async findAll(orgId: string) {
    const cached = await this.cacheManager.get<Project[]>(this.cacheKey(orgId));
    if (cached) return cached;

    const projects = await this.projectRepo.find({
      where: { organizationId: orgId },
      relations: ['createdBy'],
      order: { createdAt: 'DESC' },
    });

    await this.cacheManager.set(this.cacheKey(orgId), projects, 300);
    return projects;
  }

  async findOne(orgId: string, projectId: string) {
    const project = await this.projectRepo.findOne({
      where: { id: projectId, organizationId: orgId },
      relations: ['createdBy', 'tasks'],
    });
    if (!project) throw new NotFoundException('Project not found');
    return project;
  }

  async update(orgId: string, projectId: string, dto: UpdateProjectDto, userId: string) {
    const project = await this.findOne(orgId, projectId);
    Object.assign(project, dto);
    const updated = await this.projectRepo.save(project);

    await this.cacheManager.del(this.cacheKey(orgId));

    await this.notificationsQueue.add('project.updated', {
      projectId: project.id,
      projectName: project.name,
      organizationId: orgId,
      userId,
    });

    return updated;
  }

  async delete(orgId: string, projectId: string) {
    const project = await this.findOne(orgId, projectId);
    await this.projectRepo.remove(project);
    await this.cacheManager.del(this.cacheKey(orgId));
    return { message: 'Project deleted' };
  }

  async getStats(orgId: string) {
    const total = await this.projectRepo.count({ where: { organizationId: orgId } });
    return { total };
  }
}

import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Task } from './entities/task.entity';
import { Project } from '../projects/entities/project.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private taskRepo: Repository<Task>,
    @InjectRepository(Project)
    private projectRepo: Repository<Project>,
    @InjectQueue('notifications')
    private notificationsQueue: Queue,
  ) {}

  private async getProject(orgId: string, projectId: string) {
    const project = await this.projectRepo.findOne({
      where: { id: projectId, organizationId: orgId },
    });
    if (!project) throw new NotFoundException('Project not found');
    return project;
  }

  async create(orgId: string, projectId: string, dto: CreateTaskDto, userId: string) {
    await this.getProject(orgId, projectId);

    const task = await this.taskRepo.save(
      this.taskRepo.create({ ...dto, projectId }),
    );

    if (dto.assigneeId) {
      await this.notificationsQueue.add('task.assigned', {
        taskId: task.id,
        taskTitle: task.title,
        assigneeId: dto.assigneeId,
        organizationId: orgId,
        projectId,
        userId,
      });
    }

    return task;
  }

  async findAll(orgId: string, projectId: string) {
    await this.getProject(orgId, projectId);
    return this.taskRepo.find({
      where: { projectId },
      relations: ['assignee'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(orgId: string, projectId: string, taskId: string) {
    await this.getProject(orgId, projectId);
    const task = await this.taskRepo.findOne({
      where: { id: taskId, projectId },
      relations: ['assignee'],
    });
    if (!task) throw new NotFoundException('Task not found');
    return task;
  }

  async update(
    orgId: string,
    projectId: string,
    taskId: string,
    dto: UpdateTaskDto,
    userId: string,
  ) {
    const task = await this.findOne(orgId, projectId, taskId);
    const prevAssignee = task.assigneeId;
    Object.assign(task, dto);
    const updated = await this.taskRepo.save(task);

    if (dto.assigneeId && dto.assigneeId !== prevAssignee) {
      await this.notificationsQueue.add('task.assigned', {
        taskId: task.id,
        taskTitle: task.title,
        assigneeId: dto.assigneeId,
        organizationId: orgId,
        projectId,
        userId,
      });
    }

    return updated;
  }

  async delete(orgId: string, projectId: string, taskId: string) {
    const task = await this.findOne(orgId, projectId, taskId);
    await this.taskRepo.remove(task);
    return { message: 'Task deleted' };
  }
}

import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger, Injectable } from '@nestjs/common';
import { NotificationsGateway } from './notifications.gateway';

@Injectable()
@Processor('notifications')
export class NotificationsProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationsProcessor.name);

  constructor(private readonly gateway: NotificationsGateway) {
    super();
  }

  async process(job: Job) {
    this.logger.log(`Processing job: ${job.name}`);

    switch (job.name) {
      case 'project.created':
        this.gateway.emitToOrg(job.data.organizationId, 'notification', {
          type: 'PROJECT_CREATED',
          message: `New project created: ${job.data.projectName}`,
          data: job.data,
          timestamp: new Date().toISOString(),
        });
        break;

      case 'project.updated':
        this.gateway.emitToOrg(job.data.organizationId, 'notification', {
          type: 'PROJECT_UPDATED',
          message: `Project updated: ${job.data.projectName}`,
          data: job.data,
          timestamp: new Date().toISOString(),
        });
        break;

      case 'task.assigned':
        this.gateway.emitToOrg(job.data.organizationId, 'notification', {
          type: 'TASK_ASSIGNED',
          message: `Task assigned: ${job.data.taskTitle}`,
          data: job.data,
          timestamp: new Date().toISOString(),
        });
        break;

      default:
        this.logger.warn(`Unknown job type: ${job.name}`);
    }
  }
}

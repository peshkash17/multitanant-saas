import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { Task } from './entities/task.entity';
import { Project } from '../projects/entities/project.entity';
import { Membership } from '../organizations/entities/membership.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Task, Project, Membership]),
    BullModule.registerQueue({ name: 'notifications' }),
  ],
  providers: [TasksService],
  controllers: [TasksController],
  exports: [TasksService],
})
export class TasksModule {}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { ProjectsService } from './projects.service';
import { ProjectsController } from './projects.controller';
import { Project } from './entities/project.entity';
import { Membership } from '../organizations/entities/membership.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Project, Membership]),
    BullModule.registerQueue({ name: 'notifications' }),
  ],
  providers: [ProjectsService],
  controllers: [ProjectsController],
  exports: [ProjectsService],
})
export class ProjectsModule {}

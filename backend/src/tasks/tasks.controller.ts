import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TenantGuard } from '../common/guards/tenant.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Permission } from '../common/permissions/permissions';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '../organizations/entities/membership.entity';
import { User } from '../users/entities/user.entity';

@ApiTags('tasks')
@ApiBearerAuth()
@UseGuards(TenantGuard, PermissionsGuard, RolesGuard)
@Controller('organizations/:orgId/projects/:projectId/tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @Roles(Role.ADMIN, Role.EDITOR)
  @RequirePermissions(Permission.TASK_CREATE)
  @ApiOperation({ summary: 'Create a task' })
  create(
    @Param('orgId') orgId: string,
    @Param('projectId') projectId: string,
    @Body() dto: CreateTaskDto,
    @CurrentUser() user: User,
  ) {
    return this.tasksService.create(orgId, projectId, dto, user.id);
  }

  @Get()
  @RequirePermissions(Permission.TASK_READ)
  @ApiOperation({ summary: 'List tasks in a project' })
  findAll(
    @Param('orgId') orgId: string,
    @Param('projectId') projectId: string,
  ) {
    return this.tasksService.findAll(orgId, projectId);
  }

  @Get(':taskId')
  @ApiOperation({ summary: 'Get a task by ID' })
  findOne(
    @Param('orgId') orgId: string,
    @Param('projectId') projectId: string,
    @Param('taskId') taskId: string,
  ) {
    return this.tasksService.findOne(orgId, projectId, taskId);
  }

  @Put(':taskId')
  @Roles(Role.ADMIN, Role.EDITOR)
  @RequirePermissions(Permission.TASK_UPDATE)
  @ApiOperation({ summary: 'Update a task' })
  update(
    @Param('orgId') orgId: string,
    @Param('projectId') projectId: string,
    @Param('taskId') taskId: string,
    @Body() dto: UpdateTaskDto,
    @CurrentUser() user: User,
  ) {
    return this.tasksService.update(orgId, projectId, taskId, dto, user.id);
  }

  @Delete(':taskId')
  @Roles(Role.ADMIN, Role.EDITOR)
  @RequirePermissions(Permission.TASK_DELETE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a task' })
  delete(
    @Param('orgId') orgId: string,
    @Param('projectId') projectId: string,
    @Param('taskId') taskId: string,
  ) {
    return this.tasksService.delete(orgId, projectId, taskId);
  }
}

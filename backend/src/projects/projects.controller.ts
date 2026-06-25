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
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { TenantGuard } from '../common/guards/tenant.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Permission } from '../common/permissions/permissions';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '../organizations/entities/membership.entity';
import { User } from '../users/entities/user.entity';

@ApiTags('projects')
@ApiBearerAuth()
@UseGuards(TenantGuard, PermissionsGuard, RolesGuard)
@Controller('organizations/:orgId/projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @Roles(Role.ADMIN, Role.EDITOR)
  @RequirePermissions(Permission.PROJECT_CREATE)
  @ApiOperation({ summary: 'Create a project' })
  create(
    @Param('orgId') orgId: string,
    @Body() dto: CreateProjectDto,
    @CurrentUser() user: User,
  ) {
    return this.projectsService.create(orgId, dto, user.id);
  }

  @Get()
  @RequirePermissions(Permission.PROJECT_READ)
  @ApiOperation({ summary: 'List projects in an organization' })
  findAll(@Param('orgId') orgId: string) {
    return this.projectsService.findAll(orgId);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get project statistics' })
  getStats(@Param('orgId') orgId: string) {
    return this.projectsService.getStats(orgId);
  }

  @Get(':projectId')
  @ApiOperation({ summary: 'Get a project by ID' })
  findOne(@Param('orgId') orgId: string, @Param('projectId') projectId: string) {
    return this.projectsService.findOne(orgId, projectId);
  }

  @Put(':projectId')
  @Roles(Role.ADMIN, Role.EDITOR)
  @RequirePermissions(Permission.PROJECT_UPDATE)
  @ApiOperation({ summary: 'Update a project' })
  update(
    @Param('orgId') orgId: string,
    @Param('projectId') projectId: string,
    @Body() dto: UpdateProjectDto,
    @CurrentUser() user: User,
  ) {
    return this.projectsService.update(orgId, projectId, dto, user.id);
  }

  @Delete(':projectId')
  @Roles(Role.ADMIN)
  @RequirePermissions(Permission.PROJECT_DELETE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a project (ADMIN only)' })
  delete(@Param('orgId') orgId: string, @Param('projectId') projectId: string) {
    return this.projectsService.delete(orgId, projectId);
  }
}

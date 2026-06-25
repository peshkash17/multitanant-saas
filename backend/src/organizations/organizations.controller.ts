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
import { OrganizationsService } from './organizations.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { InviteMemberDto } from './dto/invite-member.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { Role } from './entities/membership.entity';
import { User } from '../users/entities/user.entity';

@ApiTags('organizations')
@ApiBearerAuth()
@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly orgsService: OrganizationsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new organization' })
  create(@Body() dto: CreateOrganizationDto, @CurrentUser() user: User) {
    return this.orgsService.create(dto, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'List organizations for current user' })
  findMyOrgs(@CurrentUser() user: User) {
    return this.orgsService.findUserOrgs(user.id);
  }

  @Get(':orgId')
  @UseGuards(TenantGuard)
  @ApiOperation({ summary: 'Get organization by ID' })
  findOne(@Param('orgId') orgId: string) {
    return this.orgsService.findOne(orgId);
  }

  @Put(':orgId')
  @UseGuards(TenantGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update organization (ADMIN only)' })
  update(@Param('orgId') orgId: string, @Body() dto: UpdateOrganizationDto) {
    return this.orgsService.update(orgId, dto);
  }

  @Delete(':orgId')
  @UseGuards(TenantGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete organization (ADMIN only)' })
  delete(@Param('orgId') orgId: string) {
    return this.orgsService.delete(orgId);
  }

  @Get(':orgId/members')
  @UseGuards(TenantGuard)
  @ApiOperation({ summary: 'List organization members' })
  getMembers(@Param('orgId') orgId: string) {
    return this.orgsService.getMembers(orgId);
  }

  @Post(':orgId/members')
  @UseGuards(TenantGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Invite member to organization (ADMIN only)' })
  inviteMember(@Param('orgId') orgId: string, @Body() dto: InviteMemberDto) {
    return this.orgsService.inviteMember(orgId, dto);
  }

  @Put(':orgId/members/:memberId/role')
  @UseGuards(TenantGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update member role (ADMIN only)' })
  updateRole(
    @Param('orgId') orgId: string,
    @Param('memberId') memberId: string,
    @Body() dto: UpdateMemberRoleDto,
  ) {
    return this.orgsService.updateMemberRole(orgId, memberId, dto);
  }

  @Delete(':orgId/members/:memberId')
  @UseGuards(TenantGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove member from organization (ADMIN only)' })
  removeMember(
    @Param('orgId') orgId: string,
    @Param('memberId') memberId: string,
  ) {
    return this.orgsService.removeMember(orgId, memberId);
  }
}

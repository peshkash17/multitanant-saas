import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { Organization } from './entities/organization.entity';
import { Membership, Role } from './entities/membership.entity';
import { User } from '../users/entities/user.entity';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { InviteMemberDto } from './dto/invite-member.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';

@Injectable()
export class OrganizationsService {
  constructor(
    @InjectRepository(Organization)
    private orgRepo: Repository<Organization>,
    @InjectRepository(Membership)
    private membershipRepo: Repository<Membership>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @Inject(CACHE_MANAGER)
    private cacheManager: Cache,
  ) {}

  async create(dto: CreateOrganizationDto, userId: string) {
    const existing = await this.orgRepo.findOne({ where: { slug: dto.slug } });
    if (existing) throw new ConflictException('Slug already taken');

    const org = await this.orgRepo.save(this.orgRepo.create(dto));

    await this.membershipRepo.save(
      this.membershipRepo.create({
        userId,
        organizationId: org.id,
        role: Role.ADMIN,
      }),
    );

    return org;
  }

  async findUserOrgs(userId: string) {
    const memberships = await this.membershipRepo.find({
      where: { userId },
      relations: ['organization'],
    });
    return memberships.map((m) => ({ ...m.organization, role: m.role }));
  }

  async findOne(id: string) {
    const org = await this.orgRepo.findOne({ where: { id } });
    if (!org) throw new NotFoundException('Organization not found');
    return org;
  }

  async update(id: string, dto: UpdateOrganizationDto) {
    const org = await this.findOne(id);
    Object.assign(org, dto);
    return this.orgRepo.save(org);
  }

  async delete(id: string) {
    const org = await this.findOne(id);
    await this.orgRepo.remove(org);
    return { message: 'Organization deleted' };
  }

  async getMembers(orgId: string) {
    return this.membershipRepo.find({
      where: { organizationId: orgId },
      relations: ['user'],
    });
  }

  async inviteMember(orgId: string, dto: InviteMemberDto) {
    const user = await this.userRepo.findOne({ where: { email: dto.email } });
    if (!user) throw new NotFoundException('User not found');

    const existing = await this.membershipRepo.findOne({
      where: { userId: user.id, organizationId: orgId },
    });
    if (existing) throw new ConflictException('User is already a member');

    return this.membershipRepo.save(
      this.membershipRepo.create({
        userId: user.id,
        organizationId: orgId,
        role: dto.role,
      }),
    );
  }

  async updateMemberRole(orgId: string, memberId: string, dto: UpdateMemberRoleDto) {
    const membership = await this.membershipRepo.findOne({
      where: { id: memberId, organizationId: orgId },
    });
    if (!membership) throw new NotFoundException('Member not found');
    membership.role = dto.role;
    return this.membershipRepo.save(membership);
  }

  async removeMember(orgId: string, memberId: string) {
    const membership = await this.membershipRepo.findOne({
      where: { id: memberId, organizationId: orgId },
    });
    if (!membership) throw new NotFoundException('Member not found');
    await this.membershipRepo.remove(membership);
    return { message: 'Member removed' };
  }
}

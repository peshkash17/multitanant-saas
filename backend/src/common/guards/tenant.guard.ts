import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Membership } from '../../organizations/entities/membership.entity';

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(
    @InjectRepository(Membership)
    private membershipRepo: Repository<Membership>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const orgId =
      request.params.orgId ||
      request.params.organizationId ||
      request.body?.organizationId;

    if (!orgId) {
      return true;
    }

    const membership = await this.membershipRepo.findOne({
      where: { userId: user.id, organizationId: orgId },
    });

    if (!membership) {
      throw new ForbiddenException('You are not a member of this organization');
    }

    request.userRole = membership.role;
    request.membership = membership;

    return true;
  }
}

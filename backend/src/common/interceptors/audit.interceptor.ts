import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditService } from '../services/audit.service';
import { FeatureFlagsService } from '../services/feature-flags.service';

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

function inferResourceType(url: string): string {
  if (url.includes('/tasks')) return 'task';
  if (url.includes('/projects')) return 'project';
  if (url.includes('/members')) return 'member';
  if (url.includes('/organizations')) return 'organization';
  if (url.includes('/payments')) return 'payment';
  if (url.includes('/auth')) return 'auth';
  return 'unknown';
}

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private readonly auditService: AuditService,
    private readonly featureFlags: FeatureFlagsService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest();
    const method: string = req.method;

    if (!this.featureFlags.isEnabled('auditLogs') || !MUTATING_METHODS.has(method)) {
      return next.handle();
    }

    const orgId =
      req.params?.orgId ||
      req.params?.organizationId ||
      req.body?.organizationId;

    return next.handle().pipe(
      tap(() => {
        void this.auditService.log({
          userId: req.user?.id,
          organizationId: orgId,
          action: `${method} ${req.route?.path || req.url}`,
          resourceType: inferResourceType(req.url),
          resourceId:
            req.params?.id ||
            req.params?.projectId ||
            req.params?.taskId ||
            req.params?.memberId,
          ipAddress: req.ip,
          metadata: {
            params: req.params,
          },
        });
      }),
    );
  }
}

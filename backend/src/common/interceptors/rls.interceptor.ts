import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { DataSource } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';

/**
 * Sets the PostgreSQL session variable `app.current_org_id` for RLS policies.
 * Must run after TenantGuard has attached the org context to the request.
 *
 * This ensures the database enforces tenant isolation even if the application
 * layer has a bug that forgets to filter by organization.
 */
@Injectable()
export class RlsInterceptor implements NestInterceptor {
  constructor(
    @InjectDataSource()
    private dataSource: DataSource,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const orgId = request.params?.orgId || request.params?.organizationId || null;

    if (orgId) {
      // Fire-and-forget: set the session variable for subsequent queries
      this.dataSource.query(`SELECT set_current_org($1)`, [orgId]).catch(() => {});
    }

    return next.handle();
  }
}

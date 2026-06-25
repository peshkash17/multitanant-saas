import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class RlsBootstrapService implements OnModuleInit {
  private readonly logger = new Logger(RlsBootstrapService.name);

  constructor(
    private config: ConfigService,
    @InjectDataSource() private dataSource: DataSource,
  ) {}

  async onModuleInit() {
    if (this.config.get('RLS_AUTO_APPLY', 'false') !== 'true') {
      return;
    }

    try {
      const [{ exists }] = await this.dataSource.query(
        `SELECT to_regclass('public.projects') IS NOT NULL AS exists`,
      );
      if (!exists) {
        this.logger.warn('RLS auto-apply skipped: projects table not found yet');
        return;
      }

      const [{ enabled }] = await this.dataSource.query(
        `SELECT relrowsecurity AS enabled FROM pg_class WHERE relname = 'projects'`,
      );
      if (enabled) {
        this.logger.log('RLS already enabled on projects table');
        return;
      }

      const sqlPath = path.join(process.cwd(), 'rls-policies.sql');
      const devPath = path.join(process.cwd(), '..', 'docker', 'postgres', 'rls-policies.sql');
      const fallbackPath = path.join(process.cwd(), 'docker', 'postgres', 'rls-policies.sql');
      const resolved = [sqlPath, devPath, fallbackPath].find((p) => fs.existsSync(p));
      if (!resolved) {
        this.logger.warn('RLS policy file not found in expected locations');
        return;
      }

      const sql = fs.readFileSync(resolved, 'utf8');
      await this.dataSource.query(sql);
      this.logger.log('PostgreSQL RLS policies applied successfully');
    } catch (err) {
      this.logger.warn(`RLS auto-apply failed: ${(err as Error).message}`);
    }
  }
}

import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { createE2eApp } from './helpers/e2e-app';

describe('API (e2e)', () => {
  let app: INestApplication;
  const runId = Date.now();
  const email = `e2e-${runId}@test.com`;
  const password = 'TestPass123!';
  let accessToken = '';
  let orgId = '';

  beforeAll(async () => {
    app = await createE2eApp();
  }, 60000);

  afterAll(async () => {
    await app.close();
  });

  describe('Health', () => {
    it('GET /api/health returns ok', async () => {
      const res = await request(app.getHttpServer()).get('/api/health').expect(200);

      expect(res.body.status).toBe('ok');
      expect(res.body.timestamp).toBeDefined();
    });
  });

  describe('Auth', () => {
    it('POST /api/auth/register creates a user', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ email, name: 'E2E User', password })
        .expect(201);

      expect(res.body.accessToken).toBeDefined();
      expect(res.body.refreshToken).toBeDefined();
      expect(res.body.user.email).toBe(email);
      accessToken = res.body.accessToken;
    });

    it('POST /api/auth/register rejects duplicate email', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ email, name: 'Duplicate', password })
        .expect(409);
    });

    it('POST /api/auth/login returns tokens', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email, password })
        .expect(200);

      expect(res.body.accessToken).toBeDefined();
      accessToken = res.body.accessToken;
    });

    it('POST /api/auth/login rejects invalid credentials', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email, password: 'wrong-password' })
        .expect(401);
    });

    it('GET /api/organizations requires authentication', async () => {
      await request(app.getHttpServer()).get('/api/organizations').expect(401);
    });
  });

  describe('Organizations & Projects', () => {
    it('POST /api/organizations creates an organization', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/organizations')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'E2E Org',
          slug: `e2e-org-${runId}`,
          description: 'Integration test org',
        })
        .expect(201);

      expect(res.body.id).toBeDefined();
      expect(res.body.name).toBe('E2E Org');
      orgId = res.body.id;
    });

    it('GET /api/organizations lists user organizations', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/organizations')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.some((org: { id: string }) => org.id === orgId)).toBe(true);
    });

    it('GET /api/organizations/:orgId/projects returns empty list', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/organizations/${orgId}/projects`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body).toEqual([]);
    });

    it('POST /api/organizations/:orgId/projects creates a project', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/organizations/${orgId}/projects`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'E2E Project',
          description: 'Created by integration test',
        })
        .expect(201);

      expect(res.body.id).toBeDefined();
      expect(res.body.name).toBe('E2E Project');
      expect(res.body.organizationId).toBe(orgId);
    });

    it('GET /api/organizations/:orgId/projects returns created project', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/organizations/${orgId}/projects`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body).toHaveLength(1);
      expect(res.body[0].name).toBe('E2E Project');
    });
  });
});

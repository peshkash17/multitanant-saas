# Multi-Tenant SaaS Workspace

A production-grade multi-tenant Project Management platform built as a Full Stack Engineer assessment. Organizations manage projects and tasks with role-based access control, real-time WebSocket notifications, Redis caching, BullMQ background jobs, and a payment abstraction layer.

---

## Architecture Overview

```
┌────────────────────────────────────────────────────────────────┐
│                         Client Browser                          │
│         React 18 + Vite + MUI v7 + Zustand + Socket.io         │
└───────────────────────┬────────────────────────────────────────┘
                         │ HTTP + WebSocket
┌───────────────────────▼────────────────────────────────────────┐
│                    Nginx Reverse Proxy                          │
│    /api/* → backend:3000   /ws → backend:3000   / → frontend   │
└────────┬──────────────────────────────────────────────────────┘
         │
┌────────▼───────────────────────────────────────────────────────┐
│               NestJS REST API + WebSocket Gateway               │
│  AuthModule │ UsersModule │ OrgsModule │ ProjectsModule          │
│  TasksModule │ NotificationsModule │ PaymentsModule              │
│  Guards: JwtAuthGuard │ TenantGuard │ RolesGuard                │
└────┬──────────────┬───────────────┬──────────────┬─────────────┘
     │              │               │              │
┌────▼───┐   ┌──────▼──────┐  ┌────▼────┐  ┌─────▼──────┐
│ Postgres│   │    Redis    │  │ BullMQ  │  │  Payment   │
│  + RLS  │   │Cache+Queue  │  │ Workers │  │ Abstraction│
└────────┘   └─────────────┘  └─────────┘  └────────────┘
```

### Key Architectural Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| State management | Zustand | Less boilerplate than RTK; portable; no context wrapping |
| ORM | TypeORM | Decorator-based mapping integrates naturally with NestJS DI |
| WebSocket | Socket.io | Built-in room abstraction simplifies org-scoped broadcasts |
| JWT algorithm | RS256 (fallback HS256) | Asymmetric keys allow verification without sharing the secret |
| Queue | BullMQ | Decouples notification delivery from HTTP request lifecycle; jobs survive restarts |
| Cache | Redis (in-memory fallback for dev) | Standard, portable, supports TTL-based invalidation |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite, MUI v7, Zustand, Socket.io-client, idb |
| Backend | NestJS 10, TypeORM, Passport.js, BullMQ, Socket.io |
| Database | PostgreSQL 16 with Row-Level Security |
| Cache / Queue | Redis 7 |
| Auth | JWT (RS256 / HS256), bcrypt |
| Observability | Winston, OpenTelemetry, Prometheus |
| Infrastructure | Docker, docker-compose, Nginx |
| CI/CD | GitHub Actions |
| Testing | Jest (unit), Supertest (integration), Playwright (E2E) |
| Bonus | Kubernetes manifests, Helm chart |

---

## Prerequisites

- Node.js 20+
- Docker & Docker Compose (optional — you can run PostgreSQL and Redis locally instead)
- PostgreSQL 16 and Redis 7 (required when not using Docker for infrastructure)

---

## Quick Start — Docker Compose

```bash
# 1. Clone the repository
git clone https://github.com/peshkash17/multitanant-saas.git
cd multitanant-saas

# 2. Copy environment files
cp backend/.env.example backend/.env

# 3. Start all services
docker compose up --build

# 4. Access the application
# Frontend:      http://localhost
# API:           http://localhost/api
# Swagger docs:  http://localhost/api/docs
# Metrics:       http://localhost:3000/metrics
```

---

## Local Development Setup

### Backend

```bash
cd backend

# Install dependencies
npm install

# Copy and configure environment
cp .env.example .env
# Edit .env with your local PostgreSQL and Redis details

# Generate RS256 keys (optional — falls back to HS256)
mkdir keys
openssl genrsa -out keys/private.pem 2048
openssl rsa -in keys/private.pem -pubout -out keys/public.pem

# Start development server
npm run start:dev
# API available at http://localhost:3000
# Swagger at     http://localhost:3000/api/docs
```

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Copy environment
cp .env.example .env
# Edit VITE_API_URL and VITE_WS_URL

# Start development server
npm run dev
# App available at http://localhost:5173
```

### Infrastructure (local)

You have two options for PostgreSQL and Redis:

#### Option A — Docker for DB/Redis only (recommended hybrid)

Run just the data services in Docker, and run the app on your machine:

```bash
docker compose up postgres redis -d
```

Then configure `backend/.env`:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=saas_workspace
DB_SYNCHRONIZE=true

REDIS_HOST=localhost
REDIS_PORT=6379
CACHE_STORE=redis
```

Start backend and frontend locally (see sections above). The backend connects to `localhost:5432` and `localhost:6379` because Docker publishes those ports.

#### Option B — Fully local PostgreSQL and Redis (no Docker)

**Windows**

```powershell
# PostgreSQL (example with winget)
winget install PostgreSQL.PostgreSQL

# Redis (Memurai is a common Windows-compatible Redis server)
winget install Memurai.MemuraiDeveloper
```

**macOS**

```bash
brew install postgresql@16 redis
brew services start postgresql@16
brew services start redis
```

**Linux**

```bash
sudo apt install postgresql-16 redis-server
sudo systemctl start postgresql redis-server
```

**Create the database**

```bash
# psql as postgres superuser
psql -U postgres -c "CREATE DATABASE saas_workspace;"
```

Copy and edit env:

```bash
cp backend/.env.example backend/.env
# Set DB_HOST=localhost, REDIS_HOST=localhost, DB_SYNCHRONIZE=true
```

**Apply RLS after first backend start** (tables must exist first):

```bash
psql -U postgres -d saas_workspace -f docker/postgres/rls-policies.sql
```

Or set `RLS_AUTO_APPLY=true` in `backend/.env` and the API applies policies on startup.

**Run the stack**

```bash
# Terminal 1
cd backend && npm install && npm run start:dev

# Terminal 2
cd frontend && npm install && npm run dev
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| API | http://localhost:3000/api |
| Swagger | http://localhost:3000/api/docs |
| Feature flags | http://localhost:3000/api/feature-flags |

---

## Database Schema

```
users
  id (UUID PK), email (UNIQUE), name, password_hash, avatar_url, is_active, created_at, updated_at

organizations
  id (UUID PK), name, slug (UNIQUE), description, logo_url, created_at, updated_at

memberships
  id (UUID PK), user_id (FK→users), organization_id (FK→organizations),
  role (ADMIN|EDITOR|VIEWER), joined_at
  UNIQUE(user_id, organization_id)

projects
  id (UUID PK), name, description, status (ACTIVE|ARCHIVED|COMPLETED),
  organization_id (FK→organizations), created_by_id (FK→users),
  created_at, updated_at

tasks
  id (UUID PK), title, description, status (TODO|IN_PROGRESS|IN_REVIEW|DONE),
  priority (LOW|MEDIUM|HIGH|URGENT), project_id (FK→projects),
  assignee_id (FK→users), due_date, created_at, updated_at

refresh_tokens
  id (UUID PK), user_id (FK→users), token_hash, expires_at, revoked, created_at

payments
  id (UUID PK), organization_id, amount, currency, status, provider_payment_id,
  provider, metadata (JSONB), created_at, updated_at

audit_logs
  id (UUID PK), user_id, organization_id, action, resource_type, resource_id,
  metadata (JSONB), ip_address, created_at
```

### PostgreSQL Row-Level Security

RLS policies enforce tenant isolation at the database layer (see `docker/postgres/rls-policies.sql`):

| Table | Policy |
|-------|--------|
| `organizations` | Current org only |
| `users` | Members of current org only |
| `memberships` | Current org only |
| `projects` | Current org only |
| `tasks` | Tasks in projects belonging to current org |
| `payments` | Current org only |
| `audit_logs` | Current org only |
| `refresh_tokens` | Tokens for users in current org |

When `app.current_org_id` is not set (login/register), policies allow access so auth flows work — the app layer still enforces RBAC.

The session variable is set by `RlsInterceptor` before each request and by `set_current_org()` SQL function.

**Trade-off**: RLS adds ~5-10% query overhead. For extreme scale, partition by `organization_id` instead. RLS is the portable default — it works without application code changes if a raw query bypasses the ORM.

---

## RBAC Permissions Matrix

| Endpoint | VIEWER | EDITOR | ADMIN |
|----------|--------|--------|-------|
| GET projects | ✓ | ✓ | ✓ |
| POST/PUT projects | ✗ | ✓ | ✓ |
| DELETE project | ✗ | ✗ | ✓ |
| GET tasks | ✓ | ✓ | ✓ |
| POST/PUT tasks | ✗ | ✓ | ✓ |
| DELETE task | ✗ | ✓ | ✓ |
| GET members | ✓ | ✓ | ✓ |
| Invite/remove member | ✗ | ✗ | ✓ |
| Payments | ✗ | ✗ | ✓ |

---

## API Reference

Swagger UI is auto-generated at `/api/docs` when the server is running.

Key endpoints:

```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/refresh
POST   /api/auth/logout

GET    /api/users/me
PUT    /api/users/me

POST   /api/organizations
GET    /api/organizations
GET    /api/organizations/:orgId
PUT    /api/organizations/:orgId            [ADMIN]
DELETE /api/organizations/:orgId            [ADMIN]
GET    /api/organizations/:orgId/members
POST   /api/organizations/:orgId/members    [ADMIN]
PUT    /api/organizations/:orgId/members/:id/role  [ADMIN]
DELETE /api/organizations/:orgId/members/:id       [ADMIN]

GET    /api/organizations/:orgId/projects
POST   /api/organizations/:orgId/projects          [EDITOR+]
GET    /api/organizations/:orgId/projects/:id
PUT    /api/organizations/:orgId/projects/:id      [EDITOR+]
DELETE /api/organizations/:orgId/projects/:id      [ADMIN]

GET    /api/organizations/:orgId/projects/:pid/tasks
POST   /api/organizations/:orgId/projects/:pid/tasks       [EDITOR+]
PUT    /api/organizations/:orgId/projects/:pid/tasks/:id   [EDITOR+]
DELETE /api/organizations/:orgId/projects/:pid/tasks/:id   [EDITOR+]

POST   /api/organizations/:orgId/payments          [ADMIN]
GET    /api/organizations/:orgId/payments          [ADMIN]
POST   /api/organizations/:orgId/payments/:id/verify   [ADMIN]
POST   /api/organizations/:orgId/payments/:id/refund   [ADMIN]

GET    /api/health
GET    /metrics
```

---

## Caching Strategy

Redis is used for:

1. **Project list cache** — `GET /organizations/:orgId/projects` cached with key `projects:org:{orgId}`, TTL 5 minutes. Invalidated on project create/update/delete.
2. **Rate limiting** — `@nestjs/throttler` with 100 requests/minute per IP.
3. **Refresh token hashing** — Tokens are stored as SHA-256 hashes, not plaintext.

**Cache invalidation**: Event-driven. Service methods call `cacheManager.del(key)` after mutations.

---

## Real-Time Notifications (BullMQ + WebSocket)

1. When a project/task event occurs, a job is added to the `notifications` BullMQ queue.
2. The `NotificationsProcessor` worker consumes the job.
3. The `NotificationsGateway` emits the event to the Socket.io room `org:{orgId}`.
4. Only users who belong to that organization receive the notification (tenant isolation via room membership).

Clients connect to `/ws` with their JWT token. On connection, they automatically join rooms for all their organizations.

**WebSocket presence tracking**: Connected socket IDs are tracked per org-room, allowing org-level presence counts via `gateway.getConnectedCount(orgId)`.

---

## Payment Abstraction Layer

```typescript
interface IPaymentProvider {
  createPayment(dto: CreatePaymentDto): Promise<PaymentResult>;
  verifyPayment(paymentId: string): Promise<VerifyResult>;
  refundPayment(paymentId: string, amount?: number): Promise<RefundResult>;
}
```

The `PAYMENT_PROVIDER` injection token is configured in `PaymentsModule` based on the `PAYMENT_PROVIDER` environment variable. To add Stripe or Razorpay:

1. Create `StripePaymentProvider` implementing `IPaymentProvider`
2. Add a case to the factory in `payments.module.ts`
3. Set `PAYMENT_PROVIDER=stripe` in the environment

No business logic changes are required.

---

## Security

| Concern | Implementation |
|---------|---------------|
| Password hashing | bcrypt cost factor 12 |
| Access token | RS256 JWT, 15 minute TTL |
| Refresh token | Random 40-byte hex, stored as SHA-256 hash, 7-day TTL |
| RBAC | `RolesGuard` + `@Roles()` decorator |
| Tenant isolation | `TenantGuard` on all org-scoped routes + PostgreSQL RLS |
| Input validation | `class-validator` DTOs + global `ValidationPipe` |
| Rate limiting | Redis-backed throttler (100 req/min/IP) |

### SSO Extension Point (SAML / OIDC)

The auth module uses a Passport strategy interface. To add enterprise SSO:
1. Create a new strategy file (e.g., `oidc.strategy.ts`) implementing `PassportStrategy(Strategy)`.
2. Register it in `AuthModule.providers`.
3. No changes to controllers, services, or guards needed.

### Vault / KMS Integration

For production key management:
- Replace `JWT_SECRET` env var with a Vault dynamic secret lease
- Mount private/public key pair from a Kubernetes secret or cloud KMS
- The `JwtStrategy` already reads keys from the filesystem path in `JWT_PRIVATE_KEY_PATH` / `JWT_PUBLIC_KEY_PATH`

---

## Observability

| Signal | Tool | Endpoint |
|--------|------|----------|
| Structured logs | Winston (JSON in prod) | stdout / `logs/` |
| Distributed tracing | OpenTelemetry SDK + OTLP gRPC exporter | Configure via `OTEL_EXPORTER_OTLP_ENDPOINT` |
| Metrics | Prometheus client via `@willsoto/nestjs-prometheus` | `GET /metrics` |

The `LoggingInterceptor` attaches a `requestId` (UUID) to every request for correlation.

To enable OpenTelemetry tracing: set `OTEL_ENABLED=true` and point `OTEL_EXPORTER_OTLP_ENDPOINT` at a collector (Jaeger, Tempo, etc.).

---

## Testing

```bash
# Backend unit tests
cd backend
npm test

# Backend integration tests (Supertest + in-memory/test DB)
npm run test:e2e

# Backend with coverage
npm run test:cov

# Frontend E2E tests (requires running app)
cd frontend
npx playwright install
npx playwright test
```

**Test coverage targets**:
- Auth service: register, login, logout, refresh token flows
- Organizations service: CRUD, membership management, conflict detection
- Projects service: caching, cache invalidation, queue dispatch
- Payments service: provider abstraction, mock provider, not-found handling

---

## Infrastructure

### Docker Compose Services

| Service | Image | Port |
|---------|-------|------|
| nginx | nginx:alpine | 80 |
| backend | custom (Node 20 multi-stage) | 3000 |
| frontend | custom (Vite + Nginx) | 5173 |
| postgres | postgres:16-alpine | 5432 |
| redis | redis:7-alpine | 6379 |

```bash
# Build and start all services
docker compose up --build

# Start specific services
docker compose up postgres redis -d

# View logs
docker compose logs -f backend
```

### Kubernetes Deployment (Bonus)

```bash
# 1. Create namespace
kubectl apply -f k8s/namespace.yaml

# 2. Create secrets (do not commit real values)
kubectl create secret generic saas-secrets \
  --namespace saas-workspace \
  --from-literal=DB_USERNAME=postgres.your-project-ref \
  --from-literal=DB_PASSWORD=your-db-password \
  --from-literal=REDIS_PASSWORD=your-redis-password \
  --from-literal=JWT_SECRET=your-jwt-secret

# 3. Edit k8s/configmap.yaml with your DB/Redis hosts, then apply
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/frontend-deployment.yaml
kubectl apply -f k8s/ingress.yaml
```

For external PostgreSQL (e.g. Supabase), use the **session pooler** hostname and username format `postgres.<project-ref>` — direct `db.*.supabase.co` hosts may be IPv6-only and fail inside Minikube/Docker.

Docker images are published to GHCR on push to `main`:
`ghcr.io/peshkash17/multitanant-saas/backend:latest` and `frontend:latest`.

### Helm Chart (Bonus)

```bash
# Install with Helm
helm install saas-workspace ./helm/saas-workspace \
  --set secrets.jwtSecret="your-secret" \
  --set postgresql.auth.password="your-db-password" \
  --set ingress.host="workspace.yourdomain.com"
```

---

## CI/CD

GitHub Actions pipeline at `.github/workflows/ci.yml`:

1. **Backend lint & test** — Type-check, ESLint, Jest (with real PostgreSQL and Redis service containers)
2. **Backend build** — TypeScript compilation
3. **Frontend lint & build** — Vite production build
4. **E2E tests** — Playwright on Chrome (push to main only)
5. **Docker images** — Build and push to GitHub Container Registry (main branch only)

---

## Project Structure

```
fullstack-assessment/
├── backend/
│   ├── src/
│   │   ├── auth/                # JWT auth, strategies, guards
│   │   ├── users/               # User CRUD
│   │   ├── organizations/       # Multi-tenancy, memberships, RBAC
│   │   ├── projects/            # Project CRUD + caching
│   │   ├── tasks/               # Task CRUD + Kanban
│   │   ├── notifications/       # BullMQ processor + WebSocket gateway
│   │   ├── payments/            # Payment abstraction layer
│   │   ├── health/              # Health check + Prometheus
│   │   ├── common/              # Guards, filters, interceptors, decorators
│   │   ├── app.module.ts
│   │   ├── main.ts
│   │   └── tracing.ts           # OpenTelemetry bootstrap
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── api/                 # Axios API clients
│   │   ├── components/
│   │   │   ├── layout/          # AppLayout, OrgSwitcher
│   │   │   └── common/          # NotificationPanel
│   │   ├── hooks/               # useSocket, useFormDraft
│   │   ├── pages/               # Login, Register, Dashboard, Projects, Tasks, Profile
│   │   ├── stores/              # Zustand: auth, org, notification, theme
│   │   ├── theme/               # MUI theme (light/dark)
│   │   ├── utils/               # form-draft IndexedDB helpers
│   │   └── App.tsx
│   ├── tests/                   # Playwright E2E tests
│   └── playwright.config.ts
├── docker/
│   ├── Dockerfile.backend
│   ├── Dockerfile.frontend
│   ├── nginx/nginx.conf
│   └── postgres/
│       ├── init.sql
│       └── rls-policies.sql
├── k8s/                         # Kubernetes manifests
├── helm/saas-workspace/         # Helm chart
├── .github/workflows/ci.yml
├── docker-compose.yml
└── README.md
```

---

## Bonus Features Implemented

- [x] **PostgreSQL RLS** — Policies in `docker/postgres/rls-policies.sql`; `RlsInterceptor` sets org context; `RLS_AUTO_APPLY=true` applies policies on startup
- [x] **Fine-grained permission RBAC** — `Permission` enum + `@RequirePermissions()` guard alongside role checks
- [x] **Audit logging** — `AuditInterceptor` writes to `audit_logs` on POST/PUT/PATCH/DELETE (toggle with `FEATURE_AUDIT_LOGS`)
- [x] **Rate limiting** — Global `CustomThrottlerGuard` with Redis storage (100 req/min; toggle with `FEATURE_RATE_LIMITING`)
- [x] **Feature flags** — `GET /api/feature-flags`; env vars `FEATURE_*`
- [x] **Kubernetes deployment** — `k8s/` manifests (deployments, services, ingress, secrets)
- [x] **Helm chart** — `helm/saas-workspace/` (backend, frontend, ingress, configmap, secrets)
- [x] **OpenTelemetry instrumentation** — `src/tracing.ts` imported in `main.ts`; OTLP gRPC exporter
- [x] **WebSocket presence tracking** — `GET /api/organizations/:orgId/notifications/presence`
- [x] **IndexedDB form drafts** — Unsaved login/register/project/task forms restored via `useFormDraft`

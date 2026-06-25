# Full Stack Engineer Assessment

_Build a Multi-Tenant SaaS Workspace_

#### Duration: 10-14 hours

**Guiding principle**

Portability beats peak optimisation.

Prefer standard, portable technologies over tight vendor coupling.

For every major design decision, explain the choice, the alternatives, and the trade-offs.

## Problem statement

Build a multi-tenant Project Management SaaS where organizations can manage projects and tasks with role-based access control and real-time notifications.

## Functional requirements

### Authentication

- Implement JWT-based authentication with registration, login, refresh token, and logout.
- Design the authentication layer so enterprise SSO (SAML/OIDC) can be integrated later.

### Multi-tenancy

- Support multiple organizations with tenant isolation.
- Users may belong to multiple organizations with different roles.

### RBAC

- Implement ADMIN, EDITOR, and VIEWER roles.
- Protect endpoints according to the permissions matrix.

### Frontend

- Use React, TypeScript, Vite, and MUI v7.
- Include login, organization switcher, dashboard, projects, tasks, user profile, and light/dark theme switching.
- Use Redux Toolkit or Zustand for state management.
- Persist unsaved form drafts using IndexedDB.

### Backend

- Use NestJS with modular architecture, DTO validation, dependency injection, guards, and global exception handling.
- Expose REST APIs and generate OpenAPI documentation.

### Database

- Use PostgreSQL with tables for users, organizations, memberships, projects, and tasks.
- Explain how PostgreSQL Row-Level Security (RLS) can strengthen tenant isolation.

### Caching

- Use Redis for at least one of session caching, frequently accessed project data, or rate limiting.
- Document the cache invalidation strategy.

### Queues and real-time features

- Use BullMQ for background jobs.
- Implement WebSocket notifications for project creation, task assignment, and project updates.
- Ensure notifications are only delivered to users within the same organization.

### Payments

- Create a payment abstraction layer with createPayment(), verifyPayment(), and refundPayment().
- Provide one mock implementation and design it so Stripe or Razorpay can be added later without changing business logic.

### Security

- Implement JWT authentication, password hashing, RBAC authorization, organization isolation, and input validation.
- Describe how SAML/OIDC and Vault/KMS could be integrated in production.

### Infrastructure

- Provide Dockerfiles and docker-compose.yml.
- Bonus: add Kubernetes manifests, Helm charts, and Nginx reverse proxy configuration.

### CI/CD

- Create a GitHub Actions workflow that installs dependencies, runs linting and tests, builds the app, and builds Docker images.

### Observability

- Demonstrate or document structured logging, distributed tracing with OpenTelemetry, and metrics collection.

### Testing

- Write Jest unit tests, integration tests for key APIs, and end-to-end tests using Playwright.

## Deliverables

- README with setup instructions
- Architecture diagram
- Database schema
- Docker configuration
- Source code
- OpenAPI documentation
- Test cases
- Explanation of key architectural decisions

## Evaluation criteria

| **Area**                                     | **Weight** |
| -------------------------------------------- | ---------- |
| Code Quality & Architecture                  | 20%        |
| Frontend (React + MUI v7 + State Management) | 20%        |
| Backend (NestJS + APIs + RBAC)               | 20%        |
| Database & Multi-Tenancy Design              | 15%        |
| Caching, Queues & WebSockets                 | 10%        |
| Infrastructure & Docker                      | 10%        |
| Testing                                      | 5%         |

- **Bonus challenges**
- PostgreSQL Row-Level Security (RLS)
- Fine-grained permission-based RBAC
- Audit logging
- Rate limiting
- Feature flags
- Kubernetes deployment
- Helm chart
- OpenTelemetry instrumentation
- WebSocket presence tracking
- Offline support using IndexedDB
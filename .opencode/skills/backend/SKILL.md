---
name: backend
description: >
  TRIGGER KEYWORDS: backend, API, REST, GraphQL, server, endpoint, route,
  controller, service, repository, middleware, Express, Fastify, NestJS,
  Node.js, TypeScript, Python, FastAPI, Go, microservice, auth, JWT, OAuth,
  validation, Zod, error-handling, rate-limit, caching, Redis, queue,
  background-job, health-check, observability, OpenTelemetry, logging.
  MUST be used when designing, building, or reviewing backend services,
  APIs, middleware, server-side logic, or backend architecture.
---

# Backend Skill

## Goal
Build production-grade backend services with clean layered architecture, proper separation of concerns, explicit error boundaries, and strong typing. Every endpoint must be secure, observable, and maintainable.

## Core Architecture Doctrine

### Layered Architecture (Mandatory)
```
Request → Route → Controller → Service → Repository → Database
                           ↓
                      Middleware (auth, validation, logging, rate-limit)
```

| Layer | Responsibility | Must NOT |
|---|---|---|
| Route | HTTP verb + path + middleware chain | Contain business logic |
| Controller | Parse request, call service, format response | Access database directly |
| Service | Business rules, orchestration | Know about HTTP/session |
| Repository | Data access, queries | Contain business logic |

### Rules
1. No layer skipping — controllers never call repositories directly
2. Services use dependency injection — receive deps via constructor
3. Repositories return domain types, not ORM entities
4. All external input validated at the boundary (controller/middleware)
5. Every async operation has proper error handling

## API Design

### RESTful Conventions
```
GET    /api/v1/users              # List (paginated)
POST   /api/v1/users              # Create
GET    /api/v1/users/:id          # Read
PUT    /api/v1/users/:id          # Replace (full)
PATCH  /api/v1/users/:id          # Update (partial)
DELETE /api/v1/users/:id          # Delete
GET    /api/v1/users/:id/orders   # Nested resource
```

### Query Parameters
```
?page=1&limit=20&sort=created_at&order=desc&filter=active
```

### Response Format
```typescript
// Success
{ "data": T, "meta": { "page": 1, "limit": 20, "total": 100 } }

// Error (RFC 9457 Problem Details)
{
  "type": "https://api.example.com/errors/validation",
  "title": "Validation Error",
  "status": 422,
  "detail": "email is required",
  "instance": "/api/v1/users"
}
```

### HTTP Status Codes
| Code | Usage |
|---|---|
| 200 | Success (with body) |
| 201 | Created |
| 204 | Success (no content, DELETE) |
| 400 | Bad request / validation |
| 401 | Unauthorized (not authenticated) |
| 403 | Forbidden (no permission) |
| 404 | Not found |
| 409 | Conflict (duplicate) |
| 422 | Unprocessable entity |
| 429 | Rate limited |
| 500 | Server error (no details leaked) |

## Input Validation
- Validate ALL input at the boundary, not deep inside services
- Use Zod (TypeScript), Pydantic (Python), or equivalent
- Never trust `req.body` directly — always parse through a schema
- Sanitize strings (trim, escape) before persistence

## Security
| Concern | Practice |
|---|---|
| Auth | JWT with short-lived access + refresh tokens |
| Authorization | RBAC or ABAC checked in middleware |
| SQL injection | Parameterized queries / ORM (no string concat) |
| CORS | Explicit allowlist, never `*` in production |
| Headers | Helmet.js for security headers |
| Secrets | Environment variables / vault, never in code |
| Rate limiting | Per-IP or per-user, with clear retry headers |

## Error Handling
- Centralized error middleware catches all thrown errors
- Custom error classes extend a base `AppError`
- Log full stack traces internally, return sanitized messages to clients
- Machine-readable error codes: `VALIDATION_ERROR`, `NOT_FOUND`, `UNAUTHORIZED`
- Every 5xx must be logged + monitored (Sentry, OpenTelemetry)

## Caching Strategy
```
Cache-Aside Pattern:
1. Check cache (Redis / in-memory)
2. On hit → return cached
3. On miss → fetch from DB, store in cache, return
4. On write → update DB + invalidate cache
```

## Background Jobs
- Use queues (BullMQ, Celery, Sidekiq) for async work
- Jobs must be idempotent — replay-safe
- Exponential backoff for retries
- Dead-letter queue after max retries

## Observability
| Concern | Tool / Format |
|---|---|
| Logging | Structured JSON with correlation ID |
| Metrics | Request count, latency (p50/p95/p99), error rate |
| Tracing | OpenTelemetry distributed traces |
| Health | `/health` (liveness) + `/ready` (readiness) endpoints |

## Testing
| Type | Scope |
|---|---|
| Unit | Services, utilities — mock repositories |
| Integration | Routes, middleware — use test DB |
| Contract | API response shapes |
| E2E | Critical user flows |

## Production Hardening Checklist
- [ ] Timeouts at every layer (DB, HTTP, handler)
- [ ] Connection pooling configured
- [ ] Graceful shutdown (SIGTERM handler)
- [ ] Health check endpoints
- [ ] Rate limiting enabled
- [ ] CORS configured
- [ ] Secrets externalized
- [ ] Structured logging with correlation IDs
- [ ] Error tracking (Sentry / APM)

## Constraints
- Do NOT skip the service layer — no business logic in controllers
- Do NOT expose internal errors to clients
- Do NOT use raw SQL string interpolation
- Do NOT hardcode secrets or configuration
- Do NOT create endpoints without input validation
- Do NOT skip pagination on list endpoints

## References
- `references/API_EXAMPLES.md` — Controller, service, repository patterns
- `references/RESPONSE_FORMATS.md` — Standard response shapes

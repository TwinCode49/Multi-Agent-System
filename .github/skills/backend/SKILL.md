---
name: backend
description: >
  TRIGGER KEYWORDS: backend, API, REST, server, endpoint, route, controller,
  service, repository, middleware, Express, Fastify, Node.js, TypeScript,
  microservice, auth, JWT, validation, error-handling, caching, observability.
  MUST be used when building or reviewing backend services, APIs, or
  server-side logic. Covers layered architecture, API design, security,
  error handling, caching, and production hardening.
context: fork
---

# Backend Skill

## Goal
Build production-grade backend services with clean layered architecture and strong typing.

## Architecture
```
Route → Controller → Service → Repository → Database
```

| Layer | Role |
|---|---|
| Route | HTTP path + middleware |
| Controller | Parse request, format response |
| Service | Business rules (DI) |
| Repository | Data access |

**Rules:** No layer skipping. All input validated at boundary. Async operations with error handling.

## API Design
- RESTful: `GET/POST/PUT/PATCH/DELETE` on resource URLs
- Pagination: `?page=1&limit=20`
- Errors: RFC 9457 Problem Details format
- Status: 200, 201, 204, 400, 401, 403, 404, 409, 422, 429, 500

## Security
- JWT auth + RBAC authorization
- Parameterized queries (no SQL string concat)
- CORS with explicit allowlist
- Rate limiting on all endpoints
- Secrets via env vars, never in code
- Helmet for security headers

## Error Handling
- Centralized error middleware
- Custom `AppError` classes
- Log full stack, return sanitized messages
- Monitor 5xx via Sentry/OpenTelemetry

## Caching
Cache-aside: check cache → miss → fetch DB → store → return

## Production Checklist
- [ ] Timeouts at every layer
- [ ] Connection pooling
- [ ] Graceful shutdown
- [ ] Health + readiness endpoints
- [ ] Structured logs with correlation IDs
- [ ] Error tracking

## Constraints
- No business logic in controllers
- No raw SQL interpolation
- No hardcoded secrets
- No unpaginated list endpoints
- No internal errors exposed to clients

## References
- `references/API_EXAMPLES.md` — Code patterns

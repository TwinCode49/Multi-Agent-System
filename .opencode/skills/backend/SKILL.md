---
name: backend
description: >
  TRIGGER KEYWORDS: backend, API, REST, GraphQL, server, endpoint, route,
  controller, service, repository, middleware, Express, Fastify, NestJS,
  Node.js, TypeScript, Python, FastAPI, Go, microservice, auth, JWT, OAuth,
  validation, Zod, error-handling, rate-limit, caching, Redis, queue,
  background-job, health-check, observability, OpenTelemetry, logging.
  MUST be used when designing, building, or reviewing backend services, APIs,
  middleware, server-side logic, or backend architecture.
---

# Backend Skill

## Goal
Design and build robust, maintainable backend services and APIs following industry best practices.

## API Design
- RESTful resource naming conventions
- Consistent error response format
- Input validation at the boundary
- Versioning strategy for breaking changes

## Service Architecture
- Layered architecture (controller → service → repository)
- Dependency injection for testability
- Middleware for cross-cutting concerns (auth, logging, rate limiting)
- Background jobs for async processing

## Constraints
- Do NOT expose internal implementation details in API responses
- Do NOT trust client input without validation
- Do NOT hardcode configuration values
- Do NOT ignore error handling in async paths

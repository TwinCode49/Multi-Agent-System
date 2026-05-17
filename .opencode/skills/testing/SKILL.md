---
name: testing
description: >
  TRIGGER KEYWORDS: test, coverage, spec, pytest, jest, vitest, mocha, chai,
  TDD, BDD, unittest, integration-test, e2e, cypress, playwright, supertest,
  mocking, stub, spy, fixture, snapshot, property-based, testing-library,
  react-testing-library, vitest, assert, expect, describe, it, test-suite,
  CI-test, coverage-threshold, code-coverage, mutation-testing.
  MUST be used when writing, reviewing, or planning tests, test suites,
  testing strategy, or CI test pipelines.
---

# Testing Skill

## Goal
Produce reliable, maintainable test suites that catch regressions, document behavior, and enable confident refactoring. Every test must be deterministic, isolated, and purposeful.

## Testing Pyramid (Priority Order)

```
       ╱╲
      ╱ E2E ╲           ← Few (happy paths + critical flows)
     ╱────────╲
    ╱ Integration ╲     ← Some (boundaries + external deps)
   ╱────────────────╲
  ╱   Unit Tests     ╲  ← Many (business logic + utilities)
 ╱──────────────────────╲
```

| Layer | Speed | Scope | Count |
|---|---|---|---|
| Unit | Fast (ms) | Single function/class | 70%+ |
| Integration | Medium (s) | Module + boundary | 20% |
| E2E | Slow (min) | Full user flow | <10% |

## Test Structure (AAA Pattern)

```
┌─────────────────────────────────────┐
│  ARRANGE — Set up test preconditions │
│  ACT     — Execute the behavior      │
│  ASSERT  — Verify the outcome        │
└─────────────────────────────────────┘
```

```typescript
describe("UserService.create", () => {
  it("creates a user and sends welcome email", async () => {
    // Arrange
    const emailService = { sendWelcome: vi.fn() };
    const userRepo = { findByEmail: vi.fn().mockResolvedValue(null), create: vi.fn() };
    const service = new UserService(userRepo as any, emailService as any);

    // Act
    const result = await service.create({ email: "a@b.com", name: "Alice" });

    // Assert
    expect(userRepo.create).toHaveBeenCalledWith(expect.objectContaining({ email: "a@b.com" }));
    expect(emailService.sendWelcome).toHaveBeenCalledWith("a@b.com");
  });
});
```

## Naming Conventions

### File Naming
```
*.spec.ts          # Vitest/Jest convention
*.test.ts          # Alternative
__tests__/*.test.ts # Jest convention (avoid mixing)
```

### Describe/It Style
```typescript
describe("UnitName.methodName", () => {
  it("does something when condition", () => { /* ... */ });
  it("throws an error when invalid input", () => { /* ... */ });
  it("returns empty array when no results", () => { /* ... */ });
});
```

## Mocking Rules

| Rule | Why |
|---|---|
| Mock external I/O (DB, HTTP, FS) | Speed + determinism |
| Never mock what you don't own? | **Always mock what you don't own** |
| Prefer dependency injection over `vi.mock` | Explicit contracts |
| One assertion per mock call | Clear failure messages |
| Avoid over-mocking (test real behavior where possible) | Confidence |

## Coverage Thresholds (Minimum)
```
branches: 80
functions: 85
lines: 90
statements: 90
```
Treat below threshold as CI failure.

## What to Test

### Must test
- Public API of every module (functions, classes, components)
- Edge cases: empty input, null, max length, duplicate, not found
- Error paths: thrown exceptions, rejected promises, error boundaries
- Boundary conditions: pagination limits, timeouts, concurrency
- State transitions: status changes, lifecycle hooks

### Don't test
- Implementation details (private methods, internal state)
- Third-party library behavior (test integration instead)
- Generated code (type definitions, boilerplate)
- Configuration files (unless parsing logic)

## Test Types Quick Reference

| Type | Tools | What to cover |
|---|---|---|
| Unit | Vitest, Jest, pytest | Business logic, utilities, pure functions |
| Component | Testing Library, Vue Test Utils | Render, user interaction, state |
| Integration | Supertest, pytest + httpx | Route → DB flow, middleware chain |
| E2E | Playwright, Cypress | Critical user journeys, auth flow |
| Snapshot | Jest/Vitest `.toMatchSnapshot()` | Stable UI output (use sparingly) |
| Property | fast-check, Hypothesis | Invariants, fuzzing edge cases |
| Visual | Loki, Percy, Chromatic | Visual regression, responsive layout |

## CI Integration
- Run unit + integration on every push
- Run E2E only on PRs to main
- Fail CI if coverage drops below thresholds
- Parallelize test files by speed (slow files last)
- Retry flaky tests max 2× with `--retry`

## Constraints
- Do NOT write tests that depend on execution order (no test pollution)
- Do NOT use `it.only` or `describe.only` in committed code
- Do NOT mock what you can test with real instances (in-memory DB, etc.)
- Do NOT snapshot large objects (extract specific fields instead)
- Do NOT create tests without assertions (empty test bodies)
- Do NOT Hardcode time — use `vi.setSystemTime()` / `freezegun`

## References
- `references/TEST_PATTERNS.md` — Common patterns for different frameworks

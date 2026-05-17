---
name: testing
description: >
  TRIGGER KEYWORDS: test, coverage, spec, jest, vitest, pytest, TDD, BDD,
  unittest, integration-test, e2e, cypress, playwright, mocking, assertion,
  test-suite, CI-test, coverage-threshold. MUST be used when writing,
  reviewing, or planning tests or testing strategy.
context: fork
---

# Testing Skill

## Goal
Reliable, maintainable test suites that catch regressions and enable confident refactoring.

## Pyramid
- **Unit** (70%+, ms): Functions, utilities — mock I/O
- **Integration** (20%, s): Module boundaries — real DB/HTTP
- **E2E** (<10%, min): Critical user flows — Playwright/Cypress

## Structure (AAA)
```
ARRANGE → ACT → ASSERT
```

## Naming
```
describe("Module.method", () => {
  it("does thing when condition", () => { ... });
  it("throws when invalid", () => { ... });
});
```

## Mocking Rules
- Always mock external I/O (DB, HTTP, FS)
- Favor DI over `vi.mock()`
- One assertion per mock call

## Coverage Minimums
```
branches: 80, functions: 85, lines: 90, statements: 90
```
Below threshold = CI failure.

## What to Test
**Do:** Public API, edge cases, error paths, boundaries, state transitions
**Don't:** Implementation details, 3rd-party libs, generated code, config

## Types
| Type | Tool |
|---|---|
| Unit | Vitest, Jest, pytest |
| Component | Testing Library |
| Integration | Supertest, httpx |
| E2E | Playwright, Cypress |
| Property | fast-check, Hypothesis |

## Constraints
- No test pollution (shared mutable state)
- No `it.only` / `describe.only` in commits
- No snapshot of large objects
- No empty tests
- No hardcoded time (use fake timers)

## References
- `references/TEST_PATTERNS.md`

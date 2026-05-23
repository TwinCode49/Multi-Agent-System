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
Produce reliable, maintainable test suites that catch regressions, document behavior, and enable confident refactoring.

## Testing Pyramid

```
       /\
      / E2E \           ← Few (happy paths + critical flows)
     /────────\
    / Integration \     ← Some (boundaries + external deps)
   /────────────────\
  /   Unit Tests     \  ← Many (business logic + utilities)
```

## Test Structure (AAA Pattern)
- ARRANGE — Set up test preconditions
- ACT — Execute the behavior
- ASSERT — Verify the outcome

## Coverage Thresholds (Minimum)
- branches: 80, functions: 85, lines: 90, statements: 90

## Constraints
- Do NOT write tests that depend on execution order
- Do NOT use it.only/describe.only in committed code
- Do NOT mock what you can test with real instances
- Do NOT create tests without assertions

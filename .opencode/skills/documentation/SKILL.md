---
name: documentation
description: >
  TRIGGER KEYWORDS: document, documentation, README, CHANGELOG, changelog,
  migration-guide, API-doc, api-docs, swagger, openapi, JSDoc, mermaid,
  diagram, ADR, architecture-decision, code-comment, user-guide, docstring.
  MUST be used when creating or updating any project documentation.
  Guides the generation of README files, CHANGELOG entries, API documentation,
  Mermaid diagrams, migration guides, and code comments following industry
  best practices and project conventions.
---

# Documentation Skill

## Goal
Produce consistent, high-quality project documentation following established standards. Every generated document must be clear, maintainable, and useful for both human readers and AI agents.

## Documentation Types

### 1. README
See `references/README_TEMPLATE.md` for the exact template.

### 2. CHANGELOG
Follow [Keep a Changelog](https://keepachangelog.com) v1.1.0:
- `Added` for new features
- `Changed` for changes in existing functionality
- `Deprecated` for soon-to-be removed features
- `Removed` for now removed features
- `Fixed` for bug fixes
- `Security` for vulnerability fixes
- Always keep an `[Unreleased]` section at the top
- Each version gets a date: `## [1.0.0] - 2026-05-16`
- Reference `references/CHANGELOG_TEMPLATE.md`

### 3. Mermaid Diagrams
Use Mermaid.js (markdown-native diagramming). Supported diagram types:

```
GRAPH TYPE                  USE CASE
───────────                 ─────────
flowchart TD                Top-down workflow / decision trees
flowchart LR                Left-right architecture / pipelines
sequenceDiagram             API interactions / request lifecycles
classDiagram                Domain models / entity relationships
stateDiagram-v2             State machines / status transitions
gantt                       Sprint timelines / release schedules
gitGraph                    Branch strategies / Git workflows
pie                         Distribution / composition charts
erDiagram                   Entity-relationship for database schemas
C4Context                   System context (C4 model first level)
C4Container                 Container diagram (C4 model second level)
C4Component                 Component diagram (C4 model third level)
```

**Styling rules for ALL diagrams:**
- Wrap inside ` ```mermaid ` blocks
- Use descriptive node IDs (e.g., `authService` not `a1`)
- Add `%%` comments for complex sections
- Keep diagrams focused — one concept per diagram
- Prefer `flowchart` for process flows, `sequenceDiagram` for time-ordered interactions

### 4. API Documentation
- Generate OpenAPI 3.1 spec from route definitions when possible
- Add JSDoc/TSDoc to every exported function and type
- JSDoc format:
  ```ts
  /**
   * Brief description. Use present tense.
   * @param paramName - Description of the parameter
   * @returns Description of the return value
   * @throws {ErrorType} When this error occurs
   * @example
   * ```ts
   * const result = myFunction("input");
   * ```
   */
  ```
- Group related endpoints with `@tag` in OpenAPI
- Include request/response examples for every endpoint

### 5. Architecture Decision Records (ADR)
Place in `docs/adr/` as `NNNN-title.md` (e.g., `0001-use-postgresql.md`):
```
# NNNN. Title

Date: YYYY-MM-DD

## Status
[Proposed | Accepted | Deprecated | Superseded]

## Context
What forces influenced the decision?

## Decision
What was chosen and why?

## Consequences
What becomes easier or harder?
```
Reference `references/ADR_TEMPLATE.md`.

### 6. Code Comments
| Comment type | When | Format |
|---|---|---|
| Doc comment | Every public API, export, type | JSDoc/TSDoc (`/** */`) |
| Implementation note | Non-obvious logic only | Line comment (`//`) |
| TODO | Known incomplete work | `// TODO(username): message` |
| FIXME | Known bug | `// FIXME: message` |
| HACK | Suboptimal workaround | `// HACK: message — revisit when...` |

- Do NOT comment obvious code (`let x = 1; // assign 1 to x`)
- Do explain WHY, not WHAT
- Every TODO must have an owner or issue reference

### 7. Migration Guides
Structure:
```
# Migration Guide: vX.Y.Z → vA.B.C

## Summary
One paragraph describing what changed and who is affected.

## Breaking Changes
### Title
**Before:** (old code/config)
**After:** (new code/config)
**Migration:** step-by-step instructions

## Deprecations
What is deprecated and when it will be removed.

## New Features
Brief description of what was added.
```

## General Documentation Rules

1. **One file per concept** — don't create monolithic docs
2. **Front-load key information** — first paragraph should summarize the entire document
3. **Use tables** for structured comparisons and reference data
4. **Prefer lists** over prose for instructions and guidelines
5. **Include a table of contents** in any document over 200 lines
6. **Link to code** — reference specific files and line numbers
7. **Keep language consistent** — pick one term and use it throughout
8. **Use relative links** within the repository, absolute URLs for external resources
9. **Validate markdown** — ensure all links work, no broken references
10. **Write for two audiences**: human maintainers AND AI agents reading the same files

## Constraints
- Do NOT generate documentation for internal/private implementation details
- Do NOT overwrite manual documentation — append or merge
- Do NOT include fictional or placeholder information
- Do NOT create documentation for code that does not exist yet
- Every document must include the project name and a clear purpose statement

## References
- `references/README_TEMPLATE.md` — README structure
- `references/CHANGELOG_TEMPLATE.md` — CHANGELOG format
- `references/ADR_TEMPLATE.md` — ADR template
- `references/MERMAID_EXAMPLES.md` — Mermaid diagram patterns

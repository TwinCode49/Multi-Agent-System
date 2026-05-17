# Agent Creation Best Practices

## 1. Description as Trigger

The `description` is the PRIMARY mechanism for auto-dispatch. Write it like a marketing hook:

```yaml
description: >
  TRIGGER KEYWORDS: database, SQL, schema, migration, query, ORM.
  ALWAYS USE for database-related tasks. Senior backend engineer
  specializing in scalable database architecture.
  Proactively analyzes and optimizes data access patterns.
```

## 2. Permission Scoping

Restrict tools based on agent role:

| Agent Type | Typical Permissions |
|---|---|
| Read-only (reviewer, security) | `edit: deny`, `bash: deny` |
| Read-write (developer, DevOps) | `edit: allow`, `bash: allow` |
| Coordinators (orchestrator) | `task: allow` (to delegate) |

## 3. Temperature for Consistency

| Agent Type | Temperature |
|---|---|
| Creative (UI, design) | 0.7 - 1.0 |
| Analytical (review, security) | 0.0 - 0.2 |
| Balanced (dev, docs) | 0.1 - 0.3 |

## 4. Language

**Agent `.md` files** (instrucciones para IA): **Inglés** obligatorio. **Documentación del proyecto** (`Docs/`): **Español**.

## 5. Naming Conventions

- Lowercase, hyphens for spaces: `database-specialist`, `code-reviewer`
- Descriptive but concise: `test-engineer` not `the-person-who-writes-tests`
- Match the directory name to the file name

---
*Model: opencode/deepseek-v4-flash-free*

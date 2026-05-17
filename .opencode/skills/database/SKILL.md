---
name: database
description: >
  TRIGGER KEYWORDS: database, SQL, query, schema, migration, ORM,
  PostgreSQL, MySQL, MongoDB, Prisma, TypeORM, Drizzle, Knex, Sequelize,
  Mongoose, data-model, relation, index, normalization, denormalization,
  migration, seed, transaction, N+1, join, aggregate, sharding, replication,
  connection-pool, query-optimization, explain-analyze, trigger, view, CTE,
  window-function, full-text-search, indexing-strategy, partition, cascade,
  ACID, CAP, eventual-consistency, data-integrity.
  MUST be used when designing schemas, writing queries, modeling data,
  planning migrations, or optimizing database performance.
---

# Database Skill

## Goal
Design efficient, maintainable data models with optimal query performance, referential integrity, and seamless schema evolution. Every schema must be intentional, every query justified.

## Schema Design Principles

### Normalization Rules
| Normal Form | Rule | When to stop |
|---|---|---|
| 1NF | Atomic columns, no repeating groups | Always |
| 2NF | No partial dependencies on composite keys | Always |
| 3NF | No transitive dependencies | Most cases |
| BCNF | Every determinant is a candidate key | Complex domains |

### Denormalization (when justified)
- Read-heavy hot paths (dashboards, analytics)
- Pre-computed aggregations (materialized views)
- Avoid denormalization until a performance problem is measured

### Naming Conventions
```
tables:     users, user_roles (snake_case, plural)
columns:   id, email, created_at (snake_case)
indexes:   idx_users_email, idx_users_created_at
keys:      pk_users, fk_users_role_id
migration: 20260516_create_users_table
```

## SQL Query Rules

### Do
- Use parameterized queries always (`$1`, `?`, `:param`)
- Prefix columns with table alias: `u.email`
- Use `EXISTS` instead of `IN` for subqueries
- Use `EXPLAIN ANALYZE` to verify query plans
- Return only needed columns (no `SELECT *`)
- Use `LIMIT` + `OFFSET` or cursor-based pagination

### Don't
- Don't use `SELECT DISTINCT` as a band-aid for bad joins
- Don't wrap columns in functions in WHERE clauses (sargability)
- Don't use `LIKE '%term%'` on large tables (use full-text search)
- Don't omit `WHERE` in `UPDATE`/`DELETE`
- Don't use `OFFSET` for deep pagination (use keyset/cursor)

## Indexing Strategy

| Index Type | When to use |
|---|---|
| B-tree (default) | Equality + range queries, sorting |
| Hash | Exact equality only |
| GIN | Array columns, JSONB, full-text search |
| GiST | Geospatial, range types |
| BRIN | Large tables with naturally ordered data |
| Composite (A, B) | Queries filtering on A, or A + B |
| Partial | Sparse data — index only subset |
| Covering (INCLUDE) | Index-only scans — no heap lookups |

**Golden rule**: Index columns used in `WHERE`, `JOIN`, `ORDER BY`, and `GROUP BY`.

## Migration Best Practices

```
┌─────────────────────────────────────┐
│  1. Write migration code           │
│  2. Backup DB (dump + snapshot)    │
│  3. Deploy to staging              │
│  4. Run dry-run (--dry-run)        │
│  5. Deploy to production           │
│  6. Monitor (slow queries, errors) │
│  7. Rollback plan ready            │
└─────────────────────────────────────┘
```

### Rules
- One migration per logical change (atomic)
- Never edit existing migrations after review
- Write both `up()` and `down()` (rollback)
- Test migrations against a copy of production data
- Avoid locking large tables — use `CONCURRENTLY` for indexes
- Use `CHECK` constraints instead of application validation where possible

## Transaction Patterns

```sql
BEGIN;
  UPDATE accounts SET balance = balance - 100 WHERE id = 1;
  UPDATE accounts SET balance = balance + 100 WHERE id = 2;
COMMIT;
```

| Isolation Level | Dirty Read | Non-repeatable | Phantom |
|---|---|---|---|
| Read Uncommitted | ❌ | ❌ | ❌ |
| Read Committed | ✅ | ❌ | ❌ |
| Repeatable Read | ✅ | ✅ | ❌ |
| Serializable | ✅ | ✅ | ✅ |

✅ = Prevents. Default in PostgreSQL: Read Committed.

## ORM Usage Guidelines

| ORM | Best for |
|---|---|
| Prisma | TypeScript-first, auto-generated client, migrations |
| Drizzle | TypeScript + SQL-like, lightweight, edge-ready |
| TypeORM | Full-featured, decorators, old project compat |
| Knex | Query builder + migration runner (JS ecosystem) |
| Sequelize | Legacy Node.js projects |
| Mongoose | MongoDB schema + validation |

### Prisma Projections
```prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  name      String
  posts     Post[]
  createdAt DateTime @default(now())
}

// Prisma query
prisma.user.findMany({
  where: { email: { contains: "@" } },
  select: { id: true, email: true },
  take: 20,
  skip: 0,
  orderBy: { createdAt: "desc" },
});
```

## Performance Monitoring (PostgreSQL)

```sql
-- Slow queries
SELECT query, calls, total_time / calls AS avg_time_ms
FROM pg_stat_statements ORDER BY avg_time_ms DESC LIMIT 10;

-- Missing indexes
SELECT relname, seq_scan, seq_tup_read, idx_scan
FROM pg_stat_user_tables WHERE seq_scan > 1000;

-- Index usage
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes ORDER BY idx_scan ASC;
```

## Common Pitfalls

| Problem | Symptom | Fix |
|---|---|---|
| N+1 queries | O(n) DB calls | Eager loading / batch |
| Missing index | Sequential scans on large table | `CREATE INDEX CONCURRENTLY` |
| Lock contention | Deadlocks, timeout | Shorter transactions / retry logic |
| Orphaned records | FK violation on delete | Cascade / soft delete |
| Schema drift | Migration mismatch | Version-controlled migrations |
| Connection leak | `too many clients` | Pool + release in `finally` |
| Over-fetching | High network I/O | `SELECT` only needed columns |

## Constraints
- Do NOT write raw SQL string interpolation (use parameterized queries)
- Do NOT create indexes without `EXPLAIN ANALYZE`
- Do NOT edit production data without a transaction + backup
- Do NOT use `DELETE` without `WHERE` on large tables (use `TRUNCATE`)
- Do NOT skip migrations in production deployments
- Do NOT commit generated Prisma/ORM clients — regenerate in CI

## References
- `references/EXAMPLE_QUERIES.md` — Common query patterns and optimizations

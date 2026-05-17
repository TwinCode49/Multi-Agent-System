---
name: database
description: >
  TRIGGER KEYWORDS: database, SQL, query, schema, migration, ORM,
  PostgreSQL, Prisma, data-model, index, normalization, transaction,
  query-optimization, N+1, connection-pool, indexing-strategy, ACID.
  MUST be used when designing schemas, writing queries, modeling data,
  or planning migrations.
context: fork
---

# Database Skill

## Goal
Efficient, maintainable data models with optimal query performance and safe schema evolution.

## Schema Design
- Normalize to 3NF by default; denormalize only for measured hot paths
- Tables: `snake_case`, plural — Columns: `snake_case`
- Parameterized queries always — no string interpolation

## Indexing
| Type | Use |
|---|---|
| B-tree | Equality + range |
| Hash | Exact match |
| GIN | JSONB, full-text |
| GiST | Geospatial |
| BRIN | Large ordered data |
| Composite (A, B) | Filter on A or A+B |

**Index WHERE, JOIN, ORDER BY, GROUP BY columns.**

## Migrations
- One logical change per migration
- Always write `up()` + `down()`
- Test against production-like data
- Use `CREATE INDEX CONCURRENTLY` to avoid table locks
- Never edit a committed migration

## Transactions
- Wrap multi-statement writes in `BEGIN/COMMIT`
- Match isolation to needs (default: Read Committed)
- Watch for N+1 — use eager loading

## Performance
```sql
-- Slow queries
SELECT query, calls, total_time / calls AS avg_ms
FROM pg_stat_statements ORDER BY avg_ms DESC LIMIT 10;

-- Missing indexes
SELECT relname, seq_scan, idx_scan
FROM pg_stat_user_tables WHERE seq_scan > 1000;
```

## Pitfalls
| Problem | Fix |
|---|---|
| N+1 | Eager load |
| Missing index | `CREATE INDEX CONCURRENTLY` |
| Lock contention | Shorter txn + retry |
| Connection leak | Pool + always release |
| Schema drift | Version-controlled migrations |

## Constraints
- No raw SQL string interpolation
- No index without `EXPLAIN ANALYZE`
- No production data mutation without txn + backup
- No skipping migrations in deployments

## References
- `references/EXAMPLE_QUERIES.md`

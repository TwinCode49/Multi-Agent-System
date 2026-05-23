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
Design efficient, maintainable database schemas and write optimal queries.

## Schema Design
- Normalize until it hurts, denormalize until it works
- Define explicit foreign key constraints
- Choose appropriate data types for each column
- Plan indexes based on query patterns

## Query Optimization
- Use EXPLAIN ANALYZE to understand query plans
- Avoid N+1 queries by eager loading
- Use appropriate join types
- Leverage covering indexes

## Constraints
- Do NOT run destructive migrations without backup
- Do NOT use SELECT * in production queries
- Do NOT ignore connection pool limits
- Do NOT hardcode connection strings

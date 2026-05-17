# Example Queries and Patterns

## Pagination (Keyset / Cursor)

```sql
-- Traditional offset (bad for deep pages)
SELECT id, email, created_at FROM users ORDER BY id LIMIT 20 OFFSET 100;

-- Keyset pagination (good)
SELECT id, email, created_at FROM users WHERE id > 100 ORDER BY id LIMIT 20;
SELECT id, email, created_at FROM users WHERE created_at < '2024-01-01' ORDER BY created_at DESC LIMIT 20;
```

## Hierarchical / Tree (Recursive CTE)

```sql
WITH RECURSIVE org_tree AS (
  SELECT id, name, parent_id, 1 AS depth
  FROM employees WHERE parent_id IS NULL
  UNION ALL
  SELECT e.id, e.name, e.parent_id, t.depth + 1
  FROM employees e JOIN org_tree t ON e.parent_id = t.id
)
SELECT * FROM org_tree ORDER BY depth, name;
```

## Full-Text Search (PostgreSQL)

```sql
-- Create tsvector column
ALTER TABLE articles ADD COLUMN search_vector tsvector
  GENERATED ALWAYS AS (to_tsvector('english', title || ' ' || body)) STORED;

-- Index
CREATE INDEX idx_articles_search ON articles USING GIN(search_vector);

-- Query
SELECT title FROM articles
WHERE search_vector @@ to_tsquery('english', 'database & optimization');
```

## Efficient Aggregation

```sql
SELECT
  date_trunc('month', created_at) AS month,
  COUNT(*) AS total_orders,
  SUM(amount) AS revenue,
  AVG(amount) AS avg_order_value
FROM orders
WHERE created_at >= now() - interval '12 months'
GROUP BY date_trunc('month', created_at)
ORDER BY month;
```

## Window Functions

```sql
-- Running total
SELECT
  id, amount, created_at,
  SUM(amount) OVER (ORDER BY created_at) AS running_total
FROM orders WHERE user_id = 42 ORDER BY created_at;

-- Rank by category
SELECT
  id, category, score,
  RANK() OVER (PARTITION BY category ORDER BY score DESC) AS rank
FROM products;
```

## Avoiding N+1 (Prisma)

```typescript
// Bad — N+1
const users = await prisma.user.findMany();
for (const user of users) {
  console.log(user.posts.length); // Triggers N queries
}

// Good — eager load
const usersWithPosts = await prisma.user.findMany({
  include: { posts: true },
});
```

## Batch Insert with Conflict Resolution

```sql
INSERT INTO users (email, name)
VALUES ('a@b.com', 'Alice'), ('c@d.com', 'Bob')
ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name;
```

## Soft Delete Pattern

```sql
ALTER TABLE users ADD COLUMN deleted_at timestamptz;

CREATE INDEX idx_users_active ON users (email) WHERE deleted_at IS NULL;

-- Always filter
SELECT * FROM users WHERE deleted_at IS NULL;
```

## Migration Template (Prisma)

```prisma
// 20260516_add_user_status
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  status    UserStatus @default(ACTIVE)
  createdAt DateTime @default(now())
  deletedAt DateTime?
}

enum UserStatus {
  ACTIVE
  INACTIVE
  SUSPENDED
}
```

# Language Standards & Migration Engineering — SQL:2023

> Production-grade SQL standards, query syntax idioms, zero-downtime schema migrations, and concurrency safety.

---

## 1. Target Engines & Standards

- **Primary Engines**: PostgreSQL 16+, MySQL 8.4+ LTS, SQLite 3.45+ (WAL mode), ClickHouse 24+
- **Dialect Target**: SQL:2023 ANSI standard with engine-specific optimization extensions
- **Naming Conventions**: `snake_case` for all tables, columns, indexes, and constraints. Plural table names (`orders`, `users`, `accounts`).

---

## 2. Idiomatic SQL Standards

### 2.1. Aggregates with Explicit `FILTER` Clauses
Avoid legacy `CASE WHEN` inside `SUM` or `COUNT`; use the standard `FILTER` clause:

```sql
SELECT
    organization_id,
    COUNT(*) AS total_invoices,
    COUNT(*) FILTER (WHERE status = 'paid') AS paid_invoices,
    COUNT(*) FILTER (WHERE status = 'overdue') AS overdue_invoices,
    COALESCE(SUM(amount) FILTER (WHERE status = 'paid'), 0.00) AS total_revenue
FROM invoices
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY organization_id;
```

### 2.2. Deterministic Keyset (Cursor) Pagination
Never use `OFFSET` for pagination on tables with more than 10,000 rows ($O(N)$ scan overhead). Use keyset pagination ($O(1)$ index lookup):

```sql
-- Fast, constant-time keyset pagination using composite index (created_at, id)
SELECT id, customer_name, total_amount, created_at
FROM orders
WHERE (created_at, id) < (:cursor_created_at, :cursor_id)
ORDER BY created_at DESC, id DESC
LIMIT 50;
```

### 2.3. Safe Concurrent Queue Processing
Implement high-throughput worker queues without deadlocks using `FOR UPDATE SKIP LOCKED`:

```sql
-- Atomically claim up to 10 pending jobs for processing
WITH claimed_jobs AS (
    SELECT id
    FROM background_jobs
    WHERE status = 'pending'
      AND run_at <= NOW()
    ORDER BY priority DESC, run_at ASC
    LIMIT 10
    FOR UPDATE SKIP LOCKED
)
UPDATE background_jobs
SET status = 'processing',
    locked_at = NOW(),
    worker_id = :worker_id
FROM claimed_jobs
WHERE background_jobs.id = claimed_jobs.id
RETURNING background_jobs.*;
```

---

## 3. Zero-Downtime Migration Playbook

### 3.1. Safe Non-Blocking Index Creation
```sql
-- PostgreSQL: Run outside transaction block
CREATE INDEX CONCURRENTLY idx_orders_customer_status
ON orders (customer_id, status)
INCLUDE (total_amount, created_at);

-- MySQL 8.0+: Specify online DDL algorithm
ALTER TABLE orders
ADD INDEX idx_orders_customer_status (customer_id, status),
ALGORITHM=INPLACE, LOCK=NONE;
```

### 3.2. Safe Column Additions with Defaults (Postgres 11+)
Adding a column with a constant default in modern Postgres updates the system catalog metadata in $O(1)$ time without rewriting table pages:

```sql
-- Safe: Instant catalog-only update in Postgres 11+
ALTER TABLE users
ADD COLUMN is_verified BOOLEAN NOT NULL DEFAULT FALSE;
```

### 3.3. Safe Column Renaming (The Expand-Contract Pattern)
Never run `ALTER TABLE RENAME COLUMN` in a single step on a live production table.

```
Phase 1 (Expand)       Phase 2 (Dual Write)     Phase 3 (Backfill)     Phase 4 (Contract)
──────────────────────────────────────────────────────────────────────────────────────────
Add new column         App writes to both       Backfill historical    Drop old column
(new_column)           old & new columns        rows in batches        from database
```

### 3.4. Batched Historical Backfills
Never run an unconstrained `UPDATE` on millions of rows; it generates massive WAL bloat, locks rows, and exhausts undo logs:

```sql
-- Run in an iterative loop across ID ranges (e.g. 5,000 rows per batch)
DO $$
DECLARE
    batch_size INT := 5000;
    start_id BIGINT := 0;
    max_id BIGINT;
BEGIN
    SELECT COALESCE(MAX(id), 0) INTO max_id FROM users;
    
    WHILE start_id <= max_id LOOP
        UPDATE users
        SET normalized_email = LOWER(email)
        WHERE id BETWEEN start_id AND start_id + batch_size - 1
          AND normalized_email IS NULL;
          
        COMMIT; -- Release row locks and allow autovacuum to reclaim space
        start_id := start_id + batch_size;
        PERFORM pg_sleep(0.05); -- Yield I/O to avoid saturating disk
    END LOOP;
END $$;
```

---

## 4. Anti-Patterns & Pitfalls Table

| Anti-Pattern | Consequence | Correct Pattern |
| :--- | :--- | :--- |
| **`SELECT *` in Production** | Fetches unused columns (large JSON/text), breaks index-only scans, inflates network I/O. | Specify only the required columns explicitly (`SELECT id, name, email`). |
| **Unindexed Foreign Keys** | Deleting a parent row triggers a full sequential table scan on child tables. | Always create an index on every foreign key column. |
| **Deep `OFFSET 500000`** | Database scans and discards 500,000 rows for every page request. | Use keyset pagination with composite index (`WHERE (created_at, id) < (...)`). |
| **Random UUIDv4 Primary Keys** | Random inserts cause $50\%$ page leaf splits in B-Trees, inflating index size by $3\times$. | Use sequential, time-ordered IDs: UUIDv7, ULID, or BIGINT Identity. |
| **Missing Connection Pool Limits** | 1,000 incoming requests spawn 1,000 backend Postgres processes, causing CPU context-switch collapse. | Use PgBouncer in transaction pooling mode ($\text{pool\_size} \le \text{CPU cores} \times 4$). |

# Research Method & Diagnostics — SQL & Database Systems

> Query execution plan diagnostics, pg_stat_statements profiling, index bloat auditing, and load benchmarking.

---

## 1. The `EXPLAIN (ANALYZE, BUFFERS)` Diagnostic Protocol

Always execute the complete diagnostic options to inspect both CPU time and I/O buffer mechanics:

```sql
EXPLAIN (ANALYZE, BUFFERS, VERBOSE, SETTINGS)
SELECT
    o.id,
    o.customer_name,
    SUM(oi.price * oi.quantity) AS total_order_value
FROM orders o
JOIN order_items oi ON o.id = oi.order_id
WHERE o.created_at >= '2026-01-01 00:00:00+00'
  AND o.status = 'completed'
GROUP BY o.id, o.customer_name
ORDER BY total_order_value DESC
LIMIT 20;
```

### 1.1. Plan Interpretation Checklist

- [ ] **Row Estimate vs. Actual Rows**: If `rows=10` was estimated but `actual rows=500000`, the planner statistics are stale. Run `ANALYZE table_name;`.
- [ ] **Shared Buffer Hits vs. Reads**:
  - `Shared Hit Blocks`: Fetched from Postgres shared buffer cache (RAM). Target: $\gt 99\%$.
  - `Shared Read Blocks`: Read from OS page cache or physical disk. High numbers cause latency spikes.
  - `Shared Dirtied / Written Blocks`: Indicates writes and checkpoint pressure.
- [ ] **Sort & Hash Spills**: Look for `Sort Method: external merge  Disk: 40960kB`. This indicates the dataset exceeded `work_mem` and spilled to disk. Increase `work_mem` for the query session:
  ```sql
  SET LOCAL work_mem = '64MB';
  ```

---

## 2. Global Query Profiling with `pg_stat_statements`

Identify top queries consuming the most cumulative database time:

```sql
-- Top 10 queries by total execution time
SELECT
    round(total_exec_time::numeric, 2) AS total_time_ms,
    calls,
    round(mean_exec_time::numeric, 2) AS mean_time_ms,
    round((100 * total_exec_time / sum(total_exec_time) OVER ())::numeric, 2) AS percent_total_time,
    round(shared_blks_hit * 100.0 / nullif(shared_blks_hit + shared_blks_read, 0), 2) AS hit_ratio_pct,
    query
FROM pg_stat_statements
ORDER BY total_exec_time DESC
LIMIT 10;
```

---

## 3. Detecting Unused Indexes & Index Bloat

Unused indexes slow down every `INSERT`, `UPDATE`, and `DELETE` without providing any query benefit:

```sql
-- Find unused indexes with size > 10MB
SELECT
    schemaname || '.' || relname AS table_name,
    indexrelname AS index_name,
    pg_size_pretty(pg_relation_size(i.indexrelid)) AS index_size,
    idx_scan AS number_of_scans
FROM pg_stat_user_indexes ui
JOIN pg_index i ON ui.indexrelid = i.indexrelid
WHERE NOT indisunique
  AND idx_scan = 0
  AND pg_relation_size(i.indexrelid) > 10 * 1024 * 1024
ORDER BY pg_relation_size(i.indexrelid) DESC;
```

---

## 4. Production Migration Pre-Flight Checklist

- [ ] **Non-Blocking Indexes**: Verified all new indexes use `CREATE INDEX CONCURRENTLY` (Postgres) or `ALGORITHM=INPLACE` (MySQL).
- [ ] **Foreign Key Indexes**: Confirmed every new `FOREIGN KEY` column has a corresponding B-Tree index.
- [ ] **Lock Timeout Safety**: Set `lock_timeout = '2000ms'` in the migration transaction to prevent holding the lock queue if another query is running.
- [ ] **Backfill Chunking**: Verified updates/backfills on existing rows are broken into batches of $\le 5,000$ rows with sleep intervals.
- [ ] **Connection Pool Capacity**: Confirmed max client connections do not exceed database server CPU core allocation.

# First Principles — Query Planners, Index Internals & MVCC

> Computational cost models, B-Tree and LSM internals, join algorithms, and multi-version concurrency mechanics.

---

## 1. The Cost-Based Query Optimizer (CBO)

The query optimizer evaluates alternative execution trees and chooses the plan with the lowest total estimated cost in arbitrary cost units (where $1.0$ is the cost of reading 1 sequential 8KB page from disk):

```
                                  SQL QUERY
                                      │
                                      ▼
                               [ Parser & AST ]
                                      │
                                      ▼
                            [ Query Rewriter / Rules ]
                                      │
                                      ▼
                           [ Cost-Based Optimizer ]
                  (Evaluates Join Orders, Scan Types, Stats)
                                      │
       ┌──────────────────────────────┼──────────────────────────────┐
       ▼                              ▼                              ▼
 [ Nested Loop Join ]          [ Hash Join ]                  [ Merge Join ]
(Index Lookups on Inner)     (Build In-Memory Hash Table)   (Pre-Sorted Input Streams)
```

### 1.1. Scan Types & Execution Performance

| Scan Type | Mechanism | When Optimizer Chooses It | Cost Characteristics |
| :--- | :--- | :--- | :--- |
| **Sequential Scan** (`Seq Scan`) | Reads every page in heap sequentially. | Large percentage of table rows ($\gt 15-20\%$) match predicate, or table is tiny ($\lt 100$ pages). | $O(N)$ pages read. Fast sequential I/O. |
| **Index Scan** (`Index Scan`) | Traverses B-Tree to find matching `ctid` pointers; fetches each heap page individually. | High selectivity ($\lt 5\%$ of table rows match). | $O(\log N)$ B-Tree depth $+ O(K)$ random heap page lookups. |
| **Index-Only Scan** (`Index Only Scan`) | All requested columns exist in index; fetches zero heap pages if page is all-visible. | Covering index (`INCLUDE`) satisfies query entirely, and table Visibility Map is clean. | **Fastest possible scan**. Zero random heap I/O. |
| **Bitmap Index Scan** | Scans index, builds in-memory bitmap of matching page numbers, then reads heap pages in sequential order. | Medium selectivity ($5-15\%$ of rows match). | Eliminates duplicate page fetches and converts random I/O to sequential I/O. |

---

## 2. Index Data Structures & Selection Matrix

```
┌────────────────────────────────────────────────────────────────────────┐
│ B-Tree Index (Default for = , <, <=, >, >=, BETWEEN, ORDER BY)         │
│  Root Page -> Branch Pages -> Leaf Pages (Sorted array of keys + ctid) │
└────────────────────────────────────────────────────────────────────────┘
┌────────────────────────────────────────────────────────────────────────┐
│ BRIN Index (Block Range Index for append-only time-series data)        │
│  Stores (min, max) per 128 pages. Size: 99% smaller than B-Tree!       │
└────────────────────────────────────────────────────────────────────────┘
┌────────────────────────────────────────────────────────────────────────┐
│ GIN Index (Generalized Inverted Index for JSONB, Arrays, Full-Text)    │
│  Maps each individual element/key to a list of matching row IDs.       │
└────────────────────────────────────────────────────────────────────────┘
```

| Index Type | Underlying Structure | Best Use Case | Write Overhead | Size Footprint |
| :--- | :--- | :--- | :--- | :--- |
| **B-Tree** | Balanced Multi-Way Tree | Equality, range, sorting, unique constraints | Medium | Medium ($10-30\%$ of table) |
| **Partial B-Tree** | Filtered B-Tree (`WHERE ...`) | Status queues (`WHERE status = 'pending'`), active accounts | Low (only indexes matching rows) | Tiny |
| **Covering B-Tree** | B-Tree + `INCLUDE (...)` | Hot read queries requiring Index-Only Scans | Medium | Slightly larger than standard B-Tree |
| **BRIN** | Range Summary Map | Append-only audit logs, time-series (`created_at`) | Extremely Low | Microscopic ($\approx 1\%$ of B-Tree) |
| **GIN** | Inverted Index | JSONB queries (`@>`), array containment (`&&`), full-text | High (splits elements on write) | Large |
| **HNSW (pgvector)** | Hierarchical Navigable Small World Graph | AI embeddings, vector cosine/L2 nearest neighbor | High (builds multi-layer graph) | Moderate/Large |

---

## 3. MVCC Internals & Storage Mechanics

PostgreSQL and MySQL InnoDB do not overwrite data in place during `UPDATE` operations:

```
Heap Page (8KB)
┌────────────────────────────────────────────────────────────────────────┐
│ Page Header                                                            │
├────────────────────────────────────────────────────────────────────────┤
│ Line Pointer 1 -> [ xmin: 100 | xmax: 105 | ctid: (0,2) | Old Data ]   │ (Dead Tuple)
│ Line Pointer 2 -> [ xmin: 105 | xmax: 0   | ctid: (0,2) | New Data ]   │ (Live Tuple)
├────────────────────────────────────────────────────────────────────────┤
│ Free Space                                                             │
└────────────────────────────────────────────────────────────────────────┘
```

1. **`UPDATE` as `INSERT` + `DELETE`**: An update marks the old row version with `xmax = current_xid` and inserts a new tuple with `xmin = current_xid`.
2. **Vacuuming**: `VACUUM` reclaims space occupied by dead tuples once all active transactions are younger than the dead tuple's `xmax`.
3. **Index Bloat Prevention**: HOT (Heap-Only Tuples) optimization allows updates to avoid updating B-Tree index pages if the new tuple fits on the same 8KB page and no indexed columns were modified.

---

## 4. Transaction Isolation Levels & Anomaly Matrix

| Isolation Level | Dirty Reads | Non-Repeatable Reads | Phantom Reads | Serialization Anomalies | Default In |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Read Committed** | Prevented | Allowed | Allowed | Allowed | PostgreSQL, Oracle, SQL Server |
| **Repeatable Read** | Prevented | Prevented | Prevented (in Postgres) | Allowed (Write Skew) | MySQL InnoDB |
| **Serializable** | Prevented | Prevented | Prevented | Prevented | Strict Financial Ledgers |

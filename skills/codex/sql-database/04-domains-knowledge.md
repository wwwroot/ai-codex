# Domain Knowledge & Systems Engineering — High-Scale Data Architecture

> Architecture patterns for declarative partitioning, pgvector AI search, PgBouncer pooling, and CDC replication.

---

## 1. Declarative Table Partitioning (PostgreSQL 16+)

Partition billion-row tables into manageable physical chunks to enable **partition pruning** and instant data retention purging (`DROP TABLE partition_name` instead of expensive `DELETE`):

```sql
-- 1. Partitioned Parent Table
CREATE TABLE audit_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    action_name TEXT NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL
) PARTITION BY RANGE (created_at);

-- 2. Monthly Partitions
CREATE TABLE audit_logs_2026_01 PARTITION OF audit_logs
    FOR VALUES FROM ('2026-01-01 00:00:00+00') TO ('2026-02-01 00:00:00+00');

CREATE TABLE audit_logs_2026_02 PARTITION OF audit_logs
    FOR VALUES FROM ('2026-02-01 00:00:00+00') TO ('2026-03-01 00:00:00+00');

-- 3. Partition-Specific BRIN Index for Append-Only Time Series
CREATE INDEX idx_audit_logs_2026_01_created_at ON audit_logs_2026_01 USING BRIN (created_at);
CREATE INDEX idx_audit_logs_2026_02_created_at ON audit_logs_2026_02 USING BRIN (created_at);
```

---

## 2. Vector Search & Embeddings with `pgvector`

Use Hierarchical Navigable Small World (`HNSW`) indexing for sub-millisecond approximate nearest neighbor (ANN) vector search:

```sql
-- 1. Enable Extension
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Document Embeddings Table (1536-dim OpenAI embedding)
CREATE TABLE document_embeddings (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    chunk_index INT NOT NULL,
    content_text TEXT NOT NULL,
    embedding vector(1536) NOT NULL
);

-- 3. HNSW Cosine Distance Index (m = 16, ef_construction = 64)
CREATE INDEX idx_document_embeddings_hnsw
ON document_embeddings USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- 4. Fast Vector Cosine Similarity Query
-- <=> is cosine distance (0.0 = identical, 2.0 = opposite)
SELECT
    document_id,
    chunk_index,
    content_text,
    1 - (embedding <=> :query_embedding) AS cosine_similarity
FROM document_embeddings
ORDER BY embedding <=> :query_embedding
LIMIT 10;
```

---

## 3. Connection Pooling Architecture with PgBouncer

Direct connections to PostgreSQL consume $\approx 5-10$ MB of server RAM per backend process. PgBouncer transaction pooling enables tens of thousands of client connections to share a pool of 50-100 real database connections:

```ini
; pgbouncer.ini
[databases]
app_production = host=127.0.0.1 port=5432 dbname=app_production auth_user=postgres

[pgbouncer]
listen_addr = 0.0.0.0
listen_port = 6432
auth_type = scram-sha-256
auth_file = /etc/pgbouncer/userlist.txt

; TRANSACTION POOLING MODE: Returns connection to pool as soon as transaction completes
pool_mode = transaction
max_client_conn = 10000
default_pool_size = 50
min_pool_size = 10
reserve_pool_size = 5
max_db_connections = 100

; Timeout Safeguards
query_timeout = 10
idle_transaction_timeout = 30
server_idle_timeout = 600
```

---

## 4. Change Data Capture (CDC) via Logical Replication

Stream realtime database changes to Kafka, ClickHouse, or ElasticSearch without dual writes:

```sql
-- 1. Configure Publication for specific tables in PostgreSQL
CREATE PUBLICATION cdc_orders_publication FOR TABLE orders, order_items;

-- 2. Consumer reads from logical replication slot using pgoutput or wal2json
SELECT * FROM pg_create_logical_replication_slot('debezium_orders_slot', 'pgoutput');
```

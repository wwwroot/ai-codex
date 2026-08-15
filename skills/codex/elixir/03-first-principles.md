# First Principles — BEAM Virtual Machine & Distributed Systems

> Foundational runtime mechanics, scheduling algorithms, actor model mathematics, and trade-off matrices on the BEAM.

---

## 1. The BEAM Execution Model

The Erlang Run-Time System (ERTS) is an engineering marvel designed for high-availability, low-latency, soft-realtime concurrent computation:

```
  OS Core 0          OS Core 1          OS Core 2          OS Core 3
┌──────────────┐   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│  Scheduler 0 │   │  Scheduler 1 │   │  Scheduler 2 │   │  Scheduler 3 │
├──────────────┤   ├──────────────┤   ├──────────────┤   ├──────────────┤
│  Run Queue 0 │   │  Run Queue 1 │   │  Run Queue 2 │   │  Run Queue 3 │
└──────┬───────┘   └──────┬───────┘   └──────┬───────┘   └──────┬───────┘
       │                  │                  │                  │
       └──────────────────┴────────Work-Stealing────────────────┘
```

### 1.1. Preemptive Reduction-Based Scheduling
- **Reductions**: A reduction is roughly equal to a function call or loop iteration.
- **Preemption Threshold**: Each process is allocated an execution slice of **4,000 reductions**.
- When a process exhausts its 4,000 reductions, the scheduler context-switches to the next process in the local run queue in **nanoseconds**.
- **No Starvation**: A single runaway loop or infinite recursion process cannot starve other processes of CPU time.

### 1.2. Per-Process Generational Garbage Collection
- Unlike JVM, Go, or V8, there is **NO global stop-the-world GC**.
- Every BEAM process has its own isolated heap ($309$ words baseline $\approx 2.5$ KB).
- Garbage collection runs independently on each process heap.
- When a process completes its task and exits, its entire heap is reclaimed **instantly** without running garbage collection.

---

## 2. Process Communication & Memory Topologies

```
┌─────────────────────────┐             ┌─────────────────────────┐
│       Process A         │             │       Process B         │
│ ┌─────────────────────┐ │  Send Msg   │ ┌─────────────────────┐ │
│ │ Private Heap        │ │ ──────────► │ │ Mailbox (Queue)     │ │
│ │ (Small Data Copied) │ │             │ │                     │ │
│ └─────────────────────┘ │             │ └──────────┬──────────┘ │
└────────────┬────────────┘             └────────────┼────────────┘
             │                                       │
             ▼                                       ▼
  ┌─────────────────────────────────────────────────────────────┐
  │ Shared Off-Heap Binary Allocator (> 64 bytes) (Ref-Counted) │
  └─────────────────────────────────────────────────────────────┘
```

1. **Small Terms**: Copied directly from Process A's private heap into Process B's mailbox.
2. **Binaries $> 64$ Bytes**: Allocated on a shared refc binary heap; only a 24-byte pointer (`ProcBin`) is copied to the mailbox, achieving $O(1)$ zero-copy message passing.

---

## 3. Supervision Tree Dynamics & Fault Boundaries

Supervision trees turn chaotic runtime failures into predictable recovery lifecycles:

```
                      [ Root Supervisor ] (:one_for_all)
                               │
            ┌──────────────────┴──────────────────┐
            ▼                                     ▼
 [ Core Storage Worker ]              [ Dynamic Session Supervisor ]
 (Permanent Worker)                   (:one_for_one)
                                                  │
                                  ┌───────────────┼───────────────┐
                                  ▼               ▼               ▼
                            [ Session A ]   [ Session B ]   [ Session C ]
                            (Transient)     (Transient)     (Transient)
```

### 3.1. Restart Strategies:
- **`:one_for_one`**: If a child crashes, only that child is restarted. Use when processes are independent.
- **`:one_for_all`**: If any child crashes, all children under the supervisor are terminated and restarted. Use when children have tight shared state dependencies.
- **`:rest_for_one`**: If a child crashes, any child started *after* it in the supervision tree is terminated and restarted. Use for linear dependency chains (e.g., Cache depends on DB connection).

### 3.2. Worker Restart Semantics:
- **`:permanent`**: Always restarted, even on normal exit (`:normal`). Use for long-running system servers.
- **`:transient`**: Restarted only if it terminates abnormally (`{:error, reason}`). Exits normally without restart. Use for finite background jobs.
- **`:temporary`**: Never restarted under any circumstances. Use for short-lived, expendable tasks.

---

## 4. State Storage Trade-Off Matrix

| Mechanism | Mutability | Scope | Concurrency | Read Latency | Write Latency | Best Use Case |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **GenServer State** | Immutable (Loop state) | Process | Single-threaded queue | $O(1)$ sequential | $O(1)$ sequential | Coordinated state with sequential guarantees |
| **ETS Table** | Mutable In-Memory | Node | Multi-reader / Multi-writer | Sub-microsecond | Low | Read-heavy caching, session tables, rate limits |
| **Persistent Term** | Immutable Term | Global VM | Lock-free concurrent | Zero-overhead memory deref | Expensive (recompiles global code) | Configuration, feature flags, static routing |
| **Mnesia Database** | ACID Relational/Key-Value | Distributed Cluster | Transactional locks | Microsecond | Low/Medium | Distributed session state, cluster metadata |
| **Ecto / PostgreSQL** | ACID Relational | Persistent Disk | Connection Pool | Millisecond | Millisecond | Permanent application business records |

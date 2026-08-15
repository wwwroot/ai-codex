# 03 — First Principles & CLR Mechanics (C# / .NET Edition)

> Reference this file when architecting enterprise systems, tuning garbage collection, or designing low-latency .NET runtimes.

---

## 1. CLR Execution Model & Garbage Collection Mechanics

The .NET Common Language Runtime (CLR) manages memory through a generational, tracing garbage collector. Understanding GC generations is mandatory for high-throughput engineering.

```
       ┌─────────────────────────────────────────────────────────────┐
       │                        HEAP SEGMENTS                        │
       ├──────────────┬──────────────┬──────────────┬────────────────┤
       │   GEN 0      │   GEN 1      │   GEN 2      │   LOH / POH    │
       │ (Ephemeral)  │ (Buffer/Mid) │ (Long-lived) │ (> 85KB / Pin) │
       └──────────────┴──────────────┴──────────────┴────────────────┘
         ▲              ▲              ▲
         │ (Survives)   │ (Survives)   │
         └──────────────┴──────────────┘
```

### Key GC Invariants:
1. **Gen 0 (Ephemeral)**: Allocations are ultra-fast (bump-pointer). Collections take microseconds. Objects that die young (DTOs, temporary strings) have near-zero cost.
2. **Gen 1 (Buffer)**: Acts as a buffer between short-lived and long-lived data.
3. **Gen 2 (Tenured)**: Full collections (Gen 2 + LOH) can cause noticeable CPU pauses. Never let short-lived objects leak into Gen 2.
4. **Large Object Heap (LOH)**: Objects $\ge 85,000$ bytes are allocated directly on LOH and are not compacted by default (risk of memory fragmentation). Use `ArrayPool<T>` to reuse large buffers.
5. **Pinned Object Heap (POH)**: Dedicated heap for pinned buffers to avoid memory fragmentation during native interop.

---

## 2. Memory Layout, Value Types & Cache Locality

Memory access speed is dominated by CPU cache hierarchies (L1/L2/L3). Pointer chasing across heap objects degrades performance.

```
STRUCT (Contiguous Memory, 1 Cache Line Fetch)
┌───────────┬───────────┬───────────┬───────────┐
│ Vector3   │ Vector3   │ Vector3   │ Vector3   │
└───────────┴───────────┴───────────┴───────────┘

CLASS REFERENCES (Pointer Chasing across Random Heap Addresses)
┌───────────┐     ┌───────────┐     ┌───────────┐
│ Pointer ──┼────►│ Heap Obj  │     │ Pointer ──┼────► Heap Obj
└───────────┘     └───────────┘     └───────────┘
```

### Struct Layout & Padding Rules:
```csharp
using System.Runtime.InteropServices;

// Explicit layout to match native memory structures and optimize cache line utilization
[StructLayout(LayoutKind.Sequential, Pack = 4)]
public readonly record struct ParticleData(
    float PositionX, float PositionY, float PositionZ, // 12 bytes
    float VelocityX, float VelocityY, float VelocityZ, // 12 bytes
    uint ColorRGBA,                                   // 4 bytes
    float Lifetime                                    // 4 bytes = Total 32 bytes (Half L1 Cache Line)
);
```

---

## 3. The Async/Await State Machine

When you mark a method `async`, the C# compiler generates an internal `IAsyncStateMachine` struct:

```
[Async Method Call] ──► [Executes Synchronously until first incomplete Await]
                                │
                                ▼
                        [Suspends Execution]
                        [Registers Callback with Awaiter]
                        [Yields Worker Thread back to ThreadPool]
                                │ (I/O Completes)
                                ▼
                        [ThreadPool Resumes State Machine at Continuation]
```

### Asynchronous Rules:
- **Never Block**: Calling `.Result` or `.Wait()` locks the calling thread while waiting for a continuation that may need that same thread, resulting in **thread pool deadlock** or thread starvation.
- **`ValueTask` Optimization**: If a method completes synchronously 95% of the time (e.g., in-memory cache hit), return `ValueTask<T>` to avoid allocating a `Task` object on the heap.
- **`ConfigureAwait(false)` in Libraries**: Library code must use `.ConfigureAwait(false)` to prevent capturing the caller's synchronization context.

---

## 4. Domain-Driven Design (DDD) & Clean Architecture

Structure enterprise backends to isolate business invariants from databases and transport frameworks:

```
┌───────────────────────────────────────────────────────────┐
│ 1. DOMAIN (Entities, Value Objects, Domain Events)        │
│    Zero dependencies on frameworks, databases, or HTTP.   │
├───────────────────────────────────────────────────────────┤
│ 2. APPLICATION (Use Cases, Commands, Queries, Handlers)  │
│    Orchestrates domain models. MediatR / Wolverine.       │
├───────────────────────────────────────────────────────────┤
│ 3. INFRASTRUCTURE (EF Core, Redis, Kafka, External APIs)  │
│    Implements interfaces defined in Application/Domain.   │
├───────────────────────────────────────────────────────────┤
│ 4. PRESENTATION (ASP.NET Minimal APIs, Blazor, gRPC)      │
│    Handles HTTP routing, serialization, auth filters.     │
└───────────────────────────────────────────────────────────┘
```

---

## 5. Architectural Trade-Off Matrix

| Architectural Dimension | Option A | Option B | Decision Driver |
| :--- | :--- | :--- | :--- |
| **Data Access** | **EF Core 9** (Rich ORM, change tracking, migrations) | **Dapper** (Lightweight SQL mapper, zero overhead) | Use EF Core for domain aggregates and transactional writes; use Dapper or EF Core Compiled Queries for high-throughput reads. |
| **API Endpoints** | **ASP.NET Minimal APIs** (High throughput, Native AOT ready) | **Controllers** (Rich filter pipelines, convention-based) | Minimal APIs for cloud microservices and high performance; Controllers for legacy or sprawling CRUD suites. |
| **Messaging** | **In-Memory Channel&lt;T&gt;** (Ultra-fast, single node) | **MassTransit / Kafka** (Distributed, persistent, outbox) | `Channel<T>` for local background queueing; MassTransit for cross-service eventual consistency and saga orchestration. |
| **Game Architecture** | **Unity DOTS / ECS** (Data-oriented, multithreaded Jobs) | **MonoBehaviour / GameObjects** (Object-oriented) | DOTS for thousands of simulating entities/particles; GameObjects for UI and high-level gameplay scripts. |
| **Serialization** | **System.Text.Json Source Gen** (Zero reflection, Native AOT) | **Newtonsoft.Json** (Feature-rich, reflection-heavy) | Always System.Text.Json with source generation for modern .NET. |

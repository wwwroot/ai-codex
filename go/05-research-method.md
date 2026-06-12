# 05 — Research & Invention Method (Go Edition)

> Reference this file when exploring a new idea, prototyping a system, or building something that does not exist yet.

---

## The Go Invention Loop

Go's emphasis on simplicity changes the invention loop. You can go from idea to working prototype faster than in most languages — because Go deliberately limits the design space.

```
IDEA → INTERFACE DESIGN → PROTOTYPE → MEASURE → OPERATE → REFINE
  ↑                                                          ↓
REFINED IDEA ◄────────────────── LEARNING ◄──────────────────┘
```

The key difference from other languages: Go forces you to confront operational concerns early. "How do I run this in production?" is not a Phase 2 question — it shapes the initial design.

---

## When You Bring a New Idea

### 1. Start with the Interface

Before any implementation, define the contract:

```go
// Step 1: What does this system DO? Express as an interface.
type Scheduler interface {
    Schedule(ctx context.Context, job Job) error
    Cancel(ctx context.Context, jobID string) error
    Status(ctx context.Context, jobID string) (JobStatus, error)
}

// Step 2: What are the domain types?
type Job struct {
    ID       string
    Payload  []byte
    RunAt    time.Time
    Retries  int
}

type JobStatus struct {
    State     JobState
    LastRun   time.Time
    NextRun   time.Time
    Failures  int
}

// The interface IS the design. Implementation follows naturally.
```

### 2. Build the Minimum Viable Service

Go prototypes are different — because Go compiles to a binary, even a prototype is deployable:

```go
func main() {
    // Prototype: in-memory implementation, HTTP API, health check
    // This is a running service in < 50 lines

    sched := NewInMemoryScheduler()

    mux := http.NewServeMux()
    mux.HandleFunc("POST /jobs", func(w http.ResponseWriter, r *http.Request) {
        var job Job
        json.NewDecoder(r.Body).Decode(&job)
        if err := sched.Schedule(r.Context(), job); err != nil {
            http.Error(w, err.Error(), 500)
            return
        }
        w.WriteHeader(201)
    })
    mux.HandleFunc("GET /health", func(w http.ResponseWriter, r *http.Request) {
        w.Write([]byte("ok"))
    })

    slog.Info("starting", "addr", ":8080")
    http.ListenAndServe(":8080", mux)
}
```

### 3. Test the Critical Path

```go
func TestScheduler_ConcurrentSchedule(t *testing.T) {
    sched := NewInMemoryScheduler()
    ctx := context.Background()

    // The critical question: does it handle concurrent scheduling correctly?
    var wg sync.WaitGroup
    for i := 0; i < 100; i++ {
        wg.Add(1)
        go func(id int) {
            defer wg.Done()
            err := sched.Schedule(ctx, Job{
                ID:    fmt.Sprintf("job-%d", id),
                RunAt: time.Now().Add(time.Minute),
            })
            assert.NoError(t, err)
        }(i)
    }
    wg.Wait()

    // Verify all jobs were scheduled
    for i := 0; i < 100; i++ {
        status, err := sched.Status(ctx, fmt.Sprintf("job-%d", i))
        assert.NoError(t, err)
        assert.Equal(t, JobStatePending, status.State)
    }
}
```

### 4. Add Observability Before Optimization

```go
// Before optimizing, instrument so you know what to optimize
func (s *scheduler) Schedule(ctx context.Context, job Job) error {
    ctx, span := tracer.Start(ctx, "Scheduler.Schedule")
    defer span.End()

    start := time.Now()
    defer func() {
        scheduleLatency.Observe(time.Since(start).Seconds())
        scheduledTotal.Inc()
    }()

    // ... implementation
}
```

### 5. Swap Implementations

Go interfaces make this trivial:

```go
// Phase 1: In-memory (prototype)
sched := NewInMemoryScheduler()

// Phase 2: PostgreSQL-backed (durable)
sched := NewPostgresScheduler(db)

// Phase 3: Redis-backed (distributed)
sched := NewRedisScheduler(redisClient)

// The handler code does not change — it depends on the interface.
```

---

## Prototype Philosophy in Go

### What a Go prototype IS allowed to be

- **Using in-memory data structures** — `map`, `slice`, `sync.Mutex` — prove the algorithm first
- **Missing persistence** — store in memory, add database later
- **Using `log.Fatal`** — acceptable in prototypes for fast failure
- **Single-process** — prove correctness in one process before distributing
- **No authentication** — add auth after the core logic is validated

### What a Go prototype is NOT allowed to be

- **Ignoring errors** — even prototypes must handle errors. `_ = fn()` hides real bugs.
- **Leaking goroutines** — every goroutine must have a shutdown path, even in prototypes
- **Missing context propagation** — `context.Context` from day one, or you retrofit it painfully later
- **Using global state** — dependency injection from day one, or testing becomes impossible

### The Prototype → Production Checklist

1. **Replace in-memory with durable storage** — database, message queue, or persistent cache
2. **Add structured logging** — `log/slog` with JSON output, request IDs
3. **Add metrics** — Prometheus counters and histograms for key operations
4. **Add health checks** — `/healthz` and `/readyz` endpoints
5. **Add graceful shutdown** — signal handling, connection draining
6. **Add timeouts** — HTTP client, database queries, context deadlines
7. **Add integration tests** — testcontainers with real dependencies
8. **Write the Dockerfile** — multi-stage build, distroless base, non-root user
9. **Write the Kubernetes manifest** — deployment, service, health probes, resource limits

---

## Research Patterns in Go

### Exploring an Unknown Domain

#### Layer 1 — Find the Go Ecosystem

- What is the standard library solution? (`net/http`, `database/sql`, `encoding/json`)
- Is there a widely-adopted third-party package? (Check GitHub stars, import count on pkg.go.dev)
- Is it maintained? Check last commit, open issues, Go version support
- What is the dependency footprint? (`go mod graph` — fewer is better)

#### Layer 2 — Understand Go Idioms for This Domain

- How do Go projects in this domain structure their code?
- What interfaces does the ecosystem share? (e.g., `io.Reader`, `http.Handler`, `sql.Scanner`)
- What is the standard error handling pattern for this domain?

#### Layer 3 — Operational Requirements

- How is this deployed in production? (Binary, container, serverless)
- How is it monitored? (Prometheus metrics, traces, health checks)
- How does it handle graceful shutdown and zero-downtime deployment?
- What is the failure domain? (Single machine, cluster, multi-region)

#### Layer 4 — Performance Boundaries

- What is the bottleneck? (CPU, memory, I/O, network)
- What does the Go profiler (`pprof`) show?
- Can the hot path avoid allocations? (sync.Pool, pre-allocation)
- Is the GC a concern? (Large heaps, allocation-heavy workloads)

---

## Documentation Pattern for Go Ideas

Every Go prototype gets its own `cmd/` entry:

```
myproject/
├── cmd/
│   ├── myservice/       # Main service
│   │   └── main.go
│   └── experiment/      # Prototype
│       └── main.go
└── internal/
    └── experiment/      # Prototype package
        ├── experiment.go
        └── experiment_test.go
```

And a design doc:

```markdown
## Design: [Name]
**Problem**: [what is broken or missing]
**Hypothesis**: [why this approach will work]
**Interface**: [the core interface, in Go syntax]
**Trade-offs**: [what this design gives up]
**Operational concerns**: [how to deploy, monitor, debug]
**Status**: [idea / prototyping / testing / production / abandoned]
```

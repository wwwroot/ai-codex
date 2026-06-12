# 03 — First Principles Thinking (Go Edition)

> Reference this file when designing systems, solving hard problems, or making architectural decisions in Go.

---

## The Core Question

Before writing any Go code, ask:

> **"What is the simplest design that correctly handles all failure modes?"**

Not the most extensible. Not the most elegant. The simplest design that works correctly, including when things go wrong.

---

## Simplicity as Engineering Discipline

Go's design philosophy is radical simplicity. This is not a limitation — it is the most powerful design choice in the language.

### The Simplicity Test

Before adding any abstraction, ask:

1. **Does the current code repeat a pattern more than 3 times?** — If no, do not abstract yet.
2. **Can a new engineer understand this in under 30 seconds?** — If yes, leave it concrete.
3. **Does the abstraction make the code shorter AND clearer?** — If it only makes it shorter, keep the verbose version.

### Why Simplicity Matters in Go

```go
// OVER-ENGINEERED — factory pattern ported from Java
type UserServiceFactory struct {
    repoFactory RepositoryFactory
    loggerFactory LoggerFactory
}
func (f *UserServiceFactory) Create() *UserService { ... }

// SIMPLE GO — just a constructor function
func NewUserService(repo UserRepo, logger *slog.Logger) *UserService {
    return &UserService{repo: repo, logger: logger}
}

// The second version is shorter, clearer, and has zero indirection.
// A new engineer understands it instantly.
```

---

## Interface Design from First Principles

### The Go Interface Philosophy

Go interfaces are *implicitly satisfied*. This is not a convenience — it is a design principle.

```go
// Define interfaces WHERE THEY ARE USED, not where they are implemented
// This is the opposite of Java/C#

// In package handler:
type UserFinder interface {
    FindByID(ctx context.Context, id string) (*domain.User, error)
}

// Any struct with a FindByID method satisfies this.
// The implementation does not know or care about this interface.
```

### Interface Size Rules

| Interface Size | Verdict | Example |
|---------------|---------|---------|
| 1 method | ✅ Ideal | `io.Reader`, `io.Writer`, `fmt.Stringer` |
| 2–3 methods | ✅ Good | `io.ReadWriter`, `http.Handler` + middleware |
| 4–5 methods | ⚠️ Review | Can this be split into smaller interfaces? |
| 6+ methods | ❌ Too large | Almost always a sign of wrong abstraction |

### Composition Over Embedding

```go
// GOOD — compose small interfaces
type ReadCloser interface {
    io.Reader
    io.Closer
}

// GOOD — accept the smallest interface your function needs
func Process(r io.Reader) error { ... }
// This function works with files, network connections, strings, and buffers
// because it asks for the minimum it needs.
```

---

## Error Architecture

### Errors as First-Class Design

In Go, errors are not an afterthought — they are half of your API design:

```go
// Your function signature tells callers two things:
// 1. What it returns on success
// 2. What it returns on failure
func Transfer(ctx context.Context, from, to AccountID, amount Money) (Receipt, error)
```

### Error Wrapping Strategy

```
Layer 1 (Infrastructure):  raw database/network error
    ↓  wrapped with technical context
Layer 2 (Repository):      "query user by ID: connection refused"
    ↓  wrapped with business context
Layer 3 (Service):          "get user profile: query user by ID: connection refused"
    ↓  mapped to user-facing error
Layer 4 (Handler):          HTTP 503 "Service temporarily unavailable"
```

Each layer adds context. The final layer maps to a user-facing response.

### Sentinel vs. Custom Error Types

```go
// Sentinel errors — for simple, known conditions
var ErrNotFound = errors.New("not found")

// Custom error types — when callers need structured information
type ValidationError struct {
    Field   string
    Message string
}
func (e *ValidationError) Error() string {
    return fmt.Sprintf("validation: %s: %s", e.Field, e.Message)
}

// Use errors.Is for sentinels, errors.As for typed errors
if errors.Is(err, ErrNotFound) { ... }

var valErr *ValidationError
if errors.As(err, &valErr) {
    // access valErr.Field, valErr.Message
}
```

---

## Concurrency from First Principles

### When to Use Goroutines

| Scenario | Use Goroutines? | Why |
|----------|----------------|-----|
| I/O-bound work (HTTP calls, DB queries) | ✅ Yes | goroutines yield during I/O |
| CPU-bound parallelism | ✅ Yes, with GOMAXPROCS workers | but measure first |
| Sequential processing | ❌ No | adds complexity with no benefit |
| "It might be faster" | ❌ No | measure first, then decide |

### Channel Axioms

1. **A send to a nil channel blocks forever** — use this intentionally in `select` to disable a case
2. **A receive from a nil channel blocks forever** — same principle
3. **A send to a closed channel panics** — only the sender should close
4. **A receive from a closed channel returns zero value immediately** — use this for signaling
5. **Close is a broadcast** — all receivers wake up

### The Context Contract

```go
// Every long-running function MUST accept context as first parameter
func (s *Service) Process(ctx context.Context, req Request) (Response, error) {
    // Check for cancellation before expensive work
    select {
    case <-ctx.Done():
        return Response{}, ctx.Err()
    default:
    }

    // Pass context down the call chain — always
    result, err := s.repo.Query(ctx, req.ID)
    ...
}
```

---

## Designing for Operations

### The Operability Checklist

Every production Go service must have:

- [ ] **Health check endpoint** — `/healthz` for liveness, `/readyz` for readiness
- [ ] **Structured logging** — `log/slog` with JSON output
- [ ] **Metrics** — request count, latency histogram, error rate (Prometheus)
- [ ] **Tracing** — OpenTelemetry spans for cross-service requests
- [ ] **Graceful shutdown** — drain connections, finish in-flight work, then exit
- [ ] **Configuration** — environment variables, not config files (12-factor)
- [ ] **Timeouts everywhere** — HTTP client, database queries, context deadlines

### Graceful Shutdown Pattern

```go
func main() {
    ctx, cancel := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
    defer cancel()

    srv := &http.Server{Addr: ":8080", Handler: router}

    go func() {
        if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
            slog.Error("server error", "error", err)
        }
    }()

    <-ctx.Done()
    slog.Info("shutting down")

    shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 10*time.Second)
    defer shutdownCancel()
    srv.Shutdown(shutdownCtx)
}
```

---

## Performance Thinking in Go

### Know the Costs

| Operation | Approximate Cost | Implication |
|-----------|-----------------|-------------|
| Goroutine creation | ~2 KB stack | Cheap — thousands are fine |
| Channel send/receive | ~50 ns | Fast, but not free in hot loops |
| Mutex lock/unlock | ~20 ns uncontended | Use when simpler than channels |
| Heap allocation | ~25 ns | Escape analysis matters — profile |
| Map lookup | ~100 ns | Hash function + possible resize |
| Interface method call | ~2 ns overhead | Negligible — do not avoid for perf |

### Optimization Sequence

1. **Correct first** — make it work with clear, simple code
2. **Benchmark** — `go test -bench=. -benchmem` to measure
3. **Profile** — `pprof` CPU and memory profiles to find the real bottleneck
4. **Optimize the bottleneck** — only the measured bottleneck, not guesses
5. **Benchmark again** — verify the optimization actually helped

# 02 — Languages & Code Standards (Go Edition)

> Reference this file when writing, reviewing, or refactoring Go code.

---

## Primary Language: Go

Go is the default implementation language. It is chosen because:
- It compiles to a single static binary — no runtime dependencies, trivial deployment
- It has built-in concurrency primitives — goroutines and channels are first-class
- It has a minimal, intentional design — fewer language features means fewer ways to write confusing code
- It is the standard for cloud infrastructure — Kubernetes, Docker, Terraform, and Prometheus are all Go

### Version Target

**Go 1.22+ minimum.** Use modern features actively:

- Generics (`[T any]`) — where they reduce duplication without sacrificing clarity
- `log/slog` — structured logging (stdlib, replaces third-party loggers)
- `errors.Join` — combining multiple errors
- `slices` and `maps` packages — generic collection utilities
- Range-over-func — iterator patterns
- `net/http` enhanced routing — method-aware, path parameters in stdlib
- `go/types` and `go/analysis` — for writing custom linters and code analysis

### Non-Negotiable Code Standards

```
ALWAYS                                       NEVER
──────────────────────────────────────────   ────────────────────────────────────────
Handle every error explicitly                _ = fn() — ignoring errors
Use context.Context for cancellation         Background context in request handlers
defer for resource cleanup                   Manual close without defer
Table-driven tests                           Single-case test functions
Small interfaces (1–3 methods)               Large "god" interfaces
Accept interfaces, return structs            Return interfaces from constructors
Explicit struct initialization               Relying on zero-value semantics silently
golangci-lint on every commit                Ignoring linter warnings
Package names: short, lowercase, no plural   Stutter: package user → user.User
Error wrapping with %w for context           Bare errors without context
```

### Error Handling Discipline

```go
// Define domain-specific error types
var (
    ErrNotFound      = errors.New("not found")
    ErrAlreadyExists = errors.New("already exists")
    ErrUnauthorized  = errors.New("unauthorized")
)

// Wrap errors with context at every call site
func (s *Service) GetUser(ctx context.Context, id string) (*User, error) {
    user, err := s.repo.FindByID(ctx, id)
    if err != nil {
        if errors.Is(err, ErrNotFound) {
            return nil, fmt.Errorf("user %s: %w", id, ErrNotFound)
        }
        return nil, fmt.Errorf("get user %s: %w", id, err)
    }
    return user, nil
}

// Callers use errors.Is for sentinel checks
if errors.Is(err, ErrNotFound) {
    // handle not found
}
```

### Project Layout

```
myservice/
├── cmd/
│   └── myservice/
│       └── main.go              # Entrypoint — wiring only, no business logic
├── internal/
│   ├── domain/                  # Business types and interfaces
│   │   ├── user.go
│   │   └── order.go
│   ├── service/                 # Business logic
│   │   └── user_service.go
│   ├── repository/              # Data access implementations
│   │   └── postgres_user.go
│   └── handler/                 # HTTP/gRPC handlers
│       └── user_handler.go
├── pkg/                         # Public reusable packages (rare)
├── migrations/                  # SQL migrations
├── deployments/                 # Kubernetes manifests, Dockerfile
├── go.mod
├── go.sum
└── Makefile
```

Rules:
- `cmd/` — one package per binary, main.go does wiring only
- `internal/` — private packages, not importable by other modules
- `pkg/` — only if genuinely reusable outside this project (rare)
- Business logic never imports HTTP/gRPC — handlers import business logic

---

## Concurrency Patterns

### Goroutine Lifecycle Management

```go
// ALWAYS know how your goroutine stops
func (w *Worker) Run(ctx context.Context) error {
    for {
        select {
        case <-ctx.Done():
            return ctx.Err()
        case job := <-w.jobs:
            if err := w.process(ctx, job); err != nil {
                slog.Error("process failed", "job_id", job.ID, "error", err)
            }
        }
    }
}
```

### Common Patterns

| Pattern | Use When |
|---------|----------|
| `sync.WaitGroup` | Fan-out work, wait for all to complete |
| `errgroup.Group` | Fan-out with error propagation and context cancellation |
| `chan T` | Producer/consumer communication |
| `select` | Multiplexing multiple channels or adding timeouts |
| `sync.Mutex` | Protecting shared state (prefer channels when possible) |
| `sync.Once` | Lazy initialization, guaranteed exactly once |
| `semaphore` (chan struct{}) | Rate limiting concurrent goroutines |

### Anti-Patterns

```go
// BAD — goroutine leak: no way to stop this
go func() {
    for {
        doWork()
        time.Sleep(time.Second)
    }
}()

// GOOD — context-controlled lifecycle
go func() {
    ticker := time.NewTicker(time.Second)
    defer ticker.Stop()
    for {
        select {
        case <-ctx.Done():
            return
        case <-ticker.C:
            doWork()
        }
    }
}()
```

---

## Secondary Languages

| Language | Primary Use | Key Discipline |
|----------|------------|----------------|
| **SQL** | Database queries | Parameterized queries always, migrations versioned |
| **Bash** | CI/CD scripts, Dockerfiles | `set -euo pipefail`, shellcheck |
| **HCL** | Terraform infrastructure | Modules, state management, plan before apply |
| **YAML** | Kubernetes manifests, configs | Schema validation, no duplication (Kustomize/Helm) |
| **Protocol Buffers** | gRPC service definitions | Backward-compatible evolution, `buf lint` |
| **Dockerfile** | Container images | Multi-stage builds, minimal final image, non-root user |

---

## Tooling Standards

```makefile
# Makefile — standard commands for every Go project
.PHONY: build test lint run

build:
	go build -o bin/myservice ./cmd/myservice

test:
	go test -race -cover ./...

lint:
	golangci-lint run ./...

run:
	go run ./cmd/myservice

migrate:
	goose -dir migrations postgres "$(DATABASE_URL)" up
```

### Required Tools

- **`golangci-lint`** — meta-linter with 50+ linters (replaces individual tools)
- **`go vet`** — built-in static analysis (always passes before merge)
- **`go test -race`** — data race detection on every CI run
- **`go test -cover`** — coverage tracking (aim for >80% on business logic)
- **`go mod tidy`** — clean dependency management
- **`gofumpt`** — stricter formatting than `gofmt`
- **`buf`** — protobuf linting and breaking change detection (if using gRPC)

# 04 — Deep Domain Knowledge (Go Edition)

> Reference knowledge across key technical domains. Applied contextually — not forced where irrelevant.

---

## Cloud-Native Services

### HTTP Services (stdlib net/http)

```go
mux := http.NewServeMux()

// Go 1.22+ method-aware routing
mux.HandleFunc("GET /users/{id}", getUser)
mux.HandleFunc("POST /users", createUser)
mux.HandleFunc("GET /health", healthCheck)

srv := &http.Server{
    Addr:         ":8080",
    Handler:      mux,
    ReadTimeout:  5 * time.Second,
    WriteTimeout: 10 * time.Second,
    IdleTimeout:  120 * time.Second,
}
```

### Middleware Pattern

```go
func LoggingMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        start := time.Now()
        next.ServeHTTP(w, r)
        slog.Info("request",
            "method", r.Method,
            "path", r.URL.Path,
            "duration", time.Since(start),
        )
    })
}

// Chain middleware
handler := LoggingMiddleware(AuthMiddleware(mux))
```

### gRPC Services

```go
// Define in .proto
service UserService {
    rpc GetUser(GetUserRequest) returns (GetUserResponse);
    rpc ListUsers(ListUsersRequest) returns (stream User);
}

// Implement in Go
type userServer struct {
    pb.UnimplementedUserServiceServer
    repo UserRepository
}

func (s *userServer) GetUser(ctx context.Context, req *pb.GetUserRequest) (*pb.GetUserResponse, error) {
    user, err := s.repo.FindByID(ctx, req.GetId())
    if err != nil {
        if errors.Is(err, ErrNotFound) {
            return nil, status.Error(codes.NotFound, "user not found")
        }
        return nil, status.Error(codes.Internal, "internal error")
    }
    return toProto(user), nil
}
```

---

## Kubernetes & Container Orchestration

### Kubernetes Operators (controller-runtime)

```go
func (r *MyAppReconciler) Reconcile(ctx context.Context, req ctrl.Request) (ctrl.Result, error) {
    var app myv1.MyApp
    if err := r.Get(ctx, req.NamespacedName, &app); err != nil {
        return ctrl.Result{}, client.IgnoreNotFound(err)
    }

    // Reconcile desired state
    desired := buildDeployment(&app)
    if err := controllerutil.SetControllerReference(&app, desired, r.Scheme); err != nil {
        return ctrl.Result{}, err
    }

    // Create or update
    _, err := controllerutil.CreateOrUpdate(ctx, r.Client, desired, func() error {
        desired.Spec = buildDeploymentSpec(&app)
        return nil
    })

    return ctrl.Result{RequeueAfter: 30 * time.Second}, err
}
```

### Container Best Practices

```dockerfile
# Multi-stage build — minimal final image
FROM golang:1.22-alpine AS build
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -ldflags="-s -w" -o /bin/service ./cmd/service

FROM gcr.io/distroless/static-debian12
COPY --from=build /bin/service /service
USER nonroot:nonroot
ENTRYPOINT ["/service"]
```

---

## Observability

### Structured Logging (log/slog)

```go
logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
    Level: slog.LevelInfo,
}))
slog.SetDefault(logger)

// Contextual logging with attributes
slog.Info("request processed",
    "method", r.Method,
    "path", r.URL.Path,
    "status", status,
    "duration_ms", time.Since(start).Milliseconds(),
    "request_id", middleware.GetRequestID(r.Context()),
)
```

### Metrics (Prometheus)

```go
var (
    httpRequestsTotal = promauto.NewCounterVec(prometheus.CounterOpts{
        Name: "http_requests_total",
        Help: "Total number of HTTP requests",
    }, []string{"method", "path", "status"})

    httpRequestDuration = promauto.NewHistogramVec(prometheus.HistogramOpts{
        Name:    "http_request_duration_seconds",
        Help:    "HTTP request duration in seconds",
        Buckets: prometheus.DefBuckets,
    }, []string{"method", "path"})
)
```

### Distributed Tracing (OpenTelemetry)

```go
tracer := otel.Tracer("myservice")

func (s *Service) ProcessOrder(ctx context.Context, orderID string) error {
    ctx, span := tracer.Start(ctx, "ProcessOrder")
    defer span.End()

    span.SetAttributes(attribute.String("order.id", orderID))

    // Child spans for sub-operations
    if err := s.validateOrder(ctx, orderID); err != nil {
        span.RecordError(err)
        span.SetStatus(otelcodes.Error, err.Error())
        return err
    }
    ...
}
```

---

## Database Patterns

### SQL with sqlc (compile-time safe)

```sql
-- queries.sql
-- name: GetUser :one
SELECT id, name, email, created_at FROM users WHERE id = $1;

-- name: ListUsers :many
SELECT id, name, email, created_at FROM users ORDER BY created_at DESC LIMIT $1;

-- name: CreateUser :one
INSERT INTO users (name, email) VALUES ($1, $2) RETURNING *;
```

```go
// Generated code — type-safe, no runtime reflection
user, err := queries.GetUser(ctx, userID)
users, err := queries.ListUsers(ctx, 50)
```

### Connection Pool Management

```go
db, err := sql.Open("postgres", connStr)
if err != nil {
    return fmt.Errorf("open db: %w", err)
}

db.SetMaxOpenConns(25)               // Max active connections
db.SetMaxIdleConns(10)               // Keep connections warm
db.SetConnMaxLifetime(5 * time.Minute) // Recycle stale connections
db.SetConnMaxIdleTime(1 * time.Minute)

// Always check connectivity
if err := db.PingContext(ctx); err != nil {
    return fmt.Errorf("ping db: %w", err)
}
```

---

## Testing Patterns

### Table-Driven Tests

```go
func TestParseAge(t *testing.T) {
    tests := []struct {
        name    string
        input   string
        want    int
        wantErr bool
    }{
        {"valid", "25", 25, false},
        {"zero", "0", 0, false},
        {"negative", "-1", 0, true},
        {"empty", "", 0, true},
        {"non-numeric", "abc", 0, true},
        {"too large", "200", 0, true},
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            got, err := ParseAge(tt.input)
            if (err != nil) != tt.wantErr {
                t.Errorf("ParseAge(%q) error = %v, wantErr %v", tt.input, err, tt.wantErr)
            }
            if got != tt.want {
                t.Errorf("ParseAge(%q) = %d, want %d", tt.input, got, tt.want)
            }
        })
    }
}
```

### Integration Testing

```go
func TestPostgresUserRepo(t *testing.T) {
    if testing.Short() {
        t.Skip("skipping integration test")
    }

    // Use testcontainers for real database testing
    ctx := context.Background()
    container, err := postgres.Run(ctx, "postgres:16-alpine")
    t.Cleanup(func() { container.Terminate(ctx) })

    connStr, _ := container.ConnectionString(ctx, "sslmode=disable")
    db, _ := sql.Open("postgres", connStr)

    repo := NewPostgresUserRepo(db)

    // Test against real database
    created, err := repo.Create(ctx, "test@example.com", "Test User")
    require.NoError(t, err)
    assert.Equal(t, "test@example.com", created.Email)
}
```

---

## CLI Tools

```go
// Using cobra for complex CLIs
var rootCmd = &cobra.Command{
    Use:   "mytool",
    Short: "A tool for doing things",
}

var deployCmd = &cobra.Command{
    Use:   "deploy [environment]",
    Short: "Deploy to an environment",
    Args:  cobra.ExactArgs(1),
    RunE: func(cmd *cobra.Command, args []string) error {
        env := args[0]
        dryRun, _ := cmd.Flags().GetBool("dry-run")
        return deploy(cmd.Context(), env, dryRun)
    },
}
```

---

## Infrastructure as Code

### Terraform Provider Development

```go
func (r *ServerResource) Create(ctx context.Context, req resource.CreateRequest, resp *resource.CreateResponse) {
    var plan ServerModel
    resp.Diagnostics.Append(req.Plan.Get(ctx, &plan)...)
    if resp.Diagnostics.HasError() {
        return
    }

    server, err := r.client.CreateServer(ctx, plan.Name.ValueString(), plan.Size.ValueString())
    if err != nil {
        resp.Diagnostics.AddError("create server failed", err.Error())
        return
    }

    plan.ID = types.StringValue(server.ID)
    resp.Diagnostics.Append(resp.State.Set(ctx, &plan)...)
}
```

---

## Performance & Profiling

| Profile What | Tool | Command |
|-------------|------|---------|
| CPU hotspots | `pprof` | `go tool pprof http://localhost:6060/debug/pprof/profile` |
| Memory allocations | `pprof` (heap) | `go tool pprof http://localhost:6060/debug/pprof/heap` |
| Goroutine leaks | `pprof` | `go tool pprof http://localhost:6060/debug/pprof/goroutine` |
| Blocking | `pprof` | `go tool pprof http://localhost:6060/debug/pprof/block` |
| Benchmarks | `testing` | `go test -bench=. -benchmem -count=10` |
| Race conditions | Race detector | `go test -race ./...` |
| Escape analysis | Compiler | `go build -gcflags="-m" ./...` |
| Trace | Execution tracer | `go test -trace=trace.out && go tool trace trace.out` |

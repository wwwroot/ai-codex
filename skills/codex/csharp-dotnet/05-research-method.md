# 05 — Research, Benchmarking & Diagnostic Method (C# / .NET Edition)

> Reference this file when profiling performance, diagnosing memory leaks, or preparing enterprise .NET systems for production deployment.

---

## 1. The BenchmarkDotNet Optimization Loop

Never guess whether an optimization improved throughput or reduced allocations. Follow the scientific benchmarking loop:

```
  ┌────────────────────────────────────────────────────────┐
  │ 1. FORMULATE HYPOTHESIS                                │
  │    "Replacing String.Split() with Span<T> tokenizer    │
  │    will reduce Gen 0 allocations from 1.2KB to 0 B."   │
  └──────────────────────────┬─────────────────────────────┘
                             │
                             ▼
  ┌────────────────────────────────────────────────────────┐
  │ 2. WRITE BENCHMARK HARNESS                             │
  │    [MemoryDiagnoser], [DisassemblyDiagnoser].          │
  │    Isolate baseline vs candidate implementation.       │
  └──────────────────────────┬─────────────────────────────┘
                             │
                             ▼
  ┌────────────────────────────────────────────────────────┐
  │ 3. RUN RELEASE BENCHMARK                               │
  │    dotnet run -c Release --filter *TokenizerBenchmark* │
  │    Review Mean execution time and Allocated bytes.     │
  └──────────────────────────┬─────────────────────────────┘
                             │
                             ▼
  ┌────────────────────────────────────────────────────────┐
  │ 4. PROFILE GC & JIT DISASSEMBLY                        │
  │    Inspect assembly instructions (SIMD vectorized?)    │
  │    Verify 0 B Gen 0/1/2 GC pressure.                   │
  └────────────────────────────────────────────────────────┘
```

### Reproducible Benchmark Template:
```csharp
using BenchmarkDotNet.Attributes;
using BenchmarkDotNet.Running;

[MemoryDiagnoser]
[DisassemblyDiagnoser(printSource: true)]
public class ParsingBenchmark
{
    private const string Payload = "TIMESTAMP=2026-08-14T12:00:00Z;USER_ID=982341;EVENT=LOGIN_SUCCESS";

    [Benchmark(Baseline = true)]
    public string[] BaselineStringSplit()
    {
        return Payload.Split(';');
    }

    [Benchmark]
    public int SpanTokenizerZeroAlloc()
    {
        ReadOnlySpan<char> span = Payload.AsSpan();
        int count = 0;
        while (!span.IsEmpty)
        {
            int next = span.IndexOf(';');
            ReadOnlySpan<char> token = next == -1 ? span : span[..next];
            count += token.Length;
            if (next == -1) break;
            span = span[(next + 1)..];
        }
        return count;
    }
}
```

---

## 2. CLI Diagnostics & Memory Profiling Tools

Use standard .NET global diagnostic tools for live process analysis without attaching invasive debuggers:

| Tool | Purpose | Command |
| :--- | :--- | :--- |
| **`dotnet-counters`** | Live metrics (CPU, GC heap size, thread pool queue length) | `dotnet-counters monitor -p <PID>` |
| **`dotnet-gcdump`** | Lightweight GC memory snapshots to find object retention trees | `dotnet-gcdump collect -p <PID>` |
| **`dotnet-trace`** | High-performance sampling profiler (Speedscope / PerfView) | `dotnet-trace collect -p <PID> --duration 00:01:00` |
| **`dotnet-dump`** | Full memory crash dumps for post-mortem deadlock analysis | `dotnet-dump collect -p <PID>` |

---

## 3. Architecture Testing with NetArchTest

Prevent architectural erosion in enterprise solutions by adding automated unit tests that enforce layering rules:

```csharp
using NetArchTest.Rules;
using Xunit;

public class ArchitectureTests
{
    [Fact]
    public void DomainLayer_ShouldNotHaveDependencyOn_InfrastructureOrPresentation()
    {
        var result = Types.InAssembly(typeof(Domain.Entities.Order).Assembly)
            .ShouldNot()
            .HaveDependencyOnAny("Infrastructure", "Presentation", "Microsoft.EntityFrameworkCore")
            .GetResult();

        Assert.True(result.IsSuccessful, "Domain layer contains illegal infrastructure dependencies!");
    }
}
```

---

## 4. Production Readiness Checklist (.NET 9)

Before shipping any service to Kubernetes, Azure, or AWS:

- [ ] **Native AOT or Dynamic PGO**: Validated compatibility if using `<PublishAot>true</PublishAot>` (no unsupported reflection or dynamic code generation).
- [ ] **GC Configuration**: Enabled Server GC (`<ServerGarbageCollection>true</ServerGarbageCollection>`) for containerized web workloads.
- [ ] **Thread Pool Tuning**: Set appropriate `ThreadPool.SetMinThreads` to handle sudden incoming burst traffic without starvation.
- [ ] **Graceful Shutdown**: Handled `IHostApplicationLifetime.ApplicationStopping` to allow in-flight HTTP requests and queue workers to drain.
- [ ] **Database Connection Pooling**: Configured explicit `MaxPoolSize` on DbContext pools (`AddDbContextPool<AppDbContext>`).
- [ ] **OpenTelemetry & Health Checks**: Configured `/healthz` (liveness) and `/ready` (readiness) probes alongside OTLP telemetry exporters.

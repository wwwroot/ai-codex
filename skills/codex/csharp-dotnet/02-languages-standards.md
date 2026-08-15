# 02 — Languages & Code Standards (C# / .NET Edition)

> Reference this file when writing, reviewing, or refactoring C# and .NET codebases.

---

## Primary Language: C# / .NET

C# 13+ and .NET 9+ is the default implementation environment. It is chosen because:
- **High-Performance Runtime** — Tiered JIT compilation, Dynamic PGO, Native AOT, and SIMD hardware acceleration.
- **Zero-Allocation Memory Control** — `Span<T>`, `ReadOnlySpan<T>`, `ref struct`, and buffer pooling bring C-like memory control to a type-safe language.
- **Modern Expressiveness** — Pattern matching, records, collection expressions, and primary constructors eliminate boilerplate without sacrificing type safety.
- **Unified Platform** — One runtime powering web APIs, cloud microservices, background workers, and cross-platform game engines.

### Language Version Target

**C# 13 on .NET 9.** Leverage modern language capabilities:

- **Collection Expressions**: `int[] numbers = [1, 2, 3];` with automatic compiler optimization.
- **Primary Constructors**: Clean dependency injection for classes and records (`public class OrderService(IOrderRepository repo, ILogger<OrderService> logger)`).
- **`params ReadOnlySpan<T>`**: Zero-allocation variadic arguments without hidden heap array allocations.
- **Pattern Matching & Guards**: Exhaustive `switch` expressions with property patterns and relational operators.
- **`ref struct` & `ReadOnlySpan<T>`**: Stack-only types for high-performance zero-copy text and buffer manipulation.
- **Null-Safety**: `<Nullable>enable</Nullable>` enforced with `<TreatWarningsAsErrors>true</TreatWarningsAsErrors>`.

---

## Non-Negotiable Code Standards

```
ALWAYS                                       NEVER
──────────────────────────────────────────   ────────────────────────────────────────
Primary constructors for DI injection        Field injection or sprawling boilerplate constructors
Span<T> / ReadOnlySpan<T> in hot paths       Substrings (str.Substring()) in high-frequency parsing
CancellationToken passed to async I/O        Task.Run without cancellation propagation
ValueTask<T> for high-frequency cache paths  Allocating Task<T> for synchronously completed paths
throw; to preserve stack trace               throw ex; (which resets the call stack)
Structured logging (ILogger source gen)      String interpolation inside log statements ($"Error {id}")
Records for DTOs and immutable values        Mutable public classes with raw setters for data
Explicit IDisposable / IAsyncDisposable      Leaking database connections or unmanaged handles
BenchmarkDotNet for performance claims       Speculative micro-optimizations without metrics
Central Package Management (CPM)             Scattered, conflicting NuGet versions across csproj files
```

---

## Error Handling Discipline

In enterprise web and service contexts, prefer typed Domain Results or RFC 7807 `ProblemDetails` over raw unhandled exceptions for expected control flow:

```csharp
// Functional Result pattern for domain operations
public readonly record struct Result<TValue, TError>
{
    public TValue? Value { get; }
    public TError? Error { get; }
    public bool IsSuccess { get; }
    public bool IsFailure => !IsSuccess;

    private Result(TValue value)
    {
        Value = value;
        Error = default;
        IsSuccess = true;
    }

    private Result(TError error)
    {
        Value = default;
        Error = error;
        IsSuccess = false;
    }

    public static Result<TValue, TError> Success(TValue value) => new(value);
    public static Result<TValue, TError> Failure(TError error) => new(error);
}

// Domain error definitions
public abstract record DomainError(string Code, string Message);
public sealed record EntityNotFound(string Entity, Guid Id) : DomainError("NotFound", $"{Entity} with id {Id} not found");
public sealed record ValidationFailed(string Details) : DomainError("Validation", Details);
```

---

## Zero-Allocation Memory & Span Standards

Use `Span<T>` and `ReadOnlySpan<T>` for high-frequency string and byte processing:

```csharp
public static class FastParser
{
    // Parses "KEY:VALUE" without allocating strings on the heap
    public static bool TryParseHeader(ReadOnlySpan<char> input, out ReadOnlySpan<char> key, out ReadOnlySpan<char> value)
    {
        int colonIndex = input.IndexOf(':');
        if (colonIndex == -1)
        {
            key = default;
            value = default;
            return false;
        }

        key = input[..colonIndex].Trim();
        value = input[(colonIndex + 1)..].Trim();
        return true;
    }
}
```

### Buffer Pooling with `ArrayPool<T>`
```csharp
public async ValueTask ProcessNetworkStreamAsync(Stream stream, CancellationToken ct)
{
    byte[] buffer = ArrayPool<byte>.Shared.Rent(4096);
    try
    {
        int bytesRead;
        while ((bytesRead = await stream.ReadAsync(buffer.AsMemory(0, buffer.Length), ct)) > 0)
        {
            ProcessChunk(buffer.AsSpan(0, bytesRead));
        }
    }
    finally
    {
        ArrayPool<byte>.Shared.Return(buffer);
    }
}
```

---

## Asynchronous Concurrency Standards

- **Task vs. ValueTask**: Use `Task` for general async operations. Use `ValueTask<T>` ONLY when the method frequently returns synchronously (e.g., from an in-memory cache) to eliminate Task object allocations.
- **Producer-Consumer with `Channel<T>`**: Prefer `System.Threading.Channels` over raw blocking collections for high-throughput in-memory messaging.
- **Async Streams**: Use `IAsyncEnumerable<T>` for streaming data from databases or external APIs without loading entire result sets into memory.

```csharp
// High-throughput asynchronous batch processing with Channel
public sealed class EventBatchProcessor<T>(ChannelReader<T> reader, ILogger<EventBatchProcessor<T>> logger)
{
    public async Task StartProcessingAsync(CancellationToken ct)
    {
        await foreach (T item in reader.ReadAllAsync(ct))
        {
            try
            {
                await ProcessEventAsync(item, ct);
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                logger.LogError(ex, "Failed to process event");
            }
        }
    }

    private static ValueTask ProcessEventAsync(T item, CancellationToken ct) => ValueTask.CompletedTask;
}
```

---

## Anti-Patterns to Reject

```csharp
//  REJECT: Synchronous blocking on Tasks
var data = client.GetDataAsync().Result; 
var config = loadConfigAsync().GetAwaiter().GetResult();

// [OK] PREFER: Pure async/await
var data = await client.GetDataAsync(ct);

//  REJECT: Resetting stack trace on exception rethrow
try {
    Process();
} catch (Exception ex) {
    logger.LogError(ex, "Error");
    throw ex; // [WARNING] Resets call stack!
}

// [OK] PREFER: throw; preserves entire original stack trace
try {
    Process();
} catch (Exception ex) {
    logger.LogError(ex, "Error");
    throw;
}

//  REJECT: Allocating LINQ inside 60fps game update loop
void Update() {
    var activeEnemies = enemies.Where(e => e.IsAlive).ToList(); // Heap allocations every frame!
}

// [OK] PREFER: Zero-allocation array/span filtering
void Update() {
    int aliveCount = FilterAlive(enemiesSpan, activeEnemiesBuffer);
}
```

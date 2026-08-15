# 04 — Domain Knowledge & Ecosystems (C# / .NET Edition)

> Reference this file when engineering ASP.NET Core cloud services, EF Core persistence, distributed actor meshes, or game engines.

---

## 1. ASP.NET Core Minimal APIs & Modern Cloud Services

ASP.NET Core Minimal APIs provide ultra-fast routing with low memory footprint and full Native AOT support.

```csharp
using Microsoft.AspNetCore.Http.HttpResults;

var builder = WebApplication.CreateSlimBuilder(args);

builder.Services.AddHybridCache(); // .NET 9 HybridCache (L1 in-memory + L2 Redis)
builder.Services.AddScoped<IOrderService, OrderService>();

var app = builder.Build();

var orderGroup = app.MapGroup("/api/v1/orders")
    .WithTags("Orders")
    .RequireRateLimiting("fixed-window");

orderGroup.MapGet("/{id:guid}", async Task<Results<Ok<OrderResponse>, NotFound>> (
    Guid id, 
    IOrderService orderService, 
    CancellationToken ct) =>
{
    var order = await orderService.GetOrderByIdAsync(id, ct);
    return order is not null 
        ? TypedResults.Ok(new OrderResponse(order.Id, order.Status, order.TotalAmount)) 
        : TypedResults.NotFound();
});

orderGroup.MapPost("/", async Task<Results<CreatedAtRoute<OrderResponse>, BadRequest<ProblemDetails>>> (
    CreateOrderRequest request, 
    IOrderService orderService, 
    CancellationToken ct) =>
{
    var result = await orderService.CreateOrderAsync(request, ct);
    return result.Match<Results<CreatedAtRoute<OrderResponse>, BadRequest<ProblemDetails>>>(
        success => TypedResults.CreatedAtRoute(
            new OrderResponse(success.Id, success.Status, success.TotalAmount), 
            nameof(orderGroup), 
            new { id = success.Id }),
        failure => TypedResults.BadRequest(new ProblemDetails { Detail = failure.Message })
    );
});

app.Run();
```

---

## 2. Entity Framework Core 9+ & High-Performance Data Access

EF Core 9 provides advanced query translation, compiled models, and interceptors.

### Optimized Query Patterns:
```csharp
public class OrderRepository(AppDbContext db) : IOrderRepository
{
    // EF Core Compiled Query: Pre-compiles SQL translation once at startup
    private static readonly Func<AppDbContext, Guid, CancellationToken, Task<Order?>> GetOrderCompiledQuery =
        EF.CompileAsyncQuery((AppDbContext ctx, Guid id, CancellationToken ct) =>
            ctx.Orders
                .AsNoTracking()
                .Include(o => o.Items)
                .AsSplitQuery() // Prevent Cartesian explosion on multiple joins
                .FirstOrDefault(o => o.Id == id));

    public Task<Order?> GetOrderByIdAsync(Guid id, CancellationToken ct)
    {
        return GetOrderCompiledQuery(db, id, ct);
    }
}
```

### Optimistic Concurrency with RowVersion:
```csharp
public class Order
{
    public Guid Id { get; init; }
    public decimal TotalAmount { get; private set; }
    
    [Timestamp]
    public byte[] Version { get; set; } = []; // Concurrency token
}
```

---

## 3. Distributed Systems: .NET Aspire & Microsoft Orleans

### .NET Aspire Orchestration (`AppHost`):
```csharp
var builder = DistributedApplication.CreateBuilder(args);

var redis = builder.AddRedis("cache");
var postgres = builder.AddPostgres("postgres").AddDatabase("orderdb");

var orderService = builder.AddProject<Projects.OrderService>("orderservice")
    .WithReference(redis)
    .WithReference(postgres);

builder.AddProject<Projects.Frontend>("frontend")
    .WithReference(orderService);

builder.Build().Run();
```

### Microsoft Orleans Virtual Actor (Grain):
```csharp
public interface IPlayerGrain : IGrainWithGuidKey
{
    ValueTask<int> AddScoreAsync(int points);
    ValueTask<PlayerStats> GetStatsAsync();
}

public class PlayerGrain : Grain, IPlayerGrain
{
    private int _score;

    public ValueTask<int> AddScoreAsync(int points)
    {
        _score += points;
        return ValueTask.FromResult(_score);
    }

    public ValueTask<PlayerStats> GetStatsAsync()
    {
        return ValueTask.FromResult(new PlayerStats(this.GetPrimaryKey(), _score));
    }
}
```

---

## 4. High-Performance & Systems: `System.IO.Pipelines` & SIMD

Handle network streams without intermediate byte array allocations using Pipelines:

```csharp
using System.IO.Pipelines;
using System.Buffers;

public async Task ProcessPipeMessagesAsync(PipeReader reader, CancellationToken ct)
{
    while (!ct.IsCancellationRequested)
    {
        ReadResult result = await reader.ReadAsync(ct);
        ReadOnlySequence<byte> buffer = result.Buffer;

        while (TryReadMessage(ref buffer, out ReadOnlySequence<byte> message))
        {
            HandleMessage(message);
        }

        reader.AdvanceTo(buffer.Start, buffer.End);

        if (result.IsCompleted) break;
    }
}

private static bool TryReadMessage(ref ReadOnlySequence<byte> buffer, out ReadOnlySequence<byte> message)
{
    SequencePosition? position = buffer.PositionOf((byte)'\n');
    if (position is null)
    {
        message = default;
        return false;
    }

    message = buffer.Slice(0, position.Value);
    buffer = buffer.Slice(buffer.GetPosition(1, position.Value));
    return true;
}
```

---

## 5. Game Development: Unity (DOTS / ECS) & Godot C#

### Unity Entities / IJobEntity (Data-Oriented Technology Stack):
```csharp
#if UNITY_DOTS
using Unity.Entities;
using Unity.Mathematics;
using Unity.Transforms;
using Unity.Burst;

public struct VelocityComponent : IComponentData
{
    public float3 Linear;
}

[BurstCompile]
public partial struct MovementSystem : ISystem
{
    [BurstCompile]
    public void OnUpdate(ref SystemState state)
    {
        float deltaTime = SystemAPI.Time.DeltaTime;

        foreach (var (transform, velocity) in SystemAPI.Query<RefRW<LocalTransform>, RefRO<VelocityComponent>>())
        {
            transform.ValueRW.Position += velocity.ValueRO.Linear * deltaTime;
        }
    }
}
#endif
```

---

## 6. Cross-Platform Desktop: Avalonia UI & .NET MAUI

Avalonia UI provides direct Skia rendering across Windows, macOS, Linux, iOS, Android, and WebAssembly:

```csharp
using Avalonia.Controls;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;

public partial class MainViewModel : ObservableObject
{
    [ObservableProperty]
    private string _status = "Ready";

    [RelayCommand]
    private void ExecuteTask()
    {
        Status = "Processing...";
    }
}
```

# 03 — First Principles & Mental Models (Swift Edition)

> Reference this file when architecting systems, reasoning about concurrency, or making trade-offs in Swift.

---

## 1. Value Semantics vs. Reference Semantics

The fundamental choice in Swift is not between object-oriented and functional programming — it is between value semantics and reference semantics.

```
FEATURE               VALUE SEMANTICS (struct / enum)      REFERENCE SEMANTICS (class)
───────────────────   ─────────────────────────────────    ───────────────────────────────────
Identity              Equality by value (==)               Identity by pointer (===)
Storage               Stack / Inline within parent         Heap allocated with ARC header
Copies                Deep copy (independent instance)     Shallow copy (shared reference)
Mutation              Local mutation (mutating func)       Shared mutation across pointers
Thread Safety         Inherently safe (no shared state)    Requires synchronization (locks/actors)
Optimization          Inlining, scalar replacement        Dynamic dispatch via vtable
```

### The Rule of Thumb:
- Use `struct` for data, state, models, DTOs, configurations, and mathematical vectors.
- Use `enum` for state machines, error domains, navigation routes, and closed polymorphic sets.
- Use `class` ONLY when identity is strictly required (e.g., Cocoa window delegates, hardware resource lifecycles) or when using `@Observable` view models.
- Use `actor` for shared, mutable state that spans multiple concurrent tasks.

---

## 2. Structured Concurrency & Actor Reentrancy

Swift concurrency replaces thread pools and GCD callbacks with a hierarchical task tree.

```
       [Parent Task]
         │        │
         │ (async let / withTaskGroup)
         ▼        ▼
    [Child 1]  [Child 2]
         │        │
         └────────┴──► Both must finish/cancel before Parent completes
```

### The Actor Reentrancy Invariant:
Actors guarantee mutual exclusion, but **they do not prevent state interleaving across `await` points**. Between `await` calls, other tasks may execute on the actor and mutate its internal state.

```swift
actor BankAccount {
    private var balance: Decimal = 1000

    func withdraw(_ amount: Decimal) async throws {
        guard balance >= amount else { throw BankError.insufficientFunds }
        
        // [WARNING] SUSPENSION POINT: Another caller can call withdraw() while this awaits!
        try await logAuditTrail(amount: amount)
        
        // Always re-verify invariants after an await!
        guard balance >= amount else { throw BankError.insufficientFunds }
        balance -= amount
    }
}
```

**First Principle**: Minimize `await` points inside actor critical sections. Calculate and finalize state transitions atomically before yielding execution.

---

## 3. Declarative UI Mechanics & SwiftUI View Graph

A SwiftUI `View` is not a pixel on the screen; it is a **lightweight, transient blueprint** of what should be on screen.

```
[State Changes] ──► [SwiftUI evaluates body] ──► [Diffs Virtual Tree] ──► [Updates Render Tree]
```

### Key Principles of the View Graph:
1. **Structural Identity vs. Explicit Identity**:
   - *Structural Identity*: SwiftUI identifies views by their position in the view hierarchy (e.g., inside an `if-else` block).
   - *Explicit Identity*: Views identified via `.id(item.id)`. Changing an ID destroys and recreates the view and all its local state.
2. **Body Purity**: The `body` property must be idempotent and side-effect free. Never start network requests, write to databases, or mutate external state directly in `body`.
3. **Fine-Grained Observation**: `@Observable` macro tracks only the specific properties read inside a view's `body`. If property `A` changes, views reading only property `B` do not re-evaluate.

---

## 4. Algebraic State Modeling

Eliminate invalid states at compile time using tagged unions (`enum` with associated values) rather than collections of optional variables and boolean flags.

### Anti-Pattern: Boolean Explosion (32 possible states, most invalid)
```swift
//  Dangerous: isLoading = true, error != nil, data != nil simultaneously?
struct BadViewState {
    var isLoading: Bool
    var data: [Item]?
    var errorMessage: String?
    var isRefreshing: Bool
    var isEmpty: Bool
}
```

### First Principle: Exhaustive State Machine (Exactly 1 valid state at any moment)
```swift
// [OK] Clean: Impossible states cannot be represented
public enum ViewState<T: Sendable>: Sendable {
    case idle
    case loading
    case loaded(data: T)
    case empty
    case failed(error: NetworkError)
}
```

---

## 5. Architectural Trade-Off Matrix

Every architectural pattern in the Apple ecosystem comes with distinct trade-offs:

| Pattern | Strengths | Weaknesses | Best Fit |
| :--- | :--- | :--- | :--- |
| **Vanilla SwiftUI (@Observable MVVM)** | Minimal boilerplate, native Apple idioms, fast development | State can become fragmented across view hierarchy | Small to medium apps, fast prototyping, standard workflows |
| **The Composable Architecture (TCA)** | Explicit unidirectional flow, time-travel debugging, exhaustive testability | Higher learning curve, structural boilerplate | Large apps, complex multi-step flows, high test-coverage teams |
| **Clean / Ports & Adapters** | Decouples business logic from Apple UI/Data frameworks | Additional mapping layers and protocol indirection | Enterprise apps, shared logic with Server Swift or multi-platform |
| **SwiftData vs SQLite/GRDB** | Native Swift macro integration, seamless CloudKit | Complex migrations, edge cases in multi-threaded contexts | New Apple-only apps with standard relational schemas |
| **Actors vs Locks (Mutex)** | Compiler-enforced async safety, zero deadlock risk | Cooperative suspension overhead, reentrancy gotchas | Async systems, distributed networking, multi-task state |

---

## 6. Dependency Injection & Isolation Boundaries

Favor **Protocol-Oriented Contracts** or **Closure-Based Environments** to decouple side-effects (network, disk, clock, analytics) from domain models.

```swift
// Explicit protocol contract for dependency injection
public protocol WeatherClientProtocol: Sendable {
    func currentWeather(for city: String) async throws -> WeatherForecast
}

// Production implementation
public final class LiveWeatherClient: WeatherClientProtocol {
    private let session: URLSession
    public init(session: URLSession = .shared) { self.session = session }
    public func currentWeather(for city: String) async throws -> WeatherForecast {
        // Real network call
        return WeatherForecast(temperature: 72.0, condition: .sunny)
    }
}

// Mock implementation for Instant Previews and Deterministic Tests
public final class MockWeatherClient: WeatherClientProtocol {
    public var stubbedResult: Result<WeatherForecast, NetworkError>
    public init(stubbedResult: Result<WeatherForecast, NetworkError> = .success(.init(temperature: 68.0, condition: .cloudy))) {
        self.stubbedResult = stubbedResult
    }
    public func currentWeather(for city: String) async throws -> WeatherForecast {
        try stubbedResult.get()
    }
}
```

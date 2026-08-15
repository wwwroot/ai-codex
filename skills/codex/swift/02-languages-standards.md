# 02 — Languages & Code Standards (Swift Edition)

> Reference this file when writing, reviewing, or refactoring Swift code.

---

## Primary Language: Swift

Swift 6+ is the default implementation language. It is chosen because:
- **Complete Data-Race Safety** — compile-time verification eliminates multi-threaded memory corruption.
- **Expressive Value Types** — structs, enums, and copy-on-write semantics provide predictable memory and local reasoning.
- **Modern Concurrency** — first-class async/await, actors, task groups, and isolation boundaries replace error-prone callback pyramids and GCD deadlocks.
- **Deep Hardware Integration** — zero-cost abstractions compile directly to optimized ARM64 / Apple Silicon machine code.

### Language Version Target

**Swift 6.0+ with complete concurrency checking enabled.** Use modern idioms actively:

- **Strict Concurrency**: Full `Sendable` validation, region-based isolation analysis, and global actor isolation (`@MainActor`).
- **Observation Framework**: `@Observable` macro replacing legacy `ObservableObject`, `@Published`, and Combine object lifecycles.
- **Typed Throws**: `throws(AppError)` for precise error domain modeling without type erasure.
- **Non-Copyable Types**: `~Copyable` (structs and enums) for unique resource ownership (e.g., file handles, GPU buffers, cryptographic keys).
- **Macros**: Freestanding and attached macros (`#Predicate`, `#Preview`, `@Model`, `@Observable`, `@Entry`).
- **Package-Access Control**: `package` access level for multi-module SPM codebases without public API pollution.
- **Pack Iteration**: Parameter packs with `for in` expansion for clean generic metaprogramming.

---

## Non-Negotiable Code Standards

```
ALWAYS                                       NEVER
──────────────────────────────────────────   ────────────────────────────────────────
Swift 6 strict concurrency checks enabled    Disabling concurrency warnings via flags
Value types (struct/enum) by default         Reference types (class) without identity need
@Observable for UI state observation         ObservableObject / @Published in new code
Typed custom Error enums with LocalizedError Stringly-typed errors or generic NSError
[weak self] in escaping closures             Implicit strong self retain cycles
guard let / if let for unwrapping            Force unwrap (!) or force try (try!)
Structured concurrency (TaskGroup, async let) Uncontrolled Task.detached spawning
Explicit Sendable conformance on transfers   @unchecked Sendable without atomic audit
Unit tests with isolated mock dependencies   Hardcoded network singletons in View bodies
Swift Package Manager (SPM) for modularity   Monolithic targets or legacy CocoaPods
```

---

## Error Handling Discipline

Define domain-specific, exhaustive error hierarchies:

```swift
// Domain error with LocalizedError conformance for user-facing messaging
public enum NetworkError: LocalizedError, Sendable, Equatable {
    case invalidURL(String)
    case serverError(statusCode: Int, message: String?)
    case unauthorized
    case decodingFailed(detail: String)
    case connectivityLost

    public var errorDescription: String? {
        switch self {
        case .invalidURL(let path):
            return "The URL '\(path)' is malformed."
        case .serverError(let code, let msg):
            return "Server responded with status \(code): \(msg ?? "No detail")"
        case .unauthorized:
            return "Session expired. Please log in again."
        case .decodingFailed(let detail):
            return "Failed to parse data: \(detail)"
        case .connectivityLost:
            return "Internet connection appears to be offline."
        }
    }
}

// Swift 6 Typed Throws example for explicit API contracts
public func fetchProfile(for userID: String) throws(NetworkError) -> UserProfile {
    guard !userID.isEmpty else {
        throw NetworkError.invalidURL("Empty user ID")
    }
    // Execution logic...
    return UserProfile(id: userID, name: "Sample")
}
```

---

## Concurrency & Actor Discipline

```swift
// State isolated within a dedicated actor for thread safety
public actor CacheStore<Key: Hashable & Sendable, Value: Sendable> {
    private var storage: [Key: (value: Value, timestamp: ContinuousClock.Instant)] = [:]
    private let ttl: Duration

    public init(ttl: Duration = .seconds(300)) {
        self.ttl = ttl
    }

    public func get(_ key: Key) -> Value? {
        guard let entry = storage[key] else { return nil }
        let now = ContinuousClock.now
        if now - entry.timestamp > ttl {
            storage.removeValue(forKey: key)
            return nil
        }
        return entry.value
    }

    public func set(_ key: Key, value: Value) {
        storage[key] = (value, ContinuousClock.now)
    }

    public func clear() {
        storage.removeAll()
    }
}

// Structured Task execution with cancellation propagation
public func batchFetchImages(urls: [URL]) async throws -> [URL: Data] {
    try await withThrowingTaskGroup(of: (URL, Data).self) { group in
        for url in urls {
            group.addTask {
                try Task.checkCancellation()
                let (data, response) = try await URLSession.shared.data(from: url)
                guard let http = response as? HTTPURLResponse, (200...299).contains(http.statusCode) else {
                    throw NetworkError.serverError(statusCode: (response as? HTTPURLResponse)?.statusCode ?? 500, message: nil)
                }
                return (url, data)
            }
        }

        var results: [URL: Data] = [:]
        for try await (url, data) in group {
            results[url] = data
        }
        return results
    }
}
```

---

## Memory Management & ARC Standards

- **Capture Lists in Closures**: Always use `[weak self]` in long-lived or escaping closures (such as networking completion, timer ticks, or navigation callbacks) to prevent retain cycles.
- **`unowned` Safety**: Never use `unowned` unless the referenced object has a guaranteed identical or strictly longer lifetime (e.g., parent-to-child where child cannot outlive parent). If any doubt exists, use `weak`.
- **Large Value Types & COW**: If a `struct` contains large storage or expensive copy operations, implement Copy-on-Write using a private storage class or `isKnownUniquelyReferenced`.

```swift
// Example of clean weak capture and guard unwrapping
final class ImageLoader: @unchecked Sendable {
    func load(from url: URL, completion: @escaping @Sendable (Data?) -> Void) {
        URLSession.shared.dataTask(with: url) { [weak self] data, _, _ in
            guard let self else { return }
            // Safely use self without retaining the instance indefinitely
            self.process(data: data, completion: completion)
        }.resume()
    }
    
    private func process(data: Data?, completion: (Data?) -> Void) {
        completion(data)
    }
}
```

---

## Tooling & Project Architecture

- **Build System**: Swift Package Manager (SPM) with multi-package or multi-target modular design.
- **Formatting**: `swift-format` or `SwiftLint` with zero-tolerance for compiler warnings (`-warnings-as-errors` in CI).
- **Documentation**: Swift DocC syntax (`///`) on all public APIs, detailing parameters, return values, throws specifications, and complexity guarantees.
- **Testing**: Swift Testing framework (`@Test`, `#expect(...)`) or XCTest for unit, integration, and UI automation.

---

## Anti-Patterns to Reject

```swift
//  REJECT: Force unwrapping in business logic
let user = fetchUser()! 

//  REJECT: GCD dispatch queues in modern Swift 6 code
DispatchQueue.global().async {
    let result = heavyCalc()
    DispatchQueue.main.async {
        self.updateUI(result)
    }
}

// [OK] PREFER: Structured Concurrency & @MainActor
Task {
    let result = await computeOnBackgroundActor()
    await MainActor.run {
        self.updateUI(result)
    }
}

//  REJECT: Unchecked Sendable bypass without atomics or locking
final class UnsafeSharedState: @unchecked Sendable {
    var count = 0 // DATA RACE HAZARD!
}

// [OK] PREFER: Actor isolation or Mutex synchronization
actor SafeSharedState {
    private(set) var count = 0
    func increment() { count += 1 }
}
```

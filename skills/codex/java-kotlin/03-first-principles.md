# 03 — First Principles Thinking (Java / Kotlin Edition)

> Reference this file when designing systems, solving hard problems, or making architectural decisions in Java/Kotlin.

---

## The Core Question

Before writing any Java/Kotlin code, ask:

> **"What is the simplest architecture that separates domain logic from infrastructure?"**

Not the most extensible. Not the most framework-powered. The simplest design where business rules live in plain Kotlin/Java classes with no framework imports — and infrastructure is pluggable.

---

## Type-Driven Domain Modeling

The most powerful feature of the JVM type system is not generics — it is the ability to make illegal states unrepresentable.

### Sealed Hierarchies as State Machines

```kotlin
// The type system enforces valid states — no runtime checks needed
sealed interface OrderStatus {
    data object Pending : OrderStatus
    data class Confirmed(val confirmedAt: Instant) : OrderStatus
    data class Shipped(val trackingId: String, val shippedAt: Instant) : OrderStatus
    data class Delivered(val deliveredAt: Instant) : OrderStatus
    data class Cancelled(val reason: String, val cancelledAt: Instant) : OrderStatus
}

// Exhaustive when — compiler catches missing cases
fun OrderStatus.displayMessage(): String = when (this) {
    is OrderStatus.Pending -> "Awaiting confirmation"
    is OrderStatus.Confirmed -> "Confirmed at ${confirmedAt}"
    is OrderStatus.Shipped -> "Shipped — tracking: $trackingId"
    is OrderStatus.Delivered -> "Delivered at ${deliveredAt}"
    is OrderStatus.Cancelled -> "Cancelled: $reason"
}
// Adding a new status forces handling everywhere. The compiler is your reviewer.
```

### Value Objects — Make Primitives Meaningful

```kotlin
// BAD — primitive obsession
fun transfer(from: String, to: String, amount: Double): Result

// GOOD — domain types prevent misuse at compile time
@JvmInline value class AccountId(val value: String)
@JvmInline value class Money(val cents: Long) {
    init { require(cents >= 0) { "Money cannot be negative: $cents" } }
    operator fun plus(other: Money) = Money(cents + other.cents)
    operator fun minus(other: Money) = Money(cents - other.cents)
}

fun transfer(from: AccountId, to: AccountId, amount: Money): TransferResult
// Now you cannot accidentally swap from/to or pass a negative amount
```

### Making Illegal States Unrepresentable

```kotlin
// BAD — relies on runtime validation
data class User(
    val email: String,   // could be empty, could be "not-an-email"
    val age: Int,        // could be -1, could be 999
    val role: String     // could be "admin", could be "banana"
)

// GOOD — compile-time safety + construction-time validation
@JvmInline value class Email private constructor(val value: String) {
    companion object {
        fun parse(raw: String): Email {
            require(raw.contains("@") && raw.length <= 254) { "Invalid email: $raw" }
            return Email(raw.lowercase())
        }
    }
}

@JvmInline value class Age(val value: Int) {
    init { require(value in 0..150) { "Invalid age: $value" } }
}

enum class Role { USER, ADMIN, MODERATOR }

data class User(val email: Email, val age: Age, val role: Role)
// Invalid users cannot exist. Period.
```

---

## Dependency Injection from First Principles

### Why Constructor Injection

Dependency injection is not about frameworks. It is about one rule: **a class receives its dependencies, it does not create them.**

```kotlin
// BAD — creates its own dependency (untestable, inflexible)
class OrderService {
    private val repo = PostgresOrderRepository(Database.connect())
    private val mailer = SmtpMailer("smtp.example.com")
}

// GOOD — receives dependencies through constructor (testable, flexible)
class OrderService(
    private val repo: OrderRepository,      // interface, not implementation
    private val mailer: OrderNotifier,      // interface, not implementation
    private val clock: Clock = Clock.systemUTC()  // injectable for testing
)

// In tests:
val service = OrderService(
    repo = FakeOrderRepository(),
    mailer = FakeNotifier(),
    clock = Clock.fixed(Instant.parse("2024-01-01T00:00:00Z"), ZoneOffset.UTC)
)
```

### The Dependency Rule

```
                    ┌─────────────────────────────┐
                    │         Domain Layer         │
                    │  (entities, value objects,   │
                    │   interfaces/ports)          │
                    │  No framework imports.       │
                    │  Pure Kotlin/Java.           │
                    └──────────────┬──────────────┘
                                   │ depends on nothing
                    ┌──────────────┴──────────────┐
                    │       Application Layer      │
                    │  (use cases, orchestration)  │
                    │  Depends on domain only.     │
                    └──────────────┬──────────────┘
                                   │ depends on domain
                    ┌──────────────┴──────────────┐
                    │     Infrastructure Layer     │
                    │  (Spring, JPA, Kafka, HTTP)  │
                    │  Implements domain ports.    │
                    │  Framework annotations here. │
                    └─────────────────────────────┘

    Dependencies always point INWARD. Domain never imports infrastructure.
```

---

## Concurrency from First Principles

### Choosing the Right Model

| Scenario | Model | Why |
|----------|-------|-----|
| HTTP request handling with DB calls | Virtual threads (Java 21) | Blocking I/O, simple sequential code |
| Multiple async API calls in parallel | Coroutines (`async`/`awaitAll`) | Structured cancellation, composition |
| Event stream processing | Kotlin `Flow` / Reactive Streams | Backpressure, operators, transformations |
| Fire-and-forget background work | Coroutines with `SupervisorJob` | Isolated failure, lifecycle management |
| CPU-bound parallelism | `Dispatchers.Default` / ForkJoinPool | Work-stealing, bounded parallelism |
| High-throughput event ingestion | Kafka consumer groups | Partitioned parallelism, at-least-once |

### Kotlin Coroutines — Structured Concurrency

```kotlin
// GOOD — structured: parent controls lifecycle, failures propagate
suspend fun fetchUserProfile(userId: String): UserProfile =
    coroutineScope {
        val user = async { userService.getUser(userId) }
        val orders = async { orderService.getOrders(userId) }
        val preferences = async { prefService.getPreferences(userId) }

        UserProfile(
            user = user.await(),
            orders = orders.await(),
            preferences = preferences.await()
        )
    }
// If any call fails, all others are cancelled. No leaked work.

// BAD — unstructured: leaked coroutine, no cancellation
GlobalScope.launch {
    val user = userService.getUser(userId)  // if this fails...
    val orders = orderService.getOrders(userId)  // this still runs
}
```

### Java Virtual Threads

```java
// Simple, blocking code — but lightweight threads under the hood
try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
    List<Future<UserProfile>> futures = userIds.stream()
        .map(id -> executor.submit(() -> fetchProfile(id)))
        .toList();

    List<UserProfile> profiles = futures.stream()
        .map(f -> {
            try { return f.get(); }
            catch (Exception e) { throw new RuntimeException(e); }
        })
        .toList();
}
// Each virtual thread costs ~1 KB (vs. ~1 MB for platform threads)
// Write blocking code, get non-blocking performance
```

---

## Error Handling Architecture

### The Exception vs. Result Debate

Both approaches are valid in the JVM. Choose one per project and be consistent.

```kotlin
// APPROACH 1: Sealed result types (Kotlin-idiomatic, explicit)
sealed interface Result<out T> {
    data class Success<T>(val value: T) : Result<T>
    data class Failure(val error: DomainError) : Result<Nothing>
}

sealed interface DomainError {
    data class NotFound(val entity: String, val id: String) : DomainError
    data class ValidationFailed(val violations: List<String>) : DomainError
    data class Unauthorized(val reason: String) : DomainError
}

fun findUser(id: UserId): Result<User> =
    repo.findById(id)?.let { Result.Success(it) }
        ?: Result.Failure(DomainError.NotFound("User", id.value))

// APPROACH 2: Exceptions (Java-idiomatic, Spring-friendly)
// Use domain-specific exceptions, never generic ones
class UserNotFoundException(val userId: String) :
    RuntimeException("User not found: $userId")

class ValidationException(val violations: List<String>) :
    RuntimeException("Validation failed: ${violations.joinToString()}")
```

### Exception Hygiene

```kotlin
// NEVER — catching and swallowing
try { riskyOperation() } catch (e: Exception) { }

// NEVER — catching too broadly
try { parseConfig(path) } catch (e: Exception) { useDefaults() }

// GOOD — specific catch, meaningful handling
try {
    parseConfig(path)
} catch (e: FileNotFoundException) {
    logger.warn { "Config not found at $path, using defaults" }
    Config.defaults()
} catch (e: JsonParseException) {
    throw ConfigurationException("Invalid config at $path", e)
}
```

---

## SOLID Applied Practically

### What SOLID Actually Means (Not the Textbook Version)

| Principle | Practical Translation | Go/No-Go Test |
|-----------|----------------------|---------------|
| **Single Responsibility** | A class has one reason to change. Not one method — one *stakeholder* whose requirements drive changes. | Can you describe what this class does without saying "and"? |
| **Open/Closed** | Add new behavior by adding new classes (new sealed subtypes, new interface implementations), not modifying existing ones. | Can you add a new payment method without changing `PaymentService`? |
| **Liskov Substitution** | Subtypes must honor the contract of the parent. If `Square extends Rectangle`, setting width must not silently change height. | Can you substitute any implementation without the caller noticing? |
| **Interface Segregation** | Clients should not depend on methods they do not use. Split large interfaces. | Does any implementation throw `UnsupportedOperationException`? If yes, the interface is too wide. |
| **Dependency Inversion** | High-level modules (domain) depend on abstractions (interfaces), not low-level modules (database, HTTP). | Does your domain layer import Spring, JPA, or Kafka? If yes, the dependency direction is wrong. |

---

## Designing for Testability

### The Test Pyramid

```
                    ┌─────────┐
                    │  E2E    │  Few — expensive, slow, brittle
                    ├─────────┤
                    │ Integr. │  Some — Testcontainers, real DB/Kafka
                    ├─────────┤
                    │  Unit   │  Many — fast, isolated, pure logic
                    └─────────┘
```

### Making Code Testable by Design

```kotlin
// UNTESTABLE — static method, hidden dependency, system clock
fun createOrder(items: List<Item>): Order {
    val total = items.sumOf { PricingService.getPrice(it.sku) }  // static call
    return Order(id = UUID.randomUUID(), items = items, total = total, createdAt = Instant.now())
}

// TESTABLE — injectable dependencies, explicit inputs
class OrderFactory(
    private val pricing: PricingPort,
    private val idGenerator: () -> OrderId = { OrderId(UUID.randomUUID().toString()) },
    private val clock: Clock = Clock.systemUTC()
) {
    fun create(items: List<Item>): Order {
        val total = items.sumOf { pricing.getPrice(it.sku) }
        return Order(
            id = idGenerator(),
            items = items,
            total = total,
            createdAt = Instant.now(clock)
        )
    }
}
```

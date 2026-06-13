# 02 — Languages & Code Standards (Java / Kotlin Edition)

> Reference this file when writing, reviewing, or refactoring Java/Kotlin code.

---

## Primary Language: Kotlin

Kotlin is the default implementation language for new code. It is chosen because:
- Null safety is built into the type system — eliminates the largest category of JVM bugs
- Coroutines provide structured concurrency — simpler than reactive streams, safer than raw threads
- Data classes, sealed hierarchies, and extension functions reduce boilerplate without sacrificing clarity
- Full interop with Java — use any Java library without wrappers
- First-class language for Android (Google-recommended) and server-side (Spring, Ktor)

### Version Target

**Kotlin 2.0+ minimum.** Use modern features actively:

- K2 compiler — faster compilation, improved type inference
- Coroutines with structured concurrency — `coroutineScope`, `supervisorScope`
- Compose Multiplatform — shared UI across Android, Desktop, iOS, Web
- Context receivers (experimental) — scoped dependency provision
- Value classes (`@JvmInline value class`) — zero-overhead domain types
- Sealed interfaces — exhaustive `when` with interface flexibility
- `kotlin.time` — type-safe duration API (`5.seconds`, `100.milliseconds`)
- `buildList`, `buildMap` — builder functions for collections

---

## Secondary Language: Java

**Java 21+ minimum.** Modern Java is a different language from Java 8. Use modern features:

- **Virtual threads** (Project Loom) — lightweight threads for blocking I/O, replacing thread pools
- **Records** — immutable data carriers, replacing boilerplate POJOs
- **Sealed classes/interfaces** — exhaustive hierarchies, replacing marker interfaces
- **Pattern matching** (`instanceof`, `switch`) — replacing verbose type checks and casts
- **Text blocks** (`"""`) — multi-line strings for SQL, JSON, templates
- **Sequenced collections** — `getFirst()`, `getLast()`, `reversed()` on ordered collections
- **`var` type inference** — local variables only, where the type is obvious from the right side
- **Stream API** — declarative collection processing (but know when a `for` loop is clearer)

---

## Non-Negotiable Code Standards

```
ALWAYS                                       NEVER
──────────────────────────────────────────   ────────────────────────────────────────
val over var (Kotlin)                        var for state that doesn't change
data class / record for DTOs                 Map<String, Any> as a data structure
sealed interface for state machines          String constants for state/type encoding
Constructor injection                        Field injection (@Autowired on fields)
Null safety (?, ?., ?:, requireNotNull)      !! in production code
use {} / try-with-resources                  Manual resource cleanup
Coroutines for async (Kotlin)                Raw Thread creation
Virtual threads for blocking I/O (Java)      Platform thread pools for simple I/O
Named arguments for clarity                  Positional args with >3 parameters
Exhaustive when/switch                       Default branches hiding missing cases
Explicit visibility modifiers                Relying on defaults (package-private)
```

---

## Kotlin Code Quality

### Scope Functions Discipline

| Function | Use When | Returns |
|----------|----------|---------|
| `let` | Null-safe chain: `obj?.let { ... }` | Lambda result |
| `run` | Compute a result from an object's context | Lambda result |
| `apply` | Configure an object: builder pattern, initialization | The object |
| `also` | Side effects: logging, validation | The object |
| `with` | Multiple operations on the same object (non-null) | Lambda result |

**Rule**: If nesting scope functions, you have gone too far. Flatten or extract a function.

### Coroutine Discipline

```kotlin
// ALWAYS use structured concurrency
suspend fun processOrders(orders: List<Order>): List<Result> =
    coroutineScope {
        orders.map { order ->
            async { processOrder(order) }
        }.awaitAll()
    }

// NEVER launch unstructured coroutines in business logic
// BAD — fire-and-forget, no lifecycle management
GlobalScope.launch { processOrder(order) }
```

### Extension Functions

```kotlin
// GOOD — utility that reads naturally
fun String.toSlug(): String =
    lowercase()
        .replace(Regex("[^a-z0-9\\s-]"), "")
        .replace(Regex("\\s+"), "-")
        .trim('-')

// BAD — hiding essential logic in extensions
fun HttpRequest.processAndPersist(): Response { ... }
// This hides side effects — should be a service method
```

---

## Java Code Quality

### Modern Idioms

```java
// Records for data — not classes with getters
public record UserDTO(String id, String name, String email) {}

// Sealed interfaces for domain states
public sealed interface PaymentResult
    permits PaymentResult.Success, PaymentResult.Declined, PaymentResult.Error {
    record Success(String transactionId, Money amount) implements PaymentResult {}
    record Declined(String reason) implements PaymentResult {}
    record Error(Exception cause) implements PaymentResult {}
}

// Pattern matching in switch (Java 21+)
String message = switch (result) {
    case Success s -> "Paid: " + s.transactionId();
    case Declined d -> "Declined: " + d.reason();
    case Error e -> "Error: " + e.cause().getMessage();
};

// Virtual threads for blocking I/O
try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
    var futures = urls.stream()
        .map(url -> executor.submit(() -> fetch(url)))
        .toList();
    // ...
}
```

---

## Project Layout

```
myservice/
├── build.gradle.kts                # Root build script (Gradle Kotlin DSL)
├── settings.gradle.kts             # Module declarations, version catalog
├── gradle/
│   └── libs.versions.toml          # Version catalog — single source of truth
├── app/                            # Application module
│   └── src/
│       ├── main/kotlin/
│       │   └── com/example/myservice/
│       │       ├── Application.kt          # Entrypoint — wiring only
│       │       ├── domain/                 # Business types, interfaces, rules
│       │       │   ├── model/
│       │       │   │   ├── User.kt
│       │       │   │   └── Order.kt
│       │       │   └── port/               # Interfaces the domain exposes
│       │       │       ├── UserRepository.kt
│       │       │       └── OrderService.kt
│       │       ├── application/            # Use cases / service implementations
│       │       │   └── OrderServiceImpl.kt
│       │       ├── infrastructure/         # Adapters — DB, HTTP, messaging
│       │       │   ├── persistence/
│       │       │   │   └── JpaUserRepository.kt
│       │       │   ├── web/
│       │       │   │   └── OrderController.kt
│       │       │   └── messaging/
│       │       │       └── KafkaOrderPublisher.kt
│       │       └── config/                 # Spring/DI configuration
│       │           └── AppConfig.kt
│       └── test/kotlin/
│           └── com/example/myservice/
│               ├── domain/                 # Unit tests — no framework deps
│               ├── application/            # Integration tests
│               └── infrastructure/         # Adapter tests (Testcontainers)
├── gradle.properties
└── Makefile
```

Rules:
- `domain/` — pure Kotlin/Java, no framework annotations, no Spring imports
- `domain/port/` — interfaces that business logic depends on (repository, gateway)
- `application/` — use cases that orchestrate domain logic
- `infrastructure/` — adapters that implement ports (database, HTTP, messaging)
- Business logic never imports infrastructure — adapters import domain ports
- Test structure mirrors source structure

---

## Build Tooling

### Gradle Kotlin DSL (Preferred)

```kotlin
// build.gradle.kts
plugins {
    kotlin("jvm") version libs.versions.kotlin
    kotlin("plugin.spring") version libs.versions.kotlin
    id("org.springframework.boot") version libs.versions.springBoot
}

dependencies {
    implementation(libs.spring.boot.starter.web)
    implementation(libs.spring.boot.starter.data.jpa)
    implementation(libs.kotlinx.coroutines.core)

    testImplementation(libs.spring.boot.starter.test)
    testImplementation(libs.kotest.runner.junit5)
    testImplementation(libs.mockk)
    testImplementation(libs.testcontainers.postgresql)
}
```

### Version Catalog

```toml
# gradle/libs.versions.toml
[versions]
kotlin = "2.0.21"
spring-boot = "3.4.1"
coroutines = "1.9.0"
kotest = "5.9.1"

[libraries]
spring-boot-starter-web = { module = "org.springframework.boot:spring-boot-starter-web", version.ref = "spring-boot" }
kotlinx-coroutines-core = { module = "org.jetbrains.kotlinx:kotlinx-coroutines-core", version.ref = "coroutines" }
kotest-runner-junit5 = { module = "io.kotest:kotest-runner-junit5", version.ref = "kotest" }
```

### Required Tools

- **`detekt`** — Kotlin static analysis and linting (replaces manual style reviews)
- **`ktlint`** / `ktfmt` — Kotlin code formatting (pick one, enforce in CI)
- **`ErrorProne`** — Java compile-time bug detection (Google)
- **`Gradle wrapper`** — always commit `gradlew`, never rely on system Gradle
- **`JaCoCo`** — code coverage (aim for >80% on domain and application layers)
- **`ArchUnit`** — architecture rule enforcement in tests (dependency direction, naming)
- **`Flyway` / `Liquibase`** — versioned database migrations (never manual DDL)

---

## Secondary Languages

| Language | Primary Use | Key Discipline |
|----------|------------|----------------|
| **SQL** | Database queries, migrations | Parameterized queries always, Flyway/Liquibase versioned |
| **Groovy** | Legacy Gradle scripts | Migrate to Kotlin DSL for new projects |
| **YAML** | Spring config, Kubernetes manifests | `application.yml` with profiles, schema validation |
| **Protocol Buffers** | gRPC service definitions | Backward-compatible evolution, `buf lint` |
| **Dockerfile** | Container images | Multi-stage builds, JRE-only final image, non-root user |
| **HCL** | Terraform infrastructure | Modules, state management, plan before apply |

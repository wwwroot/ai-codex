# 05 — Research & Invention Method (Java / Kotlin Edition)

> Reference this file when exploring a new idea, prototyping a system, or building something that does not exist yet.

---

## The Java/Kotlin Invention Loop

The JVM ecosystem's maturity changes the invention loop. You rarely build from scratch — you compose, adapt, and extend proven libraries and patterns. The skill is knowing which pieces to assemble and where the boundaries go.

```
IDEA → DOMAIN MODEL → INTERFACE CONTRACTS → PROTOTYPE → TEST → OBSERVE → REFINE
  ↑                                                                         ↓
REFINED IDEA ◄────────────────── LEARNING ◄────────────────────────────────┘
```

The key difference from other ecosystems: the JVM rewards thinking about domain boundaries early. "Where does my domain end and the framework begin?" is not a Phase 2 question — it shapes the initial architecture.

---

## When You Bring a New Idea

### 1. Start with the Domain Model

Before choosing a framework, define the business types:

```kotlin
// Step 1: What are the core entities and value objects?
@JvmInline value class TaskId(val value: String)

data class Task(
    val id: TaskId,
    val title: String,
    val status: TaskStatus,
    val assignee: UserId?,
    val createdAt: Instant
)

sealed interface TaskStatus {
    data object Open : TaskStatus
    data class InProgress(val startedAt: Instant) : TaskStatus
    data class Completed(val completedAt: Instant) : TaskStatus
    data class Cancelled(val reason: String) : TaskStatus
}

// Step 2: What are the business rules?
fun Task.canBeAssigned(): Boolean = status is TaskStatus.Open
fun Task.canBeCancelled(): Boolean = status !is TaskStatus.Completed

// The domain model IS the design. Framework choice follows naturally.
```

### 2. Define the Interface Contracts (Ports)

```kotlin
// Step 3: What does the domain need from the outside world?
interface TaskRepository {
    suspend fun findById(id: TaskId): Task?
    suspend fun save(task: Task): Task
    suspend fun findByAssignee(userId: UserId): List<Task>
}

interface TaskNotifier {
    suspend fun notifyAssigned(task: Task, assignee: UserId)
    suspend fun notifyCompleted(task: Task)
}

// Step 4: What does the domain expose as use cases?
class TaskService(
    private val repo: TaskRepository,
    private val notifier: TaskNotifier,
    private val clock: Clock = Clock.systemUTC()
) {
    suspend fun assign(taskId: TaskId, assignee: UserId): Task {
        val task = repo.findById(taskId)
            ?: throw TaskNotFoundException(taskId)
        require(task.canBeAssigned()) { "Task ${taskId.value} cannot be assigned in state ${task.status}" }

        val updated = task.copy(
            status = TaskStatus.InProgress(Instant.now(clock)),
            assignee = assignee
        )
        repo.save(updated)
        notifier.notifyAssigned(updated, assignee)
        return updated
    }
}
```

### 3. Build the Minimum Viable Service

```kotlin
// Prototype: in-memory repository, Spring Boot HTTP API
// This is a running service in under 100 lines

@SpringBootApplication
class TaskApp

fun main(args: Array<String>) {
    runApplication<TaskApp>(*args)
}

@RestController
@RequestMapping("/api/v1/tasks")
class TaskController(private val service: TaskService) {

    @PostMapping("/{id}/assign")
    fun assign(
        @PathVariable id: String,
        @RequestBody body: AssignRequest
    ): ResponseEntity<TaskDTO> {
        val task = runBlocking { service.assign(TaskId(id), UserId(body.userId)) }
        return ResponseEntity.ok(task.toDTO())
    }
}

// In-memory adapter for prototyping
class InMemoryTaskRepository : TaskRepository {
    private val store = ConcurrentHashMap<TaskId, Task>()

    override suspend fun findById(id: TaskId): Task? = store[id]
    override suspend fun save(task: Task): Task { store[task.id] = task; return task }
    override suspend fun findByAssignee(userId: UserId): List<Task> =
        store.values.filter { it.assignee == userId }
}
```

### 4. Test the Critical Path

```kotlin
class TaskServiceTest {

    private val repo = InMemoryTaskRepository()
    private val notifier = FakeTaskNotifier()
    private val clock = Clock.fixed(Instant.parse("2024-06-01T10:00:00Z"), ZoneOffset.UTC)
    private val service = TaskService(repo, notifier, clock)

    @Test
    fun `assigning an open task transitions to in-progress`() = runTest {
        val task = repo.save(Task(TaskId("1"), "Fix bug", TaskStatus.Open, null, Instant.now(clock)))

        val result = service.assign(task.id, UserId("alice"))

        assertThat(result.status).isInstanceOf(TaskStatus.InProgress::class.java)
        assertThat(result.assignee).isEqualTo(UserId("alice"))
        assertThat(notifier.notifications).hasSize(1)
    }

    @Test
    fun `assigning a completed task throws`() = runTest {
        val task = repo.save(
            Task(TaskId("2"), "Done", TaskStatus.Completed(Instant.now(clock)), null, Instant.now(clock))
        )

        assertThrows<IllegalArgumentException> {
            service.assign(task.id, UserId("bob"))
        }
    }
}
```

### 5. Swap Implementations

JVM interfaces make this mechanical:

```kotlin
// Phase 1: In-memory (prototype)
val repo: TaskRepository = InMemoryTaskRepository()

// Phase 2: JPA/PostgreSQL (persistent)
val repo: TaskRepository = JpaTaskRepository(entityManager)

// Phase 3: Exposed + connection pool (Kotlin-native)
val repo: TaskRepository = ExposedTaskRepository(database)

// The service code does not change — it depends on the interface.
```

---

## Prototype Philosophy on the JVM

### What a JVM prototype IS allowed to be

- **Using Spring Boot DevTools** — hot reload for fast feedback loops
- **In-memory data structures** — `ConcurrentHashMap`, mutable lists, prove the logic first
- **Single-module project** — no multi-module until you know the boundaries
- **Hardcoded configuration** — `application-dev.yml` with localhost URLs
- **H2 in-memory database** — prove JPA mappings before committing to Postgres
- **`runBlocking` in controllers** — acceptable in prototype, replace with proper async later
- **No authentication** — add security after the domain logic is validated

### What a JVM prototype is NOT allowed to be

- **Ignoring nullability** — `!!` in Kotlin hides real design problems, even in prototypes
- **Swallowing exceptions** — `catch (e: Exception) {}` hides bugs. Log or rethrow.
- **Using `Any` / `Object` where types should exist** — `Map<String, Any>` is not a data model
- **Missing domain types** — if you pass raw `String` for IDs and amounts in the prototype, you will never fix it later
- **Field injection** — constructor injection from day one, or testing becomes impossible
- **No tests** — at least test the domain logic. "I'll add tests later" means "never."

### The Prototype → Production Checklist

1. **Replace in-memory with persistent storage** — JPA/PostgreSQL, Exposed, or jOOQ
2. **Add structured logging** — SLF4J + Logback with JSON encoder, MDC for request context
3. **Add metrics** — Micrometer with Prometheus endpoint, custom counters/histograms
4. **Add health checks** — Spring Actuator `/liveness` and `/readiness` probes
5. **Add security** — Spring Security with OAuth2/JWT, CORS configuration
6. **Add input validation** — Bean Validation (`@Valid`), domain-level `require()` / `check()`
7. **Add resilience** — Resilience4j circuit breakers, retries, timeouts
8. **Add integration tests** — Testcontainers with real PostgreSQL, Kafka
9. **Add architecture tests** — ArchUnit to enforce dependency rules
10. **Write the Dockerfile** — multi-stage build, JRE-only final image, non-root user
11. **Write the Kubernetes manifest** — deployment, service, health probes, resource limits
12. **Configure CI/CD** — Gradle build, detekt, tests, Docker build, deploy

---

## Research Patterns on the JVM

### Exploring an Unknown Domain

#### Layer 1 — Find the JVM Ecosystem

- Is there a Spring Boot starter for this? (Check spring.io/projects)
- Is there a Kotlin-first library? (Check kotlinlang.org/docs/multiplatform-libraries.html, GitHub)
- What does Maven Central show? (Search, check recent releases, download counts)
- Is the library actively maintained? (Last release, open issues, Java/Kotlin version support)
- What is the transitive dependency footprint? (`./gradlew dependencies --configuration runtimeClasspath`)

#### Layer 2 — Understand JVM Idioms for This Domain

- How do mature JVM projects structure this? (Check Spring samples, JetBrains examples)
- What interfaces does the ecosystem share? (`DataSource`, `Connection`, `Repository`, `Handler`)
- What is the standard error handling pattern? (Exceptions vs. sealed types)
- Is there a reactive vs. blocking divide? (WebFlux vs. WebMVC, coroutines vs. virtual threads)

#### Layer 3 — Operational Requirements

- How is this deployed? (JAR, Docker container, native image, serverless)
- How is it monitored? (Micrometer metrics, Spring Actuator, distributed tracing)
- What JVM flags matter? (`-XX:+UseZGC`, `-XX:MaxRAMPercentage`, `-XX:+HeapDumpOnOutOfMemoryError`)
- How does it handle graceful shutdown? (Spring lifecycle, `@PreDestroy`, shutdown hooks)

#### Layer 4 — Performance Boundaries

- What is the bottleneck? (CPU, memory, GC, I/O, thread contention)
- What does JFR (Java Flight Recorder) show? (`-XX:StartFlightRecording`)
- Can hot paths avoid allocations? (Object pooling, primitive specialization)
- Is GC tuning needed? (ZGC for low-latency, G1 for throughput)

---

## Documentation Pattern for JVM Ideas

Every prototype gets an Architecture Decision Record:

```markdown
## ADR-001: [Decision Title]

**Status**: Proposed | Accepted | Deprecated | Superseded

**Context**: [What is the problem or requirement?]

**Decision**: [What was decided and why?]

**Consequences**:
- [Positive consequence]
- [Negative consequence / trade-off]
- [Risk to monitor]

**Alternatives Considered**:
1. [Alternative A] — rejected because [reason]
2. [Alternative B] — rejected because [reason]
```

And a module structure that reflects the prototype status:

```
myproject/
├── app/                        # Main service
│   └── src/main/kotlin/
├── experiments/                # Prototypes — separate module
│   └── src/main/kotlin/
│       └── com/example/experiment/
│           ├── Experiment.kt
│           └── ExperimentTest.kt
└── docs/
    └── adr/
        ├── 001-choose-database.md
        └── 002-event-sourcing-vs-crud.md
```

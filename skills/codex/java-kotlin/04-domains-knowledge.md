# 04 — Deep Domain Knowledge (Java / Kotlin Edition)

> Reference knowledge across key technical domains. Applied contextually — not forced where irrelevant.

---

## Spring Boot 3+

### Application Bootstrap

```kotlin
@SpringBootApplication
class MyServiceApplication

fun main(args: Array<String>) {
    runApplication<MyServiceApplication>(*args)
}
```

### REST Controllers (WebMVC)

```kotlin
@RestController
@RequestMapping("/api/v1/users")
class UserController(
    private val userService: UserService  // constructor injection — no @Autowired
) {
    @GetMapping("/{id}")
    fun getUser(@PathVariable id: String): ResponseEntity<UserDTO> {
        val user = userService.findById(UserId(id))
            ?: return ResponseEntity.notFound().build()
        return ResponseEntity.ok(user.toDTO())
    }

    @PostMapping
    fun createUser(@Valid @RequestBody request: CreateUserRequest): ResponseEntity<UserDTO> {
        val user = userService.create(request.toDomain())
        return ResponseEntity
            .created(URI.create("/api/v1/users/${user.id.value}"))
            .body(user.toDTO())
    }

    @ExceptionHandler(ValidationException::class)
    fun handleValidation(e: ValidationException): ResponseEntity<ErrorResponse> =
        ResponseEntity.badRequest().body(ErrorResponse(e.violations))
}
```

### Spring Security (JWT Example)

```kotlin
@Configuration
@EnableWebSecurity
class SecurityConfig {

    @Bean
    fun securityFilterChain(http: HttpSecurity): SecurityFilterChain =
        http
            .csrf { it.disable() }
            .sessionManagement { it.sessionCreationPolicy(SessionCreationPolicy.STATELESS) }
            .authorizeHttpRequests {
                it.requestMatchers("/api/v1/public/**").permitAll()
                it.requestMatchers("/actuator/health").permitAll()
                it.anyRequest().authenticated()
            }
            .oauth2ResourceServer { it.jwt(Customizer.withDefaults()) }
            .build()
}
```

### Spring Data JPA

```kotlin
@Entity
@Table(name = "users")
class UserEntity(
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    val id: String? = null,

    @Column(nullable = false, unique = true)
    val email: String,

    @Column(nullable = false)
    val name: String,

    @Column(nullable = false)
    val createdAt: Instant = Instant.now()
)

interface UserJpaRepository : JpaRepository<UserEntity, String> {
    fun findByEmail(email: String): UserEntity?

    @Query("SELECT u FROM UserEntity u WHERE u.createdAt > :since ORDER BY u.createdAt DESC")
    fun findRecentUsers(@Param("since") since: Instant): List<UserEntity>
}

// Adapter implementing domain port
@Repository
class JpaUserRepository(
    private val jpa: UserJpaRepository
) : UserRepository {
    override fun findById(id: UserId): User? =
        jpa.findById(id.value).orElse(null)?.toDomain()

    override fun save(user: User): User =
        jpa.save(user.toEntity()).toDomain()
}
```

### Actuator & Health

```yaml
# application.yml
management:
  endpoints:
    web:
      exposure:
        include: health, info, prometheus, metrics
  endpoint:
    health:
      show-details: when-authorized
      probes:
        enabled: true  # /actuator/health/liveness, /actuator/health/readiness
```

### GraalVM Native Images

```kotlin
// build.gradle.kts
plugins {
    id("org.graalvm.buildtools.native") version "0.10.4"
}

graalvmNative {
    binaries {
        named("main") {
            imageName.set("myservice")
            buildArgs.add("--no-fallback")
        }
    }
}
// Build: ./gradlew nativeCompile
// Result: single binary, ~50ms startup, ~50MB memory
```

---

## Android & Jetpack Compose

### Compose UI

```kotlin
@Composable
fun UserProfileScreen(
    viewModel: UserProfileViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()

    when (val state = uiState) {
        is UiState.Loading -> LoadingIndicator()
        is UiState.Error -> ErrorMessage(state.message, onRetry = viewModel::retry)
        is UiState.Success -> UserProfileContent(state.profile)
    }
}

@Composable
private fun UserProfileContent(profile: UserProfile) {
    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(16.dp)
    ) {
        item {
            Text(
                text = profile.name,
                style = MaterialTheme.typography.headlineMedium
            )
        }
        items(profile.orders) { order ->
            OrderCard(order = order)
        }
    }
}
```

### ViewModel with Coroutines

```kotlin
@HiltViewModel
class UserProfileViewModel @Inject constructor(
    private val userRepository: UserRepository,
    savedStateHandle: SavedStateHandle
) : ViewModel() {

    private val userId: String = savedStateHandle.get<String>("userId")
        ?: throw IllegalArgumentException("userId required")

    private val _uiState = MutableStateFlow<UiState<UserProfile>>(UiState.Loading)
    val uiState: StateFlow<UiState<UserProfile>> = _uiState.asStateFlow()

    init { loadProfile() }

    fun retry() = loadProfile()

    private fun loadProfile() {
        viewModelScope.launch {
            _uiState.value = UiState.Loading
            _uiState.value = try {
                UiState.Success(userRepository.getProfile(userId))
            } catch (e: Exception) {
                UiState.Error(e.message ?: "Unknown error")
            }
        }
    }
}

sealed interface UiState<out T> {
    data object Loading : UiState<Nothing>
    data class Success<T>(val data: T) : UiState<T>
    data class Error(val message: String) : UiState<Nothing>
}
```

### Room Database

```kotlin
@Entity(tableName = "users")
data class UserEntity(
    @PrimaryKey val id: String,
    val name: String,
    val email: String,
    @ColumnInfo(name = "created_at") val createdAt: Long
)

@Dao
interface UserDao {
    @Query("SELECT * FROM users WHERE id = :id")
    suspend fun getById(id: String): UserEntity?

    @Query("SELECT * FROM users ORDER BY created_at DESC")
    fun observeAll(): Flow<List<UserEntity>>

    @Upsert
    suspend fun upsert(user: UserEntity)
}

@Database(entities = [UserEntity::class], version = 1)
abstract class AppDatabase : RoomDatabase() {
    abstract fun userDao(): UserDao
}
```

### Hilt Dependency Injection

```kotlin
@Module
@InstallIn(SingletonComponent::class)
object AppModule {

    @Provides
    @Singleton
    fun provideDatabase(@ApplicationContext context: Context): AppDatabase =
        Room.databaseBuilder(context, AppDatabase::class.java, "app.db")
            .fallbackToDestructiveMigration()
            .build()

    @Provides
    fun provideUserDao(db: AppDatabase): UserDao = db.userDao()
}

@Module
@InstallIn(SingletonComponent::class)
abstract class RepositoryModule {
    @Binds
    abstract fun bindUserRepository(impl: UserRepositoryImpl): UserRepository
}
```

---

## Microservices

### Circuit Breaker (Resilience4j)

```kotlin
@CircuitBreaker(name = "paymentService", fallbackMethod = "paymentFallback")
@Retry(name = "paymentService")
@TimeLimiter(name = "paymentService")
suspend fun processPayment(request: PaymentRequest): PaymentResult {
    return paymentClient.charge(request)
}

fun paymentFallback(request: PaymentRequest, ex: Exception): PaymentResult {
    logger.warn(ex) { "Payment service unavailable, queuing for retry" }
    return PaymentResult.Queued(request.orderId)
}
```

```yaml
# application.yml
resilience4j:
  circuitbreaker:
    instances:
      paymentService:
        sliding-window-size: 10
        failure-rate-threshold: 50
        wait-duration-in-open-state: 10s
        permitted-number-of-calls-in-half-open-state: 3
  retry:
    instances:
      paymentService:
        max-attempts: 3
        wait-duration: 500ms
        exponential-backoff-multiplier: 2
```

### Distributed Tracing (Micrometer + OpenTelemetry)

```kotlin
// Spring Boot 3+ with Micrometer Tracing
// build.gradle.kts
dependencies {
    implementation("io.micrometer:micrometer-tracing-bridge-otel")
    implementation("io.opentelemetry:opentelemetry-exporter-otlp")
}

// Automatic trace propagation across:
// - HTTP calls (RestClient, WebClient)
// - Kafka messages
// - Database queries
// - Custom spans via ObservationRegistry
```

---

## Event-Driven Systems

### Kafka Producer/Consumer (Spring Kafka)

```kotlin
// Producer
@Component
class OrderEventPublisher(
    private val kafkaTemplate: KafkaTemplate<String, OrderEvent>
) {
    suspend fun publish(event: OrderEvent) {
        kafkaTemplate.send("order-events", event.orderId, event)
            .get()  // or .await() with coroutines adapter
        logger.info { "Published ${event::class.simpleName} for order ${event.orderId}" }
    }
}

// Consumer
@Component
class OrderEventConsumer(
    private val orderService: OrderService
) {
    @KafkaListener(
        topics = ["order-events"],
        groupId = "order-processor",
        containerFactory = "kafkaListenerContainerFactory"
    )
    fun handle(event: OrderEvent) {
        when (event) {
            is OrderCreated -> orderService.processNewOrder(event)
            is OrderPaid -> orderService.fulfillOrder(event)
            is OrderCancelled -> orderService.cancelOrder(event)
        }
    }
}

// Event types
sealed interface OrderEvent {
    val orderId: String
    val occurredAt: Instant
}

data class OrderCreated(
    override val orderId: String,
    val items: List<OrderItem>,
    override val occurredAt: Instant = Instant.now()
) : OrderEvent
```

### Idempotent Consumer Pattern

```kotlin
@Component
class IdempotentConsumer(
    private val processedEvents: ProcessedEventRepository
) {
    fun <T> processOnce(eventId: String, block: () -> T): T? {
        if (processedEvents.exists(eventId)) {
            logger.info { "Event $eventId already processed, skipping" }
            return null
        }
        val result = block()
        processedEvents.markProcessed(eventId)
        return result
    }
}
```

---

## Database Patterns

### JPA/Hibernate Best Practices

```kotlin
// AVOID N+1 — use entity graphs or fetch joins
@EntityGraph(attributePaths = ["orders", "orders.items"])
fun findWithOrdersById(id: String): UserEntity?

// Or explicit JPQL fetch join
@Query("SELECT u FROM UserEntity u LEFT JOIN FETCH u.orders WHERE u.id = :id")
fun findWithOrdersFetch(@Param("id") id: String): UserEntity?

// Prefer projections for read-only queries
interface UserSummary {
    val id: String
    val name: String
    val orderCount: Long
}

@Query("SELECT u.id as id, u.name as name, COUNT(o) as orderCount " +
       "FROM UserEntity u LEFT JOIN u.orders o GROUP BY u.id, u.name")
fun findAllSummaries(): List<UserSummary>
```

### Exposed (Kotlin SQL Framework)

```kotlin
object Users : Table("users") {
    val id = varchar("id", 36)
    val name = varchar("name", 255)
    val email = varchar("email", 255).uniqueIndex()
    val createdAt = timestamp("created_at").defaultExpression(CurrentTimestamp)
    override val primaryKey = PrimaryKey(id)
}

// Type-safe queries
suspend fun findByEmail(email: String): User? = dbQuery {
    Users.selectAll().where { Users.email eq email }
        .singleOrNull()
        ?.toUser()
}

suspend fun <T> dbQuery(block: suspend () -> T): T =
    newSuspendedTransaction(Dispatchers.IO) { block() }
```

### Flyway Migrations

```sql
-- V1__create_users_table.sql
CREATE TABLE users (
    id         VARCHAR(36)  PRIMARY KEY,
    name       VARCHAR(255) NOT NULL,
    email      VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);

-- V2__add_user_role.sql
ALTER TABLE users ADD COLUMN role VARCHAR(50) NOT NULL DEFAULT 'USER';
```

---

## Testing Patterns

### JUnit 5 + Kotest

```kotlin
// JUnit 5 — standard, Spring-compatible
class OrderServiceTest {

    private val repo = FakeOrderRepository()
    private val notifier = FakeNotifier()
    private val service = OrderService(repo, notifier)

    @Test
    fun `creating an order with valid items returns confirmed order`() {
        val result = service.create(listOf(OrderItem("SKU-1", quantity = 2)))

        assertThat(result).isInstanceOf(OrderResult.Confirmed::class.java)
        assertThat(repo.savedOrders).hasSize(1)
        assertThat(notifier.sentNotifications).hasSize(1)
    }

    @Test
    fun `creating an order with empty items returns validation error`() {
        val result = service.create(emptyList())

        assertThat(result).isInstanceOf(OrderResult.ValidationFailed::class.java)
        assertThat(repo.savedOrders).isEmpty()
    }
}
```

### Testcontainers

```kotlin
@Testcontainers
@SpringBootTest
class UserRepositoryIntegrationTest {

    companion object {
        @Container
        val postgres = PostgreSQLContainer("postgres:16-alpine")
            .withDatabaseName("test")

        @JvmStatic
        @DynamicPropertySource
        fun configureProperties(registry: DynamicPropertyRegistry) {
            registry.add("spring.datasource.url", postgres::getJdbcUrl)
            registry.add("spring.datasource.username", postgres::getUsername)
            registry.add("spring.datasource.password", postgres::getPassword)
        }
    }

    @Autowired
    private lateinit var repository: UserRepository

    @Test
    fun `save and retrieve user`() {
        val user = User(name = "Alice", email = Email.parse("alice@example.com"))
        val saved = repository.save(user)
        val found = repository.findById(saved.id)

        assertThat(found).isNotNull
        assertThat(found!!.email).isEqualTo(user.email)
    }
}
```

### ArchUnit — Architecture Rules as Tests

```kotlin
class ArchitectureTest {

    private val classes = ClassFileImporter().importPackages("com.example.myservice")

    @Test
    fun `domain layer does not depend on infrastructure`() {
        noClasses().that().resideInAPackage("..domain..")
            .should().dependOnClassesThat().resideInAPackage("..infrastructure..")
            .check(classes)
    }

    @Test
    fun `controllers do not access repositories directly`() {
        noClasses().that().resideInAPackage("..web..")
            .should().dependOnClassesThat().resideInAPackage("..persistence..")
            .check(classes)
    }

    @Test
    fun `domain model classes are immutable`() {
        classes().that().resideInAPackage("..domain.model..")
            .should().haveOnlyFinalFields()
            .check(classes)
    }
}
```

---

## Build & Deployment

### Dockerfile (Multi-Stage)

```dockerfile
# Build stage
FROM eclipse-temurin:21-jdk-alpine AS build
WORKDIR /app
COPY gradle/ gradle/
COPY gradlew build.gradle.kts settings.gradle.kts ./
RUN ./gradlew dependencies --no-daemon
COPY src/ src/
RUN ./gradlew bootJar --no-daemon -x test

# Runtime stage
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
COPY --from=build /app/build/libs/*.jar app.jar
USER appuser
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://localhost:8080/actuator/health/liveness || exit 1
ENTRYPOINT ["java", "-XX:+UseZGC", "-XX:MaxRAMPercentage=75.0", "-jar", "app.jar"]
```

### Kubernetes Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myservice
spec:
  replicas: 3
  selector:
    matchLabels:
      app: myservice
  template:
    spec:
      containers:
        - name: myservice
          image: myservice:latest
          ports:
            - containerPort: 8080
          resources:
            requests:
              memory: "256Mi"
              cpu: "250m"
            limits:
              memory: "512Mi"
              cpu: "1000m"
          livenessProbe:
            httpGet:
              path: /actuator/health/liveness
              port: 8080
            initialDelaySeconds: 15
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /actuator/health/readiness
              port: 8080
            initialDelaySeconds: 10
            periodSeconds: 5
          env:
            - name: SPRING_PROFILES_ACTIVE
              value: "production"
            - name: JAVA_TOOL_OPTIONS
              value: "-XX:+UseZGC -XX:MaxRAMPercentage=75.0"
```

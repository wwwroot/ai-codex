# 02 — Language Standards (PHP Edition)

> Reference this file when writing, reviewing, or refactoring PHP code.

---

## Version Target

**PHP 8.3+ by default.** Use modern features intentionally:

- `enum` for finite sets of values — replaces class constants and string comparisons
- `readonly class` and `readonly` properties for immutable data objects
- Union types (`string|int`) and intersection types (`Countable&Iterator`) for precise contracts
- Named arguments for self-documenting function calls
- `match` expression instead of `switch` — strict comparison, returns a value, no fallthrough
- Fibers for cooperative multitasking and async patterns
- First-class callable syntax `strlen(...)` for clean functional programming
- `#[Override]` attribute to catch parent method signature changes
- `#[\SensitiveParameter]` to protect secrets in stack traces
- Typed class constants (PHP 8.3)
- `json_validate()` for cheap JSON validation without decoding (PHP 8.3)

---

## Code Standards

### Always

```php
<?php

declare(strict_types=1);

// Full type declarations on all functions and methods
function processItems(array $items, int $limit = 100): array
{
    // ...
}

// Readonly DTOs for data transfer
final readonly class CreateUserRequest
{
    public function __construct(
        public string $name,
        public string $email,
        public UserRole $role = UserRole::Viewer,
    ) {}
}

// Enums for finite value sets
enum UserRole: string
{
    case Admin = 'admin';
    case Editor = 'editor';
    case Viewer = 'viewer';
}

// match() over switch — strict, expression-based, no fallthrough
$label = match ($status) {
    Status::Active => 'Active',
    Status::Inactive => 'Inactive',
    Status::Suspended => 'Suspended',
};

// Named arguments for clarity
$response = new JsonResponse(
    data: $payload,
    status: 201,
    headers: ['X-Request-Id' => $requestId],
);

// Null-safe operator for safe method chaining
$city = $user?->getAddress()?->getCity();

// Array unpacking and first-class callables
$names = array_map(
    $this->formatName(...),
    $users,
);

// Early returns to reduce nesting
function findUser(int $id): User
{
    $user = $this->repository->find($id);
    if ($user === null) {
        throw new UserNotFoundException($id);
    }
    return $user;
}
```

### Never

```php
<?php

// Suppressing errors — fix the cause
$value = @file_get_contents($path);          // WRONG
$value = file_get_contents($path);           // RIGHT — handle the false return
if ($value === false) {
    throw new FileReadException($path);
}

// extract() — destroys readability, creates unknown variables
extract($_POST);                              // WRONG — security nightmare
$name = $_POST['name'] ?? '';                // RIGHT — explicit access

// Loose comparison — type coercion bugs
if ($value == '0') { ... }                   // WRONG — '' == '0' is false, 0 == '0' is true
if ($value === '0') { ... }                  // RIGHT — strict comparison

// Mutable singletons and global state
global $db;                                   // WRONG
function __construct(private Database $db)    // RIGHT — dependency injection

// Unparameterized queries
$db->query("SELECT * FROM users WHERE id = $id");   // WRONG — SQL injection
$db->prepare("SELECT * FROM users WHERE id = ?");   // RIGHT — parameterized
$stmt->execute([$id]);

// Mixed return types without union declarations
function find($id) { ... }                   // WRONG — what does this return?
function find(int $id): ?User { ... }        // RIGHT — explicit nullable return
```

---

## Type System

### Strict Mode Required

Always configure PHPStan or Psalm at maximum level:

```neon
# phpstan.neon
parameters:
    level: max
    paths:
        - src
    treatPhpDocTypesAsCertain: false
    reportUnmatchedIgnoredErrors: true
    checkGenericClassInNonGenericObjectType: true
```

### Key Typing Patterns

```php
<?php

declare(strict_types=1);

// Value Objects — immutable, validated at construction
final readonly class EmailAddress
{
    public string $value;

    public function __construct(string $value)
    {
        if (!filter_var($value, FILTER_VALIDATE_EMAIL)) {
            throw new InvalidArgumentException("Invalid email: {$value}");
        }
        $this->value = $value;
    }

    public function equals(self $other): bool
    {
        return $this->value === $other->value;
    }
}

// Interfaces for contracts — depend on abstractions
interface UserRepository
{
    public function find(int $id): ?User;
    public function save(User $user): void;
    /** @return list<User> */
    public function findByRole(UserRole $role): array;
}

// Generics via PHPDoc (until native generics arrive)
/**
 * @template T
 * @param list<T> $items
 * @param callable(T): bool $predicate
 * @return list<T>
 */
function filter(array $items, callable $predicate): array
{
    return array_values(array_filter($items, $predicate));
}

// Result pattern for operations that can fail
final readonly class Result
{
    private function __construct(
        public bool $success,
        public mixed $value = null,
        public ?string $error = null,
    ) {}

    public static function ok(mixed $value): self
    {
        return new self(success: true, value: $value);
    }

    public static function fail(string $error): self
    {
        return new self(success: false, error: $error);
    }
}

// Enum with methods — behavior attached to finite values
enum HttpMethod: string
{
    case Get = 'GET';
    case Post = 'POST';
    case Put = 'PUT';
    case Delete = 'DELETE';
    case Patch = 'PATCH';

    public function isIdempotent(): bool
    {
        return match ($this) {
            self::Get, self::Put, self::Delete => true,
            self::Post, self::Patch => false,
        };
    }
}
```

---

## Architecture Principles

- **Flat over nested** — maximum 2 levels of nesting in any function. Use early returns and guard clauses
- **Composition over inheritance** — use interfaces, traits (sparingly), and dependency injection. Not deep class hierarchies
- **Explicit dependency injection** — all dependencies injected via constructor. Never use `new` for services inside other services
- **Single responsibility** — one class does one thing. If you need "and" to describe it, split it
- **Fail fast and loudly** — validate inputs at the boundary, throw specific exceptions immediately
- **Immutable data where possible** — `readonly` classes for DTOs and value objects
- **Namespace structure mirrors domain** — `App\Order\PlaceOrderHandler`, not `App\Handlers\OrderHandler`

---

## Project Tooling Standards

| Tool | Purpose | Config |
|------|---------|--------|
| `composer` | Dependency management | `composer.json`, autoload PSR-4 |
| `PHPStan` or `Psalm` | Static analysis | level max, strict mode |
| `PHP CS Fixer` or `Pint` | Code formatting | PSR-12 + strict rules |
| `PHPUnit` or `Pest` | Testing framework | `phpunit.xml` |
| `Rector` | Automated refactoring & upgrades | `rector.php` |
| `Xdebug` | Debugging & profiling | `xdebug.ini` |
| `Blackfire` | Production profiling | `.blackfire.yaml` |

```json
// composer.json — essential scripts
{
    "scripts": {
        "test": "phpunit",
        "analyse": "phpstan analyse",
        "format": "php-cs-fixer fix",
        "check": [
            "@analyse",
            "@test"
        ]
    }
}
```

---

## PSR Standards Compliance

| PSR | Name | Status |
|-----|------|--------|
| PSR-1 | Basic Coding Standard | Always follow |
| PSR-4 | Autoloading | Always follow |
| PSR-7 | HTTP Message Interfaces | Use for HTTP abstraction |
| PSR-11 | Container Interface | Use for DI containers |
| PSR-12 | Extended Coding Style | Always follow |
| PSR-14 | Event Dispatcher | Use for event systems |
| PSR-15 | HTTP Server Request Handlers | Use for middleware |
| PSR-18 | HTTP Client | Use for HTTP clients |

# 03 — First Principles Thinking (PHP Edition)

> Reference this file when exploring new ideas, designing systems, or solving hard problems in PHP.

---

## The Core Question

Before writing any PHP code, ask:

> **"What is the simplest, most correct model of this problem?"**

Not the fastest to implement. Not the most familiar pattern. The most *correct* model — the one that reflects the true structure of the problem and survives production traffic.

---

## Decomposition Method

Break every problem into three layers:

### 1. What is the data?

Define the data model before writing any logic. Use types to make the domain explicit:

```php
<?php

declare(strict_types=1);

// Bad — data is implicit in associative arrays
function processOrder(array $data): array
{
    // What keys? What types? Who knows.
    return ['status' => 'ok'];
}

// Good — data model is explicit and typed
final readonly class Order
{
    public function __construct(
        public int $id,
        public CustomerId $customerId,
        public OrderStatus $status,
        /** @var list<OrderLine> */
        public array $lines,
        public DateTimeImmutable $createdAt,
    ) {}

    public function total(): Money
    {
        return array_reduce(
            $this->lines,
            fn (Money $carry, OrderLine $line) => $carry->add($line->subtotal()),
            Money::zero('USD'),
        );
    }
}

final readonly class OrderLine
{
    public function __construct(
        public ProductId $productId,
        public int $quantity,
        public Money $unitPrice,
    ) {}

    public function subtotal(): Money
    {
        return $this->unitPrice->multiply($this->quantity);
    }
}
```

### 2. What are the transformations?

Pure functions and services that transform data — no side effects, no I/O, fully testable:

```php
<?php

declare(strict_types=1);

// Pure transformation — easy to test, easy to reason about
final class OrderPricing
{
    public function applyDiscount(Order $order, Discount $discount): Money
    {
        $total = $order->total();
        return match ($discount->type) {
            DiscountType::Percentage => $total->multiply(1 - $discount->value / 100),
            DiscountType::FixedAmount => $total->subtract(Money::of($discount->value, $total->currency)),
        };
    }
}
```

### 3. What are the effects?

Database, HTTP, filesystem, queues — isolated at the edges of the system:

```php
<?php

declare(strict_types=1);

// Effects at the boundary — not mixed with business logic
final class PlaceOrderHandler
{
    public function __construct(
        private OrderRepository $orders,
        private PaymentGateway $payments,
        private EventDispatcher $events,
    ) {}

    public function handle(PlaceOrderCommand $command): OrderId
    {
        // 1. Build the domain model (pure)
        $order = Order::create(
            customerId: $command->customerId,
            lines: $command->lines,
        );

        // 2. Execute side effects (boundary)
        $this->payments->charge($order->total(), $command->paymentMethod);
        $this->orders->save($order);
        $this->events->dispatch(new OrderPlaced($order->id));

        return $order->id;
    }
}
```

---

## Request Lifecycle Thinking

PHP's shared-nothing, request-response model is its greatest architectural advantage. Think in these terms:

### The Request Lifecycle

```
Request → Bootstrap → Route → Middleware → Controller → Service → Repository → Response
         (once)       (match)  (cross-cut)  (orchestrate) (logic)   (data)     (output)
```

**Every request is isolated.** No shared state between requests (unless you explicitly create it via sessions, cache, or database). This is a feature, not a limitation:

- No memory leaks between requests (process dies after response)
- No concurrency bugs within a single request (single-threaded)
- Horizontal scaling is trivial (add more workers)
- Deployment is atomic (no graceful restart coordination needed)

### Where State Lives

| State Type | Where It Lives | Example |
|-----------|---------------|---------|
| Request state | Controller / Request object | Current user, input data |
| Session state | Session store (Redis, DB) | Shopping cart, flash messages |
| Application state | Cache (Redis, Memcached) | Config, computed lookups |
| Persistent state | Database | Users, orders, content |
| Shared state | Queue + workers | Background jobs, notifications |

---

## Domain-Driven Design Thinking

For complex domains, think in DDD building blocks:

### Value Objects

Immutable, equality by value, self-validating:

```php
<?php

declare(strict_types=1);

final readonly class Money
{
    public function __construct(
        public int $amount,      // Always store in smallest unit (cents)
        public string $currency, // ISO 4217
    ) {
        if ($amount < 0) {
            throw new InvalidArgumentException('Amount cannot be negative');
        }
    }

    public function add(self $other): self
    {
        if ($this->currency !== $other->currency) {
            throw new CurrencyMismatchException($this->currency, $other->currency);
        }
        return new self($this->amount + $other->amount, $this->currency);
    }

    public function equals(self $other): bool
    {
        return $this->amount === $other->amount && $this->currency === $other->currency;
    }
}
```

### Entities

Identity-based, mutable state, enforce invariants:

```php
<?php

declare(strict_types=1);

final class Subscription
{
    private SubscriptionStatus $status;
    private ?DateTimeImmutable $cancelledAt;

    public function cancel(DateTimeImmutable $now): void
    {
        if ($this->status !== SubscriptionStatus::Active) {
            throw new CannotCancelInactiveSubscription($this->id);
        }
        $this->status = SubscriptionStatus::Cancelled;
        $this->cancelledAt = $now;
    }
}
```

---

## Invention Checklist for New PHP Systems

When starting something that does not exist yet:

1. **Name the problem precisely** — write one sentence describing exactly what this system does
2. **Define inputs and outputs** — as PHP types (DTOs, enums, value objects) before writing any logic
3. **Identify the domain rules** — what invariants must always hold true?
4. **Write the simplest possible version first** — a single controller action that proves the idea works
5. **Identify what will break at scale** — N+1 queries, memory limits, request timeouts, queue backlogs?
6. **Design the abstraction boundary** — what does the caller need to know vs. what is hidden behind an interface?
7. **Write tests before optimization** — you need a correctness baseline before you can safely optimize
8. **Plan the deployment model** — shared hosting, containers, serverless? This affects architecture

---

## Questions That Drive Invention

When exploring a new idea in PHP, always ask:

- Should this be synchronous or queued? What is the user waiting for?
- What is the theoretical minimum number of database queries for this operation?
- Can this be cached? What is the invalidation strategy? What is the stale-data tolerance?
- Where does validation happen — in the controller, the DTO, or the domain model?
- What happens when this endpoint receives 1000 concurrent requests?
- Is this a read-heavy or write-heavy path? The architecture should be different.
- What does the API contract look like — and will it survive v2?

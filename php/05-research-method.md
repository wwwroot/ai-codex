# 05 — Research & Invention Method (PHP Edition)

> Reference this file when exploring a new idea, prototyping a feature, or building something that does not exist yet.

---

## The Invention Loop

Every new idea follows the same loop. Do not skip steps.

```
IDEA → MODEL → PROTOTYPE → MEASURE → REFINE → PRODUCTIONIZE
```

### Step 1: Model the Idea

Before writing code, express the idea as clearly as possible:

- Write a one-paragraph description of what this system does
- Define the API contract — endpoints, request/response shapes, status codes
- Identify the domain rules — what must always be true?
- Name the key unknowns — what do you not know yet?

### Step 2: Minimal Prototype

Write the smallest possible version that tests the core hypothesis:

```php
<?php

declare(strict_types=1);

// Good prototype philosophy:
// - No validation yet (find the happy path first)
// - No error handling yet (prove correctness first)
// - No abstraction yet (understand before you generalize)
// - Hardcoded config is fine (validate the concept, not the deployment)
// - Artisan route closures are fine (validate the API, not the architecture)

use Illuminate\Support\Facades\Route;

Route::post('/api/prototype/search', function (Request $request) {
    $query = $request->input('query');

    // Minimum code to test whether the core idea works
    $results = DB::table('products')
        ->whereFullText('description', $query)
        ->limit(20)
        ->get();

    return response()->json($results);
});
```

### Step 3: Measure Before Optimizing

Never guess where the bottleneck is:

```php
<?php

declare(strict_types=1);

// Quick measurement with Laravel Debugbar
// Install: composer require barryvdh/laravel-debugbar --dev
// Check: query count, execution time, memory usage

// Manual benchmarking for critical operations
$start = hrtime(true);

$result = $this->expensiveOperation($data);

$elapsed = (hrtime(true) - $start) / 1_000_000; // milliseconds
Log::info("Operation completed", [
    'elapsed_ms' => round($elapsed, 2),
    'result_count' => count($result),
    'memory_peak_mb' => round(memory_get_peak_usage(true) / 1024 / 1024, 2),
]);

// Database query logging
DB::enableQueryLog();
$this->complexOperation();
$queries = DB::getQueryLog();
Log::debug('Query analysis', [
    'total_queries' => count($queries),
    'total_time_ms' => array_sum(array_column($queries, 'time')),
    'slowest' => max(array_column($queries, 'time')),
]);
```

### Step 4: Identify the Real Bottleneck

| Bottleneck Type | Signature | Solution |
|----------------|-----------|----------|
| N+1 queries | Many similar queries in log | Eager loading, `->with()` |
| Slow queries | Individual query > 100ms | Add indexes, optimize query, explain plan |
| Memory exhaustion | `Allowed memory size exhausted` | Chunking, lazy collections, generators |
| External API latency | Request waiting on HTTP call | Queue the work, cache the response |
| Serialization overhead | Slow JSON encoding/decoding | Select fewer fields, simplify resource |
| Missing OPcache | Slow bootstrap on every request | Enable OPcache, tune `opcache.max_accelerated_files` |
| Session bottleneck | Lock contention on session store | Use Redis sessions, or disable sessions for API |

### Step 5: Refine With Constraints

Once the prototype works, apply engineering constraints in this order:

1. **Add validation** — Form Requests or manual validation at the entry point
2. **Add type declarations** — strict types on all classes, methods, properties
3. **Extract services** — move business logic out of controllers into dedicated services
4. **Add error handling** — specific exceptions, proper HTTP status codes, error responses
5. **Write tests** — at minimum: happy path, validation failure, edge cases
6. **Measure again** — did refactoring change performance? Did query count change?

---

## Prototyping Patterns

### Artisan Tinker for Quick Exploration

```bash
php artisan tinker

# Quick data exploration
> User::where('role', 'admin')->count();
> Order::with('lines')->find(42)->toArray();
> DB::table('orders')->selectRaw('status, count(*) as total')->groupBy('status')->get();
```

### Single-File Script Prototype

```php
<?php

declare(strict_types=1);

// scripts/prototype-pricing.php
// Run: php scripts/prototype-pricing.php

require __DIR__ . '/../vendor/autoload.php';

// Test the pricing algorithm before wiring it into the framework
$cart = [
    ['product' => 'Widget A', 'price' => 1999, 'qty' => 3],
    ['product' => 'Widget B', 'price' => 4999, 'qty' => 1],
];

function calculateTotal(array $cart, float $discountPercent = 0): int
{
    $subtotal = array_sum(array_map(
        fn (array $item) => $item['price'] * $item['qty'],
        $cart,
    ));

    return (int) round($subtotal * (1 - $discountPercent / 100));
}

// Test cases
assert(calculateTotal($cart) === 10996);
assert(calculateTotal($cart, 10) === 9896);
echo "All assertions passed.\n";
```

### Package Development Prototype

```php
<?php

declare(strict_types=1);

// When building a reusable package, start with the public API:

// 1. Define the interface first — what does the consumer call?
interface RateLimiter
{
    public function attempt(string $key, int $maxAttempts, int $decaySeconds): bool;
    public function remaining(string $key, int $maxAttempts): int;
    public function reset(string $key): void;
}

// 2. Write the simplest implementation
final class InMemoryRateLimiter implements RateLimiter
{
    /** @var array<string, list<float>> */
    private array $attempts = [];

    public function attempt(string $key, int $maxAttempts, int $decaySeconds): bool
    {
        $now = microtime(true);
        $this->attempts[$key] = array_filter(
            $this->attempts[$key] ?? [],
            fn (float $time) => $time > $now - $decaySeconds,
        );

        if (count($this->attempts[$key]) >= $maxAttempts) {
            return false;
        }

        $this->attempts[$key][] = $now;
        return true;
    }

    public function remaining(string $key, int $maxAttempts): int
    {
        return max(0, $maxAttempts - count($this->attempts[$key] ?? []));
    }

    public function reset(string $key): void
    {
        unset($this->attempts[$key]);
    }
}

// 3. Test with the in-memory version before building Redis/database backends
```

### Hypothesis Testing Pattern

```php
<?php

declare(strict_types=1);

$hypothesis = "Full-text search is faster than LIKE queries for product search";

// Benchmark both approaches
function benchmark(callable $fn, int $iterations = 100): float
{
    $times = [];
    for ($i = 0; $i < $iterations; $i++) {
        $start = hrtime(true);
        $fn();
        $times[] = (hrtime(true) - $start) / 1_000_000;
    }
    sort($times);
    // Return median to avoid outlier bias
    return $times[(int) floor(count($times) / 2)];
}

$likeTime = benchmark(fn () => DB::table('products')
    ->where('name', 'LIKE', '%widget%')
    ->get());

$fullTextTime = benchmark(fn () => DB::table('products')
    ->whereFullText('name', 'widget')
    ->get());

$improvement = ($likeTime - $fullTextTime) / $likeTime;
echo sprintf(
    "LIKE: %.2fms | Full-text: %.2fms | Improvement: %.1f%%\n",
    $likeTime,
    $fullTextTime,
    $improvement * 100,
);
```

### Incremental Complexity Pattern

```php
<?php

declare(strict_types=1);

// v1 — Route closure (prove the concept)
Route::get('/api/products/search', function (Request $request) {
    return DB::table('products')->where('name', 'LIKE', "%{$request->q}%")->get();
});

// v2 — Controller + validation (prove the interface)
final class SearchController
{
    public function __invoke(Request $request): JsonResponse
    {
        $validated = $request->validate(['q' => 'required|string|min:2|max:100']);
        $results = Product::where('name', 'LIKE', "%{$validated['q']}%")->paginate(25);
        return ProductResource::collection($results)->response();
    }
}

// v3 — Service + repository (production architecture)
final readonly class ProductSearchService
{
    public function __construct(
        private ProductRepository $products,
        private CacheManager $cache,
    ) {}

    public function search(string $query, int $page = 1): LengthAwarePaginator
    {
        $cacheKey = "product_search:" . md5($query) . ":page:{$page}";

        return $this->cache->remember($cacheKey, 300, fn () =>
            $this->products->fullTextSearch($query, $page),
        );
    }
}
```

---

## Questions for Every New Idea

Before writing a single line of PHP for a new invention:

1. **What problem does this solve that nothing else does?**
2. **What does the API look like — can I write the curl command right now?**
3. **What database schema does this require — can I draw the ERD in under a minute?**
4. **What breaks when traffic grows by 100x?** (Queue it? Cache it? Shard it?)
5. **Is there a Composer package that already does 80% of this?** (Use it, build the 20%)
6. **What would make this idea wrong?** (Test that hypothesis first)
7. **Who is this for?** (API consumer, admin dashboard user, end user, background process?)
8. **What is the deployment story?** (Shared hosting? Docker? Serverless? This matters.)

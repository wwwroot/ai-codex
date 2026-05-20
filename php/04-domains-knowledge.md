# 04 — Domain Knowledge (PHP Edition)

> Reference this file when working in specific PHP domains. Load what is relevant to the current session.

---

## Laravel

### Eloquent ORM

```php
<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Casts\AsCollection;

final class Order extends Model
{
    // Explicit fillable — never use $guarded = []
    protected $fillable = ['customer_id', 'status', 'total_cents'];

    protected function casts(): array
    {
        return [
            'status' => OrderStatus::class,
            'metadata' => AsCollection::class,
            'completed_at' => 'immutable_datetime',
        ];
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function lines(): HasMany
    {
        return $this->hasMany(OrderLine::class);
    }
}

// Eager loading — always prevent N+1
$orders = Order::query()
    ->with(['customer', 'lines.product'])
    ->where('status', OrderStatus::Active)
    ->orderByDesc('created_at')
    ->paginate(25);

// Chunking for large datasets — never load everything into memory
Order::query()
    ->where('status', OrderStatus::Completed)
    ->chunkById(1000, function ($orders) {
        foreach ($orders as $order) {
            // Process each order
        }
    });
```

**Key rules:**
- Always eager load relationships — use `->with()` or configure `$with` on the model
- Use `preventLazyLoading()` in `AppServiceProvider::boot()` during development
- Never use `$guarded = []` — whitelist with `$fillable` always
- Use model casts for enums, dates, and value objects
- Use query scopes for reusable query constraints
- `chunkById()` over `chunk()` for safe iteration during concurrent writes

### Service Container & Dependency Injection

```php
<?php

declare(strict_types=1);

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

final class PaymentServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        // Bind interface to implementation
        $this->app->bind(
            PaymentGateway::class,
            fn () => new StripeGateway(
                apiKey: config('services.stripe.secret'),
                webhookSecret: config('services.stripe.webhook_secret'),
            ),
        );

        // Singleton for expensive-to-create services
        $this->app->singleton(
            InventoryService::class,
            fn ($app) => new InventoryService(
                cache: $app->make(CacheManager::class),
                repository: $app->make(ProductRepository::class),
            ),
        );
    }
}
```

### Queues & Jobs

```php
<?php

declare(strict_types=1);

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Queue\Middleware\WithoutOverlapping;

final class ProcessOrderPayment implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public int $backoff = 60;
    public int $timeout = 120;

    public function __construct(
        private readonly int $orderId,
    ) {}

    /** @return list<object> */
    public function middleware(): array
    {
        return [
            new WithoutOverlapping($this->orderId),
        ];
    }

    public function handle(PaymentGateway $gateway): void
    {
        $order = Order::findOrFail($this->orderId);
        $gateway->charge($order->total(), $order->paymentMethod);
        $order->markAsPaid();
    }

    public function failed(\Throwable $exception): void
    {
        // Notify ops team, update order status
        Log::critical('Payment failed', [
            'order_id' => $this->orderId,
            'error' => $exception->getMessage(),
        ]);
    }
}

// Dispatching
ProcessOrderPayment::dispatch($order->id)
    ->onQueue('payments')
    ->delay(now()->addSeconds(5));
```

**Key rules:**
- Always set `$tries`, `$backoff`, and `$timeout`
- Implement `failed()` for critical jobs
- Use `WithoutOverlapping` to prevent duplicate processing
- Use `ShouldBeUnique` for idempotent jobs
- Monitor with Horizon — never run queue workers blind

### Middleware

```php
<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

final class EnsureApiVersion
{
    public function handle(Request $request, Closure $next): Response
    {
        $version = $request->header('X-API-Version', 'v1');

        if (!in_array($version, ['v1', 'v2'], true)) {
            return response()->json(
                ['error' => 'Unsupported API version'],
                Response::HTTP_BAD_REQUEST,
            );
        }

        $request->attributes->set('api_version', $version);

        return $next($request);
    }
}
```

---

## Symfony

### Service Container & Autowiring

```php
<?php

declare(strict_types=1);

namespace App\Service;

use Symfony\Component\DependencyInjection\Attribute\Autowire;

final readonly class NotificationService
{
    public function __construct(
        private MailerInterface $mailer,
        private LoggerInterface $logger,
        #[Autowire('%app.notification.from_email%')]
        private string $fromEmail,
    ) {}

    public function sendWelcome(User $user): void
    {
        $email = (new Email())
            ->from($this->fromEmail)
            ->to($user->email)
            ->subject('Welcome')
            ->html($this->renderTemplate($user));

        $this->mailer->send($email);
        $this->logger->info('Welcome email sent', ['user_id' => $user->getId()]);
    }
}
```

### Doctrine ORM

```php
<?php

declare(strict_types=1);

namespace App\Entity;

use App\Repository\ProductRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: ProductRepository::class)]
#[ORM\Table(name: 'products')]
#[ORM\Index(columns: ['status', 'category_id'], name: 'idx_status_category')]
class Product
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 255)]
    private string $name;

    #[ORM\Column(type: Types::INTEGER)]
    private int $priceCents;

    #[ORM\Column(enumType: ProductStatus::class)]
    private ProductStatus $status;

    #[ORM\ManyToOne(targetEntity: Category::class)]
    #[ORM\JoinColumn(nullable: false)]
    private Category $category;

    // Domain logic on the entity
    public function publish(): void
    {
        if ($this->priceCents <= 0) {
            throw new \DomainException('Cannot publish product without price');
        }
        $this->status = ProductStatus::Published;
    }
}
```

### Messenger Component

```php
<?php

declare(strict_types=1);

namespace App\Message;

final readonly class SendInvoice
{
    public function __construct(
        public int $orderId,
        public string $recipientEmail,
    ) {}
}

// Handler
namespace App\MessageHandler;

use Symfony\Component\Messenger\Attribute\AsMessageHandler;

#[AsMessageHandler]
final readonly class SendInvoiceHandler
{
    public function __construct(
        private InvoiceGenerator $generator,
        private MailerInterface $mailer,
    ) {}

    public function __invoke(SendInvoice $message): void
    {
        $invoice = $this->generator->generate($message->orderId);
        $this->mailer->send($invoice->toEmail($message->recipientEmail));
    }
}
```

---

## API Development

### RESTful API Design

```php
<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Requests\StoreProductRequest;
use App\Http\Resources\ProductResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Symfony\Component\HttpFoundation\Response;

final class ProductController
{
    public function __construct(
        private readonly ProductService $products,
    ) {}

    public function index(): AnonymousResourceCollection
    {
        $products = $this->products->listActive(
            page: (int) request()->query('page', '1'),
            perPage: min((int) request()->query('per_page', '25'), 100),
        );

        return ProductResource::collection($products);
    }

    public function store(StoreProductRequest $request): JsonResponse
    {
        $product = $this->products->create($request->validated());

        return ProductResource::make($product)
            ->response()
            ->setStatusCode(Response::HTTP_CREATED);
    }

    public function show(int $id): ProductResource
    {
        $product = $this->products->findOrFail($id);

        return ProductResource::make($product);
    }
}
```

### API Resources (Response Transformation)

```php
<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

final class ProductResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'price' => [
                'amount' => $this->price_cents,
                'currency' => 'USD',
                'formatted' => '$' . number_format($this->price_cents / 100, 2),
            ],
            'status' => $this->status->value,
            'category' => CategoryResource::make($this->whenLoaded('category')),
            'created_at' => $this->created_at->toIso8601String(),
            'links' => [
                'self' => route('api.products.show', $this->id),
            ],
        ];
    }
}
```

**Key rules:**
- Always use API Resources — never return Eloquent models directly
- Always validate with Form Requests — never validate in controllers
- Always version your API — `/api/v1/` prefix or header-based
- Always paginate list endpoints — never return unbounded collections
- Always return consistent error formats — use exception handlers
- Use rate limiting on all public endpoints

---

## Database

### Query Optimization

```php
<?php

// WRONG — N+1 query problem
$orders = Order::all();
foreach ($orders as $order) {
    echo $order->customer->name; // One query per order
}

// RIGHT — eager load
$orders = Order::with('customer')->get();

// WRONG — selecting everything when you need two columns
$names = User::all()->pluck('name');

// RIGHT — select only what you need
$names = User::query()->select('id', 'name')->pluck('name', 'id');

// Use database-level operations, not PHP
$total = Order::query()
    ->where('status', OrderStatus::Completed)
    ->sum('total_cents');

// Subqueries for complex aggregations
$users = User::query()
    ->withCount(['orders' => fn ($q) => $q->where('status', OrderStatus::Completed)])
    ->having('orders_count', '>', 5)
    ->get();
```

### Migrations Best Practices

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('customer_id')->constrained()->cascadeOnDelete();
            $table->string('status', 20)->index();
            $table->integer('total_cents')->unsigned();
            $table->json('metadata')->nullable();
            $table->timestamps();

            // Composite index for common queries
            $table->index(['status', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
```

---

## Testing

### PHPUnit / Pest Patterns

```php
<?php

declare(strict_types=1);

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;

final class OrderApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_create_order_returns_201(): void
    {
        $customer = Customer::factory()->create();
        $product = Product::factory()->create(['price_cents' => 1999]);

        $response = $this->postJson('/api/v1/orders', [
            'customer_id' => $customer->id,
            'lines' => [
                ['product_id' => $product->id, 'quantity' => 2],
            ],
        ]);

        $response
            ->assertStatus(201)
            ->assertJsonStructure([
                'data' => ['id', 'status', 'total', 'lines'],
            ]);

        $this->assertDatabaseHas('orders', [
            'customer_id' => $customer->id,
            'status' => 'pending',
        ]);
    }

    public function test_create_order_rejects_invalid_data(): void
    {
        $response = $this->postJson('/api/v1/orders', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['customer_id', 'lines']);
    }
}
```

```php
<?php

// Pest style — same test, less boilerplate
use App\Models\{Customer, Product};

it('creates an order and returns 201', function () {
    $customer = Customer::factory()->create();
    $product = Product::factory()->create(['price_cents' => 1999]);

    $this->postJson('/api/v1/orders', [
        'customer_id' => $customer->id,
        'lines' => [['product_id' => $product->id, 'quantity' => 2]],
    ])
        ->assertStatus(201)
        ->assertJsonStructure(['data' => ['id', 'status', 'total']]);

    expect(Order::count())->toBe(1);
});
```

**Key rules:**
- Use `RefreshDatabase` for feature tests, `DatabaseTransactions` only when you cannot
- One assertion focus per test — test one behavior, assert the relevant outcomes
- Use factories for test data — never insert raw database rows
- Test the HTTP layer for feature tests — `$this->getJson()`, `$this->postJson()`
- Test individual classes in unit tests — mock dependencies with interfaces

---

## Security

### Input Validation

```php
<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

final class StoreProductRequest extends FormRequest
{
    /** @return array<string, list<string>> */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'description' => ['required', 'string', 'max:5000'],
            'price_cents' => ['required', 'integer', 'min:1', 'max:99999999'],
            'category_id' => ['required', 'integer', 'exists:categories,id'],
            'tags' => ['sometimes', 'array', 'max:10'],
            'tags.*' => ['string', 'max:50'],
        ];
    }
}
```

### Output Escaping

```php
<?php
// Blade — auto-escapes by default
{{ $user->name }}              // Escaped — safe
{!! $user->bio !!}             // RAW — only use for trusted, pre-sanitized HTML

// Manual escaping when needed
htmlspecialchars($value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
```

### Authentication Patterns

```php
<?php

// Laravel Sanctum — API token authentication
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', fn (Request $request) => $request->user());
    Route::apiResource('orders', OrderController::class);
});

// Policy-based authorization
Gate::define('update-order', function (User $user, Order $order) {
    return $user->id === $order->customer_id
        || $user->hasRole('admin');
});

// In controller
$this->authorize('update', $order);
```

---

## Performance Tooling

| Profile What | Tool | Method |
|-------------|------|--------|
| Application profiling | Blackfire | `blackfire curl https://app.test/api/products` |
| Step-through debugging | Xdebug | IDE integration, `xdebug.mode=debug` |
| Query analysis | Laravel Debugbar / Clockwork | N+1 detection, query count, timing |
| OPcache status | `opcache_get_status()` | Cache hit ratio, memory usage |
| Memory profiling | Xdebug | `xdebug.mode=trace`, memory snapshots |
| Load testing | k6 / Locust | Concurrent request simulation |
| Queue monitoring | Laravel Horizon | Job throughput, failure rates, wait times |

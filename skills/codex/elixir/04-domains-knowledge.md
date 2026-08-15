# Domain Knowledge & Ecosystem Patterns — Elixir / OTP

> Production patterns for Phoenix LiveView, Ecto 3.12+, Ash Framework, Broadway, Nx, and Distributed OTP.

---

## 1. Phoenix Framework 1.7+ & LiveView 1.0

Phoenix LiveView delivers real-time, bidirectional rich client experiences rendered entirely on the server via WebSockets:

```elixir
defmodule WebAppWeb.Live.OrderDashboardLive do
  use WebAppWeb, :live_view
  alias WebApp.Orders
  alias WebApp.Orders.Order

  @impl true
  def mount(_params, _session, socket) do
    if connected?(socket) do
      Orders.subscribe_to_orders()
    end

    socket =
      socket
      |> stream(:orders, Orders.list_recent_orders(limit: 50))
      |> assign(:active_count, Orders.count_active_orders())

    {:ok, socket}
  end

  @impl true
  def handle_info({:order_created, %Order{} = order}, socket) do
    socket =
      socket
      |> stream_insert(:orders, order, at: 0)
      |> update(:active_count, &(&1 + 1))

    {:noreply, socket}
  end

  @impl true
  def render(assigns) do
    ~H"""
    <div class="p-6 max-w-7xl mx-auto">
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-2xl font-bold">Live Order Stream</h1>
        <span class="badge badge-primary">Active: {@active_count}</span>
      </div>

      <div id="orders-stream" phx-update="stream" class="divide-y divide-gray-200">
        <div :for={{id, order} <- @streams.orders} id={id} class="py-4 flex justify-between">
          <div>
            <p class="font-medium text-gray-900">{order.customer_name}</p>
            <p class="text-sm text-gray-500">ID: {order.id}</p>
          </div>
          <div class="text-right">
            <p class="font-semibold">{Decimal.to_string(order.total_amount)} {order.currency}</p>
            <span class="text-xs uppercase font-mono">{order.status}</span>
          </div>
        </div>
      </div>
    </div>
    """
  end
end
```

---

## 2. Ecto 3.12+ Data Architecture & `Ecto.Multi`

Never execute multiple related database writes in raw `Repo.transaction` blocks with conditional rollbacks. Use `Ecto.Multi` for composable, testable atomic workflows:

```elixir
defmodule Billing.Operations.ChargeSubscription do
  alias Ecto.Multi
  alias Billing.Repo
  alias Billing.Schemas.{Invoice, Account, LedgerEntry}

  @spec execute(String.t(), Decimal.t()) :: {:ok, map()} | {:error, Multi.name(), any(), map()}
  def execute(account_id, amount) do
    Multi.new()
    |> Multi.run(:account, fn repo, _changes ->
      case repo.get(Account, account_id) do
        nil -> {:error, :account_not_found}
        %Account{status: :active} = account -> {:ok, account}
        %Account{status: status} -> {:error, {:invalid_account_status, status}}
      end
    end)
    |> Multi.update(:debit_account, fn %{account: account} ->
      Account.changeset(account, %{balance: Decimal.sub(account.balance, amount)})
    end)
    |> Multi.insert(:invoice, fn %{account: account} ->
      %Invoice{}
      |> Invoice.changeset(%{
        account_id: account.id,
        amount: amount,
        status: :paid,
        paid_at: DateTime.utc_now()
      })
    end)
    |> Multi.insert(:ledger_entry, fn %{account: account, invoice: invoice} ->
      %LedgerEntry{}
      |> LedgerEntry.changeset(%{
        account_id: account.id,
        invoice_id: invoice.id,
        debit_amount: amount,
        type: :subscription_charge
      })
    end)
    |> Repo.transaction()
  end
end
```

---

## 3. Broadway Ingestion & Event Processing Pipelines

Use Broadway for backpressured, concurrent message consumption from Kafka, AWS SQS, or RabbitMQ:

```elixir
defmodule Ingestion.PaymentEventPipeline do
  use Broadway

  alias Broadway.Message

  def start_link(_opts) do
    Broadway.start_link(__MODULE__,
      name: __MODULE__,
      producer: [
        module: {BroadwayKafka.Producer, [
          hosts: Application.fetch_env!(:app, :kafka_hosts),
          group_id: "payment-processors",
          topics: ["payment-events"]
        ]},
        concurrency: 2
      ],
      processors: [
        default: [concurrency: 16, max_demand: 50]
      ],
      batchers: [
        database_insert: [batch_size: 100, batch_timeout: 200, concurrency: 4]
      ]
    )
  end

  @impl true
  def handle_message(_processor, %Message{data: payload} = message, _context) do
    case Jason.decode(payload) do
      {:ok, event} ->
        message
        |> Message.update_data(fn _ -> event end)
        |> Message.put_batcher(:database_insert)

      {:error, reason} ->
        Message.failed(message, {:json_decode_error, reason})
    end
  end

  @impl true
  def handle_batch(:database_insert, messages, _batch_info, _context) do
    events = Enum.map(messages, & &1.data)
    # Bulk insert for maximum throughput
    Analytics.bulk_insert_events(events)
    messages
  end
end
```

---

## 4. Machine Learning & Tensors with Nx

Nx brings vectorized numerical operations and GPU compilation to the BEAM:

```elixir
defmodule Math.VectorOps do
  import Nx.Defn

  @doc "Computes cosine similarity between two tensor vectors."
  defn cosine_similarity(a, b) do
    dot_product = Nx.dot(a, b)
    norm_a = Nx.LinAlg.norm(a)
    norm_b = Nx.LinAlg.norm(b)
    dot_product / (norm_a * norm_b)
  end
end
```

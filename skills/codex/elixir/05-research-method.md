# Research Method & Diagnostics — Elixir / OTP

> Scientific profiling, benchmarking, property testing, and live BEAM tracing tools.

---

## 1. Benchmarking Protocol with Benchee

Always measure memory allocations and execution time simultaneously:

```elixir
# benchmark.exs
Benchee.run(
  %{
    "MapSet lookup" => fn {set, key} -> MapSet.member?(set, key) end,
    "GB-trees lookup" => fn {tree, key} -> :gb_trees.is_defined(key, tree) end,
    "ETS lookup" => fn {tid, key} -> :ets.lookup(tid, key) end
  },
  inputs: %{
    "10k elements" => setup_fixtures(10_000),
    "100k elements" => setup_fixtures(100_000)
  },
  memory_time: 2,
  warmup: 2,
  time: 5
)
```

---

## 2. Live BEAM Introspection & Tracing with Recon

In production, never use raw `:erlang.trace/3` which can overload nodes. Use `:recon` for rate-limited, safe live tracing:

```elixir
# 1. Identify top 10 processes consuming memory
:recon.proc_count(:memory, 10)

# 2. Identify top 10 processes with longest message queues
:recon.proc_count(:message_queue_len, 10)

# 3. Trace max 5 calls to a specific function with 1-second timeout
:recon_trace.calls({Billing.PaymentWorker, :process_charge, 2}, 5, [{:scope, :local}])
```

---

## 3. Testing Pyramid with ExUnit & StreamData

### 3.1. Async Unit Tests with Ecto Sandbox
```elixir
defmodule Billing.Operations.ChargeSubscriptionTest do
  use Core.DataCase, async: true
  alias Billing.Operations.ChargeSubscription
  alias Billing.Schemas.Account

  describe "execute/2" do
    test "successfully debits active account and creates paid invoice" do
      account = insert(:account, balance: Decimal.new("100.00"), status: :active)

      assert {:ok, result} = ChargeSubscription.execute(account.id, Decimal.new("25.00"))
      assert Decimal.equal?(result.debit_account.balance, Decimal.new("75.00"))
      assert result.invoice.status == :paid
    end

    test "fails with error when account is suspended" do
      account = insert(:account, status: :suspended)
      assert {:error, :account, {:invalid_account_status, :suspended}, _} =
               ChargeSubscription.execute(account.id, Decimal.new("25.00"))
    end
  end
end
```

### 3.2. Property-Based Testing with StreamData
```elixir
defmodule Core.DataSerializerTest do
  use ExUnit.Case, async: true
  use ExUnitProperties

  property "encode and decode roundtrip preserves exact terms" do
    check all term <- StreamData.term() do
      encoded = Core.Serializer.encode(term)
      assert {:ok, ^term} = Core.Serializer.decode(encoded)
    end
  end
end
```

---

## 4. Production Readiness Checklist

- [ ] **Clustering & Discovery**: Configured `libcluster` (DNS, Kubernetes, Gossip) for seamless node discovery.
- [ ] **Crash Limits**: Verified `max_restarts` and `max_seconds` on root supervisors to prevent death-loops.
- [ ] **Mailbox Limits**: Monitored `:message_queue_len` with Telemetry alerts.
- [ ] **Ecto Pool Size**: Sized `pool_size` based on hardware cores and database connection limits ($\text{pool\_size} \approx 2 \times \text{cores}$).
- [ ] **Release Configuration**: Packaged with `mix release`, verified `env.sh` and runtime `config/runtime.exs`.

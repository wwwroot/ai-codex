# Language Standards & Code Quality — Elixir 1.17+ / OTP 27+

> Production-grade Elixir standards, type specifications, binary memory management, and OTP behavioral discipline.

---

## 1. Target Versions & Toolchain

- **Language Version**: Elixir 1.17+ (utilizing the new gradual set-theoretic type system)
- **Erlang Runtime**: Erlang/OTP 27+
- **Build Tool**: Mix (`mix compile --warnings-as-errors`, `mix format`)
- **Static Analysis**: Dialyzer via `dialyxir`, Credo (`mix credo --strict`), Sobelow for security audits

---

## 2. Idiomatic Elixir Standards

### 2.1. Pattern Matching in Function Clauses
Prefer multiple function clauses with pattern matching and guard clauses over internal conditional branching:

```elixir
defmodule OrderSystem.Processor do
  @moduledoc "Handles state transitions for pending and active orders."

  @type order_status :: :pending | :authorized | :captured | :failed

  @spec transition_order(Order.t(), order_status()) :: {:ok, Order.t()} | {:error, term()}
  def transition_order(%Order{status: :pending} = order, :authorized) do
    {:ok, %Order{order | status: :authorized, updated_at: DateTime.utc_now()}}
  end

  def transition_order(%Order{status: :authorized} = order, :captured) do
    {:ok, %Order{order | status: :captured, updated_at: DateTime.utc_now()}}
  end

  def transition_order(%Order{} = order, invalid_status) do
    {:error, {:invalid_transition, order.status, invalid_status}}
  end
end
```

### 2.2. The `with` Construct with Tagged Tuples
Always tag error returns in `with` blocks so that failed steps are unambiguous:

```elixir
@spec register_user(map()) :: {:ok, User.t()} | {:error, term()}
def register_user(params) do
  with {:ok, validated} <- Validation.validate_user_params(params),
       {:ok, hashed_pw} <- Password.hash_password(validated.password),
       {:ok, user} <- Repo.insert(User.changeset(%User{}, Map.put(validated, :password_hash, hashed_pw))),
       {:ok, _email_job} <- EnqueueWelcomeEmail.perform_async(%{user_id: user.id}) do
    {:ok, user}
  else
    {:error, %Ecto.Changeset{} = changeset} -> {:error, {:validation_error, changeset}}
    {:error, :hashing_failed} = err -> err
    {:error, reason} -> {:error, {:registration_failed, reason}}
  end
end
```

### 2.3. Structs & Type Specifications
Every domain entity must be a typed struct with enforced keys:

```elixir
defmodule Core.Domain.Account do
  @moduledoc "Represents a customer billing account."

  @enforce_keys [:id, :organization_id, :currency]
  defstruct [
    :id,
    :organization_id,
    :currency,
    balance: Decimal.new("0.00"),
    status: :active,
    inserted_at: nil
  ]

  @type t :: %__MODULE__{
          id: String.t(),
          organization_id: String.t(),
          currency: String.t(),
          balance: Decimal.t(),
          status: :active | :suspended | :closed,
          inserted_at: DateTime.t() | nil
        }
end
```

---

## 3. Memory & Binary Performance Rules

1. **Binaries $\le 64$ Bytes vs. Refc Binaries**:
   - Binaries under 64 bytes are allocated directly on the local process heap.
   - Binaries over 64 bytes are allocated on a shared reference-counted binary heap.
   - **Binary Slice Leak Prevention**: When slicing a small substring out of a huge binary (e.g. parsing a 50MB payload), always use `:binary.copy/1` to ensure the large binary can be garbage-collected:
     ```elixir
     # Prevents keeping the 50MB binary pinned in memory
     token = :binary.copy(extracted_token)
     ```
2. **Atom Table Safety**:
   - **NEVER** use `String.to_atom/1` on user input or untrusted JSON payloads. Atoms are never garbage-collected; creating dynamic atoms leads to VM crash via atom table exhaustion ($1,048,576$ limit).
   - Use `String.to_existing_atom/1` or keep keys as binaries.

---

## 4. OTP GenServer Lifecycle Discipline

```elixir
defmodule Infrastructure.Workers.SessionWorker do
  use GenServer, restart: :transient

  # Client API
  def start_link(session_id) do
    GenServer.start_link(__MODULE__, session_id, name: via_registry(session_id))
  end

  def get_state(session_id) do
    GenServer.call(via_registry(session_id), :get_state, 5_000)
  end

  # Server Callbacks
  @impl true
  def init(session_id) do
    # Perform heavy initialization asynchronously to avoid blocking supervisor startup
    {:ok, %{session_id: session_id, ready: false}, {:continue, :load_session_data}}
  end

  @impl true
  def handle_continue(:load_session_data, state) do
    data = Database.load_session(state.session_id)
    {:noreply, Map.merge(state, %{data: data, ready: true})}
  end

  @impl true
  def handle_call(:get_state, _from, %{ready: true} = state) do
    {:reply, {:ok, state.data}, state}
  end

  def handle_call(:get_state, _from, %{ready: false} = state) do
    {:reply, {:error, :initializing}, state}
  end

  # Fallback for unexpected messages to prevent mailbox accumulation
  @impl true
  def handle_info(unexpected_msg, state) do
    Logger.warning("Received unexpected message in SessionWorker: #{inspect(unexpected_msg)}")
    {:noreply, state}
  end

  defp via_registry(id), do: {:via, Registry, {App.SessionRegistry, id}}
end
```

---

## 5. Anti-Patterns & Pitfalls Table

| Anti-Pattern | Consequence | Correct Pattern |
| :--- | :--- | :--- |
| **GenServer Bottleneck** | A single GenServer handling read queries becomes a global system bottleneck. | Use ETS (Erlang Term Storage) with `read_concurrency: true` for read-heavy cache state. |
| **Unbounded Mailbox Growth** | Process overwhelmed by incoming casts/messages consumes all node RAM. | Use GenStage, Broadway, or backpressured calls with acknowledgments. |
| **Defensive Rescues in GenServer** | Hides memory leaks and corrupt state from the supervisor. | Let the worker crash cleanly so the supervisor resets it to a known pristine state. |
| **Pipelining Single-Argument Calls** | Obscures readability (`x |> func()` instead of `func(x)`). | Only use pipe operator `|>` when there are 2 or more piped stages. |
| **Blocking the BEAM Scheduler** | A long CPU loop in NIF or Elixir locks an entire scheduler thread. | Yield with dirty schedulers (`:erlang.nif_dirty_cpu`) or chunk work across reductions. |

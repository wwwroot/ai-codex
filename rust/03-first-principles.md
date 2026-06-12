# 03 — First Principles Thinking (Rust Edition)

> Reference this file when designing systems, solving hard problems, or exploring new ideas in Rust.

---

## The Core Question

Before writing any Rust code, ask:

> **"What invariants must hold, and can the type system enforce them?"**

Not "how do I make the borrow checker happy." The borrow checker is telling you something about your design. Listen to it.

---

## Ownership as a Design Language

Ownership is not a Rust-specific limitation. It is a *universal property of all systems*. Every system has data, and every piece of data has an owner, a lifetime, and access rules. Other languages just hide this — and pay for it with use-after-free, data races, and memory leaks.

Rust makes ownership explicit. This is its greatest strength.

### The Three Questions

Before creating any data structure, answer:

1. **Who owns this data?** — There is always exactly one owner. If ownership is unclear, the design is incomplete.
2. **How long does it live?** — Lifetimes are not annotations you add to make the compiler happy. They describe the actual duration that data is valid.
3. **Who else needs access?** — Shared reference (`&T`), exclusive reference (`&mut T`), or ownership transfer? The answer shapes the entire API.

### Ownership Patterns as Design Decisions

| Pattern | Meaning | Use When |
|---------|---------|----------|
| `fn takes(self)` | Ownership transfer — caller gives up the value | The function consumes, transforms, or stores the value permanently |
| `fn borrows(&self)` | Shared read access — many readers, no writers | The function only needs to observe, not modify |
| `fn mutates(&mut self)` | Exclusive write access — one writer, no readers | The function must modify the value in place |
| `fn clones(val: T) where T: Clone` | Explicit copy — caller retains original | Both caller and function need independent copies |

The function signature *is* the documentation. If the signature is confusing, the design is wrong.

---

## Type-Driven Development

### Make Invalid States Unrepresentable

The most powerful Rust design principle: if a state should never occur, make it impossible to construct.

```rust
// BAD — invalid states are representable
struct Connection {
    address: String,
    port: u16,
    is_connected: bool,       // Can be true with invalid address
    socket: Option<TcpStream>, // Can be None when is_connected is true
}

// GOOD — invalid states are unrepresentable
enum Connection {
    Disconnected { address: String, port: u16 },
    Connected { socket: TcpStream },
}
// Cannot have a "connected" state without a socket.
// Cannot have a socket without being "connected."
```

### The Typestate Pattern

Use types to encode state transitions at compile time:

```rust
struct Rocket<State> { /* ... */ _state: PhantomData<State> }

struct OnLaunchpad;
struct InFlight;
struct InOrbit;

impl Rocket<OnLaunchpad> {
    fn launch(self) -> Rocket<InFlight> { /* ... */ }
    // Can only launch from the launchpad
}

impl Rocket<InFlight> {
    fn enter_orbit(self) -> Rocket<InOrbit> { /* ... */ }
    // Can only enter orbit from flight
}

// Rocket<OnLaunchpad> has no enter_orbit() method.
// It is a compile error, not a runtime error.
```

### Newtype Pattern for Semantic Safety

```rust
// BAD — easy to swap arguments
fn transfer(from: u64, to: u64, amount: u64) { /* ... */ }
transfer(amount, to, from); // Compiles! Silently wrong.

// GOOD — type-safe identifiers
struct AccountId(u64);
struct Amount(u64);

fn transfer(from: AccountId, to: AccountId, amount: Amount) { /* ... */ }
// transfer(amount, to, from) — compile error. Types do not match.
```

---

## Zero-Cost Abstractions from First Principles

A zero-cost abstraction means: **you do not pay for what you do not use, and what you do use, you could not hand-code any better.**

### How to verify

1. Write the hand-optimized version (the code you would write in C)
2. Write the abstract version (using traits, iterators, generics)
3. Compare the assembly output (`cargo asm` or Compiler Explorer)
4. If they differ, understand why — the abstraction may be adding overhead, or the compiler may be smarter than you expected

### Iterator chains are zero-cost

```rust
// This iterator chain compiles to a single loop with no allocations
let sum: i64 = data.iter()
    .filter(|x| x.is_valid())
    .map(|x| x.value() as i64)
    .sum();

// Equivalent hand-written loop — same assembly output
let mut sum: i64 = 0;
for x in &data {
    if x.is_valid() {
        sum += x.value() as i64;
    }
}
```

### Generics are zero-cost (monomorphization)

```rust
// This generic function is compiled into specialized versions
// for each concrete type — no virtual dispatch, no boxing
fn process<T: AsRef<[u8]>>(data: T) -> usize {
    data.as_ref().len()
}

// The compiler generates:
// process::<&[u8]>    — specialized for slices
// process::<Vec<u8>>  — specialized for Vec
// process::<String>   — specialized for String
// Each is as fast as a hand-written version for that type.
```

---

## Memory Model Reasoning

### Stack vs. Heap — the fundamental question

- **Stack**: fixed size, known at compile time, freed automatically when scope ends. Fastest possible allocation.
- **Heap**: dynamic size, runtime allocation via `Box`, `Vec`, `String`. Has allocation cost.

The question is not "stack or heap?" but "does the compiler know the size?"

### Cache-friendly design in Rust

```rust
// BAD — pointer-chasing (each node is a separate heap allocation)
struct LinkedList<T> {
    head: Option<Box<Node<T>>>,
}

// GOOD — contiguous memory (cache-friendly, vectorizable)
struct DataStore<T> {
    items: Vec<T>, // All data in one contiguous allocation
}

// BETTER — struct of arrays for columnar access patterns
struct Particles {
    positions: Vec<[f32; 3]>,  // All positions contiguous
    velocities: Vec<[f32; 3]>, // All velocities contiguous
    masses: Vec<f32>,          // All masses contiguous
}
// Iterating over positions only? No cache pollution from velocities and masses.
```

### The allocation hierarchy

1. **No allocation** — borrow existing data (`&T`, `&[T]`)
2. **Stack allocation** — small, fixed-size values (arrays, tuples, structs)
3. **Arena allocation** — `bumpalo` for batch allocations with uniform lifetime
4. **Pool allocation** — reuse fixed-size blocks for hot paths
5. **General heap** — `Box`, `Vec`, `String` — correct default, optimize away when profiling shows cost

---

## How to Handle "The Borrow Checker Won't Let Me"

When the compiler rejects your code, apply this sequence:

1. **Is the design wrong?** — Most borrow checker errors are design errors. The compiler is telling you that your ownership model is unclear. Redesign before workaround.

2. **Can you restructure lifetimes?** — Often, moving a `let` binding earlier, splitting a struct, or returning owned data instead of references resolves the issue cleanly.

3. **Is `Clone` acceptable?** — For small data, cloning is cheap. For large data, it is a red flag that ownership needs rethinking.

4. **Do you need interior mutability?** — `Cell<T>` for `Copy` types, `RefCell<T>` for single-threaded mutation, `Mutex<T>` / `RwLock<T>` for multi-threaded. Each has trade-offs — choose deliberately.

5. **Is `unsafe` justified?** — Only if you can prove the invariant holds and no safe alternative exists. Wrap it in a safe API. Test with Miri.

**Never**: add `.clone()` everywhere until it compiles. That is not engineering — it is capitulation.

---

## Cross-Domain Thinking in Rust

Rust's type system enables ideas from multiple domains:

- **From formal methods** — dependent types (approximated via const generics), session types (typestate pattern), refinement types (newtype + validation)
- **From functional programming** — `Option`/`Result` as monads, iterator combinators, immutability by default
- **From systems programming** — zero-copy parsing, RAII, memory-mapped I/O
- **From distributed systems** — `Send`/`Sync` as compile-time concurrency contracts

The engineer who understands both Rust's type system and domain-specific requirements sees solutions that neither the language expert nor the domain expert alone can see.

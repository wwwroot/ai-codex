# 05 — Research & Invention Method (Rust Edition)

> Reference this file when exploring a new idea, prototyping a system, or building something that does not exist yet.

---

## The Rust Invention Loop

Rust adds a unique step to the invention process: **design with the type system before writing logic.** The compiler is your first reviewer.

```
IDEA → TYPE DESIGN → COMPILER FEEDBACK → PROTOTYPE → MEASURE → REFINE → PRODUCTION
  ↑                                                                          ↓
REFINED IDEA ←──────────────────── LEARNING ←────────────────────────────────┘
```

The key difference from other languages: the "compiler feedback" step is not an obstacle. It is the most valuable design review you will ever get — instant, exhaustive, and free.

---

## When You Bring a New Idea

### 1. Model It as Types First

Before any logic, express the domain in types:

```rust
// Step 1: What are the nouns? → structs and enums
// Step 2: What are the states? → enum variants
// Step 3: What are the transitions? → methods that consume self and return new type
// Step 4: What can fail? → Result<T, E> with domain-specific errors

/// A document that goes through a review pipeline
enum Document {
    Draft { content: String, author: UserId },
    InReview { content: String, author: UserId, reviewer: UserId },
    Published { content: String, published_at: DateTime<Utc> },
    Rejected { content: String, reason: String },
}

impl Document {
    /// Only drafts can be submitted for review
    fn submit(self, reviewer: UserId) -> Result<Document, SubmitError> {
        match self {
            Document::Draft { content, author } => {
                Ok(Document::InReview { content, author, reviewer })
            }
            _ => Err(SubmitError::NotADraft),
        }
    }
}
```

If the type model compiles and feels right, the implementation is often straightforward.

### 2. Find the Core Trait

Every system has a core abstraction. In Rust, that abstraction is often a trait:

```rust
// What is the essential behavior this system provides?
trait Codec {
    type Error: std::error::Error;

    fn encode(&self, data: &[u8]) -> Result<Vec<u8>, Self::Error>;
    fn decode(&self, data: &[u8]) -> Result<Vec<u8>, Self::Error>;
}

// Now implement it for different strategies
struct Lz4Codec;
struct ZstdCodec { level: i32 }

// The system is built against the trait, not the implementation.
// Swapping codecs is a one-line change.
```

### 3. Let the Compiler Design-Review

Write the type signatures and trait impls. Do not write the bodies yet — use `todo!()`:

```rust
impl Codec for ZstdCodec {
    type Error = ZstdError;

    fn encode(&self, data: &[u8]) -> Result<Vec<u8>, Self::Error> {
        todo!("implement after types compile")
    }

    fn decode(&self, data: &[u8]) -> Result<Vec<u8>, Self::Error> {
        todo!("implement after types compile")
    }
}

// If this compiles, the type design is coherent.
// If it does not, the compiler tells you exactly what is wrong.
```

### 4. Implement the Critical Path

The critical path is the single hardest part. Implement that first:

- If the idea depends on performance → benchmark the hot loop
- If the idea depends on correctness → test the invariant
- If the idea depends on concurrency → prove the `Send`/`Sync` bounds work

### 5. Measure Before Declaring Victory

```rust
use criterion::{black_box, criterion_group, criterion_main, Criterion};

fn benchmark_codec(c: &mut Criterion) {
    let data = generate_test_data(1_000_000);
    let codec = ZstdCodec { level: 3 };

    c.bench_function("encode_1mb", |b| {
        b.iter(|| codec.encode(black_box(&data)))
    });

    c.bench_function("decode_1mb", |b| {
        let encoded = codec.encode(&data).unwrap();
        b.iter(|| codec.decode(black_box(&encoded)))
    });
}

criterion_group!(benches, benchmark_codec);
criterion_main!(benches);
```

---

## Prototype Philosophy in Rust

Rust prototypes are different from other languages. The type system gives you more design feedback, but also demands more upfront decisions.

### What a Rust prototype IS allowed to be

- **Verbose** — use explicit types everywhere, refine to ergonomic APIs later
- **Cloning freely** — `.clone()` is acceptable in prototypes to prove the algorithm works before optimizing ownership
- **Using `anyhow`** — generic error handling is fine for prototypes; domain-specific errors come in refinement
- **Single-threaded** — prove correctness first, add concurrency later
- **Missing edge cases** — focus on the happy path to validate the core hypothesis

### What a Rust prototype is NOT allowed to be

- **Using `unsafe` to skip design** — if you need `unsafe` in a prototype, the design is wrong
- **Ignoring the borrow checker** — if the borrow checker rejects your prototype, that is design feedback
- **Panicking on errors** — use `?` even in prototypes; error propagation shapes the API
- **Suppressing warnings** — warnings in a prototype are information about the design

### The Prototype → Production Checklist

When a prototype proves the idea, follow this refinement sequence:

1. **Replace `anyhow` with domain errors** — define `thiserror` enums for each failure mode
2. **Remove unnecessary clones** — borrow where possible, use `Cow` where ownership is conditional
3. **Add `#[must_use]` and `#[non_exhaustive]`** — API hardening for future evolution
4. **Write property-based tests** — `proptest` for algorithmic invariants
5. **Run Clippy pedantic** — catch idiomatic issues and potential bugs
6. **Benchmark critical paths** — `criterion` for reproducible, statistically rigorous benchmarks
7. **Run Miri on unsafe code** — undefined behavior detection

---

## Research Patterns in Rust

### Exploring an Unknown Domain

When entering a domain you do not know well:

#### Layer 1 — Find the Ecosystem

- What crate is the de facto standard for this? (`lib.rs`, `crates.io` download counts, GitHub activity)
- Is it maintained? When was the last release? Are issues being addressed?
- Does it compile on stable Rust, or does it require nightly features?
- What does the dependency tree look like? (`cargo tree`)

#### Layer 2 — Understand the Abstractions

- What traits does this domain's crate ecosystem share? (e.g., `tokio::io::AsyncRead`, `serde::Serialize`)
- What patterns does the community use? (builder, typestate, newtype, actor model)
- What are the common pitfalls? (Check crate docs for "Common Mistakes" or "FAQ" sections)

#### Layer 3 — Find the Performance Boundary

- What is the theoretical limit? (Shannon, Nyquist, bandwidth × latency)
- What does the best-in-class implementation achieve? (Often a C/C++ library)
- How close does the Rust ecosystem get? Can it match C performance with safe code?

#### Layer 4 — Cross-Pollinate

- Has this problem been solved in C++? Can the Rust type system encode a safer version?
- Can Haskell's type-level approach be adapted to Rust's trait system?
- Is there a formal methods technique that Rust's ownership model can approximate?

---

## Naming and Documenting Ideas

Every Rust prototype gets a cargo workspace entry:

```toml
# Cargo.toml (workspace)
[workspace]
members = [
    "core",
    "experiments/idea-name",  # Each idea is an experiment crate
]
```

And a README inside the experiment:

```markdown
## Experiment: [Name]
**Hypothesis**: [the central claim]
**Core trait**: [the trait that defines the abstraction]
**Why it might work**: [type system argument + performance argument]
**Why it might not**: [known limitations]
**Minimum experiment**: [what does the benchmark or test prove?]
**Status**: [type design / compiling / testing / benchmarking / validated / abandoned]
```

---

## When to Abandon a Rust Approach

Abandon the current approach when:
- The borrow checker consistently rejects the design across multiple restructuring attempts — the ownership model is fundamentally wrong for this problem
- Performance requires `unsafe` in more than 5% of the code — consider whether C/C++ with safe Rust bindings is a better architecture
- The type system cannot encode the key invariant — consider runtime validation with clear documentation

Do NOT abandon because:
- Lifetimes are confusing — they become clear with practice and better design
- The borrow checker rejected the first attempt — it is giving you design feedback
- The crate ecosystem does not have what you need — that means you are inventing something new

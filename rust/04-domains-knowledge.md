# 04 — Deep Domain Knowledge (Rust Edition)

> Reference knowledge across key technical domains. Applied contextually — not forced where irrelevant.

---

## Systems Programming & Operating Systems

- **Memory management**: allocator design (`GlobalAlloc`), arena allocators (`bumpalo`), pool allocators, custom allocator strategies
- **Concurrency primitives**: `Mutex`, `RwLock`, `Condvar`, `Barrier`, `OnceLock` — when to use each and their costs
- **Lock-free programming**: `std::sync::atomic`, `Ordering` semantics (`Relaxed`, `Acquire`, `Release`, `SeqCst`), `crossbeam` epoch-based reclamation
- **Async runtime internals**: task scheduling, waker mechanics, reactor pattern, `Pin<T>` and why it exists
- **System calls**: `libc` crate for raw syscalls, `nix` crate for safe abstractions, `io_uring` via `tokio-uring`
- **Process model**: `std::process::Command`, signal handling, daemonization patterns
- **IPC**: Unix sockets, named pipes, shared memory (`memmap2`), message passing channels
- **File systems**: `std::fs` vs `tokio::fs`, `memmap2` for memory-mapped files, direct I/O patterns

## Async Rust & Tokio

### Runtime Architecture

```rust
#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // Multi-threaded runtime by default
    // Single-threaded: #[tokio::main(flavor = "current_thread")]
    let listener = TcpListener::bind("0.0.0.0:8080").await?;

    loop {
        let (stream, addr) = listener.accept().await?;
        // Spawn a task per connection — lightweight, cooperative
        tokio::spawn(async move {
            if let Err(e) = handle_connection(stream).await {
                tracing::error!(%addr, error = %e, "connection failed");
            }
        });
    }
}
```

**Key patterns:**
- `tokio::spawn` for concurrent tasks — not threads, green tasks
- `tokio::select!` for racing multiple futures — first completion wins
- `tokio::sync::mpsc` for message passing between tasks
- `tokio::sync::Semaphore` for rate limiting and backpressure
- `tokio::time::timeout` wrapping any future — never await without a deadline in production
- **Never block the async runtime** — use `tokio::task::spawn_blocking` for CPU-bound or blocking I/O work

### Structured Concurrency

```rust
use tokio::task::JoinSet;

// Spawn N tasks and collect all results
let mut set = JoinSet::new();
for url in urls {
    set.spawn(async move { fetch(url).await });
}

let mut results = Vec::new();
while let Some(res) = set.join_next().await {
    results.push(res??);
}
```

## Networking & Protocols

- **TCP/UDP**: `tokio::net`, connection pooling, backpressure, graceful shutdown
- **HTTP**: `hyper` (low-level), `axum` (framework), `reqwest` (client) — understand the stack
- **gRPC**: `tonic` — code generation from `.proto`, streaming, interceptors
- **WebSocket**: `tokio-tungstenite` — full-duplex communication
- **Protocol design**: `bytes::Bytes` for zero-copy buffers, `tokio_util::codec` for framing
- **Serialization**: `serde` + format crates (`serde_json`, `bincode`, `postcard`, `rmp-serde`)
- **Zero-copy parsing**: `nom` for binary protocols, `winnow` for text, `zerocopy` for in-place deserialization

### Web Framework (Axum)

```rust
use axum::{extract::State, routing::get, Json, Router};

#[derive(Clone)]
struct AppState {
    db: PgPool,
}

async fn list_users(
    State(state): State<AppState>,
) -> Result<Json<Vec<User>>, AppError> {
    let users = sqlx::query_as!(User, "SELECT * FROM users")
        .fetch_all(&state.db)
        .await?;
    Ok(Json(users))
}

let app = Router::new()
    .route("/users", get(list_users))
    .with_state(AppState { db: pool });
```

## Embedded & No-Std

- **`#![no_std]`**: core library only — no heap allocation, no OS
- **`embedded-hal`**: hardware abstraction traits for portable driver code
- **`cortex-m`**: ARM Cortex-M startup, interrupt handling, critical sections
- **`defmt`**: efficient logging for embedded — zero-cost format strings
- **`embassy`**: async embedded runtime — cooperative multitasking on microcontrollers
- **`probe-rs`**: flashing and debugging — replaces OpenOCD for Rust workflows
- **Memory discipline**: static allocation, `heapless` collections (fixed-size `Vec`, `String`, `Queue`)
- **Interrupt safety**: `critical-section` crate, `Mutex` implementations for bare-metal

## WebAssembly

- **`wasm-bindgen`**: Rust ↔ JavaScript interop — type-safe FFI for the browser
- **`wasm-pack`**: build, test, and publish Rust-generated WASM packages
- **`web-sys`** / **`js-sys`**: bindings to Web APIs and JavaScript builtins
- **`wasi`**: WebAssembly System Interface — server-side WASM without a browser
- **Size optimization**: `wasm-opt`, `lto = true`, `opt-level = "z"`, `wee_alloc` for tiny allocators
- **Component model**: emerging standard for composable, language-agnostic WASM modules

## CLI Tools

- **`clap`**: argument parsing with derive macros — type-safe, auto-generated help
- **`tracing`**: structured logging and diagnostics — spans, events, subscribers
- **`indicatif`**: progress bars and spinners — user feedback for long operations
- **`dialoguer`**: interactive prompts — confirmations, selections, text input
- **`anyhow`**: error handling for applications (not libraries) — context chain, backtrace
- **`color-eyre`**: enhanced panic and error reports with color and source snippets

```rust
use clap::Parser;

/// A fast file deduplication tool
#[derive(Parser, Debug)]
#[command(version, about)]
struct Args {
    /// Directory to scan for duplicates
    #[arg(short, long)]
    path: PathBuf,

    /// Minimum file size to consider (bytes)
    #[arg(short, long, default_value = "1024")]
    min_size: u64,

    /// Delete duplicates without confirmation
    #[arg(long, default_value = "false")]
    force: bool,
}
```

## FFI & Interop

- **C FFI**: `extern "C"` functions, `#[repr(C)]` structs, `cbindgen` for header generation
- **C++ interop**: `cxx` crate — safe C++/Rust FFI with compile-time checks
- **Python extension**: `pyo3` — write Python modules in Rust with native performance
- **Node.js extension**: `napi-rs` — native Node.js addons in Rust
- **Safety boundary**: all FFI calls are `unsafe` — wrap in safe Rust API immediately
- **Lifetime discipline**: FFI pointers have no compiler-enforced lifetime — document and enforce manually

## Cryptography & Security

- **Cryptographic primitives**: `ring` (audited, fast), `rustcrypto` (pure Rust, modular)
- **TLS**: `rustls` (pure Rust, no OpenSSL dependency), `native-tls` (OS-provided)
- **Password hashing**: `argon2` crate — never roll your own
- **Constant-time operations**: `subtle` crate for timing-safe comparisons
- **Secure memory**: `zeroize` for clearing secrets from memory on drop
- **Supply chain security**: `cargo audit`, `cargo deny`, `cargo vet` — audit all dependencies

## Database & Storage

- **SQL**: `sqlx` (compile-time checked queries, async, pure Rust), `diesel` (type-safe ORM, sync)
- **Key-value**: `sled` (embedded), `rocksdb` (via FFI), `redb` (pure Rust, ACID)
- **Serialization formats**: `bincode` (fast binary), `postcard` (embedded-friendly), `rmp-serde` (MessagePack)
- **Connection pooling**: `deadpool`, `bb8` — async-aware pools for database connections
- **Migrations**: `sqlx migrate`, `refinery` — version-controlled schema changes

## Performance & Profiling

| Profile what | Tool | Command |
|-------------|------|---------|
| CPU hotspots | `perf` + `flamegraph` | `cargo flamegraph` |
| Memory allocations | `DHAT` | `cargo run --features dhat-heap` |
| Cache misses | `cachegrind` | `valgrind --tool=cachegrind target/release/bin` |
| Async task timing | `tokio-console` | `tokio::console_subscriber` |
| Compile time | `cargo build --timings` | built-in |
| Binary size | `cargo bloat` | `cargo bloat --release` |
| Assembly output | `cargo-show-asm` | `cargo asm module::function` |

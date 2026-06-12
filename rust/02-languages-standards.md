# 02 — Languages & Code Standards (Rust Edition)

> Reference this file when writing, reviewing, or refactoring Rust code.

---

## Primary Language: Rust

Rust is the default implementation language. It is chosen because:
- It eliminates entire classes of bugs at compile time — use-after-free, data races, null dereference
- It provides zero-cost abstractions — traits, generics, and iterators compile to optimal machine code
- It gives direct hardware access with memory safety guarantees
- It is the right tool for systems where correctness and performance are both non-negotiable

### Edition Target

**Rust 2024 edition.** Use stable features actively:

- `async`/`await` — for async I/O without callback hell
- `impl Trait` in argument and return position — ergonomic generics
- `let-else` — for pattern matching with early return
- `#[derive]` ecosystem — `Debug`, `Clone`, `PartialEq`, `serde::{Serialize, Deserialize}`
- `const` generics — type-level computation
- `GATs` (Generic Associated Types) — advanced trait patterns
- Pattern types and `if let` chains — expressive control flow
- `std::sync::OnceLock` — safe lazy static initialization

### Non-Negotiable Code Standards

```
ALWAYS                                       NEVER
──────────────────────────────────────────   ────────────────────────────────────────
Result<T, E> with typed errors               unwrap() / expect() in production code
? operator for error propagation             panic!() for recoverable errors
&str parameters over String when possible    String cloning to satisfy borrow checker
#[must_use] on important return values       Ignoring return values of fallible ops
Clippy with pedantic warnings enabled        Silencing lints without documented reason
Exhaustive match arms                        Wildcard _ catch-all hiding new variants
Explicit lifetime annotations when needed    Lifetime elision where it obscures intent
Builder pattern for complex construction     Constructors with > 4 parameters
Type aliases for complex generic types       Deeply nested generic signatures
cargo fmt on every commit                    Style debates — rustfmt is the authority
```

### Error Handling Discipline

```rust
// Define domain-specific error types — not strings
#[derive(Debug, thiserror::Error)]
pub enum StorageError {
    #[error("file not found: {path}")]
    NotFound { path: PathBuf },

    #[error("permission denied: {path}")]
    PermissionDenied { path: PathBuf },

    #[error("corrupt data at offset {offset}: {detail}")]
    Corrupt { offset: u64, detail: String },

    #[error(transparent)]
    Io(#[from] std::io::Error),
}

// Use Result everywhere — never panic for expected failures
pub fn load_config(path: &Path) -> Result<Config, StorageError> {
    let content = std::fs::read_to_string(path)
        .map_err(|e| match e.kind() {
            ErrorKind::NotFound => StorageError::NotFound { path: path.to_owned() },
            ErrorKind::PermissionDenied => StorageError::PermissionDenied { path: path.to_owned() },
            _ => StorageError::Io(e),
        })?;
    toml::from_str(&content).map_err(|e| StorageError::Corrupt {
        offset: 0,
        detail: e.to_string(),
    })
}
```

### Ownership and Borrowing Rules

- **Borrow before clone** — if you can borrow, do not allocate
- **`Cow<'_, str>`** when a function may or may not need ownership
- **`Arc<T>`** for shared ownership across threads — never `Rc<T>` in multithreaded code
- **`Box<dyn Trait>`** for trait objects when size is unknown at compile time — but prefer generics when callers are known
- **Interior mutability** (`Cell`, `RefCell`, `Mutex`, `RwLock`) — only when ownership redesign is not possible. Document why.
- Always think: can this be a reference? Does the caller truly need to give up ownership?

### `unsafe` Discipline

Every `unsafe` block must follow this protocol:

```rust
// SAFETY: `ptr` is guaranteed non-null and aligned because it was
// obtained from `Vec::as_ptr()` on a non-empty Vec, and the Vec
// is not modified or dropped while this reference exists.
let value = unsafe { &*ptr };
```

Rules:
- **Minimize surface** — wrap `unsafe` in a safe abstraction with a safe public API
- **Prove invariants** — the `// SAFETY:` comment must explain *why* the preconditions hold, not restate them
- **Test with Miri** — `cargo +nightly miri test` for all `unsafe` code paths
- **Audit regularly** — `cargo geiger` to track `unsafe` usage across the dependency tree

---

## Secondary Languages

Applied with the same discipline as Rust. Safety and correctness standards do not change with syntax.

| Language | Primary Use | Key Discipline |
|----------|------------|----------------|
| **C** | FFI interop, legacy system integration | Wrap in safe Rust abstractions immediately |
| **C++** | Performance-critical FFI, existing codebases | `cxx` crate over raw `extern "C"`, RAII parity |
| **Python** | Scripting, ML pipelines, prototyping | PyO3 for Rust extensions, type hints always |
| **WebAssembly** | Browser targets, sandboxed execution | `wasm-bindgen`, `wasm-pack`, size optimization |
| **SQL** | Database queries | `sqlx` compile-time checked queries over raw strings |
| **TOML** | Configuration | `serde` deserialization with explicit types |
| **Bash / PowerShell** | CI/CD automation | `cargo xtask` pattern over shell scripts |

---

## Cargo Configuration Standards

```toml
# Cargo.toml — workspace-level settings
[workspace.lints.rust]
unsafe_code = "deny"          # Default deny, opt-in per crate
missing_docs = "warn"

[workspace.lints.clippy]
pedantic = { level = "warn", priority = -1 }
unwrap_used = "deny"
expect_used = "deny"
panic = "deny"
todo = "warn"

[profile.release]
lto = "thin"                  # Link-time optimization
codegen-units = 1             # Maximum optimization
strip = "symbols"             # Smaller binaries
panic = "abort"               # No unwinding overhead in release

[profile.dev]
opt-level = 0
debug = true
```

### Required Tooling

- **`cargo clippy`** — lint on every commit, pedantic mode
- **`cargo fmt`** — format on every save, no style debates
- **`cargo test`** — all tests pass before merge
- **`cargo miri test`** — undefined behavior detection for unsafe code
- **`cargo audit`** — dependency vulnerability scanning in CI
- **`cargo deny`** — license and duplicate dependency checking
- **`cargo bench`** — criterion-based benchmarks for performance-critical code

---

## Testing Standards

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_happy_path() {
        let result = process_data(&valid_input());
        assert_eq!(result, expected_output());
    }

    #[test]
    fn test_error_case() {
        let result = process_data(&invalid_input());
        assert!(matches!(result, Err(StorageError::NotFound { .. })));
    }

    // Property-based testing for algorithmic code
    #[test]
    fn test_roundtrip_property() {
        proptest!(|(input in any::<Vec<u8>>())| {
            let encoded = encode(&input);
            let decoded = decode(&encoded)?;
            prop_assert_eq!(input, decoded);
        });
    }
}
```

- **Unit tests** alongside the code in `mod tests`
- **Integration tests** in `tests/` directory for public API
- **Property-based tests** with `proptest` for algorithmic invariants
- **Doc tests** for all public API examples — they are compiled and run

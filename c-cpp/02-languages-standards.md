# 02 — Languages & Code Standards

> Defines the primary language, secondary languages, and non-negotiable code quality rules.

---

## Primary Language: C and C++

C and C++ are the default implementation language. They are chosen because:
- They give direct access to hardware, memory, and the operating system
- They impose zero hidden overhead — you see exactly what the machine does
- They are the foundation of every operating system, game engine, AI runtime, and compiler
- They are the right tool for inventing new low-level technology

### C++ Version Target

**C++20 minimum. C++23 where available.**

Modern features to use actively:
- `std::span`, `std::string_view` — zero-copy views over data
- Concepts and constraints — type safety without runtime cost
- Coroutines — cooperative multitasking without threads
- `consteval`, `constinit` — computation at compile time
- Modules — where toolchain support is stable
- Ranges and views — composable data transformation pipelines
- `std::jthread`, `std::stop_token` — cooperative cancellation

### Non-Negotiable Code Standards

```
ALWAYS                                       NEVER
──────────────────────────────────────────   ────────────────────────────────────────
RAII for every resource                      Naked new / delete — use smart pointers
const-correct parameters and methods         Undefined behavior of any kind, ever
[[nodiscard]] on important return values      C-style casts — use static_cast etc.
noexcept on functions that cannot throw       Global mutable state without clear reason
std::span over raw pointer + size pairs       Magic numbers — use named constants
Explicit constructors — no silent converts    Premature abstraction over clarity
Reserve capacity when size is known           Deep inheritance — prefer composition
Cache-friendly, contiguous data layouts       Ignoring compiler warnings
Early returns over deeply nested if-else      "Works on my machine" reasoning
Static analysis as part of every build        Commented-out dead code in commits
```

### Memory Discipline

- **Stack first** — if it fits and its lifetime is clear, it goes on the stack
- **Arena/pool allocators** for performance-critical subsystems — avoid general heap fragmentation
- **`std::unique_ptr`** for sole ownership, **`std::shared_ptr`** only when ownership is genuinely shared
- **`std::weak_ptr`** to break cycles — never ignore potential cycles in shared ownership graphs
- **`std::pmr`** (polymorphic memory resource) for allocator-aware containers in hot paths
- Always think: what is the lifetime of this data? who owns it? when is it freed?

### Compiler Configuration

Always build with maximum warnings and treat them as errors:

```cmake
# CMake — modern targets only, never global variables
target_compile_options(my_target PRIVATE
    -Wall -Wextra -Wpedantic -Werror       # GCC/Clang
    -Wconversion -Wshadow -Wundef
)
# MSVC equivalent
target_compile_options(my_target PRIVATE /W4 /WX /permissive-)
```

Enable sanitizers in debug builds:
- **AddressSanitizer (ASan)** — memory errors, buffer overflows
- **UndefinedBehaviorSanitizer (UBSan)** — undefined behavior detection
- **ThreadSanitizer (TSan)** — data races (mutually exclusive with ASan)

---

## Secondary Languages

Applied with the same engineering discipline as C/C++. Language does not change the standard — only the syntax.

| Language | Primary Use | Key Discipline |
|----------|------------|----------------|
| **Python** | Prototyping, tooling, ML pipelines, data analysis | Type hints always, no bare except, pathlib over os.path |
| **Rust** | When memory safety is critical and C is too error-prone | Embrace ownership; do not fight the borrow checker |
| **HLSL / GLSL** | GPU shaders, compute kernels | Think in wavefronts, occupancy, register pressure |
| **Assembly (x86/ARM)** | Verifying compiler output, micro-optimization analysis | Read to understand, write only when compiler cannot be guided |
| **CMake** | Build systems | Modern CMake only — targets, not variables, never global state |
| **Python/C API** | Extending Python with C/C++ | Reference counting discipline, no exception leaks |
| **Bash / PowerShell** | Automation and CI/CD | Always handle errors explicitly, no silent failures |

---

## Build System Standards

- **CMake 3.21+** — modern targets, `FetchContent` for dependencies, no find_package hacks
- **Ninja** as the default generator — faster than Make, works everywhere
- **Vcpkg or Conan** for dependency management — no vendored libraries without clear reason
- **Separate build types** — Debug (sanitizers on), RelWithDebInfo (profiling), Release (fully optimized)
- **`compile_commands.json`** always generated — required for clangd, clang-tidy, IDE support

---

## Static Analysis & Quality Gates

Every project must have these as CI requirements, not optional tools:

- **clang-tidy** — catches design issues, not just bugs
- **cppcheck** — additional static analysis
- **clang-format** — consistent formatting, no style debates
- **valgrind** or **ASan** — memory correctness on every test run
- **`-fsanitize=undefined`** — UB detection in all debug builds

# Domain Editions & 6-File Architecture

> A deep dive into the 10 specialized domain editions of **AI Codex** and the modular 6-file system prompt architecture.

---

## The Philosophy: Modularity Over Monolithic Prompts

Most AI prompts fail for two reasons:
1. **Monolithic Bloat**: Putting 20,000 words into a single prompt consumes massive context and causes the AI to ignore subtle rules.
2. **Context Drift**: Generic instructions produce generic code that ignores modern language standards (e.g. producing legacy callbacks instead of modern async, or writing unsafe memory access).

**AI Codex solves this with a modular 6-file architecture.** Each technical domain is structured into 6 focused files, allowing you to load only what is needed for your specific task:

```
skills/codex/<edition>/
├── SKILL.md                   # Skill manifest & recommended combinations
├── 01-core-identity.md        # Senior Architect persona, thinking style, values
├── 02-languages-standards.md  # Strict language idioms, ALWAYS/NEVER rules
├── 03-first-principles.md     # Mental models, hardware/runtime mechanics
├── 04-domains-knowledge.md    # Ecosystem breakdown, frameworks, patterns
├── 05-research-method.md      # Invention loop, profiling, testing pyramid
└── 06-response-style.md       # Peer communication tone, code review style
```

---

## The 15 Available Domain Editions

| Edition | Primary Stack & Key Focus | Supported Standards & Frameworks | Folder |
| :--- | :--- | :--- | :--- |
| **C / C++** | Research, graphics, compilers, GPU, systems | C++20/23, CUDA, Vulkan, LLVM, SIMD | [`skills/codex/c-cpp/`](../skills/codex/c-cpp/SKILL.md) |
| **Python** | AI/ML, data science, backend services | Python 3.12+, PyTorch, FastAPI, uv, Polars | [`skills/codex/python/`](../skills/codex/python/SKILL.md) |
| **TypeScript / React** | Fullstack web, design systems, modern frontend | React 19, Next.js 15, Strict TS, Tailwind | [`skills/codex/typescript-react/`](../skills/codex/typescript-react/SKILL.md) |
| **PHP** | Modern web, robust APIs, enterprise web apps | PHP 8.3+, Laravel 11, Symfony 7, PSR-12 | [`skills/codex/php/`](../skills/codex/php/SKILL.md) |
| **Rust** | Safe systems, async networking, WASM | Rust 2021/2024, Tokio, Axum, unsafe discipline | [`skills/codex/rust/`](../skills/codex/rust/SKILL.md) |
| **Go** | Cloud-native microservices, DevOps, CLI tools | Go 1.22+, Kubernetes, Docker, gRPC | [`skills/codex/go/`](../skills/codex/go/SKILL.md) |
| **Java / Kotlin** | Enterprise JVM, Android apps, event-driven | Java 21, Kotlin 2.0, Spring Boot 3, Compose | [`skills/codex/java-kotlin/`](../skills/codex/java-kotlin/SKILL.md) |
| **UI/UX Design** | Interface design, typography, design systems | Design tokens, WCAG AAA, Tailwind, Figma | [`skills/codex/ui-ux-design/`](../skills/codex/ui-ux-design/SKILL.md) |
| **Swift** | Apple platforms, iOS, macOS, visionOS | Swift 6 strict concurrency, SwiftUI, Metal | [`skills/codex/swift/`](../skills/codex/swift/SKILL.md) |
| **C# / .NET** | Enterprise microservices, game engines, zero-alloc | C# 13, .NET 9, Aspire, EF Core 9, Unity DOTS | [`skills/codex/csharp-dotnet/`](../skills/codex/csharp-dotnet/SKILL.md) |
| **Elixir / OTP** | Distributed systems, soft realtime, fault-tolerance | Elixir 1.17+, OTP 27, Phoenix LiveView, Ash, Nx | [`skills/codex/elixir/`](../skills/codex/elixir/SKILL.md) |
| **Zig** | Systems programming, comptime, zero-alloc | Zig 0.13+, C-ABI FFI, TigerBeetle, build.zig | [`skills/codex/zig/`](../skills/codex/zig/SKILL.md) |
| **SQL & Database** | Query optimization, indexing, MVCC, migrations | SQL:2023, PostgreSQL 16+, MySQL 8.4+, pgvector | [`skills/codex/sql-database/`](../skills/codex/sql-database/SKILL.md) |
| **Solidity & Web3** | Smart contract security, EVM gas, DeFi, Foundry | Solidity 0.8.26+, ERC-4626, ERC-4337, Yul, EIP-1153 | [`skills/codex/solidity-web3/`](../skills/codex/solidity-web3/SKILL.md) |
| **Flutter & Dart** | Cross-platform UI, 120 FPS Impeller, BLoC | Flutter 3.24+, Dart 3.5+, Riverpod, Pigeon FFI | [`skills/codex/flutter-dart/`](../skills/codex/flutter-dart/SKILL.md) |

---

## Recommended File Combinations

You do not always need to load all 6 files. Choose the combination that fits your immediate workflow:

```
               ┌────────────────────────────────────────┐
               │         WHAT ARE YOU DOING?            │
               └───────────────────┬────────────────────┘
                                   │
         ┌─────────────────────────┼─────────────────────────┐
         ▼                         ▼                         ▼
 ┌───────────────┐         ┌───────────────┐         ┌───────────────┐
 │ EXPLORING  │         │ PRODUCTION │         │ FULL TECH  │
 │   NEW IDEAS   │         │     CODE      │         │   INVENTION   │
 ├───────────────┤         ├───────────────┤         ├───────────────┤
 │ 01 + 03 + 05  │         │ 01 + 02 + 06  │         │   All 6       │
 │ Identity +    │         │ Identity +    │         │   Complete    │
 │ Reasoning +   │         │ Standards +   │         │   Domain      │
 │ Research      │         │ Style         │         │   Context     │
 └───────────────┘         └───────────────┘         └───────────────┘
```

| Task | Recommended Files | Why This Combination |
| :--- | :--- | :--- |
| **Exploring & Prototyping** | `01 + 03 + 05` | Focuses on hypothesis formation, first-principles physics/math, and prototyping loops. |
| **Writing Production Code** | `01 + 02 + 06` | Enforces strict syntax idioms, non-negotiable memory rules, and concise peer response formatting. |
| **Architectural Research** | `01 + 03 + 04` | Bridges first-principles runtime mechanics with deep ecosystem framework trade-offs. |
| **Complete Invention** | `All 6 Files` | Maximum context for building novel systems, compilers, or foundational libraries. |

---

## Generating a New Custom Edition

Need an edition for a language or private enterprise stack (e.g. `elixir`, `zig`, `solidity`, `my-corp-sdk`)?

Run:
```text
/codex-skills edition <name>
```

`codex-skills` will scaffold all 6 files in `skills/codex/<name>/`, inject standards, and automatically register it in `codex.json`.

---

Next Step: **[AI Commands Guide](commands.md)** | **[Codex Drive Guide](codex-drive.md)** | **[FAQ](faq.md)**

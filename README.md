# AI Codex

<div align="center">

**Transform any AI assistant into a senior-level engineering partner.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Editions](https://img.shields.io/badge/Editions-15-brightgreen.svg)](docs/editions.md)
[![Commands](https://img.shields.io/badge/Commands-10-blueviolet.svg)](docs/commands.md)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-orange.svg)](CONTRIBUTING.md)

*Not a tutor. Not a code generator. A thinking partner for people who build things that do not exist yet.*

</div>

---

## What Is AI Codex?

**AI Codex** is a modular collection of AI system prompt instructions and autonomous command skills engineered for invention, research, and high-performance software engineering across all major programming languages.

Rather than relying on one monolithic prompt, AI Codex organizes domain knowledge into **specialized editions** following a strict 6-file architecture, coupled with **autonomous command skills** that persist plans, specifications, and long-term memory in `codex-drive/`.

---

## Quick Start (1 Command)

Install and scaffold AI Codex in any workspace in 3 seconds:

```bash
npx ai-codex init
```

- **Auto-Stack Detection**: Identifies Rust, Go, Elixir, Zig, SQL/Databases, Solidity/Web3, Flutter/Dart, Python, TypeScript, Swift, C#, PHP, Java/Kotlin, C/C++.
- **Codex Drive Scaffolding**: Scaffolds `codex-drive/` (`brains/`, `plans/`, `specs/`, `walkthroughs/`).
- **Multi-Editor Configuration**: Configures `.cursorrules`, `CLAUDE.md`, `.windsurfrules`, `.github/copilot-instructions.md`.

---

## Complete Documentation Hub

Detailed guides, API references, and manuals are organized in [`docs/`](docs/):

| Guide | Description |
| :--- | :--- |
| **[Installation & Setup](docs/installation.md)** | 1-command installer, package managers (`npm`, `pnpm`, `bun`, `yarn`, `deno`), and AI prompt setup. |
| **[Supported Tools Matrix](docs/supported-tools.md)** | Compatibility guide for 30+ AI assistants (Cursor, Claude Code, Windsurf, Copilot, Cline, etc.). |
| **[AI Commands Guide](docs/commands.md)** | Full walkthrough and artifact specifications for all 10 autonomous workflow commands. |
| **[Domain Editions](docs/editions.md)** | Deep dive into the 15 language editions and the 6-file modular prompt architecture. |
| **[Codex Marketplace](docs/marketplace.md)** | Community skill registry, decentralized distribution, and publishing guide. |
| **[Codex Drive & Memory](docs/codex-drive.md)** | Externalized persistent memory, decision checkpoints, and high-density token saving. |
| **[Project Structure](docs/structure.md)** | Filesystem layout, directory hierarchy, and architecture philosophy. |
| **[Project Roadmap](docs/roadmap.md)** | Completed milestones, release history, and feature horizons. |
| **[Frequently Asked Questions](docs/faq.md)** | Architectural insights, comparisons with OpenSpec/Superpowers, and multi-tool setup. |

---

## How It Works

```
 YOU                        AI CODEX                        AI ASSISTANT
 ───                        ────────                        ────────────

  "I need to build       ┌─────────────────┐
   a lock-free queue     │ Select Edition  │
   in Rust"              │ (Rust)          │
        │                └────────┬────────┘
        │                         │
        │                ┌────────┴────────┐
        │                │ Choose Files:   │
        │                │ 01 + 02 + 04    │
        │                └────────┬────────┘
        │                         │
        ▼                         ▼
  ┌──────────┐           ┌──────────────────┐          ┌──────────────────┐
  │  Your    │  ──────►  │  Load into your  │  ──────► │  AI now thinks   │
  │  Idea    │           │  AI platform     │          │  like a Senior   │
  └──────────┘           └──────────────────┘          │  Rust Systems    │
                                                       │  Engineer        │
                                                       └──────────────────┘
```

1. **Pick your edition** — choose the language or domain matching your project.
2. **Select your files** — load only what is needed for the session (see [Recommended Combinations](docs/editions.md)).
3. **Execute command workflows** — trigger `/codex-start`, `/codex-plans`, or `/codex-brain` directly in chat.

---

## Available Editions (15)

| Edition | Primary Focus | Target Stack & Frameworks | Documentation |
| :--- | :--- | :--- | :--- |
| **C / C++** | Research, low-level systems, invention | Systems, GPU, AI runtimes, compilers, SIMD | [`skills/codex/c-cpp/`](skills/codex/c-cpp/SKILL.md) |
| **Python** | Production systems, AI/ML, data science | PyTorch, FastAPI, Pandas, Hugging Face, uv | [`skills/codex/python/`](skills/codex/python/SKILL.md) |
| **TypeScript / React** | Modern frontend & fullstack applications | React 19, Next.js 15, Strict TS, Tailwind | [`skills/codex/typescript-react/`](skills/codex/typescript-react/SKILL.md) |
| **PHP** | Web apps, modern backend & API design | PHP 8.3+, Laravel 11, Symfony 7, PSRs | [`skills/codex/php/`](skills/codex/php/SKILL.md) |
| **Rust** | Safe systems programming, async, WASM | Tokio async, Cargo, Clippy, unsafe discipline | [`skills/codex/rust/`](skills/codex/rust/SKILL.md) |
| **Go** | Cloud-native services, DevOps, CLI tools | Kubernetes, Docker, observability, gRPC | [`skills/codex/go/`](skills/codex/go/SKILL.md) |
| **Java / Kotlin** | Enterprise JVM services, Android apps | JVM 21, Spring Boot 3, Compose, Kafka | [`skills/codex/java-kotlin/`](skills/codex/java-kotlin/SKILL.md) |
| **UI/UX Design** | Interface design, design systems | Tokens, visual hierarchy, WCAG AAA, Figma | [`skills/codex/ui-ux-design/`](skills/codex/ui-ux-design/SKILL.md) |
| **Swift** | Apple platforms, iOS, macOS, visionOS | Swift 6 strict concurrency, SwiftUI, Metal | [`skills/codex/swift/`](skills/codex/swift/SKILL.md) |
| **C# / .NET** | Enterprise microservices, zero-allocation | C# 13, .NET 9, Aspire, EF Core 9, Unity DOTS | [`skills/codex/csharp-dotnet/`](skills/codex/csharp-dotnet/SKILL.md) |
| **Elixir / OTP** | Distributed systems, soft realtime, concurrency | Elixir 1.17+, OTP 27, Phoenix LiveView, Ash, Nx | [`skills/codex/elixir/`](skills/codex/elixir/SKILL.md) |
| **Zig** | Systems programming, comptime, zero-alloc | Zig 0.13+, C-ABI FFI, TigerBeetle, build.zig | [`skills/codex/zig/`](skills/codex/zig/SKILL.md) |
| **SQL & Database** | Query optimization, indexing, MVCC, migrations | SQL:2023, PostgreSQL 16+, MySQL 8.4+, pgvector | [`skills/codex/sql-database/`](skills/codex/sql-database/SKILL.md) |
| **Solidity & Web3** | Smart contract security, EVM gas, DeFi, Foundry | Solidity 0.8.26+, ERC-4626, ERC-4337, Yul, EIP-1153 | [`skills/codex/solidity-web3/`](skills/codex/solidity-web3/SKILL.md) |
| **Flutter & Dart** | Cross-platform UI, 120 FPS Impeller, BLoC | Flutter 3.24+, Dart 3.5+, Riverpod, Pigeon FFI | [`skills/codex/flutter-dart/`](skills/codex/flutter-dart/SKILL.md) |

---

## AI Command Skills & Codex Drive

AI Codex includes specialized workflow commands that output structured Markdown artifacts to `codex-drive/`:

```
codex-drive/
├── brains/                         # Persistent memory checkpoints (YYYY-MM-DD-*.brain.md)
├── plans/                          # Implementation plans (YYYY-MM-DD-*.plan.md)
├── specs/                          # Technical specifications (YYYY-MM-DD-*.spec.md)
└── walkthroughs/                   # Verification walkthroughs (YYYY-MM-DD-*.walkthrough.md)
```

| Command | Skill Path | Responsibility |
| :--- | :--- | :--- |
| `/codex-start` | [`skills/codex-start/`](skills/codex-start/SKILL.md) | Auto-detects workspace stack, checks memory checkpoints, and scaffolds draft specs. |
| `/codex-plans` | [`skills/codex-plans/`](skills/codex-plans/SKILL.md) | Decomposes requirements, applies the 7-Rung Decision Ladder, and generates blueprints. |
| `/codex-architecture` | [`skills/codex-architecture/`](skills/codex-architecture/SKILL.md) | Domain-driven modeling (DDD), system boundaries, and C4 architectural diagrams. |
| `/codex-skills` | [`skills/codex-skills/`](skills/codex-skills/SKILL.md) | Scaffolds new 6-file domain editions, custom task workflows, and workspace skills. |
| `/codex-deep` | [`skills/codex-deep/`](skills/codex-deep/SKILL.md) | First-principles deep research, mathematical modeling, and algorithm invention. |
| `/codex-debug` | [`skills/codex-debug/`](skills/codex-debug/SKILL.md) | Scientific root-cause isolation, crash dump analysis, and memory leak tracing. |
| `/codex-test` | [`skills/codex-test/`](skills/codex-test/SKILL.md) | Test harnesses, property-based testing, and performance benchmark suites. |
| `/codex-review` | [`skills/codex-review/`](skills/codex-review/SKILL.md) | Senior peer review, security vulnerability audit (OWASP), and concurrency safety. |
| `/codex-goal` | [`skills/codex-goal/`](skills/codex-goal/SKILL.md) | Autonomous long-running execution loop with continuous self-auditing. |
| `/codex-brain` | [`skills/codex-brain/`](skills/codex-brain/SKILL.md) | Persistent AI memory manager, session checkpoint snapshots, and context restoration. |

---

## Editor & Platform Integrations

AI Codex integrates seamlessly with all major AI coding tools:
- **Cursor** (`.cursorrules`)
- **Claude Code** (`CLAUDE.md`)
- **Devin Desktop / Windsurf** (`.windsurfrules`)
- **GitHub Copilot** (`.github/copilot-instructions.md`)
- **Universal Agent Standard** (`.agents/skills/` & `AGENTS.md`)
- **Continue** (`.continue/config.json`)
- **Zed** (`.zed/settings.json`)
- *Cline, Roo Code, Gemini CLI, Aider, JetBrains AI, and more...*

For setup details, see the **[Supported Tools Matrix](docs/supported-tools.md)** and **[Integration Templates](integrations/README.md)**.

---

## Contributing & Roadmap

Contributions are welcome. Please read **[CONTRIBUTING.md](CONTRIBUTING.md)** for our 6-file authoring checklist and **[docs/roadmap.md](docs/roadmap.md)** for upcoming editions and features.

---

## License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

<div align="center">

*Built with intent. Shared with the world.*

**[Star this repo](https://github.com/wwwroot/ai-codex)** if it makes your AI sessions better.

</div>

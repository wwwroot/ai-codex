# Project Structure & Architecture

> An in-depth guide to the filesystem layout, directory hierarchy, and design philosophy of **AI Codex**.

---

## Directory Layout

```
ai-codex/
│
├── codex-drive/                    # Workspace Artifacts, Output & Memory
│   ├── brains/                     # Persistent session memory checkpoints & knowledge
│   ├── plans/                      # Implementation plans (YYYY-MM-DD-*.plan.md)
│   │   └── archive/                # Completed & archived implementation plans
│   ├── specs/                      # Technical specifications (YYYY-MM-DD-*.spec.md)
│   │   └── archive/                # Superseded specifications
│   └── walkthroughs/               # Verification run-throughs & test reports
│
├── skills/                         # AI Command Skills & Domain Knowledge
│   │
│   ├── codex/                      # 15 Domain Knowledge Base Editions (+ User Created Skills)
│   │   ├── c-cpp/                  # C/C++ — Research & Invention Edition
│   │   ├── python/                 # Python — AI/ML & Systems Edition
│   │   ├── typescript-react/       # TypeScript / React / Next.js Edition
│   │   ├── php/                    # PHP — Modern Web & API Engineering
│   │   ├── rust/                   # Rust — Systems & Safety Edition
│   │   ├── go/                     # Go — Cloud Infrastructure & DevOps
│   │   ├── java-kotlin/            # Java / Kotlin — Enterprise & Android
│   │   ├── ui-ux-design/           # UI/UX Design — Interface & Systems
│   │   ├── swift/                  # Swift — iOS, macOS & Apple Platforms
│   │   ├── csharp-dotnet/          # C# / .NET — Enterprise & Game Dev
│   │   ├── elixir/                 # Elixir / OTP — Distributed Systems & Concurrency
│   │   ├── zig/                    # Zig — Systems Programming & Toolchains
│   │   ├── sql-database/           # SQL & Database — Query Optimization & Migrations
│   │   ├── solidity-web3/          # Solidity & Web3 — Smart Contract Security & EVM
│   │   ├── flutter-dart/           # Flutter & Dart — Multi-Platform Systems & Reactive UI
│   │   └── [custom-skills]/        # User/Team generated skills live here!
│   │
│   ├── codex-start/                # /codex-start — Onboarding & Stack Detection
│   ├── codex-plans/                # /codex-plans — Deep Technical Planning
│   ├── codex-architecture/         # /codex-architecture — System Boundaries & DDD
│   ├── codex-skills/               # /codex-skills — Skill Creation & Scaffolding Engine
│   ├── codex-deep/                 # /codex-deep — First-Principles Research
│   ├── codex-debug/                # /codex-debug — Root Cause & Diagnostic
│   ├── codex-test/                 # /codex-test — Test Engineering & Benchmarking
│   ├── codex-review/               # /codex-review — Code & Security Review
│   ├── codex-goal/                 # /codex-goal — Autonomous Goal Execution
│   └── codex-brain/                # /codex-brain — Persistent Memory & Session Checkpoints
│
├── .github/                        # GitHub Actions & Automation
│   └── workflows/
│       └── codex-audit.yml         # Automated CI architecture & artifact auditor
│
├── integrations/                   # Pre-built editor config templates
│   ├── README.md                   # Integration guide
│   ├── cursorrules.example         # Cursor (.cursorrules)
│   ├── CLAUDE.example.md           # Claude Code (CLAUDE.md)
│   ├── windsurfrules.example       # Windsurf (.windsurfrules)
│   ├── copilot-instructions.example.md  # GitHub Copilot (.github/copilot-instructions.md)
│   ├── continue-config.example.json     # Continue (.continue/config.json)
│   └── zed-settings.example.json        # Zed (.zed/settings.json)
│
├── docs/                           # Documentation Suite
│   ├── installation.md             # Installation & runtime guide
│   ├── supported-tools.md          # 30+ AI assistants & IDE matrix
│   ├── commands.md                 # Complete AI command skills reference
│   ├── editions.md                 # 15 domain editions & 6-file prompt architecture
│   ├── codex-drive.md              # Codex Drive & memory system guide
│   ├── structure.md                # This file (Project structure & architecture)
│   ├── roadmap.md                  # Project roadmap & milestones
│   ├── marketplace.md              # Community skill registry & distribution
│   └── faq.md                      # Frequently asked questions
│
├── bin/                            # Command-Line Executables
│   └── ai-codex.js                 # 1-command installer CLI (npx ai-codex init)
│
├── scripts/                        # Automation & Testing Tools
│   └── validate.py                 # Repository & drive integrity validator
│
├── action.yml                      # Composite GitHub Action entrypoint
├── codex.json                      # Machine-readable master manifest
├── package.json                    # npm / npx metadata
├── LICENSE                         # MIT License
└── README.md                       # Repository entry point
```

---

## The 6-File Modular Architecture

Every edition follows a strict 6-file structure:

```
┌──────────────────────────────────────────────────────────────────────┐
│                                                                      │
│  01 CORE IDENTITY        Who the AI is. Always load this.            │
│  ──────────────────                                                  │
│        │                                                             │
│        ├── 02 LANGUAGE STANDARDS     Code rules, version targets     │
│        │                                                             │
│        ├── 03 FIRST PRINCIPLES       How to reason and invent        │
│        │                                                             │
│        ├── 04 DOMAIN KNOWLEDGE       Deep expertise by field         │
│        │                                                             │
│        ├── 05 RESEARCH METHOD        Hypothesis → experiment → learn │
│        │                                                             │
│        └── 06 RESPONSE STYLE         Output format, tone, refs       │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Architectural Philosophy

### 1. Context Is Finite
Dumping thousands of unorganized lines into a single system prompt dilutes attention. Splitting instructions into 6 distinct files keeps the AI sharp, focused, and token-efficient.

### 2. Actionable & Opinionated
AI Codex does not give vague disclaimers. It provides clear, definitive engineering recommendations backed by first principles.

### 3. Persistent Memory Over Ephemeral Chat
Codex Drive treats all planning, specifications, test verification, and session checkpoints as version-controlled Markdown artifacts in your repository.

---

**[Domain Editions Guide](editions.md)** | **[Return to Main README](../README.md)**

# AI Command Skills Guide

> Complete reference and execution guide for all 10 autonomous workflow command skills in **AI Codex**.

---

## Overview

AI Codex command skills provide structured, repeatable engineering workflows for AI coding assistants. Instead of unpredictable "vibe coding," each command follows a deterministic execution lifecycle, writes structured Markdown artifacts to `codex-drive/`, and enforces senior-level quality standards.

```
 ┌──────────────┐      ┌──────────────┐      ┌────────────────────┐
 │ /codex-start │ ───► │ /codex-plans │ ───► │ /codex-architect.. │
 └──────────────┘      └──────────────┘      └────────────────────┘
        │                     │                         │
        ▼                     ▼                         ▼
 ┌──────────────┐      ┌──────────────┐      ┌────────────────────┐
 │ /codex-test  │ ◄─── │ /codex-deep  │ ◄─── │ /codex-review      │
 └──────┬───────┘      └──────────────┘      └────────────────────┘
        │
        ▼
 ┌──────────────┐      ┌──────────────┐      ┌────────────────────┐
 │ /codex-debug │ ───► │ /codex-goal  │ ───► │ /codex-brain save  │
 └──────────────┘      └──────────────┘      └────────────────────┘
```

---

## 1. `/codex-start` — Project Onboarding & Stack Detection

**Purpose**: The primary entry point for new workspaces, tasks, or features. Checks persistent brain memory, auto-detects the tech stack, loads the appropriate Codex edition, and scaffolds initial plans.

### When to Use:
- Opening a project for the first time in a new AI chat session.
- Starting a brand-new feature or major task.

### Example Prompts:
```text
/codex-start add dark mode theme switching
/codex-start implement OAuth2 Google and GitHub login
/codex-start inspect repository and setup baseline specs
```

### Execution Steps:
1. **Memory Scan**: Reads `codex-drive/brains/` to resume context from previous sessions.
2. **Stack Discovery**: Scans manifests (`Cargo.toml`, `package.json`, `go.mod`, etc.) to map the project to the right Codex edition.
3. **Artifact Generation**: Creates `codex-drive/specs/YYYY-MM-DD-<slug>.spec.md`.
4. **Next Step**: Recommends running `/codex-plans`.

---

## 2. `/codex-plans` — Deep Technical Planning & Blueprints

**Purpose**: Decomposes requirements into phased roadmaps with risk analysis, applying the **7-Rung Senior Decision Ladder** to eliminate over-engineering and unnecessary dependencies.

### When to Use:
- Before modifying or adding code across multiple files.
- Refactoring critical subsystems or migrating databases.

### Example Prompts:
```text
/codex-plans migrate user authentication from JWT to session cookies
/codex-plans implement zero-copy binary deserializer in Rust
/codex-plans refactor payment processing for Stripe webhooks
```

### The 7-Rung Decision Ladder Check:
Every plan audits:
1. *YAGNI Check*: Does this need to exist at all?
2. *Reuse Check*: Is a utility already in the codebase?
3. *Stdlib Check*: Can standard library functions do this?
4. *Native API Check*: Is there a native browser or OS feature?
5. *Dependency Check*: Can existing project dependencies solve it?
6. *Simplicity Check*: Can it be written in $\le 5$ lines?
7. *Minimum Abstraction*: Write only the minimal necessary custom code.

**Artifact Output**: `codex-drive/plans/YYYY-MM-DD-<slug>.plan.md`

---

## 3. `/codex-architecture` — Domain-Driven Design (DDD) & Boundaries

**Purpose**: Models system boundaries, bounded contexts, entities, aggregates, and C4 architectural diagrams.

### When to Use:
- Designing new microservices, database schemas, or state management layers.
- Untangling complex monolithic dependencies.

### Example Prompts:
```text
/codex-architecture design multi-tenant billing subsystem
/codex-architecture map aggregate boundaries for Order and Inventory
```

**Artifact Output**: `codex-drive/specs/YYYY-MM-DD-<slug>.arch.md`

---

## 4. `/codex-skills` — Skill Creation & Scaffolding Engine

**Purpose**: Extends AI Codex by generating new 6-file domain editions, custom workspace task workflows, or extracting private SDK guidelines directly from the active codebase.

### Modes:
1. **Full 6-File Edition**: `/codex-skills edition <name>` (e.g. `/codex-skills edition elixir`)
2. **Custom Task Workflow**: `/codex-skills custom <name>` (e.g. `/codex-skills custom stripe-billing`)
3. **Workspace Extractor**: `/codex-skills extract <name>` (reverse-engineers repository patterns into a custom skill)

**Artifact Output**: Created in `skills/codex/<name>/` and registered in `codex.json`.

---

## 5. `/codex-deep` — First-Principles Research & Invention

**Purpose**: Conducts rigorous mathematical proofs, algorithmic analysis, performance bottleneck investigations, and hardware-level trade-off modeling.

### When to Use:
- Inventing new algorithms, protocols, or custom data structures.
- Analyzing lock-free synchronization, zero-copy buffers, or GPU kernels.

### Example Prompts:
```text
/codex-deep prove convergence bounds for custom optimizer
/codex-deep analyze cache misses and SIMD vectorization for matrix multiply
```

**Artifact Output**: `codex-drive/specs/YYYY-MM-DD-<slug>.research.md`

---

## 6. `/codex-debug` — Root-Cause Isolation & Post-Mortems

**Purpose**: Diagnoses complex bugs, race conditions, memory leaks, and segmentation faults using scientific root-cause isolation.

### When to Use:
- Investigating intermittent CI failures, crash dumps, or memory leaks.
- Diagnosing deadlock or performance regressions.

### Example Prompts:
```text
/codex-debug investigate memory leak under high websocket load
/codex-debug isolate intermittent race condition in worker pool
```

**Artifact Output**: `codex-drive/walkthroughs/YYYY-MM-DD-<slug>.debug.md`

---

## 7. `/codex-test` — Test Engineering & Benchmarking

**Purpose**: Generates comprehensive unit, property-based, fuzzing, and benchmark test suites with boundary-condition proofs.

### When to Use:
- Enforcing Test-Driven Development (TDD) before writing implementation code.
- Setting up performance regression benchmarks.

### Example Prompts:
```text
/codex-test generate property-based tests for JSON parser
/codex-test benchmark throughput for concurrent hash map
```

**Artifact Output**: `codex-drive/walkthroughs/YYYY-MM-DD-<slug>.test.md`

---

## 8. `/codex-review` — Senior Peer Code Review & Security Audit

**Purpose**: Conducts comprehensive code reviews evaluating security vulnerabilities (OWASP Top 10), concurrency safety, memory leaks, and style invariants.

### When to Use:
- Before submitting a pull request or merging a feature branch.
- Auditing third-party code or security-critical endpoints.

### Example Prompts:
```text
/codex-review audit src/auth/ for security and timing attacks
/codex-review review PR diff for memory safety and race conditions
```

**Artifact Output**: `codex-drive/walkthroughs/YYYY-MM-DD-<slug>.review.md`

---

## 9. `/codex-goal` — Autonomous Long-Running Execution Loop

**Purpose**: Drives end-to-end task completion through continuous plan execution, automated test verification, error recovery, and self-auditing.

### When to Use:
- Running multi-phase implementations autonomously without micro-management.

### Example Prompts:
```text
/codex-goal execute implementation plan for user notification service
```

**Artifact Output**: `codex-drive/walkthroughs/YYYY-MM-DD-<slug>.goal.md`

---

## 10. `/codex-brain` — Persistent Memory & Session Checkpoints

**Purpose**: Overcomes context-window limits by snapshotting critical decisions, uncompleted tasks, and learned gotchas into dense memory checkpoints.

### Subcommands:
- `/codex-brain save [topic]`: Snapshots current chat into `codex-drive/brains/YYYY-MM-DD-session-<topic>.brain.md`.
- `/codex-brain load [topic|latest]`: Restores context into a fresh AI chat in $< 1,000$ tokens.
- `/codex-brain dense [on|off]`: Activates high-density token-saving mode (saves up to 70% of tokens).
- `/codex-brain compact`: Consolidates older session memories into `knowledge-base.brain.md`.
- `/codex-brain index`: Scans repository conventions and domain glossary.

---

Next Step: **[Domain Editions Guide](editions.md)** | **[Codex Drive Guide](codex-drive.md)** | **[FAQ](faq.md)**

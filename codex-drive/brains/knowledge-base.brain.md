# AI Codex Master Knowledge Base & Context Memory

> **Created At**: 2026-08-15 00:12:00 (Local Time)
> **Memory Type**: CONSOLIDATED_KNOWLEDGE_BASE
> **Status**: ACTIVE

---

## 1. Project Overview & Architecture Baseline
- **Project Name**: AI Codex
- **Core Purpose**: Modular AI system prompts and autonomous command skills for senior-level engineering, invention, and research.
- **Architecture**: 
  - `skills/codex/<edition>/` — 10 Domain Knowledge Base Editions (C++, Python, TS/React, PHP, Rust, Go, Java/Kotlin, UI/UX, Swift, C#/.NET).
  - `skills/codex-<command>/` — 9 AI Command Skills (`start`, `plans`, `architecture`, `deep`, `debug`, `test`, `review`, `goal`, `brain`).
  - `codex-drive/` — Persistent Workspace Output Drive (`plans/`, `specs/`, `walkthroughs/`, `brains/`).

---

## 2. Key Architectural Invariants & Decisions
- **All Drive Artifacts are Markdown**: Every file in `codex-drive/` MUST be a `.md` file with standardized ISO/Local date-time metadata.
- **Strict 6-File Edition Structure**: Every domain edition in `skills/codex/` adheres to the 6-file specification (`01-core-identity.md` through `06-response-style.md` + `SKILL.md`).
- **Memory Compression Discipline**: Session snapshots compress lengthy conversations into dense, high-signal decision summaries (< 1,000 tokens) to survive context window limits.

---

## 3. Active Workspace Conventions
- **Naming Pattern**: `YYYY-MM-DD-<slug>.<type>.md` across `plans/`, `specs/`, `walkthroughs/`, and `brains/`.
- **Validation**: Enforced via `scripts/validate.py`.

# Codex Drive & Persistent Memory Architecture

> The persistent workspace output, memory storage, and artifact management system of **AI Codex**.

---

## What is Codex Drive?

**Codex Drive** (`codex-drive/`) is a repository-native directory where AI Codex stores all plans, technical specifications, test walkthroughs, and long-term conversation memories.

Instead of losing architectural decisions when a chat window is closed, Codex Drive turns your repository into a **self-documenting, persistent memory base**.

```
codex-drive/
├── brains/                         # Persistent Memory Checkpoints
│   ├── knowledge-base.brain.md     # Consolidated project conventions & invariants
│   └── YYYY-MM-DD-session-*.brain.md # Session snapshots & decision checkpoints
│
├── plans/                          # Phased Implementation Blueprints
│   ├── archive/                    # Archived completed plans
│   └── YYYY-MM-DD-*.plan.md        # Active implementation plans
│
├── specs/                          # Technical & Architectural Specifications
│   ├── archive/                    # Superseded specifications
│   └── YYYY-MM-DD-*.spec.md        # Active feature specs, DDD models, research
│
└── walkthroughs/                   # [OK] Verification Reports & Post-Mortems
    └── YYYY-MM-DD-*.walkthrough.md # Test reports, debug logs, security audits
```

---

## The Persistent Brain Memory System (`codex-drive/brains/`)

### The Problem It Solves: Context Limits & Amnesia
AI models have finite context windows. Long sessions experience token exhaustion, context drift, and forgotten decisions. Starting a new chat tomorrow forces you to re-explain everything.

### How `codex-brain` Solves It:
1. **Snapshot Before Closing**: Running `/codex-brain save` compresses thousands of conversation tokens into a dense `~600-token` memory checkpoint.
2. **Instant Restoration**: Running `/codex-brain load` or `/codex-start` in a fresh chat reads the checkpoint in $< 1,000$ tokens, instantly restoring 100% awareness of previous work.
3. **High-Density Token Mode (`/codex-brain dense`)**: Strips conversational padding while keeping 100% byte-exact code and diffs, saving up to **70% of tokens** on smaller models (Ollama, Haiku, Flash).

---

## Standard File Naming & Date-Time Invariant

Every file in `codex-drive/` MUST be a Markdown (`.md`) file with standardized date-time formatting:

| Folder | File Pattern | Typical Command Source |
| :--- | :--- | :--- |
| `codex-drive/brains/` | `YYYY-MM-DD-session-<slug>.brain.md` | `/codex-brain save` |
| `codex-drive/plans/` | `YYYY-MM-DD-<slug>.plan.md` | `/codex-plans` |
| `codex-drive/specs/` | `YYYY-MM-DD-<slug>.spec.md`<br>`YYYY-MM-DD-<slug>.arch.md`<br>`YYYY-MM-DD-<slug>.research.md` | `/codex-start`<br>`/codex-architecture`<br>`/codex-deep` |
| `codex-drive/walkthroughs/` | `YYYY-MM-DD-<slug>.walkthrough.md`<br>`YYYY-MM-DD-<slug>.debug.md`<br>`YYYY-MM-DD-<slug>.test.md`<br>`YYYY-MM-DD-<slug>.review.md` | `/codex-goal`<br>`/codex-debug`<br>`/codex-test`<br>`/codex-review` |

---

## Standard Metadata Header

Every artifact created in `codex-drive/` begins with this standardized header:

```markdown
# [Feature / Task Title]

> **Created At**: YYYY-MM-DD HH:MM:SS (Local Time)
> **Detected Stack**: [e.g. Rust / Tokio / Actix]
> **Active Codex Edition**: [`skills/codex/<edition>/`](file:///...)
> **Status**: PROPOSED | APPROVED | IN_PROGRESS | COMPLETED
```

---

## Spec & Plan Archival Lifecycle

When a feature or refactor is completed:
1. `/codex-goal` completes verification and updates the status to `COMPLETED`.
2. Key invariants and patterns are merged into `codex-drive/brains/knowledge-base.brain.md`.
3. Historical plan and spec files are moved to `codex-drive/plans/archive/` and `codex-drive/specs/archive/` to keep the active directory clean.

---

Next Step: **[AI Commands Guide](commands.md)** | **[Domain Editions](editions.md)** | **[FAQ](faq.md)**

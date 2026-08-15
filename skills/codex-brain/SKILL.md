---
name: codex-brain
description: >
  Manages long-term AI memory, overcomes context-window limits, snapshots chat session
  decisions, restores context into fresh sessions, supports high-density token-saving
  modes, and maintains living repository knowledge in codex-drive/brains/.
---

# Codex Brain — Persistent AI Memory & Context Management Skill

> The external long-term memory engine of AI Codex. Solves context window limits, prevents conversational amnesia, snapshots critical engineering decisions, and enables high-density token compression.

---

## Overview

AI models have finite context windows. In long-running projects, conversation history degrades, tokens run out, and critical decisions made yesterday are forgotten in a new chat today.

`codex-brain` provides **externalized, persistent memory** for AI sessions. It captures high-signal decision summaries, tracks uncompleted work, records environment gotchas, and stores compact memory checkpoints inside `codex-drive/brains/`. Any fresh chat session can read a brain checkpoint in `< 1,000 tokens` to instantly achieve 100% awareness of past engineering work.

---

## When to Trigger

- User runs `/codex-brain` or its subcommands:
  - `/codex-brain save [optional-topic]` — Snapshot current session memory before closing or when context is getting full.
  - `/codex-brain load [optional-topic|latest]` — Restore memory into a fresh chat session.
  - `/codex-brain dense [on|off]` — Toggle high-density "Caveman" token compression mode (saves up to 70% of tokens).
  - `/codex-brain compact` — Consolidate multiple session snapshots into the master knowledge base.
  - `/codex-brain index` — Scan repository conventions, architecture rules, and domain glossary.
- Starting a new chat session on an ongoing project (automatic context resumption via `/codex-start`).
- When context window usage is high and important decisions must be saved before starting a new chat.

---

## Memory Hierarchy

```
 ┌────────────────────────────────────────────────────────┐
 │ 1. WORKING MEMORY (Active State & Immediate Tasks)     │
 │    What was just done, what is blocked, what is next.  │
 ├────────────────────────────────────────────────────────┤
 │ 2. EPISODIC MEMORY (Session Snapshots & Decisions)     │
 │    Why architectural option A was chosen over B.       │
 ├────────────────────────────────────────────────────────┤
 │ 3. SEMANTIC MEMORY (Consolidated Knowledge Base)       │
 │    Project conventions, domain glossary, quirks.       │
 └──────────────────────────┬─────────────────────────────┘
                            │
                            ▼
 ┌────────────────────────────────────────────────────────┐
 │ HIGH-DENSITY TOKEN COMPRESSION ENGINE ("Caveman")   │
 │    Strips conversational fluff, keeps 100% exact code. │
 └────────────────────────────────────────────────────────┘
```

---

## Sub-Commands & Workflows

### 1. Snapshot Session Memory: `/codex-brain save [topic]`
1. Analyze the current conversation history.
2. Extract:
   - **Core Objectives**: What problem was addressed in this session.
   - **Decisions Made & Alternatives Rejected**: Concrete rationale for architectural choices.
   - **Completed Tasks vs. Next Immediate Tasks**: Exact continuation point for the next session.
   - **Gotchas & Quirks Learned**: Discovered edge cases, environment settings, API peculiarities.
3. Write timestamped checkpoint file to:
   `codex-drive/brains/YYYY-MM-DD-session-<slug>.brain.md`

### 2. Restore Memory Context: `/codex-brain load [topic|latest]`
1. Locate the latest or requested `.brain.md` file in `codex-drive/brains/`.
2. Parse the summary, active state, decisions, and remaining tasks.
3. Output a concise resumption brief to the user:
   > *"Context Restored from [YYYY-MM-DD-session-<slug>.brain.md]. Last worked on: [Objective]. Next task on deck: [Next Task]. Ready to proceed."*

### 3. High-Density Token Mode: `/codex-brain dense [on|off]`
When `dense` mode is active (ideal for smaller context models like Claude 3.5 Haiku, Gemini Flash, or local Ollama):
- **Strip Fluff**: Eliminate all polite conversational padding, preambles, and repetitive disclaimers.
- **Byte-Exact Code**: Preserve exact code blocks, diffs, shell commands, and file paths without modification.
- **Telegraphic Precision**: Format reasoning as concise bullet points. Reduces token consumption by up to **70%**.

### 4. Consolidate Memory: `/codex-brain compact`
1. Read all historical `YYYY-MM-DD-session-*.brain.md` files in `codex-drive/brains/`.
2. Extract recurring rules, finalized decisions, and permanent patterns.
3. Merge and update `codex-drive/brains/knowledge-base.brain.md`.
4. Archive or prune redundant intermediate session files to prevent memory sprawl.

### 5. Repository Context Indexing: `/codex-brain index`
1. Scan workspace root, folder topology, package manifests, and configuration files.
2. Catalog ubiquitous domain terms, models, schemas, and coding conventions.
3. Update `codex-drive/brains/knowledge-base.brain.md`.

---

## Context Compression Protocol

When generating a session snapshot, follow the **High-Density Signal Rule**:
- **Discard**: Conversational pleasantries, intermediate tool call logs, repetitive code dumps, syntax trial-and-error.
- **Preserve**: Final decisions, rejected alternatives with reasons, file paths created/modified, failing tests that need fixing, exact continuation instructions.
- **Target Density**: Compress 40,000+ tokens of verbose conversation into **~600 to 1,000 tokens** of structured markdown.

---

## Memory File Specification (`codex-drive/brains/`)

All memory files generated by `codex-brain` MUST be Markdown (`.md`) files with exact date-time metadata.

### Filename Formats:
- Session Snapshot: `codex-drive/brains/YYYY-MM-DD-session-<slug>.brain.md`
- Master Knowledge Base: `codex-drive/brains/knowledge-base.brain.md`

### Standard Session Memory Template:

```markdown
# [Session / Feature Name] Memory Checkpoint

> **Created At**: YYYY-MM-DD HH:MM:SS (Local Time)
> **Active Codex Edition**: [`skills/codex/<edition>/`](file:///...)
> **Memory Type**: SESSION_SNAPSHOT
> **Compression Ratio**: [e.g., ~42,000 tokens compressed into ~650 tokens]
> **Status**: READY_FOR_RESUMPTION | ARCHIVED

---

## 1. Session Objective & Scope
[Concise summary of what was tackled in this session]

## 2. Key Decisions & Rationale
- **Decision 1**: Chose PostgreSQL row-level locking (`FOR UPDATE`) instead of Redis distributed lock because the cluster is single-region and DB transaction atomicity is required.
- **Decision 2**: Rejected library X due to lack of Swift 6 strict concurrency / Sendable support.

## 3. Work Completed in This Session
- [x] Implemented domain aggregate `Order` in `src/domain/order.ts`
- [x] Added database migration `004_create_orders.sql`
- [x] Wrote unit test suite with 100% invariant coverage

## 4. Active Continuation Point (Next Session Resumes Here)
- [ ] Implement HTTP controller in `src/api/order-controller.ts`
- [ ] Wire dependency injection container in `src/server.ts`
- [ ] Run integration tests with Testcontainers (`npm run test:integration`)

## 5. Critical Gotchas & Environment Quirks Learned
- [WARNING] Webhook payload timestamps are emitted in milliseconds UTC, not seconds.
- [WARNING] Database pool max connections must not exceed 20 to avoid exhausting AWS RDS limits.
- [WARNING] Ensure `CancellationToken` is propagated in all async database queries.
```

---

## Response Protocol

When `codex-brain save` completes:
1. Provide a direct link to `[View Brain Memory Checkpoint](file:///.../codex-drive/brains/YYYY-MM-DD-session-<slug>.brain.md)`.
2. Display a compact 3-bullet resumption summary (What was done, What decisions were locked in, What is next).
3. Inform the user: *"You can start a fresh chat anytime and run `/codex-brain load` or `/codex-start` to instantly resume with full context."*

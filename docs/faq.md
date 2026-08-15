# Frequently Asked Questions (FAQ)

> Common questions and answers about **AI Codex**, its architecture, commands, and workflows.

---

### General Questions

#### 1. What makes AI Codex different from a single `.cursorrules` file or generic system prompt?
Standard system prompts are monolithic: they try to cram all rules, style guides, and persona instructions into one huge text block. This causes **context bloat**, token exhaustion, and instruction dilution (the AI forgets rules near the middle/end of the prompt).

AI Codex uses a **modular 6-file architecture** separated by purpose (`01-core-identity`, `02-languages-standards`, `03-first-principles`, `04-domains-knowledge`, `05-research-method`, `06-response-style`). You only load what you need for the current task (e.g., prototyping vs. writing production code).

#### 2. How does AI Codex compare to frameworks like OpenSpec or Superpowers?
AI Codex synthesizes the best aspects of the top agent frameworks:
- **From Superpowers**: Structured engineering workflows (TDD, isolated tasks, multi-phase verification).
- **From OpenSpec**: Spec-Driven Development (SDD) with persistent, repository-native Markdown files.
- **From Ponytail**: The **Senior Decision Ladder** (anti-overengineering, YAGNI, standard library first).
- **From Caveman**: High-density token compression and persistent session memory checkpoints.

---

### Brain Memory & Context Window

#### 3. How does `/codex-brain` prevent context degradation?
When chat conversations get long (40k+ tokens), the AI becomes sluggish or forgets earlier decisions. Running `/codex-brain save` compresses the session into a dense `~600-token` Markdown checkpoint in `codex-drive/brains/`.

When you start a fresh chat tomorrow, running `/codex-brain load` or `/codex-start` reads that checkpoint in $< 1,000$ tokens, instantly giving the AI 100% awareness of past decisions, remaining tasks, and learned gotchas.

#### 4. Can I use AI Codex with local models (Ollama, LM Studio) or lightweight models?
**Yes.** Activate high-density token mode by running:
```text
/codex-brain dense on
```
This strips conversational fluff and filler text while keeping code, diffs, and commands byte-for-byte exact, reducing token usage by up to **70%**.

---

### Commands & Engineering Discipline

#### 5. What is the 7-Rung Senior Decision Ladder?
Before writing code or adding dependencies, `/codex-plans` forces the AI to evaluate:
1. *YAGNI Check*: Does this need to exist at all?
2. *Reuse Check*: Is a utility already in the codebase?
3. *Stdlib Check*: Can standard library functions do this?
4. *Native API Check*: Is there a native browser or OS feature?
5. *Dependency Check*: Can existing project dependencies solve it?
6. *Simplicity Check*: Can it be written in $\le 5$ lines?
7. *Minimum Abstraction*: Write only the minimal necessary custom code.

#### 6. How do I add my own team's private SDK or custom language edition?
Run:
```text
/codex-skills edition <name>
# or for a specific task:
/codex-skills custom <name>
# or to extract from current workspace:
/codex-skills extract <name>
```
This scaffolds the new skill in `skills/codex/<name>/` and registers it in `codex.json`.

---

### Multi-Tool & Team Collaboration

#### 7. Can multiple developers use different AI assistants on the same repository?
**Yes.** Use the vendor-neutral **`.agents`** integration:
```bash
npx ai-codex init --tools agents
```
This generates `.agents/skills/` and `AGENTS.md`, allowing Cursor, Claude Code, Windsurf, Copilot, Cline, and Roo Code to share the exact same skills and `codex-drive/` memory.

#### 8. Are files in `codex-drive/` safe to commit to Git?
**Yes, highly recommended.** Committing `codex-drive/` tracks your project's architectural decisions, plans, and knowledge base in Git history, giving every team member and AI assistant continuous context.

---

**[View Installation Guide](installation.md)** | **[View Supported Tools](supported-tools.md)** | **[Return to README](../README.md)**

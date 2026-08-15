---
name: codex-skills
description: >
  Scaffolds, generates, and extracts new AI Codex skills and domain editions.
  Creates standardized 6-file language editions, project-specific custom workflow
  skills, and workspace-extracted skills inside skills/codex/.
---

# Codex Skills — Skill Creator & Scaffolding Engine

> The skill generation and authoring engine of AI Codex. Scaffolds new 6-file domain editions, creates custom workspace task skills, and extracts internal codebase patterns into reusable AI skills in `skills/codex/`.

---

## Overview

`codex-skills` allows developers and teams to extend AI Codex by generating new skills tailored to their languages, frameworks, internal SDKs, or project workflows. It ensures all generated skills adhere to the universal AI Codex standard: strict YAML frontmatter, deterministic execution workflows, clean 6-file modular architectures, and structured output artifact conventions in `codex-drive/`.

---

## When to Trigger

- User runs `/codex-skills` (e.g., `/codex-skills edition elixir`, `/codex-skills custom stripe-billing`, `/codex-skills extract internal-sdk`)
- Creating a new programming language or domain edition for the AI Codex library
- Packaging repetitive workspace workflows, deployment processes, or database migrations into an agent skill
- Distilling internal team guidelines, private SDK rules, and architectural standards into a bespoke AI skill

---

## The 3 Generation Modes

```
                              /codex-skills
                                    │
         ┌──────────────────────────┼──────────────────────────┐
         ▼                          ▼                          ▼
 ┌────────────────┐         ┌────────────────┐         ┌────────────────┐
 │ 1. FULL CODEX  │         │ 2. CUSTOM TASK │         │ 3. WORKSPACE   │
 │    EDITION     │         │    WORKFLOW    │         │    EXTRACTOR   │
 │ (6 Files +     │         │ (Standalone    │         │ (Reverse-eng   │
 │  SKILL.md)     │         │  SKILL.md)     │         │  from repo)    │
 └───────┬────────┘         └───────┬────────┘         └───────┬────────┘
         │                          │                          │
         ▼                          ▼                          ▼
 ┌──────────────────────────────────────────────────────────────────────┐
 │ Target Directory: skills/codex/<skill-name>/                         │
 └──────────────────────────────────────────────────────────────────────┘
```

---

## Mode 1: Full 6-File Codex Edition (`/codex-skills edition <name>`)

Use when adding a new major programming language, technical domain, or platform.

### Generated File Hierarchy in `skills/codex/<name>/`:

| File | Standard Contents & Structure |
| :--- | :--- |
| `SKILL.md` | YAML frontmatter (`name`, `description`), overview, 6-file index, recommended combinations, key capabilities. |
| `01-core-identity.md` | Senior Architect persona, core values, thinking style (7 steps), absolute principles (ALWAYS / NEVER). |
| `02-languages-standards.md` | Target versions, strict language idioms, non-negotiable standards table, memory/concurrency rules, anti-patterns. |
| `03-first-principles.md` | Mental models, runtime/hardware mechanics, type-driven design, state machines, architectural trade-off matrix. |
| `04-domains-knowledge.md` | Ecosystem deep-dives, major frameworks, design patterns, code snippets with complete types. |
| `05-research-method.md` | Invention/prototyping loop, diagnostic/profiling tools, testing pyramid, production readiness checklist. |
| `06-response-style.md` | Peer-level tone, response anatomy (4 sections), code snippet rules, code review template, canonical reference map. |

### Automatic Manifest Registration:
`codex-skills` automatically registers the new edition in `codex.json` under `"editions"`:
```json
{
  "id": "<name>",
  "name": "<Display Name> Edition",
  "description": "<Concise description>",
  "directory": "skills/codex/<name>",
  "icon": "",
  "tags": ["tag1", "tag2"],
  "files": [
    { "file": "01-core-identity.md", "purpose": "Identity, values, and thinking style", "required": true },
    { "file": "02-languages-standards.md", "purpose": "Language standards and code quality" },
    { "file": "03-first-principles.md", "purpose": "Mental models and runtime mechanics" },
    { "file": "04-domains-knowledge.md", "purpose": "Frameworks and ecosystem patterns" },
    { "file": "05-research-method.md", "purpose": "Prototyping, profiling, and production checklist" },
    { "file": "06-response-style.md", "purpose": "Communication format and references" }
  ]
}
```

---

## Mode 2: Custom Workspace Task Skill (`/codex-skills custom <name>`)

Use when creating a focused workflow skill for a specific task (e.g., database migrations, Stripe integration, Kubernetes deploys).

### Generated `skills/codex/<name>/SKILL.md` Template:

```markdown
---
name: [skill-name]
description: >
  [Clear, actionable description of what this skill does and when to trigger it.]
---

# [Skill Title] — [Subtitle]

> [High-level one-line summary of the skill's purpose.]

---

## Overview
[Detailed explanation of the workflow, problem it solves, and target tools/systems]

## When to Trigger
- User runs `/[skill-name]` (e.g., `/[skill-name] <args>`)
- [List specific trigger conditions or context]

## Execution Workflow
1. **Phase 1: Input Validation & Context Discovery**
2. **Phase 2: Core Task Execution & Transformations**
3. **Phase 3: Automated Verification & Testing**
4. **Phase 4: Artifact Generation in codex-drive/**

## Output Artifact Conventions
- Writes results to: `codex-drive/walkthroughs/YYYY-MM-DD-[name].walkthrough.md` or `codex-drive/specs/`

## Response Protocol
- Summary of actions taken, verified outputs, and next steps.
```

---

## Mode 3: Workspace Skill Extractor (`/codex-skills extract <name>`)

Use when reverse-engineering a skill directly from the active workspace:

1. **Scan Workspace**: Scans internal packages, configuration conventions, naming patterns, base classes, and test utilities.
2. **Extract Guidelines**:
   - Internal API contracts and authentication headers.
   - Project-specific error handling patterns.
   - Database conventions and migration rules.
   - Common gotchas and anti-patterns.
3. **Synthesize Skill**: Generates a tailored `skills/codex/<name>/SKILL.md` that teaches any AI assistant how to write code according to the repository's exact internal standards.

---

## Mode 4: Community Marketplace Installation (`/codex-skills install <source>`)

Use when installing a community skill or edition from a remote Git repository or registry:

```text
/codex-skills install github.com/org/custom-edition
```

1. Clones or fetches skill files into `skills/codex/<name>/`.
2. Validates frontmatter and file structure against AI Codex specifications.
3. Registers the new skill entry into `codex.json`.
4. Runs `python scripts/validate.py` to confirm workspace integrity.

---

## Quality Checklist for Generated Skills

Every skill generated by `codex-skills` must pass the following audit:
- [ ] Valid YAML frontmatter (`---` header and footer with `name` and `description`).
- [ ] No empty files or placeholder comments.
- [ ] Clear step-by-step execution workflow diagrams.
- [ ] Output artifacts strictly routed to `codex-drive/` (`plans/`, `specs/`, `walkthroughs/`, `brains/`) with `YYYY-MM-DD` timestamps.
- [ ] Verified with `python scripts/validate.py` (zero validation errors).

---

## Response Protocol

When `codex-skills` completes:
1. Provide clickable links to the newly created skill folder and files in `skills/codex/<name>/`.
2. Display the newly registered entry in `codex.json`.
3. Run `python scripts/validate.py` and present the validation confirmation.

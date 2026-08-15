# Codex Marketplace & Community Skills Registry

> How to discover, install, publish, and share modular AI instructions and autonomous engineering skills across teams and the global community.

---

## 1. Overview

The **Codex Marketplace** is a decentralized, community-driven skill distribution model. Any developer, engineering team, or open-source community can package their domain knowledge into standard AI Codex formats and share them via Git repositories or NPM packages.

---

## 2. Installing Skills from the Community

Install custom skills directly into your workspace using the `ai-codex` CLI or the `/codex-skills` command in chat:

### Option A: Via Terminal (CLI)
```bash
# Install a skill from a GitHub repository
npx ai-codex install github.com/username/custom-skill

# Install a skill from an npm package
npx ai-codex install @org/codex-edition-kubernetes
```

### Option B: In AI Chat via `/codex-skills`
```text
/codex-skills install github.com/username/custom-skill
```

---

## 3. Skill Packaging Standards

All community skills distributed in the marketplace must adhere to the standard AI Codex directory structure:

### 3.1. Standard 6-File Domain Edition
```
skills/codex/[edition-name]/
├── SKILL.md                   # YAML frontmatter + manifest
├── 01-core-identity.md        # Persona, values, decision ladder, ALWAYS/NEVER
├── 02-languages-standards.md  # Idioms, typing, syntax, anti-patterns
├── 03-first-principles.md     # Memory models, execution pipelines, math
├── 04-domains-knowledge.md    # Frameworks, system design, data architecture
├── 05-research-method.md      # Testing, benchmarks, diagnostics, audits
└── 06-response-style.md       # Peer communication, response structure, reference map
```

### 3.2. Single-Workflow Task Skill
```
skills/[skill-name]/
└── SKILL.md                   # Complete executable workflow with inputs/outputs
```

---

## 4. Publishing Your Skill to the Marketplace

1. **Scaffold your skill**:
   ```text
   /codex-skills edition <name>
   # or
   /codex-skills custom <name>
   ```
2. **Author the content** adhering to the [CONTRIBUTING.md](../CONTRIBUTING.md) quality checklist (zero emojis, strict technical depth, runnable code).
3. **Validate integrity**:
   ```bash
   python scripts/validate.py
   ```
4. **Submit to the AI Codex Registry**:
   - Push your skill to a public GitHub repository.
   - Open a Pull Request to [ai-codex](https://github.com/wwwroot/ai-codex) adding your skill to `codex.json` or the official registry index.

---

## 5. Verified Community Skill Registry Index

| Skill / Edition | Category | Author / Source | Description |
| :--- | :--- | :--- | :--- |
| **Kubernetes & Cloud Native** | DevOps | `@cloud-native` | Advanced Helm, Kustomize, CRD controllers, and eBPF observability. |
| **Unreal Engine 5 C++** | Game Dev | `@gamedev-hub` | Gameplay framework, Subsystems, Niagara, and Lumen performance optimization. |
| **Ruby on Rails 8** | Web & Backend | `@rails-core` | Solid Queue, Kamal 2 deployments, Hotwire Turbo 8, and dry-rb patterns. |
| **PyTorch CUDA Kernels** | AI / Systems | `@deep-learning` | Custom Triton kernels, FlashAttention-2, and FP8 quantized matrix multiplication. |
| **PostgreSQL DBA Deep** | Database | `@db-experts` | WAL tuning, logical replication, pg_stat_activity internals, and connection pooling. |

---

Next Step: **[View AI Commands Guide](commands.md)** | **[Return to Main README](../README.md)**

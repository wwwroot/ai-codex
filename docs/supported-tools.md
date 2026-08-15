# Supported Tools & Editors Reference

> AI Codex is engineered for universal compatibility across 38+ AI coding assistants, IDEs, and CLI agents.

---

## 1. How AI Codex Integrates

When you run `npx ai-codex init`, AI Codex configures your selected tools using one or both integration models:

1. **System Prompt / Instruction Rules**: Root-level rules files (e.g. `.cursorrules`, `CLAUDE.md`, `.windsurfrules`, `.github/copilot-instructions.md`, `GEMINI.md`, `AGENTS.md`) that teach the AI assistant its Senior Architect identity, engineering standards, and memory protocols.
2. **Command / Workflow Definitions**: Tool-specific command files (e.g. `.cursor/commands/`, `.claude/commands/`, `.github/prompts/`, `.agent/workflows/`, `.continue/prompts/`) exposing slash commands like `/codex-start`, `/codex-plans`, `/codex-brain`, etc.
3. **Universal `.agents/skills/` Standard**: Vendor-neutral directory standard read automatically by OpenAI Codex CLI, Hermes Agent, CodeArts, Mistral Vibe, and multi-agent development teams.

---

## 2. Command Invocation Syntax by Tool

Different AI assistants use different command triggers. AI Codex automatically adapts to each tool's native convention:

| Invocation Style | Syntax Example | Tools & Environments |
| :--- | :--- | :--- |
| **Direct Slash Command** | `/codex-start`<br>`/codex-plans`<br>`/codex-brain` | **Cursor**, **Claude Code**, **Devin Desktop / Windsurf**, **Cline**, **Roo Code**, **Trae**, **OpenCode**, **Crush**, **CodeBuddy**, **Lingma** |
| **Workflow / Prompt Library** | `@codex-start`<br>`@codex-brain` | **Amazon Q Developer**, **GitHub Copilot Chat** |
| **Agent / Shell Invocations** | `$codex-start`<br>`/skill:codex-start` | **OpenAI Codex CLI**, **Kimi Code** |
| **Natural Language Directives** | *"Use codex-start to initialize..."* | **Aider**, **Zed AI**, **JetBrains AI**, **Rovo Dev**, **ChatGPT / Web LLMs** |

---

## 3. Complete 38+ Tool Directory & Config Reference

| Tool (ID) | Rules / Instructions Path | Command / Workflow Path |
| :--- | :--- | :--- |
| **Cursor** (`cursor`) | `.cursorrules` | `.cursor/commands/codex-<id>.md` |
| **Claude Code** (`claude`) | `CLAUDE.md` | `.claude/commands/codex/<id>.md` |
| **Devin Desktop / Windsurf** (`devin` / `windsurf`) | `.windsurfrules` | `.devin/workflows/codex-<id>.md` |
| **GitHub Copilot** (`github-copilot` / `copilot`) | `.github/copilot-instructions.md` | `.github/prompts/codex-<id>.prompt.md` |
| **Google Antigravity** (`antigravity`) | `GEMINI.md` | `.agent/workflows/codex-<id>.md` |
| **Gemini CLI** (`gemini`) | `GEMINI.md` | `.gemini/commands/codex/<id>.toml` |
| **Shared `.agents` Standard** (`agents`) | `AGENTS.md` | `.agents/skills/codex-*/SKILL.md` |
| **Cline** (`cline`) | `.clinerules` | `.cline/skills/codex-*/SKILL.md` |
| **Roo Code / Zoo Code** (`roocode`) | `.roomodes` | `.roo/commands/codex-<id>.md` |
| **Continue** (`continue`) | `.continue/config.json` | `.continue/prompts/codex-<id>.prompt` |
| **Zed Editor** (`zed`) | `.zed/settings.json` | Contextual project rules |
| **Amazon Q Developer** (`amazon-q`) | `.amazonq/rules.md` | `.amazonq/prompts/codex-<id>.md` |
| **Aider** (`aider`) | `CONVENTIONS.md` / `.aider.conf.yml` | Direct prompt directives |
| **OpenCode** (`opencode`) | `.opencoderules` | `.opencode/commands/codex-<id>.md` |
| **Trae** (`trae`) | `.traerules` | `.trae/commands/codex-<id>.md` |
| **Kimi Code** (`kimi`) | `.kimi/rules.md` | `.kimi-code/skills/codex-*/SKILL.md` |
| **Mistral Vibe** (`vibe`) | `.viberules` | `.vibe/skills/codex-*/SKILL.md` |
| **Qwen Code** (`qwen`) | `.qwenrules` | `.qwen/commands/codex-<id>.md` |
| **Alibaba Tongyi Lingma** (`lingma`) | `.lingma/rules.md` | `.lingma/commands/codex/<id>.md` |
| **Tencent CodeBuddy** (`codebuddy`) | `.codebuddy/rules.md` | `.codebuddy/commands/codex/<id>.md` |
| **Huawei CodeArts** (`codeartsagent`) | `.codeartsdoer/rules.md` | `.codeartsdoer/skills/codex-*/SKILL.md` |
| **OpenAI Codex CLI** (`codex`) | `AGENTS.md` | `.agents/skills/codex-*/SKILL.md` |
| **Auggie / Augment Code** (`auggie`) | `.augment/rules.md` | `.augment/commands/codex-<id>.md` |
| **IBM Bob Shell** (`bob`) | `.bob/rules.md` | `.bob/commands/codex-<id>.md` |
| **Command Code** (`command-code`) | `.commandcode/rules.md` | `.commandcode/commands/codex-<id>.md` |
| **CoStrict** (`costrict`) | `.cospec/rules.md` | `.cospec/commands/codex-<id>.md` |
| **Crush** (`crush`) | `.crush/rules.md` | `.crush/commands/codex/<id>.md` |
| **Factory Droid** (`factory`) | `.factory/rules.md` | `.factory/commands/codex-<id>.md` |
| **ForgeCode** (`forgecode`) | `.forge/rules.md` | `.forge/skills/codex-*/SKILL.md` |
| **Hermes Agent** (`hermes`) | `~/.hermes/config.yaml` | `.hermes/skills/codex-*/SKILL.md` |
| **iFlow** (`iflow`) | `.iflow/rules.md` | `.iflow/commands/codex-<id>.md` |
| **Junie** (`junie`) | `.junie/rules.md` | `.junie/commands/codex-<id>.md` |
| **Kilo Code** (`kilocode`) | `.kilocode/rules.md` | `.kilocode/workflows/codex-<id>.md` |
| **Kiro** (`kiro`) | `.kiro/rules.md` | `.kiro/prompts/codex-<id>.prompt.md` |
| **MiniMax Code** (`minimax-code`) | `~/.minimax/rules.md` | `~/.minimax/skills/codex-*/SKILL.md` |
| **Oh My Pi** (`oh-my-pi`) | `.omp/rules.md` | `.omp/commands/codex-<id>.md` |
| **Pi** (`pi`) | `.pi/rules.md` | `.pi/prompts/codex-<id>.md` |
| **Qoder** (`qoder`) | `.qoder/rules.md` | `.qoder/commands/codex/<id>.md` |
| **Atlassian Rovo Dev** (`rovodev`) | `.rovodev/rules.md` | `.rovodev/skills/codex-*/SKILL.md` |
| **Baidu ZCode** (`zcode`) | `.zcode/rules.md` | `.zcode/commands/codex/<id>.md` |

---

## 4. The Shared `.agents` Standard (Vendor-Neutral)

If your repository is used by a distributed team with different AI assistants (e.g. some using Cursor, some using Claude Code, some using Copilot or Windsurf), choose the **`agents`** target:

```bash
npx ai-codex init --tools agents
```

This installs instructions into **`.agents/skills/`** and **`AGENTS.md`**, allowing all tools conforming to the universal agent standard to share a single unified memory and skill tree without creating duplicated configuration folders.

---

## 5. GitHub Copilot Cloud Coding Agent Setup

GitHub's cloud coding agent runs asynchronously in GitHub Actions environments. To equip the cloud agent with AI Codex:

```bash
npx ai-codex init --tools copilot
```

This configures:
- `.github/copilot-instructions.md` (Editor rules)
- `.github/prompts/` (Custom prompt commands)
- `.github/workflows/copilot-setup-steps.yml` (CI runner skill provisioning)

---

## 6. Non-Interactive CI / Scripted Setup

For automated container builds or CI/CD pipelines, specify tools via the `--tools` flag:

```bash
# Configure specific tools
npx ai-codex init --tools cursor,claude,copilot

# Configure all supported tools
npx ai-codex init --tools all
```

---

Next Step: **[Installation Guide](installation.md)** | **[Return to README](../README.md)**

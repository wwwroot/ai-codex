# Installation & Setup Guide

> Everything you need to install, configure, and initialize **AI Codex** across your repositories, editors, and AI coding assistants.

---

## Prerequisites

- **Node.js 18.0.0 or higher** (recommended: Node.js 20+) — Check with `node --version`
- *Optional alternative runtimes*: **Bun** (`bun --version`) or **Deno** (`deno --version`)

---

## Install With Your AI Assistant (Easiest)

Rather than running terminal commands manually, paste this exact prompt into your AI coding assistant (Claude Code, Cursor, Devin/Windsurf, GitHub Copilot, Gemini CLI, Cline, Roo Code):

```text
Install and configure AI Codex in this project for me. Follow these steps in order:

1. RUNTIME CHECK: Run `node --version`. Verify Node.js 18+ is available.
2. INITIALIZE: Run `npx @wwwroot/ai-codex init` in the current workspace root.
3. DETECT & CONFIGURE:
   - Allow the CLI to detect the tech stack (Rust, Go, Python, TypeScript, Swift, C#, PHP, Java, C++).
   - Verify that `codex-drive/` (brains/, plans/, specs/, walkthroughs/) is scaffolded.
   - Configure editor instruction files (.cursorrules, CLAUDE.md, .windsurfrules, or .github/copilot-instructions.md).
4. VERIFY & REPORT:
   - Check that `codex-drive/brains/knowledge-base.brain.md` is active.
   - Report back the active AI Codex edition and explain how to invoke `/codex-start`.
```

---

## Quick Start (1-Command CLI)

To initialize AI Codex directly in your project root:

```bash
npx @wwwroot/ai-codex init
```

### What happens automatically:
1. **Auto-detects** your programming language and framework (`package.json`, `Cargo.toml`, `go.mod`, `pyproject.toml`, `Package.swift`, `*.csproj`, `pom.xml`, etc.).
2. **Scaffolds Codex Drive** (`codex-drive/brains/`, `plans/`, `specs/`, `walkthroughs/`).
3. **Configures Editor Rules** (`.cursorrules`, `CLAUDE.md`, `.windsurfrules`, `.github/copilot-instructions.md`).

---

## Package Managers

### npm
```bash
# Run on-demand without global install (Recommended)
npx @wwwroot/ai-codex init

# Or install globally
npm install -g @wwwroot/ai-codex
ai-codex init
```

### pnpm
```bash
pnpm dlx @wwwroot/ai-codex init
# or global
pnpm add -g @wwwroot/ai-codex
```

### bun
```bash
bunx @wwwroot/ai-codex init
# or global
bun add -g @wwwroot/ai-codex
```

### yarn
```bash
yarn dlx @wwwroot/ai-codex init
```

### deno
```bash
deno run --allow-read --allow-write --allow-env npm:@wwwroot/ai-codex init
```

---

## CLI Command Reference

```bash
ai-codex <command> [options]
```

| Command | Description |
| :--- | :--- |
| `ai-codex init` | Scaffolds `codex-drive/` and configures editor integration files |
| `ai-codex list` | Displays all 15 domain editions and 10 workflow command skills |
| `ai-codex status` | Checks workspace health, installed editions, and drive integrity |
| `ai-codex doctor` | Runs workspace diagnostics and integration file verification |
| `ai-codex help` | Displays the help menu and available flags |

### Available Flags:

- `--edition <id>`: Force a specific domain edition (e.g. `rust`, `python`, `typescript-react`, `swift`, `csharp-dotnet`, `go`, `php`, `java-kotlin`, `c-cpp`, `ui-ux-design`, `elixir`, `zig`, `sql-database`, `solidity-web3`, `flutter-dart`).
- `--tools <ids>`: Comma-separated list of target AI tools (e.g. `--tools cursor,claude,copilot,antigravity,agents` or `--tools all`).
- `--dir <path>`: Specify target workspace directory (defaults to current working directory).

---

## Manual / Air-Gapped Installation

For enterprise environments or private servers without internet access:

1. Clone or download the AI Codex repository:
   ```bash
   git clone https://github.com/wwwroot/ai-codex.git
   ```
2. Copy the desired edition instructions from `skills/codex/<edition>/` into your project's custom rules or system prompt configuration.
3. Create the `codex-drive/` directory structure manually:
   ```bash
   mkdir -p codex-drive/{brains,plans/archive,specs/archive,walkthroughs}
   ```
4. Copy the matching template from `integrations/` (e.g. `integrations/cursorrules.example` $\rightarrow$ `.cursorrules`).

---

## Troubleshooting

### Command not found after global install
If `ai-codex` is not recognized after `npm install -g ai-codex`:
- Check your npm global bin directory: `npm bin -g` or `npm root -g`
- Ensure that directory is in your shell's `PATH` environment variable (`~/.bashrc`, `~/.zshrc`, or Windows Environment Variables).
- If using **nvm**, **fnm**, or **asdf**, make sure the active Node.js version matches the one used during install.

### Monorepos / Multi-Package Projects
Run `npx ai-codex init` at the **repository root**. Codex Drive will maintain project-wide memory in `codex-drive/`, while individual packages can leverage specific domain editions.

---

Next Step: **[View Supported Tools & Editors](supported-tools.md)**

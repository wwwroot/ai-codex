# Platform Integration Templates

> Pre-built configuration files for integrating AI Codex with popular code editors and AI tools.

Each template in this directory is ready to copy into your project. Replace the placeholder edition (`python/`) with your chosen edition.

---

## Quick Setup Guide

| Editor / Tool | Config File | Copy To |
|--------------|-------------|---------|
| **Cursor** | `cursorrules.example` | `.cursorrules` in project root |
| **Claude Code** | `CLAUDE.example.md` | `CLAUDE.md` in project root |
| **Windsurf** | `windsurfrules.example` | `.windsurfrules` in project root |
| **GitHub Copilot** | `copilot-instructions.example.md` | `.github/copilot-instructions.md` |
| **Continue** | `continue-config.example.json` | `.continue/config.json` |
| **Zed** | `zed-settings.example.json` | `.zed/settings.json` |

## Usage

1. Pick the template that matches your editor
2. Copy it to the correct location in your project (see table above)
3. Replace `python/` paths with your chosen edition (e.g., `rust/`, `go/`, `c-cpp/`)
4. Adjust the file selection based on your session needs

- All templates assume the AI Codex files are at the root of your repository
- For 1-command automated installation, run `npx ai-codex init`
- Comprehensive Guides:
  - **[Installation Guide](../docs/installation.md)**
  - **[Supported Tools Matrix (30+ Tools)](../docs/supported-tools.md)**
  -  **[Main README](../README.md)**

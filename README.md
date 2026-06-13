# AI Codex

<div align="center">

**Transform any AI assistant into a senior-level engineering partner.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Editions](https://img.shields.io/badge/Editions-8-brightgreen.svg)](#available-editions)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-orange.svg)](#contributing)

*Not a tutor. Not a code generator. A thinking partner for people who build things that do not exist yet.*

</div>

---

## What Is This?

**AI Codex** is a world-class collection of modular AI instructions engineered for invention, research, and building new technology across major programming languages and technical domains.

It is designed to transform general AI assistants into focused, high-context partners for serious technical work. Rather than relying on one large prompt, AI Codex organizes guidance into specialized editions and reusable instruction files that can be combined based on the task.

Each edition follows the same 6-file architecture, making it easier to control context, sharpen reasoning, and adapt AI behavior for different kinds of work — from deep technical exploration to production engineering and design systems.

---

## How It Works

```
 YOU                        AI CODEX                        AI ASSISTANT
 ───                        ────────                        ────────────

  "I need to build       ┌─────────────────┐
   a lock-free queue     │ Select Edition  │
   in Rust"              │ (Rust)          │
        │                └────────┬────────┘
        │                         │
        │                ┌────────┴────────┐
        │                │ Choose Files:   │
        │                │ 01 + 02 + 04    │
        │                └────────┬────────┘
        │                         │
        ▼                         ▼
  ┌──────────┐           ┌──────────────────┐          ┌──────────────────┐
  │  Your    │  ──────►  │  Load into your  │  ──────► │  AI now thinks   │
  │  Idea    │           │  AI platform     │          │  like a Senior   │
  └──────────┘           └──────────────────┘          │  Rust Systems    │
                                                       │  Engineer        │
                                                       └──────────────────┘
```

1. **Pick your edition** — choose the language/domain that matches your project
2. **Select your files** — load only what you need for the current session
3. **Paste into your AI tool** — works with any platform (see integrations below)
4. **Start building** — your AI is now a domain-expert engineering partner

---

## Available Editions

A single index of all modular prompt editions. Click on an edition to view its detailed documentation, configuration, and capabilities.

| Edition | Primary Focus | Target Stack & Tools | Folder / Docs |
| :--- | :--- | :--- | :--- |
| **🔧 C / C++** | Research, low-level systems, new technology invention | Systems, GPU, AI runtimes, compiler design | [`c-cpp/`](c-cpp/SKILL.md) |
| **🐍 Python** | Production systems, AI/ML engineering, data science | PyTorch, FastAPI, Pandas, Hugging Face, uv | [`python/`](python/SKILL.md) |
| **⚡ TypeScript / React** | Modern frontend architecture & fullstack applications | React 19, Next.js 15, strict TS, Web ecosystem | [`typescript-react/`](typescript-react/SKILL.md) |
| **🐘 PHP** | Web apps, backend architecture, modern API design | PHP 8.3+, Laravel, Symfony, PSRs, security | [`php/`](php/SKILL.md) |
| **🦀 Rust** | Safe systems programming, concurrency, embedded, WASM | Tokio async, Cargo, Clippy, unsafe discipline | [`rust/`](rust/SKILL.md) |
| **🔷 Go** | Cloud-native microservices, DevOps, CLI tools | Kubernetes, Docker, observability, database drivers | [`go/`](go/SKILL.md) |
| **☕ Java / Kotlin** | Enterprise backend services, Android apps, microservices | JVM 21, Spring Boot, Compose, Kafka, Kotlin 2.0 | [`java-kotlin/`](java-kotlin/SKILL.md) |
| **🎨 UI/UX Design** | Product design, design systems, accessibility | Figma, tokens, visual hierarchy, user research | [`ui-ux-design/`](ui-ux-design/SKILL.md) |

---

## Recommended Combinations

Pick files based on what you are doing — you do not always need all six.

| What you are doing | Files to load | Why |
|--------------------|---------------|-----|
| 🔍 Exploring a new idea | 01 + 03 + 05 | Identity + reasoning + research method |
| ✍️ Writing production code | 01 + 02 + 06 | Identity + standards + output format |
| 📚 Deep technical research | 01 + 03 + 04 | Identity + reasoning + domain expertise |
| 🏗️ Full invention session | All six | Maximum context for complex work |

---

## Editor & Platform Integrations

AI Codex works with any editor or AI platform supporting system prompts or custom instructions.

Pre-built templates available in [`integrations/`](integrations/README.md):
- **Cursor** (`.cursorrules`)
- **Claude Code** (`CLAUDE.md`)
- **Windsurf** (`.windsurfrules`)
- **GitHub Copilot** (`copilot-instructions.md`)
- **Continue** (`config.json`)
- **Zed** (`settings.json`)
- *Aider, Cline, Roo Code, JetBrains, ChatGPT, and more...*

👉 **[View Integration Guide & Templates](integrations/README.md)**

---



## Project Structure

```
ai-codex/
│
├── c-cpp/                          # C/C++ — Research & Invention Edition
│   ├── SKILL.md                    # Edition metadata and quick reference
│   ├── 01-core-identity.md
│   ├── 02-languages-standards.md
│   ├── 03-first-principles.md
│   ├── 04-domains-knowledge.md
│   ├── 05-research-method.md
│   └── 06-response-style.md
│
├── python/                         # Python — AI/ML & Systems Edition
│   ├── SKILL.md
│   └── 01 … 06
│
├── typescript-react/               # TypeScript / React / Next.js Edition
│   ├── SKILL.md
│   └── 01 … 06
│
├── php/                            # PHP — Modern Web & API Engineering
│   ├── SKILL.md
│   └── 01 … 06
│
├── rust/                           # Rust — Systems & Safety Edition
│   ├── SKILL.md
│   └── 01 … 06
│
├── go/                             # Go — Cloud Infrastructure & DevOps
│   ├── SKILL.md
│   └── 01 … 06
│
├── java-kotlin/                    # Java / Kotlin — Enterprise & Android
│   ├── SKILL.md
│   └── 01 … 06
│
├── ui-ux-design/                   # UI/UX Design — Interface & Systems
│   ├── SKILL.md
│   └── 01 … 06
│
├── integrations/                   # Pre-built editor config templates
│   ├── README.md                   # Integration guide
│   ├── cursorrules.example         # Cursor
│   ├── CLAUDE.example.md           # Claude Code
│   ├── windsurfrules.example       # Windsurf
│   ├── copilot-instructions.example.md  # GitHub Copilot
│   ├── continue-config.example.json     # Continue
│   └── zed-settings.example.json        # Zed
│
├── codex.json                      # Structured manifest for all editions
├── LICENSE                         # MIT License
└── README.md                       # You are here
```

---

## The 6-File Architecture

Every edition follows the same structure. This is intentional — it means once you learn one edition, you know them all.

```
┌──────────────────────────────────────────────────────────────────────┐
│                                                                      │
│  01 CORE IDENTITY        Who the AI is. Always load this.            │
│  ──────────────────                                                  │
│        │                                                             │
│        ├── 02 LANGUAGE STANDARDS     Code rules, version targets     │
│        │                                                             │
│        ├── 03 FIRST PRINCIPLES       How to reason and invent        │
│        │                                                             │
│        ├── 04 DOMAIN KNOWLEDGE       Deep expertise by field         │
│        │                                                             │
│        ├── 05 RESEARCH METHOD        Hypothesis → experiment → learn │
│        │                                                             │
│        └── 06 RESPONSE STYLE         Output format, tone, refs       │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘

      Always load 01. Add others based on what you are doing.
```

---

## Roadmap

Upcoming editions planned for future releases:

- [ ] Swift — iOS & macOS Development Edition
- [ ] C# / .NET — Enterprise & Game Development Edition

---

## Philosophy

The best AI instructions do not make AI smarter — they make AI *think the right way* for the task at hand. These instructions are built on one belief:

> The most valuable thing AI can do is not answer questions. It is help you ask better ones.

### Why Modular?

Most AI instruction projects dump everything into one massive file. This wastes context and dilutes focus. AI Codex splits instructions into focused files because:

- **Context is finite** — load only what you need, keep the AI sharp
- **Sessions vary** — a code review session needs different context than an invention session
- **Quality over quantity** — six precise files outperform one unfocused megafile

### Why Opinionated?

Each edition makes clear engineering recommendations. Not "here are your options" — but "here is what we recommend and why." Because:

- Vague instructions produce vague output
- Opinionated prompts produce opinionated, actionable engineering guidance
- An AI that says "it depends" on everything is useless as a partner

---

## Contributing

Contributions are welcome. If you want to add a new edition, improve an existing one, or add integrations:

1. **Fork** the repository
2. **Create a branch** for your changes
3. **Follow the 6-file structure** — every edition uses the same architecture
4. **Match the tone** — direct, opinionated, no filler, peer-level
5. **Submit a PR** with a clear description of what you changed and why

### Ideas for New Editions

- Swift — iOS & macOS Development
- C# / .NET — Enterprise & Game Development (Unity)

---

## License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

You are free to use, modify, and distribute these instructions for any purpose. Attribution is appreciated but not required.

---

<div align="center">

*Built with intent. Shared with the world.*

**[⭐ Star this repo](../../stargazers)** if it makes your AI sessions better.

</div>

# Contributing to AI Codex

> Guidelines for adding new domain editions, improving AI command skills, and contributing to **AI Codex**.

---

## How to Contribute

We welcome contributions from engineers, researchers, and prompt engineers worldwide. Whether you want to add a new programming language edition, optimize an existing one, or expand editor integrations:

1. **Fork the Repository**: Clone your fork locally.
2. **Create a Feature Branch**: `git checkout -b feature/my-new-edition`
3. **Follow the Standard Architecture**:
   - Every domain edition must implement all 6 core files (`01-core-identity.md` through `06-response-style.md`) + `SKILL.md`.
   - Adhere to the established tone: direct, opinionated, first-principles reasoning, zero filler.
4. **Register in `codex.json`**: Add your new edition or command skill to `codex.json`.
5. **Run Validation**:
   ```bash
   python scripts/validate.py
   ```
   Ensure all checks pass with zero errors.
6. **Submit a Pull Request**: Provide a clear description of your changes, design rationale, and sample outputs.

---

## 6-File Edition Authoring Checklist

When authoring a new domain edition in `skills/codex/<name>/`:

- [ ] **`SKILL.md`**: YAML frontmatter (`name`, `description`), overview, recommended combinations.
- [ ] **`01-core-identity.md`**: Senior Architect persona, 7-step thinking style, core values, absolute principles.
- [ ] **`02-languages-standards.md`**: Target versions, strict language idioms, non-negotiable ALWAYS/NEVER table.
- [ ] **`03-first-principles.md`**: Mental models, runtime/hardware mechanics, type-driven design, state machines.
- [ ] **`04-domains-knowledge.md`**: Ecosystem deep-dives, major frameworks, design patterns, complete typed examples.
- [ ] **`05-research-method.md`**: Invention/prototyping loop, diagnostic/profiling tools, testing pyramid, production checklist.
- [ ] **`06-response-style.md`**: Peer-level tone, response anatomy, code snippet rules, code review template.

---

## Priority Wishlist for New Editions

We are actively seeking contributions for the following editions:

- **Elixir / OTP**: Distributed systems, BEAM internals, supervision trees, Phoenix LiveView.
- **Zig**: Systems programming, memory allocators, comptime metaprogramming, cross-compilation.
- **SQL & Database Engineering**: Query optimization, index internals, isolation levels, partitioning.
- **Solidity & Web3**: EVM gas optimization, formal verification, reentrancy guards, DeFi security.
- **Flutter / Dart**: Cross-platform UI architecture, reactive state management, native engine bridges.

---

## Code of Conduct & Standards

- **Zero Filler**: No polite preamble, no conversational padding, no generic "it depends."
- **Production-Grade**: All code snippets must be syntactically valid, fully typed, and production-ready.
- **Security First**: Always emphasize memory safety, input validation, and secure defaults.

---

**[Return to Main README](README.md)** | **[View Documentation Hub](docs/)**

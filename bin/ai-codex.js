#!/usr/bin/env node

/**
 * AI Codex — 1-Command Workspace Installer & Multi-Tool Skill Manager
 * Zero-dependency CLI for initializing AI Codex, skills, and slash commands across 38+ AI tools.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, "..");

const ANSI = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  green: "\x1b[32m",
  cyan: "\x1b[36m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  red: "\x1b[31m",
};

const BANNER = `
${ANSI.cyan}${ANSI.bold}╔════════════════════════════════════════════════════════════╗
║                      AI CODEX                              ║
║     Modular AI Instructions & Autonomous Command Skills    ║
╚════════════════════════════════════════════════════════════╝${ANSI.reset}
`;

const COMMAND_SKILLS = [
  "codex-start",
  "codex-plans",
  "codex-architecture",
  "codex-brain",
  "codex-debug",
  "codex-deep",
  "codex-goal",
  "codex-review",
  "codex-test",
  "codex-skills",
];

const SUPPORTED_TOOLS = [
  {
    id: "cursor",
    name: "Cursor (.cursorrules, .cursor/skills, .cursor/commands)",
    ruleTarget: ".cursorrules",
    ruleSrc: "integrations/cursorrules.example",
    skillsDir: ".cursor/skills",
    commandDir: ".cursor/commands",
    commandFormat: "flat-md",
  },
  {
    id: "claude",
    name: "Claude Code (CLAUDE.md, .claude/skills, .claude/commands)",
    ruleTarget: "CLAUDE.md",
    ruleSrc: "integrations/CLAUDE.example.md",
    skillsDir: ".claude/skills",
    commandDir: ".claude/commands/codex",
    commandFormat: "namespaced-md",
  },
  {
    id: "antigravity",
    name: "Google Antigravity & Gemini CLI (GEMINI.md, .agent/skills, .agent/workflows)",
    ruleTarget: "GEMINI.md",
    ruleSrc: "integrations/GEMINI.example.md",
    skillsDir: ".agent/skills",
    commandDir: ".agent/workflows",
    commandFormat: "workflow-md",
  },
  {
    id: "copilot",
    name: "GitHub Copilot (.github/copilot-instructions.md, .github/prompts)",
    ruleTarget: ".github/copilot-instructions.md",
    ruleSrc: "integrations/copilot-instructions.example.md",
    skillsDir: ".github/skills",
    commandDir: ".github/prompts",
    commandFormat: "copilot-prompt",
  },
  {
    id: "windsurf",
    name: "Windsurf / Devin (.windsurfrules, .devin/skills, .devin/workflows)",
    ruleTarget: ".windsurfrules",
    ruleSrc: "integrations/windsurfrules.example",
    skillsDir: ".devin/skills",
    commandDir: ".devin/workflows",
    commandFormat: "workflow-md",
  },
  {
    id: "cline",
    name: "Cline (.clinerules, .cline/skills, .cline/workflows)",
    ruleTarget: ".clinerules",
    ruleSrc: "integrations/clinerules.example",
    skillsDir: ".cline/skills",
    commandDir: ".cline/workflows",
    commandFormat: "workflow-md",
  },
  {
    id: "roo",
    name: "Roo Code (.roomodes, .roo/skills, .roo/workflows)",
    ruleTarget: ".roomodes",
    ruleSrc: "integrations/clinerules.example",
    skillsDir: ".roo/skills",
    commandDir: ".roo/workflows",
    commandFormat: "workflow-md",
  },
  {
    id: "continue",
    name: "Continue (.continue/config.json, .continue/prompts)",
    ruleTarget: ".continue/config.json",
    ruleSrc: "integrations/continue-config.example.json",
    skillsDir: ".continue/skills",
    commandDir: ".continue/prompts",
    commandFormat: "continue-prompt",
  },
  {
    id: "zed",
    name: "Zed (.zed/settings.json, .zed/skills)",
    ruleTarget: ".zed/settings.json",
    ruleSrc: "integrations/zed-settings.example.json",
    skillsDir: ".zed/skills",
  },
  {
    id: "agents",
    name: "Universal Agent Standard (AGENTS.md, .agents/skills)",
    ruleTarget: "AGENTS.md",
    ruleSrc: "integrations/AGENTS.example.md",
    skillsDir: ".agents/skills",
  },
];

function parseArgs(args) {
  const options = {
    edition: null,
    tools: null,
    dir: process.cwd(),
  };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--edition" && args[i + 1]) {
      options.edition = args[++i];
    } else if (args[i] === "--tools" && args[i + 1]) {
      options.tools = args[++i].split(",").map(t => t.trim().toLowerCase());
    } else if (args[i] === "--dir" && args[i + 1]) {
      options.dir = path.resolve(args[++i]);
    }
  }

  return options;
}

function detectTechStack(targetDir) {
  // 1. High-priority composite architectures
  // Tauri (Rust + TypeScript/React)
  if (fs.existsSync(path.join(targetDir, "src-tauri/Cargo.toml")) || fs.existsSync(path.join(targetDir, "src-tauri/tauri.conf.json"))) {
    return { file: "src-tauri/Cargo.toml", edition: "rust", name: "Rust (Tauri Desktop App)" };
  }

  // 2. Comprehensive Stack & Framework Marker List
  const checks = [
    // Rust
    { file: "Cargo.toml", edition: "rust", name: "Rust (Cargo)" },
    { file: "backend/Cargo.toml", edition: "rust", name: "Rust (backend/Cargo.toml)" },
    { file: "server/Cargo.toml", edition: "rust", name: "Rust (server/Cargo.toml)" },

    // Go
    { file: "go.mod", edition: "go", name: "Go (Go Modules)" },
    { file: "backend/go.mod", edition: "go", name: "Go (backend/go.mod)" },
    { file: "server/go.mod", edition: "go", name: "Go (server/go.mod)" },

    // Solidity / Web3
    { file: "foundry.toml", edition: "solidity-web3", name: "Solidity / Foundry" },
    { file: "hardhat.config.ts", edition: "solidity-web3", name: "Solidity / Hardhat (TS)" },
    { file: "hardhat.config.js", edition: "solidity-web3", name: "Solidity / Hardhat (JS)" },
    { file: "contracts", edition: "solidity-web3", name: "Solidity (contracts/)" },

    // Elixir
    { file: "mix.exs", edition: "elixir", name: "Elixir / OTP (Mix)" },

    // Zig
    { file: "build.zig", edition: "zig", name: "Zig (build.zig)" },
    { file: "build.zig.zon", edition: "zig", name: "Zig (Zig Package)" },

    // Flutter / Dart
    { file: "pubspec.yaml", edition: "flutter-dart", name: "Flutter & Dart (pubspec.yaml)" },

    // Swift
    { file: "Package.swift", edition: "swift", name: "Swift (Package.swift)" },

    // Python
    { file: "pyproject.toml", edition: "python", name: "Python (pyproject.toml)" },
    { file: "requirements.txt", edition: "python", name: "Python (pip requirements)" },
    { file: "Pipfile", edition: "python", name: "Python (Pipfile)" },
    { file: "manage.py", edition: "python", name: "Python (Django manage.py)" },
    { file: "backend/pyproject.toml", edition: "python", name: "Python (backend/pyproject.toml)" },
    { file: "backend/requirements.txt", edition: "python", name: "Python (backend/requirements.txt)" },

    // PHP / Laravel
    { file: "artisan", edition: "php", name: "PHP (Laravel Artisan)" },
    { file: "composer.json", edition: "php", name: "PHP (Composer)" },
    { file: "backend/composer.json", edition: "php", name: "PHP (backend/composer.json)" },

    // Java / Kotlin
    { file: "pom.xml", edition: "java-kotlin", name: "Java / Kotlin (Maven pom.xml)" },
    { file: "build.gradle.kts", edition: "java-kotlin", name: "Java / Kotlin (Gradle kts)" },
    { file: "build.gradle", edition: "java-kotlin", name: "Java / Kotlin (Gradle)" },
    { file: "android/build.gradle", edition: "java-kotlin", name: "Java / Kotlin (Android)" },

    // C / C++
    { file: "CMakeLists.txt", edition: "c-cpp", name: "C / C++ (CMake)" },
    { file: "meson.build", edition: "c-cpp", name: "C / C++ (Meson)" },

    // SQL / Databases
    { file: "drizzle.config.ts", edition: "sql-database", name: "SQL (Drizzle ORM)" },
    { file: "prisma/schema.prisma", edition: "sql-database", name: "SQL (Prisma Database)" },
    { file: "alembic.ini", edition: "sql-database", name: "SQL (Alembic Migrations)" },
    { file: "schema.sql", edition: "sql-database", name: "SQL (schema.sql)" },

    // TypeScript / React / Next.js
    { file: "next.config.js", edition: "typescript-react", name: "TypeScript / Next.js (React)" },
    { file: "next.config.ts", edition: "typescript-react", name: "TypeScript / Next.js (TS)" },
    { file: "next.config.mjs", edition: "typescript-react", name: "TypeScript / Next.js (mjs)" },
    { file: "vite.config.ts", edition: "typescript-react", name: "TypeScript / Vite (React)" },
    { file: "vite.config.js", edition: "typescript-react", name: "TypeScript / Vite (JS)" },
    { file: "tsconfig.json", edition: "typescript-react", name: "TypeScript (tsconfig.json)" },
    { file: "package.json", edition: "typescript-react", name: "TypeScript / React / Next.js (package.json)" },
  ];

  for (const check of checks) {
    if (fs.existsSync(path.join(targetDir, check.file))) {
      return check;
    }
  }

  // Check for .csproj / .sln (C# / .NET)
  try {
    const files = fs.readdirSync(targetDir);
    if (files.some(f => f.endsWith(".csproj") || f.endsWith(".sln"))) {
      return { file: "*.csproj", edition: "csharp-dotnet", name: "C# / .NET" };
    }
  } catch { }

  return { file: null, edition: "typescript-react", name: "General / TypeScript (Default)" };
}

function copyDirSync(src, dest) {
  if (!fs.existsSync(src)) return;
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function scaffoldCodexDrive(targetDir) {
  const driveDirs = [
    "codex-drive/brains",
    "codex-drive/plans",
    "codex-drive/plans/archive",
    "codex-drive/specs",
    "codex-drive/specs/archive",
    "codex-drive/walkthroughs",
  ];

  for (const dir of driveDirs) {
    const fullPath = path.join(targetDir, dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
      fs.writeFileSync(path.join(fullPath, ".gitkeep"), "# Keep empty directory in version control\n");
    }
  }

  // Initialize master brain knowledge base if missing
  const brainFile = path.join(targetDir, "codex-drive/brains/knowledge-base.brain.md");
  if (!fs.existsSync(brainFile)) {
    const template = `# Workspace Brain & Knowledge Base

> **Created At**: ${new Date().toISOString().replace("T", " ").substring(0, 19)}
> **Status**: ACTIVE

## 1. Architectural Baseline
- Initialized with AI Codex.

## 2. Project Conventions
- All AI plans and specs are stored in \`codex-drive/\`.
- High-density decisions and checkpoints are recorded in \`codex-drive/brains/\`.
`;
    fs.writeFileSync(brainFile, template, "utf-8");
  }
}

function parseSkillMd(skillPath) {
  if (!fs.existsSync(skillPath)) {
    return { name: "", description: "AI Codex Skill", body: "" };
  }
  const content = fs.readFileSync(skillPath, "utf-8");

  const frontmatterMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!frontmatterMatch) {
    return { name: "", description: "AI Codex Skill", body: content };
  }

  const frontmatter = frontmatterMatch[1];
  const body = frontmatterMatch[2].trim();

  let name = "";
  let description = "AI Codex Command Skill";

  const fmLines = frontmatter.split(/\r?\n/);
  let collectingDesc = false;
  let descLines = [];

  for (const line of fmLines) {
    const trimmed = line.trim();
    if (/^name:\s*/i.test(trimmed)) {
      collectingDesc = false;
      name = trimmed.replace(/^name:\s*/i, "").replace(/^["']|["']$/g, "").trim();
    } else if (/^description:\s*/i.test(trimmed)) {
      collectingDesc = true;
      descLines = [];
      const afterKey = trimmed.replace(/^description:\s*/i, "").trim();
      if (afterKey && afterKey !== ">" && afterKey !== "|" && afterKey !== ">-" && afterKey !== "|-") {
        descLines.push(afterKey.replace(/^["']|["']$/g, ""));
      }
    } else if (collectingDesc) {
      if (/^[a-zA-Z0-9_-]+:\s*/.test(line)) {
        // Next key in frontmatter encountered
        collectingDesc = false;
      } else if (trimmed.length > 0) {
        descLines.push(trimmed);
      }
    }
  }

  if (descLines.length > 0) {
    description = descLines.join(" ").replace(/"/g, '\\"').replace(/\s+/g, " ").trim();
  }

  return { name, description, body };
}

function formatCommandContent(cmdId, skillInfo, format) {
  const shortId = cmdId.replace(/^codex-/, "");
  switch (format) {
    case "flat-md": // Cursor, etc.
      return {
        filename: `${cmdId}.md`,
        content: `---
name: "/${cmdId}"
id: "${cmdId}"
description: "${skillInfo.description}"
---

${skillInfo.body}
`,
      };

    case "namespaced-md": // Claude Code
      return {
        filename: `${shortId}.md`,
        content: `---
name: "codex:${shortId}"
description: "${skillInfo.description}"
allowed-tools: read_file, run_command, write_file
---

${skillInfo.body}
`,
      };

    case "workflow-md": // Antigravity, Devin, Cline, Roo
      return {
        filename: `${cmdId}.md`,
        content: `---
description: "${skillInfo.description}"
---

${skillInfo.body}
`,
      };

    case "copilot-prompt": // GitHub Copilot
      return {
        filename: `${cmdId}.prompt.md`,
        content: `---
description: "${skillInfo.description}"
---

${skillInfo.body}
`,
      };

    case "continue-prompt": // Continue
      return {
        filename: `${cmdId}.prompt`,
        content: `---
name: "${cmdId}"
description: "${skillInfo.description}"
invokable: true
---

${skillInfo.body}
`,
      };

    default:
      return {
        filename: `${cmdId}.md`,
        content: skillInfo.body,
      };
  }
}

function installToolsAndSkills(targetDir, editionId, selectedToolIds) {
  const isAll = !selectedToolIds || selectedToolIds.includes("all");
  const tools = isAll
    ? SUPPORTED_TOOLS
    : SUPPORTED_TOOLS.filter(t => selectedToolIds.includes(t.id));

  const skillsSrc = path.join(REPO_ROOT, "skills");

  // Install Tool-Specific Rule Files, Skills, and Slash Commands into each tool's directory
  for (const tool of tools) {
    console.log(`\n  ${ANSI.cyan}${ANSI.bold}• Configuring ${tool.name.split(" ")[0]}...${ANSI.reset}`);

    const toolSkillsPrefix = tool.skillsDir ? `${tool.skillsDir}/` : "skills/";

    // (A) Rule File Generation
    if (tool.ruleSrc && tool.ruleTarget) {
      const srcPath = path.join(REPO_ROOT, tool.ruleSrc);
      const destPath = path.join(targetDir, tool.ruleTarget);
      if (fs.existsSync(srcPath)) {
        const destDir = path.dirname(destPath);
        if (!fs.existsSync(destDir)) {
          fs.mkdirSync(destDir, { recursive: true });
        }
        let content = fs.readFileSync(srcPath, "utf-8");
        const targetEdition = (editionId && editionId !== "none" && editionId !== "general")
          ? `${toolSkillsPrefix}codex/${editionId}/`
          : `${toolSkillsPrefix}`;

        content = content.replace(/(?:skills\/codex\/[a-zA-Z0-9_-]+\/|python\/)/g, targetEdition);
        fs.writeFileSync(destPath, content, "utf-8");
        console.log(`    ${ANSI.green}[OK]${ANSI.reset} Rule file: ${ANSI.bold}${tool.ruleTarget}${ANSI.reset}`);
      }
    }

    // (B) Tool-Specific Native Skills Directory
    if (tool.skillsDir && fs.existsSync(skillsSrc)) {
      for (const cmd of COMMAND_SKILLS) {
        const src = path.join(skillsSrc, cmd);
        const dest = path.join(targetDir, tool.skillsDir, cmd);
        if (fs.existsSync(src)) {
          copyDirSync(src, dest);
        }
      }
      if (editionId && editionId !== "none" && editionId !== "general") {
        const edSrc = path.join(skillsSrc, "codex", editionId);
        const edDest = path.join(targetDir, tool.skillsDir, "codex", editionId);
        if (fs.existsSync(edSrc)) {
          copyDirSync(edSrc, edDest);
        }
      }
      console.log(`    ${ANSI.green}[OK]${ANSI.reset} Native skills: ${ANSI.bold}${tool.skillsDir}/${ANSI.reset} (10 command skills${editionId && editionId !== "none" ? ` + ${editionId}` : ""})`);
    }

    // (C) Tool-Specific Native Slash Commands / Workflows / Prompts
    if (tool.commandDir && tool.commandFormat && fs.existsSync(skillsSrc)) {
      const cmdFolder = path.join(targetDir, tool.commandDir);
      if (!fs.existsSync(cmdFolder)) {
        fs.mkdirSync(cmdFolder, { recursive: true });
      }

      for (const cmd of COMMAND_SKILLS) {
        const skillFile = path.join(skillsSrc, cmd, "SKILL.md");
        const skillInfo = parseSkillMd(skillFile);
        const { filename, content } = formatCommandContent(cmd, skillInfo, tool.commandFormat);
        fs.writeFileSync(path.join(cmdFolder, filename), content, "utf-8");
      }
      console.log(`    ${ANSI.green}[OK]${ANSI.reset} Native slash commands: ${ANSI.bold}${tool.commandDir}/${ANSI.reset} (10 commands)`);
    }
  }
}

function printHelp() {
  console.log(BANNER);
  console.log(`
${ANSI.bold}USAGE:${ANSI.reset}
  npx @wwwroot/ai-codex <command> [options]

${ANSI.bold}COMMANDS:${ANSI.reset}
  ${ANSI.cyan}init${ANSI.reset}      Initialize AI Codex, install skills, and configure editor commands
  ${ANSI.cyan}list${ANSI.reset}      List all available domain editions and command skills
  ${ANSI.cyan}status${ANSI.reset}    Check active Codex Drive, skills, and installed integrations
  ${ANSI.cyan}doctor${ANSI.reset}    Perform deep integrity diagnosis of Codex Drive and skills
  ${ANSI.cyan}help${ANSI.reset}      Display this help menu

${ANSI.bold}OPTIONS:${ANSI.reset}
  --edition <id>   Force specific edition (rust, python, typescript-react, swift, csharp-dotnet, go, php, java-kotlin, c-cpp, ui-ux-design, none)
  --tools <ids>    Comma-separated list of target tools (cursor, claude, antigravity, copilot, windsurf, cline, roo, continue, zed, agents, all)
  --dir <path>     Target directory (default: current directory)
  --version, -v    Show version number
`);
}

async function promptInteractive(detected, options) {
  const readline = await import("readline");
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const question = (query) => new Promise((resolve) => rl.question(query, resolve));

  const manifestPath = path.join(REPO_ROOT, "codex.json");
  let editions = [];
  if (fs.existsSync(manifestPath)) {
    try {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
      editions = manifest.editions || [];
    } catch { }
  }

  console.log(`\n${ANSI.bold}=== INTERACTIVE WORKSPACE CONFIGURATION ===${ANSI.reset}`);
  console.log(`Auto-detected stack: ${ANSI.green}${ANSI.bold}${detected.name}${ANSI.reset} (${detected.edition})\n`);

  console.log(`${ANSI.bold}Available Domain Editions:${ANSI.reset}`);
  console.log(`  [ 0] General / Universal (No domain edition — core skills only)`);
  editions.forEach((ed, idx) => {
    const num = (idx + 1).toString().padStart(2, " ");
    const isCurrent = ed.id === detected.edition ? ` ${ANSI.green}(Detected)${ANSI.reset}` : "";
    console.log(`  [${num}] ${ed.name}${isCurrent}`);
  });

  const edChoice = await question(`\nSelect Edition [0-${editions.length}] (press Enter for ${detected.edition}, or 0 for General): `);
  let selectedEdition = detected.edition;
  const trimmedChoice = edChoice.trim();
  if (trimmedChoice === "0" || trimmedChoice.toLowerCase() === "none" || trimmedChoice.toLowerCase() === "skip" || trimmedChoice.toLowerCase() === "general") {
    selectedEdition = "none";
  } else if (trimmedChoice) {
    const edIndex = parseInt(trimmedChoice, 10) - 1;
    if (!isNaN(edIndex) && edIndex >= 0 && edIndex < editions.length) {
      selectedEdition = editions[edIndex].id;
    }
  }

  console.log(`\n${ANSI.bold}Target AI Assistant Integrations:${ANSI.reset}`);
  SUPPORTED_TOOLS.forEach((tool, idx) => {
    const num = (idx + 1).toString().padStart(2, " ");
    console.log(`  [${num}] ${tool.name}`);
  });

  const toolChoice = await question(`\nSelect Tools [1-${SUPPORTED_TOOLS.length}] (e.g. 1,2,4 or press Enter for all): `);
  let selectedTools = [];
  const trimmedTools = toolChoice.trim();
  if (!trimmedTools || trimmedTools.toLowerCase() === "all") {
    selectedTools = SUPPORTED_TOOLS.map(t => t.id);
  } else {
    const selectedIndices = trimmedTools
      .split(",")
      .map(s => parseInt(s.trim(), 10) - 1)
      .filter(n => !isNaN(n) && n >= 0 && n < SUPPORTED_TOOLS.length);

    if (selectedIndices.length > 0) {
      selectedTools = selectedIndices.map(idx => SUPPORTED_TOOLS[idx].id);
    } else {
      selectedTools = SUPPORTED_TOOLS.map(t => t.id);
    }
  }

  rl.close();
  return {
    edition: selectedEdition,
    tools: selectedTools,
  };
}

async function runInit(args) {
  console.log(BANNER);
  const options = parseArgs(args.slice(1));
  const targetDir = options.dir;

  const detected = detectTechStack(targetDir);

  let activeEdition = options.edition;
  let activeTools = options.tools;

  // If running in interactive TTY without flags, launch interactive TUI
  if (!options.edition && !options.tools && process.stdin.isTTY) {
    const interactiveResult = await promptInteractive(detected, options);
    activeEdition = interactiveResult.edition;
    activeTools = interactiveResult.tools;
  } else {
    activeEdition = options.edition || detected.edition;
    activeTools = options.tools || ["all"];
  }

  console.log(`\n${ANSI.bold}Scaffolding Codex Drive...${ANSI.reset}`);
  scaffoldCodexDrive(targetDir);
  console.log(`  ${ANSI.green}[OK]${ANSI.reset} Created ${ANSI.bold}codex-drive/brains/${ANSI.reset}`);
  console.log(`  ${ANSI.green}[OK]${ANSI.reset} Created ${ANSI.bold}codex-drive/plans/ (with archive/)${ANSI.reset}`);
  console.log(`  ${ANSI.green}[OK]${ANSI.reset} Created ${ANSI.bold}codex-drive/specs/ (with archive/)${ANSI.reset}`);
  console.log(`  ${ANSI.green}[OK]${ANSI.reset} Created ${ANSI.bold}codex-drive/walkthroughs/${ANSI.reset}`);

  console.log(`\n${ANSI.bold}Installing AI Codex Skills & Tool Configurations...${ANSI.reset}`);
  installToolsAndSkills(targetDir, activeEdition, activeTools);

  console.log(`
${ANSI.green}${ANSI.bold}AI Codex successfully initialized!${ANSI.reset}

${ANSI.yellow}${ANSI.bold}[NOTE] Please restart or reload your editor / IDE to activate the newly generated slash commands and skills.${ANSI.reset}

${ANSI.bold}HOW TO USE IN YOUR AI CHAT (Cursor, Claude Code, Windsurf, Copilot, Gemini CLI):${ANSI.reset}
  1. Start any new task:        ${ANSI.cyan}/codex-start [your request]${ANSI.reset}
  2. Plan technical changes:    ${ANSI.cyan}/codex-plans [feature details]${ANSI.reset}
  3. Model system architecture:  ${ANSI.cyan}/codex-architecture [subsystem]${ANSI.reset}
  4. Save persistent memory:    ${ANSI.cyan}/codex-brain save${ANSI.reset}

${ANSI.bold}ONLINE DOCUMENTATION:${ANSI.reset}
  • GitHub:  ${ANSI.cyan}https://github.com/wwwroot/ai-codex${ANSI.reset}
  • NPM:     ${ANSI.cyan}https://www.npmjs.com/package/@wwwroot/ai-codex${ANSI.reset}
`);
}

function runStatus(targetDir) {
  console.log(BANNER);
  console.log(`${ANSI.bold}WORKSPACE DIAGNOSTICS & STATUS${ANSI.reset}\n`);

  const driveDirs = ["brains", "plans", "specs", "walkthroughs"];
  let driveFound = 0;
  for (const d of driveDirs) {
    const p = path.join(targetDir, "codex-drive", d);
    if (fs.existsSync(p)) {
      const count = fs.readdirSync(p).filter(f => f !== ".gitkeep").length;
      console.log(`  ${ANSI.green}[OK]${ANSI.reset} codex-drive/${d}/ (${count} active artifacts)`);
      driveFound++;
    } else {
      console.log(`  ${ANSI.yellow}[MISSING]${ANSI.reset} codex-drive/${d}/`);
    }
  }

  console.log(`\n${ANSI.bold}Agent Integrations & Rules:${ANSI.reset}`);
  for (const tool of SUPPORTED_TOOLS) {
    const p = path.join(targetDir, tool.ruleTarget);
    if (fs.existsSync(p)) {
      console.log(`  ${ANSI.green}[ACTIVE]${ANSI.reset} ${tool.name.split(" ")[0]} (${tool.ruleTarget})`);
    } else {
      console.log(`  ${ANSI.cyan}[OPTIONAL]${ANSI.reset} ${tool.name.split(" ")[0]} (${tool.ruleTarget} not generated)`);
    }
  }

  const skillsDir = path.join(targetDir, "skills");
  if (fs.existsSync(skillsDir)) {
    const skillCount = fs.readdirSync(skillsDir).length;
    console.log(`\n${ANSI.bold}Skills Library:${ANSI.reset} ${ANSI.green}[ACTIVE] skills/ (${skillCount} items installed)${ANSI.reset}`);
  }

  console.log(`\n${ANSI.bold}Overall Status:${ANSI.reset} ${driveFound === 4 ? ANSI.green + "[READY] AI Codex is fully operational." : ANSI.yellow + "[INCOMPLETE] Run 'npx @wwwroot/ai-codex init' to scaffold missing paths."}${ANSI.reset}\n`);
}

function runList() {
  console.log(BANNER);
  const manifestPath = path.join(REPO_ROOT, "codex.json");
  if (fs.existsSync(manifestPath)) {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));

    console.log(`${ANSI.bold}AVAILABLE DOMAIN EDITIONS (${manifest.editions.length}):${ANSI.reset}`);
    for (const ed of manifest.editions) {
      console.log(`  • ${ANSI.bold}${ed.name}${ANSI.reset} (${ANSI.cyan}${ed.id}${ANSI.reset})`);
      console.log(`    ${ed.description}`);
    }

    console.log(`\n${ANSI.bold}AI COMMAND SKILLS (${manifest.commands.length}):${ANSI.reset}`);
    for (const cmd of manifest.commands) {
      console.log(`  ${ANSI.bold}${cmd.command}${ANSI.reset} — ${cmd.description}`);
    }
  }
}

// CLI Routing
const args = process.argv.slice(2);
const command = args[0] || "help";

let pkgVersion = "1.0.3";
try {
  const pkg = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, "package.json"), "utf-8"));
  pkgVersion = pkg.version || "1.0.3";
} catch { }

switch (command) {
  case "init":
    await runInit(args);
    break;
  case "list":
    runList();
    break;
  case "status":
  case "doctor":
    runStatus(process.cwd());
    break;
  case "--version":
  case "-v":
    console.log(`@wwwroot/ai-codex v${pkgVersion}`);
    break;
  case "--help":
  case "-h":
  case "help":
  default:
    printHelp();
    break;
}

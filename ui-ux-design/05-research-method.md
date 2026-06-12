# 05 — Research & Design Method (UI/UX Design Edition)

> Reference this file when exploring a new product idea, redesigning an interface, or solving a design problem.

---

## The Design Loop

Design is not linear. It is a cycle of understanding, ideation, prototyping, and validation. But it needs structure, or it becomes endless exploration.

```
DISCOVER → DEFINE → IDEATE → PROTOTYPE → TEST → REFINE → SHIP
    ↑                                                  ↓
    └──────────────── LEARN ◄──────────────────────────┘
```

Never skip from DISCOVER to SHIP. The define and prototype steps prevent building the wrong thing.

---

## Phase 1 — Discover

### Understand the Problem Space

Before designing anything, understand what exists and why it fails:

1. **Stakeholder interviews** — What does the business need? What are the constraints?
2. **User research** — What do users actually do? (Not what they say they do.)
3. **Competitive analysis** — What do competitors do well? Where do they fail?
4. **Analytics review** — Where do users drop off? What takes too long? What is unused?

### The Problem Statement

Write a one-sentence problem statement:

> **[User type]** needs a way to **[action/goal]** because **[insight from research]**.

Example:
> "Freelance designers need a way to track multiple client projects simultaneously because switching between tools wastes 30% of their productive time."

If you cannot write this sentence clearly, you do not understand the problem yet.

---

## Phase 2 — Define

### Jobs To Be Done (JTBD)

Frame user needs as jobs, not features:

```
When [situation], I want to [motivation], so I can [expected outcome].
```

Example:
- ❌ "Users need a search bar" (feature)
- ✅ "When reviewing past projects, I want to find specific files quickly, so I can reference them in new proposals" (job)

### User Flows

Map the user's journey through the product:

```
Entry Point → Task Start → Steps → Decision Points → Completion/Exit
```

Rules:
- Every flow has a clear entry and exit
- Every decision point has exactly two outcomes (yes/no, success/error)
- Every step answers: what does the user see? What do they do? What happens next?

### Information Architecture

Map the content structure before designing screens:

1. **Content inventory** — list everything that exists
2. **Card sorting** — let users group related content
3. **Site map** — hierarchical content structure
4. **Navigation model** — how users move between content areas

---

## Phase 3 — Ideate

### Sketching First

```
  Low fidelity ─────────────────────────────────── High fidelity
  
  Paper sketch  →  Wireframe  →  Mockup  →  Prototype  →  Production

  Speed:    ████████░░   ██████░░░░   ████░░░░░░   ██░░░░░░░░
  Detail:   ░░░░░░░░██   ░░░░██████   ░░░░░░████   ████████░░
  Cost to   
  change:   ░░░░░░░░░█   ░░░░░░░░██   ░░░░░░████   ██████████
```

**Always start low-fidelity.** The cost of change increases with fidelity. Explore 10 rough sketches before committing to 1 detailed design.

### The Crazy Eights Method

1. Fold a paper into 8 sections
2. Set a timer for 8 minutes
3. Sketch one idea per section (1 minute each)
4. No judgment during sketching — quantity over quality
5. Review and identify the strongest concepts
6. Combine the best elements into a refined direction

### Design Alternatives

Always explore at least 3 approaches:

| Approach | Strength | Weakness |
|----------|----------|----------|
| **A** (conservative) | Low risk, familiar pattern | May not solve the core problem |
| **B** (moderate) | Balanced innovation and safety | Requires validation |
| **C** (radical) | Could transform the experience | High risk, unfamiliar to users |

Choose based on evidence, not preference. If you are not sure, prototype all three and test.

---

## Phase 4 — Prototype

### Prototype Fidelity Levels

| Level | Tool | Use When |
|-------|------|----------|
| **Paper** | Pen and paper, sticky notes | Exploring many ideas quickly |
| **Low-fi** | Figma wireframes, Balsamiq | Testing layout, hierarchy, flow |
| **Mid-fi** | Figma with real content | Testing interaction patterns |
| **High-fi** | Figma prototypes, Framer | Testing visual design, animations |
| **Code** | HTML/CSS/JS, React prototype | Testing performance, real data |

### Prototype Rules

- A prototype is a question, not a solution — it exists to test a hypothesis
- Use real content, not lorem ipsum — fake content hides real design problems
- Prototype the risky part first — the thing you are least sure about
- Prototypes are disposable — do not refine a prototype into production code

### What to Prototype

| Risk | What to Test | Method |
|------|-------------|--------|
| **Usability** | Can users complete the task? | Task-based usability test |
| **Desirability** | Do users want this? | Preference test, first-click test |
| **Feasibility** | Can we build this? | Technical spike with engineering |
| **Comprehension** | Do users understand the content? | 5-second test, think-aloud |

---

## Phase 5 — Test and Validate

### Usability Testing Essentials

**5 users catch ~85% of usability problems.** (Nielsen Norman Group)

Test protocol:
1. Define 3–5 tasks the user must complete
2. Ask the user to think aloud while performing each task
3. Observe — do not help or explain
4. Record task success, time, errors, and quotes
5. Debrief with open-ended questions

### Metrics That Matter

| Metric | Measures | Target |
|--------|----------|--------|
| **Task success rate** | Can users complete the task? | > 90% |
| **Time on task** | How long does it take? | Compare to previous version |
| **Error rate** | How often do users make mistakes? | < 10% |
| **SUS score** | Overall usability satisfaction | > 68 (above average) |
| **NPS** | Would users recommend this? | > 50 (excellent) |

### After Testing

For every finding, categorize and prioritize:

| Severity | Description | Action |
|----------|-------------|--------|
| 🔴 Critical | User cannot complete the task | Fix before launch |
| 🟡 Major | User struggles significantly | Fix in current sprint |
| 🟢 Minor | User notices but works around it | Fix when possible |
| ⚪ Cosmetic | Visual polish only | Backlog |

---

## Questions for Every Design Decision

1. **Does this serve the user's goal?** If not, why is it here?
2. **Is this the simplest possible solution?** Can anything be removed?
3. **What happens on the worst day?** Error state, slow connection, edge case?
4. **Can a first-time user figure this out without help?**
5. **Does this work on mobile?** On a screen reader? With one hand?
6. **What would I cut if I had half the space?** That is probably the right design.
7. **Can I test this assumption before building it?**

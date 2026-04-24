# 05 — Research & Invention Method

> How to approach unknown territory. From raw idea to working prototype to refined system.

---

## The Inventor's Workflow

Invention is not linear. It is a cycle of hypothesis, experiment, learning, and refinement. But it needs structure, or it becomes endless exploration with no output.

This is the structured cycle:

```
IDEA → FIRST PRINCIPLES ANALYSIS → HYPOTHESIS → MINIMUM EXPERIMENT
  ↑                                                        ↓
REFINED IDEA ← LEARNING ← MEASUREMENT ← PROTOTYPE ←──────┘
```

Never skip directly from IDEA to PROTOTYPE. The analysis and hypothesis steps prevent building the wrong thing.

---

## When You Bring a New Idea

When the user presents any idea — no matter how rough, unconventional, or "impossible-sounding" — apply this process:

### 1. Restate the Idea Precisely
Before analyzing, restate the idea in the clearest possible technical terms:
- What is the input?
- What is the output?
- What transformation or process happens in between?
- What is the claimed advantage over existing approaches?

### 2. Identify the Core Hypothesis
Every invention has a core hypothesis — the central claim that must be true for the invention to work. State it as:

> "This will work if and only if [condition X] is true."

### 3. Find the Critical Path
What is the single hardest part of making this work? That is what must be proven first. Do not build the easy parts first — find the hard constraint and test it immediately.

### 4. Design the Minimum Experiment
The minimum experiment is the smallest possible thing that tests the core hypothesis. It should:
- Take hours or days to build, not weeks
- Directly test the critical constraint
- Produce a clear yes/no answer about viability
- Require no UI, no optimization, no polish — only truth

### 5. Interpret Results Rigorously
After an experiment:
- If it works: what exactly did you prove? What did you NOT prove? What must be tested next?
- If it fails: was the hypothesis wrong, or was the experiment flawed? What did you learn?
- Never declare victory after one success. Never declare failure after one failure.

---

## Prototype Philosophy

A prototype is a learning tool, not a product. It is allowed to be:
- Ugly — no UI, no error handling, no documentation
- Incomplete — only implements the part being tested
- Throwaway — written to be deleted, not extended

A prototype is NOT allowed to:
- Hide the result — it must clearly show whether the hypothesis is true
- Be prematurely optimized — optimize only after proving correctness
- Use undefined behavior to get a "better" result

**The moment a prototype proves the concept, stop and redesign cleanly before building further.**

---

## How to Research Unknown Territory

When entering a domain you do not know well:

### Layer 1 — Map the Landscape
- What are the canonical papers, books, and implementations in this area?
- Who are the recognized authorities? (Not just popular names — who actually did the foundational work?)
- What are the 3-5 most important concepts that everything else builds on?

### Layer 2 — Find the Limits
- What are the theoretical limits in this domain? (Nyquist, Shannon, Cramér-Rao, etc.)
- What are the current practical state-of-the-art results?
- What is the gap between theoretical limits and practical results? That gap is where inventions live.

### Layer 3 — Find the Open Problems
- What do practitioners complain about?
- What is described as "an open problem" in papers?
- What trade-offs does everyone accept as unavoidable? (These are often not actually unavoidable.)

### Layer 4 — Cross-Pollinate
- Has a related problem been solved in a different field?
- Can a technique from field A be adapted to solve the open problem in field B?

---

## Naming and Documenting Ideas

Every serious idea deserves documentation before implementation. Maintain a simple record:

```markdown
## Idea: [Name]
**Date**: [when it came to you]
**Core hypothesis**: [the central claim]
**Why it might work**: [first principles reasoning]
**Why it might not work**: [known challenges]
**Minimum experiment**: [what you would build to test it]
**Status**: [raw idea / being analyzed / prototyping / validated / abandoned]
```

This practice alone separates inventors from dreamers. Ideas written down with reasoning can be returned to, refined, and eventually built. Ideas only in your head disappear.

---

## When to Abandon an Idea

An idea should be abandoned when:
- A physical or mathematical proof shows it is impossible — not just hard, but impossible
- The minimum experiment has failed three times with different approaches and the same result
- A better version of the same idea already exists and the advantage over it cannot be defined

An idea should NOT be abandoned because:
- It seems too ambitious
- Others have not done it before
- The first experiment failed
- It would take a long time

The graveyard of abandoned inventions is full of ideas that were actually correct but were given up too soon.

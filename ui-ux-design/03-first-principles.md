# 03 — First Principles Thinking (UI/UX Design Edition)

> Reference this file when exploring new product ideas, solving design problems, or rethinking interfaces.

---

## The Core Question

Before designing anything, ask:

> **"What is the user trying to accomplish, and what is the simplest path to get them there?"**

Not the most visually impressive path. Not the most feature-rich path. The simplest, clearest, most forgiving path that respects the user's time, attention, and cognitive capacity.

---

## Human-Centered Decomposition

### 1. Who is the user?

Define the user before defining the interface:

- **Context of use** — Where are they? What device? How much time and attention do they have?
- **Mental model** — What do they already know? What metaphors and patterns are familiar?
- **Goal** — What do they want to accomplish? (Not what feature they asked for.)
- **Emotional state** — Are they stressed, curious, focused, frustrated? Emotional context shapes design.

### 2. What is the information architecture?

Before drawing a single screen, map the content:

```
┌─────────────────────────────────────┐
│         Information Architecture     │
│                                      │
│  Objects     →  What are the nouns?  │
│  Attributes  →  What properties?     │
│  Hierarchy   →  What contains what?  │
│  Relations   →  What connects?       │
│  Actions     →  What can users do?   │
│  Navigation  →  How do users move?   │
└─────────────────────────────────────┘
```

### 3. What is the interaction pattern?

Every interaction is a conversation between the user and the system:

- **User acts** — clicks, types, swipes, speaks
- **System responds** — visual feedback, state change, data update
- **System confirms** — success, error, or clarification

If any step in this conversation is missing, the user is lost.

---

## Cognitive Load Principles

Design is about managing attention. Every element on screen competes for cognitive resources.

### Hick's Law — Fewer choices, faster decisions

```
Decision time = log₂(n + 1)

Where n = number of equally probable choices
```

**Practical application:**
- A menu with 3 items is fast. A menu with 20 items is overwhelming.
- Progressive disclosure: show the essential, reveal the advanced.
- Default selections reduce decision burden.

### Fitts's Law — Bigger targets, faster clicks

```
Movement time = a + b × log₂(1 + D/W)

Where D = distance to target, W = width of target
```

**Practical application:**
- Primary actions should be large and easy to reach.
- Destructive actions should be smaller and harder to reach.
- On mobile, thumb zones matter — primary actions go in the bottom third.

### Miller's Law — 7 ± 2 items in working memory

**Practical application:**
- Group related items visually (chunking).
- Navigation menus should have 5–7 top-level items.
- Step indicators for processes longer than 5 steps.

### Jakob's Law — Users spend most time on OTHER sites

**Practical application:**
- Follow conventions. Navigation at the top or left. Logo links home. Cart icon in the top right.
- Innovate on value, not on interaction patterns.
- Novel interactions require learning — is the value worth the cost?

---

## Visual Hierarchy Principles

### The Squint Test

Blur or squint at your design. What do you see first? That is what the user sees first. If it is not the most important element, the hierarchy is wrong.

### Creating Hierarchy

| Tool | Effect | Use For |
|------|--------|---------|
| **Size** | Larger = more important | Headlines, primary actions |
| **Weight** | Bolder = more emphasis | Key labels, active states |
| **Color** | Saturated/contrasting = attention | Actions, alerts, status |
| **Spacing** | More whitespace = more importance | Section breaks, featured content |
| **Position** | Top-left (LTR) = scanned first | Navigation, page titles |
| **Depth** | Shadow/elevation = closer to user | Modals, dropdowns, cards |

### The Priority Matrix

For every screen, rank the elements:

1. **Primary** — The single most important thing (one per screen)
2. **Secondary** — Supporting information or actions (2–3 per screen)
3. **Tertiary** — Everything else (metadata, navigation, footer)

If everything is emphasized, nothing is.

---

## Design for Failure

Every interface has failure states. The quality of those states defines the quality of the product.

### Error Handling Hierarchy

```
Prevention  >  Recovery  >  Explanation

1. PREVENT the error:  Disable submit until form is valid
2. ALLOW RECOVERY:     Inline validation, undo functionality
3. EXPLAIN clearly:    "Email must include @" not "Invalid input"
```

### Empty State Design

Empty states are opportunities, not dead ends:

- **First-time use** — guide the user to their first action
- **No results** — suggest alternative searches or actions
- **Completed state** — celebrate completion, suggest next steps
- **Error state** — explain what happened and how to recover

### Loading State Design

| Duration | Pattern | Example |
|----------|---------|---------|
| < 100ms | No indicator needed | Instant feedback |
| 100ms – 1s | Progress indicator (spinner) | Button loading state |
| 1s – 5s | Skeleton screen | Content placeholders |
| > 5s | Progress bar with estimate | File upload, data processing |
| Indeterminate | Skeleton + message | "Loading your dashboard..." |

---

## Responsive Design Thinking

### Content-First Responsive Design

Do not design for devices. Design for content:

1. Start with the content at the narrowest width
2. Expand the viewport until the content breaks
3. Add a breakpoint there
4. Repeat

The breakpoints are determined by the content, not by iPhone/iPad/Desktop sizes.

### Adaptive Patterns

| Pattern | Description | When to Use |
|---------|-------------|-------------|
| **Reflow** | Stack columns to single column | Default for most content |
| **Reveal** | Show more content on larger screens | Dashboard layouts |
| **Off-canvas** | Move navigation off-screen on mobile | Complex navigation |
| **Truncate** | Show less text on smaller screens | Cards, list items |
| **Prioritize** | Show only essential items on mobile | Toolbars, data tables |

---

## Design Ethics

- **Dark patterns are unacceptable** — no trick questions, hidden costs, misdirection, or forced continuity
- **Privacy by design** — request minimum data, explain why, provide clear controls
- **Inclusive design** — consider users across all abilities, cultures, languages, and contexts
- **Honest communication** — no manipulative urgency ("Only 2 left!"), no disguised ads, no confirm-shaming
- **Attention is sacred** — every notification, popup, and animation takes time from the user's life. Earn it.

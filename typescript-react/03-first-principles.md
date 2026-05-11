# 03 — First Principles Thinking (TypeScript / React / Next.js Edition)

> Reference this file when designing components, architecting applications, or solving hard frontend problems.

---

## The Core Question

Before writing any component or page, ask:

> **"What is the simplest component tree that correctly models this UI and its data dependencies?"**

Not the fastest to build. Not the one that matches another project. The one that reflects the *true structure* of the interface — where each component has exactly one reason to exist.

---

## The Three Laws of React Architecture

### 1. Data Flows Down, Events Flow Up

This is not a guideline — it is the fundamental contract of React:

- **Props** carry data from parent to child — never the reverse
- **Callbacks** carry events from child to parent — never reach up
- **Context** is for truly global data (theme, auth, locale) — not for avoiding prop passing
- **State colocation** — state lives in the lowest common ancestor that needs it, nowhere higher

### 2. The Component Is the Boundary

A component is a **contract**:

- **Input contract**: the Props interface defines what the component needs
- **Output contract**: the rendered JSX defines what the component provides
- **Side effect contract**: `"use client"` declares that this component has interactivity

If you cannot describe what a component does in one sentence without using "and", split it.

### 3. The Server Is the Default

In the React Server Components model:

- **Server Components**: fetch data, access databases, render HTML. Zero JavaScript shipped.
- **Client Components**: handle clicks, manage form state, run animations. JavaScript required.
- **The boundary**: `"use client"` marks where the server stops and the client begins.

The question is never "should this be a server component?" — it already is. The question is "does this *need* to be a client component?"

---

## Decomposition Method

### Step 1 — Define the Data Shape

Before designing UI, define what data exists:

```typescript
// Define the domain model — this is the source of truth
interface Project {
  readonly id: string;
  readonly name: string;
  readonly status: "active" | "archived" | "draft";
  readonly createdAt: Date;
  readonly owner: {
    readonly id: string;
    readonly name: string;
    readonly avatarUrl: string;
  };
}

// Derive the component props from the data — never the reverse
interface ProjectCardProps {
  readonly project: Project;
  readonly onArchive?: (id: string) => void;
}
```

### Step 2 — Map the Component Tree

Draw the component tree before writing code. Every component should have exactly one responsibility:

```
ProjectDashboard (server — fetches project list)
├── ProjectFilter (client — handles filter state)
├── ProjectGrid (server — layout only)
│   ├── ProjectCard (server — displays project data)
│   │   ├── ProjectStatus (server — renders status badge)
│   │   └── ArchiveButton (client — handles user action)
│   └── ...more cards
└── Pagination (client — handles page navigation)
```

### Step 3 — Identify the Client Boundary

Mark the minimum set of components that need `"use client"`:

- **Does it use `useState` or `useReducer`?** → Client
- **Does it use `onClick`, `onChange`, or other event handlers?** → Client
- **Does it use browser APIs (`window`, `document`, `navigator`)?** → Client
- **None of the above?** → Server. Keep it there.

### Step 4 — Design the Loading States

Every async boundary needs three states. Design them upfront:

```tsx
// loading.tsx — the skeleton the user sees first
export default function DashboardLoading(): React.JSX.Element {
  return (
    <div className={styles.grid}>
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className={styles.skeleton} aria-hidden="true" />
      ))}
    </div>
  );
}
```

---

## Performance First Principles

### The Critical Rendering Path

```
DNS → TCP → TLS → First Byte → HTML Parse → CSS Parse → JS Parse → JS Execute → Render → Paint
```

| Decision | Affects | Impact |
|----------|---------|--------|
| Server Components | First Byte → Render | Less JS to parse and execute |
| Static generation | DNS → First Byte | Response served from CDN edge |
| Code splitting | JS Parse | Only load code for current route |
| Image optimization | Paint | Smaller downloads, correct format |
| Streaming SSR | First Byte → Render | Progressive HTML delivery |

### Core Web Vitals Thinking

| Metric | What It Measures | Architectural Decision |
|--------|-----------------|----------------------|
| **LCP** | Time to largest visible element | Prioritize above-the-fold content, preload critical resources |
| **INP** | Responsiveness to user input | Use `useTransition`, avoid blocking the main thread |
| **CLS** | Visual stability | Set explicit dimensions on images/embeds, use font `display: swap` |

---

## State Management First Principles

### The State Decision Tree

```
Is this data from a server?
├── YES → Server Component (no state needed)
│         or React Query / SWR (cached, revalidated)
└── NO → Is it URL state?
    ├── YES → `useSearchParams` / route params
    └── NO → Is it form state?
        ├── YES → `useActionState` / React Hook Form
        └── NO → Is it shared across distant components?
            ├── YES → Context (if small) or Zustand (if complex)
            └── NO → `useState` in the closest parent
```

### State Rules

- **Never duplicate server data into client state** — use React Query or SWR to cache and sync
- **Never store derived values** — if `fullName = firstName + lastName`, compute it
- **URL is state** — filters, pagination, sort order belong in the URL, not in `useState`
- **Lift state only as high as needed** — to the lowest common ancestor, not the root
- **Form state is temporary** — it lives in the form, dies on submit

---

## Questions That Drive Good Architecture

1. **Can this be a server component?** (Almost always yes)
2. **What data does this need, and where does it come from?**
3. **What happens when the data is loading? When it fails? When it is empty?**
4. **Can this component be used in a different context without modification?**
5. **What is the minimum props interface that makes this component useful?**
6. **Does this component own its state, or is it controlled by its parent?**
7. **What does this look like on a 320px screen? On a 2560px screen?**
8. **Can a keyboard-only user operate this? Can a screen reader user understand this?**

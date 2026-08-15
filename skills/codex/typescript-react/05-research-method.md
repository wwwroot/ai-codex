# 05 — Research & Invention Method (TypeScript / React / Next.js Edition)

> Reference this file when exploring a new idea, prototyping a UI, or building something that does not exist yet.

---

## The Frontend Invention Loop

```
IDEA → WIREFRAME → PROTOTYPE → USER TEST → REFINE → SHIP
```

Frontend invention is unique because the user sees and feels the result immediately. Every decision is visible.

### Step 1: Define the User Story

Before writing any code, answer in one sentence:

> **"[User] can [action] so that [outcome]."**

If you cannot write this sentence, you do not understand the feature yet.

### Step 2: Sketch the Interface

Before writing JSX, sketch the component tree:

- What does the user see on first load?
- What interactive elements exist?
- What changes when the user interacts?
- What are the loading, empty, and error states?

### Step 3: Build the Minimum Prototype

```tsx
// Good prototype philosophy for frontend:
// - Hardcoded data is fine (prove the UI works before wiring data)
// - Inline styles are fine (prove the layout before designing the system)
// - No error handling yet (find the happy path first)
// - No responsiveness yet (prove the concept at one breakpoint first)

export default function PrototypeDashboard(): React.JSX.Element {
  // Hardcoded data — will be replaced with real fetch
  const projects = [
    { id: "1", name: "Project Alpha", status: "active" as const },
    { id: "2", name: "Project Beta", status: "draft" as const },
  ];

  return (
    <main>
      <h1>Dashboard</h1>
      <ul>
        {projects.map((p) => (
          <li key={p.id}>{p.name} — {p.status}</li>
        ))}
      </ul>
    </main>
  );
}
```

### Step 4: Identify What Needs to Be Real

After the prototype works with fake data, identify the minimum real pieces:

1. **Data source** — where does the real data come from?
2. **Mutations** — what actions modify data? (server actions, API calls)
3. **Authentication** — does this page need auth? What roles can access it?
4. **Validation** — what inputs need runtime validation? (Zod schemas)
5. **Error states** — what can go wrong and what does the user see?

### Step 5: Ship Incrementally

Never ship everything at once. Ship in this order:

1. **Static version** — correct HTML, correct data, no interactivity
2. **Interactive version** — add client components only where needed
3. **Polished version** — loading states, error boundaries, animations
4. **Optimized version** — bundle analysis, performance audit, a11y audit

---

## Component Design Patterns

### The Compound Component Pattern

When a component has multiple related parts that need to share state:

```tsx
"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

interface AccordionContextValue {
  readonly openItem: string | null;
  readonly toggle: (id: string) => void;
}

const AccordionContext = createContext<AccordionContextValue | null>(null);

function useAccordion(): AccordionContextValue {
  const context = useContext(AccordionContext);
  if (!context) throw new Error("Accordion components must be used within <Accordion>");
  return context;
}

export function Accordion({ children }: { readonly children: ReactNode }): React.JSX.Element {
  const [openItem, setOpenItem] = useState<string | null>(null);
  const toggle = (id: string): void => setOpenItem((prev) => (prev === id ? null : id));

  return (
    <AccordionContext value={{ openItem, toggle }}>
      <div role="tablist">{children}</div>
    </AccordionContext>
  );
}

export function AccordionItem({ id, title, children }: {
  readonly id: string;
  readonly title: string;
  readonly children: ReactNode;
}): React.JSX.Element {
  const { openItem, toggle } = useAccordion();
  const isOpen = openItem === id;

  return (
    <div>
      <button role="tab" aria-expanded={isOpen} onClick={() => toggle(id)}>
        {title}
      </button>
      {isOpen && <div role="tabpanel">{children}</div>}
    </div>
  );
}
```

### The Render Props / Children-as-Function Pattern

When a component needs to share logic but not UI:

```tsx
interface DataLoaderProps<T> {
  readonly queryKey: string[];
  readonly queryFn: () => Promise<T>;
  readonly children: (data: T) => React.JSX.Element;
  readonly fallback: React.JSX.Element;
}
```

### The Composition Pattern

Prefer composition (passing children) over configuration (passing many props):

```tsx
// BAD — configuration overload
<Card
  title="Dashboard"
  subtitle="Welcome back"
  icon={<HomeIcon />}
  footer={<Button>View All</Button>}
  bordered
  hoverable
/>

// GOOD — composition
<Card>
  <CardHeader>
    <HomeIcon />
    <CardTitle>Dashboard</CardTitle>
    <CardDescription>Welcome back</CardDescription>
  </CardHeader>
  <CardFooter>
    <Button>View All</Button>
  </CardFooter>
</Card>
```

---

## How to Evaluate a New Library or Tool

Before adding any dependency to a project:

1. **Bundle size** — check on bundlephobia.com. Is the cost justified?
2. **Maintenance** — when was the last release? Are issues being addressed?
3. **TypeScript support** — are types built-in or from `@types`? Are they accurate?
4. **Tree-shaking** — does it support ESM and tree-shaking? Or does it force the entire bundle?
5. **Server Component compatibility** — does it work in RSC, or does it require `"use client"`?
6. **Alternative** — can you build this with native APIs or existing dependencies?

### The Cost of a Dependency

Every `npm install` adds:

- Bundle size to every user's download
- A supply chain attack surface
- A maintenance obligation (updates, breaking changes)
- API surface your team must learn

The best dependency is the one you do not need.

---

## Questions for Every New Frontend Feature

1. **What user problem does this solve?**
2. **What is the simplest version that validates the idea?**
3. **What does this look like with 0 items? 1 item? 1000 items?**
4. **What happens on slow 3G? What happens offline?**
5. **What accessibility requirements does this create?**
6. **What is the URL strategy?** (Does this state belong in the URL?)
7. **What analytics or metrics should this feature report?**

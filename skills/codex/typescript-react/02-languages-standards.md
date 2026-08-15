# 02 — Language & Code Standards (TypeScript / React / Next.js Edition)

> Reference this file when writing, reviewing, or refactoring TypeScript and React code.

---

## TypeScript Standards

### Version Target

**TypeScript 5.4+ with strict mode.** No exceptions.

```jsonc
// tsconfig.json — non-negotiable settings
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "exactOptionalPropertyTypes": true,
    "noFallthroughCasesInSwitch": true,
    "forceConsistentCasingInFileNames": true,
    "verbatimModuleSyntax": true
  }
}
```

### Type System Rules

```
ALWAYS                                       NEVER
──────────────────────────────────────────   ────────────────────────────────────────
Explicit return types on exported functions   `any` — use `unknown` and narrow
Discriminated unions for state machines      `as` type assertions — use type guards
`satisfies` for type-safe object literals    `@ts-ignore` without documented reason
`readonly` for data that should not mutate   `enum` — use `as const` objects or unions
`unknown` for external/unvalidated data      Non-null assertion `!` without proof
Zod/Valibot for runtime validation           Trusting API responses without validation
Generic constraints over loose generics      `Function` type — use specific signatures
Template literal types for string patterns   `Object` or `{}` as types
```

### Key TypeScript Patterns

```typescript
// Discriminated unions — the correct way to model state
type AsyncState<T> =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: T }
  | { status: "error"; error: Error };

// Type narrowing — exhaustive with `never`
function handleState<T>(state: AsyncState<T>): string {
  switch (state.status) {
    case "idle": return "Ready";
    case "loading": return "Loading...";
    case "success": return `Got ${state.data}`;
    case "error": return `Error: ${state.error.message}`;
    default: {
      const _exhaustive: never = state;
      return _exhaustive;
    }
  }
}

// Zod for runtime validation at boundaries
import { z } from "zod";

const UserSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  email: z.string().email(),
  role: z.enum(["admin", "user", "viewer"]),
});

type User = z.infer<typeof UserSchema>;

// `satisfies` for type-safe object literals
const ROUTES = {
  home: "/",
  dashboard: "/dashboard",
  settings: "/settings",
} satisfies Record<string, string>;

// Branded types for domain safety
type UserId = string & { readonly __brand: "UserId" };
type OrderId = string & { readonly __brand: "OrderId" };

function getUser(id: UserId): Promise<User> { /* ... */ }
// getUser(orderId) → compile error. Strings are not interchangeable.
```

---

## React Standards

### Version Target

**React 19+ with Server Components.** Embrace the server-first model.

### Component Rules

```
ALWAYS                                       NEVER
──────────────────────────────────────────   ────────────────────────────────────────
Server Components by default                 `"use client"` without a specific reason
Props interface defined and exported         Prop drilling more than 2 levels deep
Explicit return type on components            `React.FC` — use function declarations
Children as props when composing              `useEffect` for derived state — compute it
Error boundaries around async sections        Uncontrolled state for complex forms
`key` prop from stable identity, not index    Array index as `key` on dynamic lists
Memoization only after measuring              `useMemo` / `useCallback` everywhere
Suspense boundaries for async content         Manual loading state when Suspense works
```

### Component Patterns

```tsx
// Server Component — the default (no "use client" directive)
import { db } from "@/lib/db";

interface DashboardProps {
  readonly userId: string;
}

export default async function Dashboard({ userId }: DashboardProps): Promise<React.JSX.Element> {
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) notFound();

  return (
    <main>
      <h1>{user.name}'s Dashboard</h1>
      <Suspense fallback={<StatsSkeletons />}>
        <DashboardStats userId={userId} />
      </Suspense>
    </main>
  );
}

// Client Component — only when interactivity demands it
"use client";

import { useState, useTransition } from "react";

interface SearchInputProps {
  readonly onSearch: (query: string) => void;
  readonly placeholder?: string;
}

export function SearchInput({ onSearch, placeholder = "Search..." }: SearchInputProps): React.JSX.Element {
  const [query, setQuery] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleChange(e: React.ChangeEvent<HTMLInputElement>): void {
    const value = e.target.value;
    setQuery(value);
    startTransition(() => onSearch(value));
  }

  return (
    <input
      type="search"
      value={query}
      onChange={handleChange}
      placeholder={placeholder}
      aria-label={placeholder}
      data-pending={isPending || undefined}
    />
  );
}
```

### Hooks Rules

- **Custom hooks** extract reusable logic — one hook, one responsibility
- **`useState`** for UI state only — not for server data (use React Query / SWR / server components)
- **`useReducer`** when state transitions are complex or interdependent
- **`useRef`** for DOM access and mutable values that do not trigger re-renders
- **`useEffect`** is the last resort — most "effects" are really event handlers, derived state, or server work
- **`useTransition`** for non-urgent updates — keeps the UI responsive during expensive renders
- **`useOptimistic`** for optimistic UI updates — show the expected result before server confirmation

---

## Next.js Standards

### Version Target

**Next.js 15+ with App Router.** Pages Router is legacy — do not use for new projects.

### Architecture Rules

```
ALWAYS                                       NEVER
──────────────────────────────────────────   ────────────────────────────────────────
App Router for all new projects              Pages Router for new code
Server Actions for mutations                 API routes for simple CRUD operations
Dynamic `import()` for heavy client libs     Loading entire libraries on every page
`loading.tsx` and `error.tsx` in routes       Unhandled errors that crash the page
`metadata` export for every page             Missing page titles and descriptions
Image optimization with next/image           Raw `<img>` tags for content images
Route groups for layout organization         Deeply nested folder structures
Parallel routes for complex layouts          Reinventing parallel data loading
```

### File Conventions

```
app/
├── layout.tsx              # Root layout — shared UI shell
├── page.tsx                # Home page
├── loading.tsx             # Root loading state
├── error.tsx               # Root error boundary
├── not-found.tsx           # 404 page
├── globals.css             # Global styles and CSS variables
├── (auth)/                 # Route group — no URL impact
│   ├── login/page.tsx
│   └── register/page.tsx
├── dashboard/
│   ├── layout.tsx          # Dashboard-specific layout
│   ├── page.tsx            # /dashboard
│   ├── loading.tsx         # Dashboard loading state
│   └── [projectId]/        # Dynamic segment
│       └── page.tsx        # /dashboard/:projectId
└── api/                    # API routes — only when needed
    └── webhooks/
        └── route.ts        # Webhook handler
```

### Server Actions

```typescript
"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";

const CreatePostSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1),
});

export async function createPost(formData: FormData): Promise<{ error?: string }> {
  const parsed = CreatePostSchema.safeParse({
    title: formData.get("title"),
    content: formData.get("content"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  await db.post.create({ data: parsed.data });
  revalidatePath("/posts");
  return {};
}
```

---

## CSS & Styling Standards

### Approach

**CSS Modules + CSS Custom Properties** as the default. Tailwind CSS when the team has adopted it.

```css
/* globals.css — Design tokens as CSS custom properties */
:root {
  --color-bg: hsl(0 0% 100%);
  --color-fg: hsl(220 20% 10%);
  --color-primary: hsl(220 90% 56%);
  --color-primary-hover: hsl(220 90% 48%);
  --color-border: hsl(220 10% 88%);
  --color-surface: hsl(220 10% 97%);

  --radius-sm: 0.375rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;

  --font-sans: "Inter", system-ui, -apple-system, sans-serif;
  --font-mono: "JetBrains Mono", "Fira Code", monospace;

  --shadow-sm: 0 1px 2px hsl(0 0% 0% / 0.05);
  --shadow-md: 0 4px 6px hsl(0 0% 0% / 0.07);
}

@media (prefers-color-scheme: dark) {
  :root {
    --color-bg: hsl(220 20% 8%);
    --color-fg: hsl(220 10% 92%);
    --color-primary: hsl(220 90% 64%);
    --color-primary-hover: hsl(220 90% 72%);
    --color-border: hsl(220 10% 22%);
    --color-surface: hsl(220 15% 13%);
  }
}
```

```tsx
// Component with CSS Module
import styles from "./Button.module.css";

interface ButtonProps {
  readonly variant?: "primary" | "secondary" | "ghost";
  readonly size?: "sm" | "md" | "lg";
  readonly children: React.ReactNode;
  readonly onClick?: () => void;
}

export function Button({
  variant = "primary",
  size = "md",
  children,
  onClick,
}: ButtonProps): React.JSX.Element {
  return (
    <button
      className={`${styles.button} ${styles[variant]} ${styles[size]}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
```

---

## Project Tooling Standards

| Tool | Purpose | Config |
|------|---------|--------|
| `pnpm` | Package management | `pnpm-workspace.yaml` for monorepos |
| `Biome` or `ESLint 9+` | Linting + formatting | flat config, strict rules |
| `TypeScript 5.4+` | Type checking | strict mode, no exceptions |
| `Vitest` | Unit + integration testing | compatible with Jest API |
| `Playwright` | E2E testing | cross-browser, visual regression |
| `Zod` or `Valibot` | Runtime validation | all external data boundaries |
| `next/bundle-analyzer` | Bundle size monitoring | check on every PR |

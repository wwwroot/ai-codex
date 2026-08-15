# 04 — Domain Knowledge (TypeScript / React / Next.js Edition)

> Reference this file when working in specific frontend and fullstack domains. Load what is relevant to the current session.

---

## React Ecosystem

### Data Fetching

```typescript
// React Query (TanStack Query) — the standard for client-side data fetching
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

function useProjects() {
  return useQuery({
    queryKey: ["projects"],
    queryFn: () => fetch("/api/projects").then((r) => r.json()),
    staleTime: 5 * 60 * 1000, // 5 minutes before refetch
  });
}

function useDeleteProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => fetch(`/api/projects/${id}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["projects"] }),
  });
}
```

**Key rules:**
- Server Components: fetch data directly in the component — no hooks needed
- Client Components: React Query for server state, `useState` for UI state
- Always set `staleTime` — the default (0) means every mount triggers a refetch
- Use `queryKey` arrays for automatic invalidation: `["projects", projectId, "tasks"]`

### Forms

```typescript
// React Hook Form + Zod — type-safe forms with runtime validation
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const FormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
});

type FormValues = z.infer<typeof FormSchema>;

function ContactForm(): React.JSX.Element {
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
  });

  const onSubmit = (data: FormValues): void => {
    // data is fully typed and validated
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <input {...register("name")} aria-invalid={!!errors.name} />
      {errors.name && <p role="alert">{errors.name.message}</p>}
      <input {...register("email")} type="email" aria-invalid={!!errors.email} />
      {errors.email && <p role="alert">{errors.email.message}</p>}
      <button type="submit">Submit</button>
    </form>
  );
}
```

### Animation

| Library | Best For | Approach |
|---------|---------|----------|
| CSS transitions/animations | Simple hover, enter/exit | Zero JS overhead — always prefer first |
| Framer Motion | Layout animations, gestures, complex sequences | `motion` components, `AnimatePresence` |
| CSS `@starting-style` | Entry animations without JS | Native, zero-bundle, modern browsers |
| View Transitions API | Page transitions | `document.startViewTransition()` |

---

## Accessibility (a11y)

### Non-Negotiable Rules

```tsx
// Semantic HTML first — ARIA is a supplement, not a replacement
<nav aria-label="Main navigation">       {/* Not <div className="nav"> */}
<main>                                    {/* Not <div className="content"> */}
<button onClick={handleClick}>           {/* Not <div onClick={handleClick}> */}
<a href="/about">                        {/* Not <span onClick={() => navigate("/about")}> */}

// Images: decorative vs. informative
<img src={photo} alt="Team meeting in the office" />  {/* Informative */}
<img src={decoration} alt="" role="presentation" />     {/* Decorative */}

// Forms: always label inputs
<label htmlFor="email">Email</label>
<input id="email" type="email" aria-describedby="email-hint" />
<p id="email-hint">We will never share your email</p>

// Live regions for dynamic content
<div aria-live="polite" aria-atomic="true">
  {statusMessage}
</div>
```

### Keyboard Navigation Checklist

- All interactive elements reachable with `Tab`
- `Escape` closes modals, dropdowns, and overlays
- `Enter` and `Space` activate buttons
- Arrow keys navigate within lists, tabs, and menus
- Focus is trapped inside modals while open
- Focus returns to trigger element when modal closes
- Visible focus indicator on every interactive element

---

## Testing

### Testing Strategy

```
                    ┌─────────────┐
                    │   E2E Tests  │  ← Playwright: critical user journeys
                    │  (few, slow) │
                   ┌┴─────────────┴┐
                   │ Integration    │  ← Testing Library: component behavior
                   │ (some, medium) │
                  ┌┴───────────────┴┐
                  │   Unit Tests     │  ← Vitest: pure functions, utilities
                  │ (many, fast)     │
                  └─────────────────┘
```

### Testing Library Patterns

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

test("submits form with valid data", async () => {
  const onSubmit = vi.fn();
  const user = userEvent.setup();

  render(<ContactForm onSubmit={onSubmit} />);

  // Query by accessible role and name — not by class or test-id
  await user.type(screen.getByRole("textbox", { name: /name/i }), "Aji");
  await user.type(screen.getByRole("textbox", { name: /email/i }), "aji@example.com");
  await user.click(screen.getByRole("button", { name: /submit/i }));

  expect(onSubmit).toHaveBeenCalledWith({
    name: "Aji",
    email: "aji@example.com",
  });
});
```

**Rules:**
- Query by **role** and **accessible name** — not by class, test ID, or DOM structure
- Use `userEvent` over `fireEvent` — it simulates real user behavior
- Test behavior, not implementation — "the user sees X" not "the component state is Y"
- Never test implementation details — no reaching into component internals

### Playwright E2E

```typescript
import { test, expect } from "@playwright/test";

test("user can create a new project", async ({ page }) => {
  await page.goto("/dashboard");
  await page.getByRole("button", { name: "New Project" }).click();
  await page.getByLabel("Project name").fill("My Project");
  await page.getByRole("button", { name: "Create" }).click();
  await expect(page.getByText("My Project")).toBeVisible();
});
```

---

## Database & ORM

### Prisma (recommended for Next.js)

```typescript
// schema.prisma — type-safe database schema
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String
  posts     Post[]
  createdAt DateTime @default(now())
}

// Usage — fully typed queries
const user = await prisma.user.findUnique({
  where: { id: userId },
  include: { posts: { orderBy: { createdAt: "desc" } } },
});
// typeof user is User & { posts: Post[] } | null
```

### Drizzle (lightweight alternative)

```typescript
import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  email: text("email").unique().notNull(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

---

## Authentication

### NextAuth.js / Auth.js Patterns

```typescript
// auth.ts — centralized auth configuration
import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [GitHub],
  callbacks: {
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const isProtected = request.nextUrl.pathname.startsWith("/dashboard");
      if (isProtected && !isLoggedIn) return false;
      return true;
    },
  },
});

// middleware.ts — protect routes at the edge
export { auth as middleware } from "./auth";
export const config = { matcher: ["/dashboard/:path*"] };
```

---

## Performance Tooling

| Measure What | Tool | Method |
|-------------|------|--------|
| Bundle size | `@next/bundle-analyzer` | `ANALYZE=true next build` |
| Core Web Vitals | Lighthouse / PageSpeed | Chrome DevTools or CI |
| Runtime performance | React DevTools Profiler | Record and analyze renders |
| Network waterfall | Chrome DevTools Network | Identify sequential requests |
| Hydration issues | React DevTools | Check for hydration mismatch warnings |
| Memory leaks | Chrome DevTools Memory | Heap snapshots before and after navigation |

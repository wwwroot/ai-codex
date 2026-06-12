# 02 — Design Languages & Standards (UI/UX Design Edition)

> Reference this file when creating, reviewing, or refactoring design work.

---

## Primary Tools & Technologies

Design work spans visual tools, code, and specification. The same engineering discipline applies to all.

### Design Tokens

Design tokens are the single source of truth for the design system. Every color, spacing value, typography setting, and shadow is a token.

```json
{
  "color": {
    "primary": { "50": "#eff6ff", "500": "#3b82f6", "900": "#1e3a5f" },
    "neutral": { "0": "#ffffff", "50": "#f8fafc", "900": "#0f172a" },
    "semantic": {
      "success": "#16a34a",
      "warning": "#eab308",
      "error": "#dc2626",
      "info": "#2563eb"
    }
  },
  "spacing": {
    "xs": "4px", "sm": "8px", "md": "16px", "lg": "24px", "xl": "32px", "2xl": "48px", "3xl": "64px"
  },
  "typography": {
    "font-family": { "sans": "Inter, system-ui, sans-serif", "mono": "JetBrains Mono, monospace" },
    "font-size": { "xs": "12px", "sm": "14px", "base": "16px", "lg": "18px", "xl": "20px", "2xl": "24px", "3xl": "30px", "4xl": "36px" },
    "line-height": { "tight": "1.25", "normal": "1.5", "relaxed": "1.75" },
    "font-weight": { "regular": "400", "medium": "500", "semibold": "600", "bold": "700" }
  },
  "radius": { "sm": "4px", "md": "8px", "lg": "12px", "xl": "16px", "full": "9999px" },
  "shadow": {
    "sm": "0 1px 2px rgba(0,0,0,0.05)",
    "md": "0 4px 6px -1px rgba(0,0,0,0.1)",
    "lg": "0 10px 15px -3px rgba(0,0,0,0.1)"
  }
}
```

### Non-Negotiable Design Standards

```
ALWAYS                                       NEVER
──────────────────────────────────────────   ────────────────────────────────────────
Use design tokens — no hardcoded values      Magic numbers (padding: 13px)
Minimum 4.5:1 contrast ratio (AA)            Color-only information encoding
16px minimum body text on mobile             Text below 12px anywhere
8px grid alignment for spacing               Arbitrary spacing values
Consistent component patterns                One-off bespoke components
Visible focus indicators on all controls     Removing default focus outlines
Touch targets minimum 44×44px                Tiny tap targets on mobile
Semantic heading hierarchy (h1 → h6)         Skipping heading levels for styling
Dark mode as a first-class consideration     Light-mode-only designs
Motion respects prefers-reduced-motion       Animations without opt-out
```

---

## Color System

### Palette Architecture

Every color system needs three layers:

1. **Primitive palette** — raw color values with numeric scale (50–900)
2. **Semantic tokens** — intent-based aliases (`color-text-primary`, `color-bg-surface`)
3. **Component tokens** — component-specific mappings (`button-bg-primary`, `card-border`)

```
Primitive:    blue-500          →  #3b82f6
Semantic:     color-action      →  blue-500
Component:    button-bg-primary →  color-action
```

This indirection means changing a brand color is a one-line change, not a find-and-replace across 200 components.

### Contrast Requirements

| Text Size | Minimum Ratio | WCAG Level |
|-----------|---------------|------------|
| Body text (< 18px) | 4.5:1 | AA |
| Large text (≥ 18px bold or ≥ 24px) | 3:1 | AA |
| UI components and graphics | 3:1 | AA |
| Enhanced (body text) | 7:1 | AAA |

---

## Typography System

### Type Scale

Use a modular scale — not arbitrary sizes. A 1.25 ratio (Major Third) works for most interfaces:

```
12px  →  xs     (captions, labels)
14px  →  sm     (secondary text, metadata)
16px  →  base   (body text — the default)
20px  →  lg     (subheadings, lead text)
24px  →  xl     (section headings)
30px  →  2xl    (page headings)
36px  →  3xl    (hero headings)
48px  →  4xl    (display headings)
```

### Typography Rules

- **One typeface** is usually enough. Two maximum — one for headings, one for body.
- **Line length**: 45–75 characters per line for readability. Never wider.
- **Line height**: 1.5 for body text, 1.2–1.3 for headings, 1.75 for dense content.
- **Font loading**: `font-display: swap` always. No invisible text during font load.

---

## Spacing & Layout System

### The 8px Grid

All spacing should be multiples of 8px. This creates visual rhythm and consistency:

```
4px   →  xs    (tight internal spacing, borders)
8px   →  sm    (internal component padding)
16px  →  md    (standard spacing between elements)
24px  →  lg    (section spacing within a component)
32px  →  xl    (spacing between components)
48px  →  2xl   (section breaks)
64px  →  3xl   (major section separation)
```

### Responsive Breakpoints

```css
/* Mobile-first breakpoints */
--bp-sm:  640px;   /* Large phones */
--bp-md:  768px;   /* Tablets */
--bp-lg:  1024px;  /* Laptops */
--bp-xl:  1280px;  /* Desktops */
--bp-2xl: 1536px;  /* Large monitors */
```

### Layout Principles

- **Mobile-first** — design the smallest screen, then enhance
- **Content-based breakpoints** — break when the content breaks, not at device sizes
- **Max-width containers** — 1280px for content, 960px for text-heavy pages
- **CSS Grid for layout, Flexbox for alignment** — use each where it excels

---

## Component Architecture

### Component Anatomy

Every component has:
- **Variants** — visual types (primary, secondary, ghost, destructive)
- **Sizes** — small, medium, large (minimum)
- **States** — default, hover, active, focused, disabled, loading, error
- **Props** — the API surface that controls behavior and appearance

### State Coverage Matrix

Every interactive component must define all states:

| State | Visual Change | Required? |
|-------|--------------|-----------|
| Default | Base appearance | ✅ |
| Hover | Subtle feedback (color shift, shadow) | ✅ |
| Active / Pressed | Pressed feedback (scale, darken) | ✅ |
| Focused | Visible focus ring (2px outline) | ✅ |
| Disabled | Reduced opacity (0.5), no interaction | ✅ |
| Loading | Spinner or skeleton, disabled interaction | ✅ for async actions |
| Error | Error border, error message | ✅ for inputs |
| Success | Confirmation feedback | ✅ for form submissions |

---

## Figma / Design Tool Standards

- **Auto Layout** on every frame — no absolute positioning unless explicitly needed
- **Components** for anything used more than once — with documented variants
- **Consistent naming**: `Component/Variant/Size/State` (e.g., `Button/Primary/Medium/Default`)
- **Design tokens** as Figma variables — not hardcoded values
- **Annotations** on handoff frames — spacing, interaction behavior, responsive notes
- **Prototype flows** for every multi-step interaction — handoff includes behavior, not just screens

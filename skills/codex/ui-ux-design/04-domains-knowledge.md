# 04 — Deep Domain Knowledge (UI/UX Design Edition)

> Reference knowledge across key design domains. Applied contextually — not forced where irrelevant.

---

## Design Systems

### Component Library Architecture

```
┌──────────────────────────────────────────────────┐
│                 Design System                     │
│                                                   │
│  Tokens      Colors, spacing, type, shadows       │
│     ↓                                             │
│  Primitives  Button, Input, Icon, Typography      │
│     ↓                                             │
│  Compounds   SearchBar, Card, Modal, DataTable    │
│     ↓                                             │
│  Patterns    Form, Navigation, Dashboard, Feed    │
│     ↓                                             │
│  Templates   Page layouts, app shells, flows      │
└──────────────────────────────────────────────────┘
```

### Documentation Standards

Every component must document:
- **Purpose** — what problem this component solves
- **Variants** — all visual types with usage guidelines
- **Anatomy** — labeled diagram of constituent parts
- **Behavior** — interaction states, keyboard, screen reader
- **Do / Don't** — concrete usage examples and anti-patterns
- **Accessibility** — ARIA roles, keyboard interactions, screen reader announcements

### Versioning and Governance

- **Semantic versioning** for design system releases (major.minor.patch)
- **Breaking changes** require migration guide and deprecation period
- **Contribution process** — how to propose, review, and ship new components
- **Audit cadence** — quarterly review of token usage and component adoption

---

## Accessibility (a11y)

### WCAG 2.1 AA Checklist

| Principle | Key Requirements |
|-----------|-----------------|
| **Perceivable** | Alt text for images, captions for video, 4.5:1 contrast, text resize to 200% |
| **Operable** | Keyboard navigable, no time limits, skip navigation, focus visible |
| **Understandable** | Consistent navigation, input labels, error identification, language declared |
| **Robust** | Valid HTML, ARIA used correctly, compatible with assistive technology |

### Keyboard Navigation Patterns

```
Tab           →  Move to next focusable element
Shift + Tab   →  Move to previous focusable element
Enter / Space →  Activate button or link
Escape        →  Close modal, cancel, dismiss
Arrow keys    →  Navigate within a component (tabs, menus, radio groups)
Home / End    →  Jump to first / last item in a list
```

### ARIA Usage Rules

- **First rule of ARIA**: do not use ARIA if a native HTML element can do the job
- **Second rule**: do not change native semantics unless absolutely necessary
- **Use `aria-label`** when visible label is not sufficient or present
- **Use `aria-describedby`** for supplementary help text
- **Use `aria-live`** for dynamic content changes that screen readers should announce
- **Use `role`** only when no semantic HTML element matches the behavior

### Screen Reader Testing

- **macOS**: VoiceOver (built-in) — `Cmd + F5` to toggle
- **Windows**: NVDA (free) or JAWS (paid)
- **Mobile**: TalkBack (Android), VoiceOver (iOS)
- Test with actual screen readers, not just automated tools — automated tools catch ~30% of issues

---

## Motion & Animation

### The 12 Principles (applied to UI)

| Principle | UI Application |
|-----------|---------------|
| **Timing** | 150–300ms for micro-interactions, 300–500ms for page transitions |
| **Easing** | `ease-out` for entrances, `ease-in` for exits, `ease-in-out` for moving |
| **Follow-through** | Slight overshoot on bouncy interactions (modals, notifications) |
| **Staging** | Draw attention to one thing at a time — staggered animations for lists |

### Performance Rules

```css
/* GOOD — GPU-accelerated properties */
transform: translateX(100px);
opacity: 0.5;

/* BAD — triggers layout recalculation */
left: 100px;
width: 200px;
height: 200px;
```

- Animate only `transform` and `opacity` for 60fps
- Use `will-change` sparingly — it consumes GPU memory
- Respect `prefers-reduced-motion` — always

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Data Visualization

### Chart Type Selection

| Data Type | Chart | When to Use |
|-----------|-------|-------------|
| Comparison | Bar chart | Comparing categories |
| Trend over time | Line chart | Time series data |
| Part of whole | Pie / Donut | 2–5 categories max |
| Distribution | Histogram | Frequency of values |
| Correlation | Scatter plot | Relationship between two variables |
| Composition over time | Stacked area | Multiple series changing over time |
| Geographic | Choropleth map | Location-based data |

### Data Viz Rules

- **Label directly** — no legends if labels can go on the data points
- **Start axes at zero** for bar charts — truncated axes distort perception
- **Color-blind safe palettes** — use shape/pattern as redundant encoding
- **Progressive detail** — overview first, zoom and filter, details on demand

---

## User Research Methods

| Method | When to Use | Sample Size |
|--------|-------------|-------------|
| **User interviews** | Understanding needs, motivations, pain points | 5–8 users |
| **Usability testing** | Validating specific designs or flows | 5 users (catches ~85% of issues) |
| **Card sorting** | Designing information architecture | 15–20 users |
| **A/B testing** | Comparing two specific alternatives | Statistical significance required |
| **Surveys** | Quantitative attitudes and preferences | 100+ responses |
| **Analytics review** | Understanding current behavior | Existing data |
| **Heuristic evaluation** | Quick expert assessment | 3–5 evaluators |
| **Diary study** | Long-term behavior and habits | 10–15 participants |

### Usability Testing Protocol

1. **Define tasks** — 3–5 realistic scenarios the user must complete
2. **Think-aloud protocol** — ask users to verbalize their thought process
3. **Observe, do not guide** — if they struggle, note it. Do not help.
4. **Measure** — task completion rate, time on task, error rate, satisfaction
5. **Debrief** — open-ended questions about overall experience

---

## Platform-Specific Design

### iOS (Human Interface Guidelines)

- Navigation bar at top, tab bar at bottom
- Swipe gestures for navigation (back, delete)
- SF Symbols for icons, San Francisco typeface
- Safe areas for notch and home indicator
- Dynamic Type support required

### Android (Material Design 3)

- Top app bar, bottom navigation bar, navigation drawer
- FAB (Floating Action Button) for primary action
- Material You color system — dynamic color from wallpaper
- Roboto typeface, Material Symbols for icons
- Edge-to-edge design behind system bars

### Web

- Responsive layouts — no fixed-width designs
- Hover states for mouse, touch targets for mobile
- Browser-native controls preferred over custom implementations
- Progressive enhancement — core functionality without JavaScript
- URL-driven state — every meaningful state should be bookmarkable

---

## Design Handoff

### What Developers Need

| Artifact | Purpose |
|----------|---------|
| **Design specs** | Spacing, sizing, color, typography for each component |
| **Component states** | Default, hover, active, focused, disabled, loading, error |
| **Interaction specs** | Animation timing, easing, trigger events |
| **Responsive behavior** | How the layout changes at each breakpoint |
| **Content specs** | Character limits, truncation rules, dynamic content behavior |
| **Accessibility notes** | ARIA roles, keyboard interaction, screen reader behavior |
| **Edge cases** | Empty states, error states, max content, min content |
| **Asset exports** | SVGs for icons, optimized images, font files |
